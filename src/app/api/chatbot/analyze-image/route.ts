import { NextResponse } from "next/server";
import * as tf from "@tensorflow/tfjs";
import * as path from "path";
import * as fs from "fs";

type AnalyzeImageBody = {
  image?: string;
  question?: string;
  imageMetrics?: {
    width?: number;
    height?: number;
    avgBrightness?: number;
    contrast?: number;
    redRatio?: number;
    darkRatio?: number;
    highlightRatio?: number;
  };
};

type FacePlusPlusDetectResponse = {
  image_width?: number;
  image_height?: number;
  faces?: Array<{
    face_rectangle?: {
      top?: number;
      left?: number;
      width?: number;
      height?: number;
    };
    attributes?: {
      headpose?: { pitch_angle?: number; yaw_angle?: number; roll_angle?: number };
      facequality?: { value?: number };
      blur?: {
        blurness?: { value?: number; threshold?: number };
        motionblur?: { value?: number; threshold?: number };
        gaussianblur?: { value?: number; threshold?: number };
      };
    };
  }>;
  error_message?: string;
};

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_DETECT_URL = process.env.FACEPP_DETECT_URL || "https://api-us.faceplusplus.com/facepp/v3/detect";
const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;

const MODEL_PATH = path.resolve(process.cwd(), "src/modele/chatbot/image-model/model.json");
const CLASSES_PATH = path.resolve(process.cwd(), "src/modele/chatbot/image-model/classes.json");

let loadedModel: tf.LayersModel | null = null;
let modelClasses: string[] = [];

async function getOrLoadModel() {
  if (loadedModel) return loadedModel;

  if (fs.existsSync(MODEL_PATH)) {
    try {
      const modelJson = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"));
      const weightsPath = path.join(path.dirname(MODEL_PATH), "model.weights.bin");
      const weightsBuffer = fs.readFileSync(weightsPath);

      loadedModel = await tf.loadLayersModel(tf.io.fromMemory(
        modelJson.modelTopology,
        modelJson.weightsManifest[0].weights,
        weightsBuffer.buffer as ArrayBuffer
      ));

      if (fs.existsSync(CLASSES_PATH)) {
        const classesData = JSON.parse(fs.readFileSync(CLASSES_PATH, "utf8"));
        modelClasses = classesData.classes;
      }
      console.log("[AI] DeepSkyn vision model loaded.");
      return loadedModel;
    } catch (err) {
      console.error("[AI] Erreur de chargement du modèle:", err);
    }
  }
  return null;
}

const toFinite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};


type ConditionDetail = {
  problem: string;
  description: string;
  severity: string;
  rootCause: string;
  routine: string[];
  products: string[];
  timeline: string;
};

const SKIN_CONDITION_DATABASE: Record<string, ConditionDetail> = {
  "acne": {
    problem: "Acne & Blemishes",
    description: "Presence of comedones, papules, or inflammatory pustules on the skin surface.",
    severity: "Moderate (depends on lesion density)",
    rootCause: "Excess sebum production, dead skin cell buildup, and bacterial proliferation (C. acnes).",
    routine: [
      "Cleanse with a gentle pH-balanced foaming gel",
      "Apply a Salicylic Acid (BHA) serum on targeted areas",
      "Moisturize with a lightweight non-comedogenic fluid",
      "Protect with a mattifying SPF 30+ every morning"
    ],
    products: [
      "Salicylic Acid 2% (Lipophilic exfoliant)",
      "Niacinamide 10% (Sebum regulator and anti-inflammatory)",
      "Benzoyl Peroxide (Powerful antibacterial)"
    ],
    timeline: "4 to 8 weeks for visible reduction of lesions."
  },
  "blackheads": {
    problem: "Blackheads (Open Comedones)",
    description: "Pores clogged with sebum that oxidizes and darkens upon air exposure.",
    severity: "Mild to Moderate",
    rootCause: "Accumulation of sebum and keratin inside dilated hair follicles.",
    routine: [
      "Double cleanse every evening (cleansing oil + gel cleanser)",
      "Regular chemical exfoliation with BHA",
      "Weekly clay mask (white or green clay)",
      "Apply lightweight water-based moisturizer"
    ],
    products: [
      "Relipidating cleansing oil",
      "Salicylic Acid (BHA) serum",
      "Activated Charcoal mask"
    ],
    timeline: "2 to 4 weeks for noticeably cleaner skin."
  },
  "dark_spots": {
    problem: "Dark Spots (Hyperpigmentation)",
    description: "Areas of dark discoloration caused by excess melanin production in the skin.",
    severity: "Varies with spot age and depth",
    rootCause: "Repeated sun exposure, post-inflammatory scars, or melasma.",
    routine: [
      "Gentle brightening cleanser morning and evening",
      "Apply concentrated Vitamin C serum in the morning",
      "Targeted Alpha-Arbutin or Azelaic Acid treatment at night",
      "Strict SPF 50+ sunscreen (reapply every 2 hours)"
    ],
    products: [
      "Vitamin C 10–20% (Antioxidant and brightening agent)",
      "Alpha-Arbutin 2% + Hyaluronic Acid",
      "Broad-spectrum high-protection sunscreen"
    ],
    timeline: "3 to 6 months of consistent treatment."
  },
  "pores": {
    problem: "Enlarged Pores",
    description: "Visibly enlarged follicular openings, commonly in the T-zone area.",
    severity: "Cosmetic (no health risk)",
    rootCause: "Reduced skin elasticity or excessive sebum production.",
    routine: [
      "Rinse with cool water to help tighten pores",
      "Apply Niacinamide serum to normalize pore appearance",
      "Gentle chemical exfoliation (AHA / Lactic Acid)",
      "Use a balancing, non-greasy moisturizer"
    ],
    products: [
      "Niacinamide 10% + Zinc 1%",
      "Glycolic Acid lotion",
      "Retinol serum to improve overall skin texture"
    ],
    timeline: "4 to 6 weeks for refined skin texture."
  },
  "wrinkles": {
    problem: "Wrinkles & Signs of Aging",
    description: "Fine lines or deeper marks caused by structural weakening of the skin over time.",
    severity: "Moderate to Pronounced",
    rootCause: "Natural collagen reduction, oxidative stress, and UV damage.",
    routine: [
      "Cleanse with a rich balm or creamy milk cleanser",
      "Apply a Peptide or Growth Factor serum",
      "Use Retinol or Retinal treatment at night (start 2x per week)",
      "Apply a rich barrier cream and daily sunscreen"
    ],
    products: [
      "Pure Retinol or Bakuchiol (gentle alternative)",
      "Multi-Peptide serum (Copper Peptides)",
      "Multi-weight Hyaluronic Acid"
    ],
    timeline: "Immediate hydration; visible wrinkle improvement in 3 to 6 months."
  },
  "general": {
    problem: "Skin Sensitivity or Fatigue",
    description: "Reactive skin showing signs of dehydration or mild redness.",
    severity: "Mild",
    rootCause: "Weakened skin barrier, environmental stress, or fatigue.",
    routine: [
      "Ultra-gentle fragrance-free cleanser",
      "Soothing serum with Centella Asiatica or Panthenol",
      "Barrier-strengthening moisturizer (Ceramides)",
      "Mineral SPF for daily protection"
    ],
    products: [
      "Panthenol (B5) serum",
      "Ceramides and Squalane cream",
      "Soothing thermal water mist"
    ],
    timeline: "Noticeable soothing effect within a few days."
  }
};

const identifyConditionFromMetrics = (metrics: AnalyzeImageBody["imageMetrics"]): string => {
  const redRatio = toFinite(metrics?.redRatio, 0);
  const contrast = toFinite(metrics?.contrast, 0);

  // PRIORITÉ RIDES (Peau Mature) : Si le contraste est élevé, c'est un signe fort de relief/rides
  if (contrast > 40) return "wrinkles";

  // ACNÉ : Si la rougeur est le signe dominant après avoir vérifié le relief
  if (redRatio > 0.38) return "acne";

  // Autres conditions
  if (redRatio > 0.35 && contrast > 35) return "acne";
  if (redRatio > 0.34 && contrast < 40) return "general";
  if (contrast > 60) return "dark_spots";

  return "general";
};

async function classifyImageWithAI(imageDataUrl: string): Promise<string | null> {
  const model = await getOrLoadModel();
  if (!model || modelClasses.length === 0) return null;

  try {
    const base64 = imageDataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    // Import Jimp 1.6+ style named export
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(buffer as any);
    image.resize({ w: 32, h: 32 });

    const pixels = image.bitmap.data as Buffer;
    const floatData = new Float32Array(32 * 32 * 3);
    let i = 0;
    for (let p = 0; p < pixels.length; p += 4) {
      floatData[i++] = (pixels[p + 0] / 127.5) - 1;
      floatData[i++] = (pixels[p + 1] / 127.5) - 1;
      floatData[i++] = (pixels[p + 2] / 127.5) - 1;
    }

    return tf.tidy(() => {
      const tensor = tf.tensor4d(floatData, [1, 32, 32, 3]);
      const prediction = model.predict(tensor) as tf.Tensor;
      const classId = prediction.argMax(-1).dataSync()[0];
      return modelClasses[classId];
    });
  } catch (err) {
    console.error("[AI] Classification error:", err);
    return null;
  }
}

const analyzeWithFacePP = async (imageDataUrl: string, _question?: string) => {
  const base64Payload = imageDataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const formData = new FormData();
  formData.append("api_key", FACEPP_API_KEY || "");
  formData.append("api_secret", FACEPP_API_SECRET || "");
  formData.append("image_base64", base64Payload);
  formData.append("return_attributes", "headpose,blur,facequality");

  const response = await fetch(FACEPP_DETECT_URL, { method: "POST", body: formData });
  const payload = await response.json() as FacePlusPlusDetectResponse;

  if (!response.ok || payload.error_message) throw new Error(payload.error_message);

  const faces = payload.faces || [];
  if (faces.length === 0) {
    return { answer: "No face detected.", confidence: 0.6, intent: "image_no_face" };
  }

  const face = faces[0];
  const faceQuality = toFinite(face.attributes?.facequality?.value, 50);
  const blurry = (face.attributes?.blur?.blurness?.value || 0) > (face.attributes?.blur?.blurness?.threshold || 50);

  return {
    answer: "Face detected",
    confidence: 0.85,
    intent: "image_analysis",
    details: { faceQuality, focusLabel: blurry ? "floue" : "nette" }
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeImageBody;
    const image = body.image || "";
    if (!image || !DATA_URL_RE.test(image)) return NextResponse.json({ error: "Image invalide" }, { status: 400 });

    let facePPData: any = null;

    if (FACEPP_API_KEY && FACEPP_API_SECRET) {
      try {
        const faceResult = await analyzeWithFacePP(image, body.question);
        if (faceResult.intent === "image_analysis") {
          facePPData = faceResult.details;
        }
      } catch (e) { console.error(e); }
    }

    const aiCondition = await classifyImageWithAI(image);
    const metricCondition = identifyConditionFromMetrics(body.imageMetrics);
    const conditionKey = aiCondition || metricCondition;
    const condition = SKIN_CONDITION_DATABASE[conditionKey] || {
      problem: "Sensibilité Générale",
      consequence: "Fatigue cutanée passagère.",
      recommendation: "• **Hydratation :** Sérum acide hyaluronique.\n• **Protection :** SPF 30+."
    };


    const answer =
      `EXPERT DERMATOLOGICAL ANALYSIS\n` +
      `______________________________________\n\n` +
      `MAIN DIAGNOSIS\n\n` +
      `${condition.problem}\n` +
      `Severity: ${condition.severity}\n\n` +
      `_______________________________________\n\n` +
      `SYMPTOM DESCRIPTION\n\n` +
      `${condition.description}\n\n` +
      `_______________________________________\n\n` +
      `ROOT CAUSE\n\n` +
      `${condition.rootCause}\n\n` +
      `_______________________________________\n\n` +
      `STEP-BY-STEP SKINCARE ROUTINE\n\n` +
      (condition.routine || []).map((step, idx) => `${idx + 1}. ${step}`).join('\n\n') + `\n\n` +
      `_______________________________________\n\n` +
      `RECOMMENDED ACTIVES & PRODUCTS\n\n` +
      (condition.products || []).map(p => `- ${p}`).join('\n') + `\n\n` +
      `_______________________________________\n\n` +
      `RESULTS TIMELINE\n\n` +
      `${condition.timeline}\n\n` +
      `_______________________________________\n\n` +
      `Note: This expert analysis is generated by DeepSkyn AI.`;



    return NextResponse.json({
      answer,
      confidence: 0.95,
      intent: "complete_skin_analysis",
      skinAnalysis: {
        problem: condition.problem,
        severity: (condition as ConditionDetail).severity ?? "",
        description: (condition as ConditionDetail).description ?? "",
        rootCause: (condition as ConditionDetail).rootCause ?? "",
        routine: (condition as ConditionDetail).routine ?? [],
        products: (condition as ConditionDetail).products ?? [],
        timeline: (condition as ConditionDetail).timeline ?? "",
      },
      details: { conditionDetected: conditionKey, ...facePPData }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
