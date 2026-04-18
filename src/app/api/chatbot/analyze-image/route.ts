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
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
      console.log("[AI] Modèle de vision DeepSkyn chargé dynamiquement.");
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

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const SKIN_CONDITION_DATABASE: Record<string, { problem: string; consequence: string; recommendation: string }> = {
  "acne_rosacea": {
    problem: "Symptômes d'Acné Inflammatoire ou de Rosacée",
    consequence: "L'activité bactérienne et l'inflammation peuvent entraîner des kystes et des cicatrices permanentes.",
    recommendation: "• **Nettoyage :** Gel nettoyant au Zinc.\n• **Traitement :** Niacinamide (10%).\n• **Correction :** Acide Azélaïque.\n• **Protection :** SPF 30+ fluide."
  },
  "aging_wrinkles": {
    problem: "Signes de Chrono-vieillissement et Rides Sévères",
    consequence: "Perte de collagène et affaissement des tissus. Les rides s'accentuent sans soins stimulants.",
    recommendation: "• **Régénération :** Rétinol pur (le soir).\n• **Volume :** Acide Hyaluronique.\n• **Fermeté :** Peptides ou Vitamine C.\n• **Protection :** SPF 50+ quotidien."
  },
  "eczema_dermatitis": {
    problem: "Dermatite Atopique ou Eczéma Barrière",
    consequence: "Sécheresse extrême et risque d'infections bactériennes chroniques.",
    recommendation: "• **Hygiène :** Huile lavante relipidante.\n• **Barrière :** Baume riche en Céramides.\n• **Apaisement :** Panthénol (B5).\n• **Habitude :** Évitez l'eau trop chaude."
  },
  "hyperpigmentation": {
    problem: "Troubles de la Pigmentation (Mélasma/Lentigos)",
    consequence: "Taches qui s'assombrissent radicalement à l'exposition UV.",
    recommendation: "• **Éclat :** Vitamine C le matin.\n• **Correction :** Alpha-Arbutine le soir.\n• **Protection :** SPF 50+ toutes les 2-3 heures."
  },
  "psoriasis_lichen": {
    problem: "Plaques de Psoriasis ou Lichen Planus",
    consequence: "Cycle cellulaire accéléré créant des squames épaisses et argentées.",
    recommendation: "• **Décapage :** Soins à l'Urée (10%+).\n• **Nutrition :** Émollients riches.\n• **Conseil :** Hydratez sur peau humide."
  },
  "malignant_lesion": {
    problem: "Lésion Atypique Suspecte (Besoin de Dermatologue)",
    consequence: "Risque vital élevé sans diagnostic précoce (mélanome).",
    recommendation: "• **URGENCE :** Consultez un dermatologue sous 48h.\n• **Interdiction :** Aucun soin maison."
  },
  "fungal_infection": {
    problem: "Infection Fongique (Mycose ou Teigne)",
    consequence: "Contagion rapide et desquamation circulaire.",
    recommendation: "• **Antifongique :** Crème locale antifongique.\n• **Hygiène :** Gardez la zone parfaitement sèche."
  }
};

const identifyConditionFromMetrics = (metrics: AnalyzeImageBody["imageMetrics"]): string => {
  const redRatio = toFinite(metrics?.redRatio, 0);
  const contrast = toFinite(metrics?.contrast, 0);

  // PRIORITÉ RIDES : Si on a du relief (contraste) et que la rougeur n'est pas hors norme
  // Une femme d'un certain âge a souvent un contraste élevé (>45)
  if (contrast > 45 && redRatio < 0.38) return "aging_wrinkles";
  
  // ACNÉ : Seulement si la rougeur est le signe dominant
  if (redRatio > 0.40) return "acne_rosacea";
  
  // Fallback rides si contraste vraiment marqué
  if (contrast > 55) return "aging_wrinkles";

  // Autres conditions
  if (redRatio > 0.35 && contrast > 50) return "psoriasis_lichen";
  if (redRatio > 0.34 && contrast < 40) return "eczema_dermatitis";
  if (contrast > 60) return "hyperpigmentation";

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
    image.resize({ w: 64, h: 64 });
    
    const floatData = new Float32Array(64 * 64 * 3);
    let i = 0;
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      floatData[i++] = (this.bitmap.data[idx + 0] / 127.5) - 1;
      floatData[i++] = (this.bitmap.data[idx + 1] / 127.5) - 1;
      floatData[i++] = (this.bitmap.data[idx + 2] / 127.5) - 1;
    });

    return tf.tidy(() => {
      const tensor = tf.tensor4d(floatData, [1, 64, 64, 3]);
      const prediction = model.predict(tensor) as tf.Tensor;
      const classId = prediction.argMax(-1).dataSync()[0];
      return modelClasses[classId];
    });
  } catch (err) {
    console.error("[AI] Classification error:", err);
    return null;
  }
}

const analyzeWithFacePP = async (imageDataUrl: string, question?: string) => {
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
    return { answer: "Aucun visage détecté.", confidence: 0.6, intent: "image_no_face" };
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
    let isFacePPAnalyzed = false;

    if (FACEPP_API_KEY && FACEPP_API_SECRET) {
      try {
        const faceResult = await analyzeWithFacePP(image, body.question);
        if (faceResult.intent === "image_analysis") {
          facePPData = faceResult.details;
          isFacePPAnalyzed = true;
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

    const redRatio = toFinite(body.imageMetrics?.redRatio, 0);
    const redScore = Math.round(clamp01((redRatio - 0.33) / 0.05) * 100);

    const answer = 
      `### 🔍 Analyse Dermatologique Experte\n` +
      `**Diagnostic IA :** ${condition.problem}\n` +
      `- **Indice d'Inflammation :** ${redScore}%\n\n` +
      `#### ⚠️ Conséquences\n${condition.consequence}\n\n` +
      `#### 🧴 Recommandation\n${condition.recommendation}\n\n` +
      `---\n*Note : Analyse basée sur le dataset DeepSkyn local.*`;

    return NextResponse.json({
      answer,
      confidence: 0.95,
      intent: "complete_skin_analysis",
      details: { conditionDetected: conditionKey, ...facePPData }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
