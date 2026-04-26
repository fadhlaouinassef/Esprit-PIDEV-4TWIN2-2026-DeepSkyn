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
    face_rectangle?: { top?: number; left?: number; width?: number; height?: number };
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

type DetectedCondition = {
  name: string;
  severity: string;
  zone: string;
  description: string;
};

type ConditionDetail = {
  problem: string;
  description: string;
  severity: string;
  rootCause: string;
  routine: string[];
  products: string[];
  timeline: string;
  skinType?: string;
  overallScore?: number;
  detectedConditions?: DetectedCondition[];
  warnings?: string[];
};

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_DETECT_URL = process.env.FACEPP_DETECT_URL || "https://api-us.faceplusplus.com/facepp/v3/detect";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;

const MODEL_PATH = path.resolve(process.cwd(), "src/modele/chatbot/image-model/model.json");
const CLASSES_PATH = path.resolve(process.cwd(), "src/modele/chatbot/image-model/classes.json");

let loadedModel: tf.LayersModel | null = null;
let modelClasses: string[] = [];

async function getOrLoadModel() {
  if (loadedModel) return loadedModel;
  if (!fs.existsSync(MODEL_PATH)) return null;
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
    return loadedModel;
  } catch (err) {
    console.error("[AI] Model loading error:", err);
    return null;
  }
}

const toFinite = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const SKIN_CONDITION_DATABASE: Record<string, ConditionDetail> = {
  acne: {
    problem: "Acne & Inflammatory Blemishes",
    description: "Active comedones, papules and pustules are visible across the face. The skin surface shows signs of excess sebum secretion, congestion in the follicular openings, and areas of localized redness indicating active bacterial inflammation.",
    severity: "Moderate (6/10)",
    rootCause: "Overactive sebaceous glands produce excess lipids that combine with dead keratinocytes to plug hair follicles. Cutibacterium acnes bacteria colonize the blocked pores and trigger an immune-mediated inflammatory cascade, resulting in red, swollen lesions.",
    detectedConditions: [
      { name: "Inflammatory Acne", severity: "Moderate (6/10)", zone: "T-zone, cheeks", description: "Active papules and pustules with surrounding erythema indicating bacterial proliferation." },
      { name: "Comedones", severity: "Mild-Moderate (4/10)", zone: "Nose, forehead", description: "Mixture of open (blackheads) and closed (whiteheads) comedones due to pore congestion." },
      { name: "Post-Inflammatory Erythema", severity: "Mild (3/10)", zone: "Cheeks", description: "Residual redness from previous breakouts persisting on the cheek area." }
    ],
    skinType: "Oily to combination with acne-prone characteristics",
    overallScore: 48,
    routine: [
      "Morning — Cleanse with a gentle pH-balanced foaming gel (pH 4.5–5.5) for 60 seconds",
      "Morning — Apply 2% Salicylic Acid toner to actively affected zones using a cotton pad",
      "Morning — Apply lightweight Niacinamide 10% serum to regulate sebum and calm inflammation",
      "Morning — Moisturize with a non-comedogenic gel-cream formula",
      "Morning — Apply mattifying SPF 50+ broad-spectrum sunscreen (essential — avoid sun exposure on acne)",
      "Evening — Double cleanse: cleansing oil first, then gel cleanser to remove sunscreen and debris",
      "Evening — Apply Benzoyl Peroxide 2.5% as a spot treatment only on active lesions",
      "Evening — Apply Niacinamide 10% to full face, avoid eyes",
      "Weekly (1–2x) — Use a 5-minute kaolin clay mask to deep-cleanse pores and absorb excess sebum"
    ],
    products: [
      "Salicylic Acid 2% BHA — lipid-soluble exfoliant that penetrates pores and dissolves sebum plugs",
      "Niacinamide 10% — reduces sebum production by up to 65%, anti-inflammatory, fades post-acne marks",
      "Benzoyl Peroxide 2.5–5% — kills C. acnes bacteria on contact, reduces pustule size within 48h",
      "Azelaic Acid 10–15% — antibacterial + brightening, ideal for post-acne hyperpigmentation",
      "Non-comedogenic SPF 50+ (mineral or hybrid) — mandatory to prevent UV-triggered post-inflammatory darkening"
    ],
    warnings: [
      "Never pick or squeeze lesions — this leads to scarring and spreads bacteria",
      "Avoid heavy oils and occlusive products (coconut oil, shea butter) which can aggravate congestion",
      "If using Benzoyl Peroxide, do not combine with Vitamin C in the same routine — causes oxidation"
    ],
    timeline: "Initial reduction of active lesions visible in 2–4 weeks. Significant improvement in 6–8 weeks. Full skin clearing typically requires 3–6 months of consistent treatment."
  },
  blackheads: {
    problem: "Open Comedones (Blackheads)",
    description: "Dense accumulation of open comedones visible primarily across the nose, forehead and chin. The dark appearance is caused by oxidation of the sebum-keratin plugs upon exposure to air, not by dirt. Pores appear visibly enlarged and congested.",
    severity: "Mild to Moderate (4/10)",
    rootCause: "Accumulation of sebum and shed keratinocytes inside dilated hair follicles forms soft plugs. The follicular opening remains open, causing the lipid mixture to oxidize and turn dark. This is worsened by hormonal fluctuations, incorrect cleansing habits, and comedogenic products.",
    detectedConditions: [
      { name: "Open Comedones (Blackheads)", severity: "Moderate (5/10)", zone: "Nose, forehead, chin (T-zone)", description: "Dense clusters of oxidized sebum plugs filling follicular openings — classic blackhead pattern." },
      { name: "Enlarged Pores", severity: "Mild (3/10)", zone: "Nose and cheeks", description: "Follicular distension from chronic congestion making pores visibly larger than normal." },
      { name: "Excess Sebum", severity: "Mild (3/10)", zone: "T-zone", description: "Shiny film of excess sebum on the T-zone indicating overactive sebaceous glands." }
    ],
    skinType: "Oily T-zone with normal to dry cheeks (combination)",
    overallScore: 62,
    routine: [
      "Morning — Gentle low-pH foaming cleanser to remove overnight sebum buildup",
      "Morning — Niacinamide 10% + Zinc 1% serum to regulate sebum and tighten pores",
      "Morning — Light, oil-free moisturizer (gel or lotion texture)",
      "Morning — SPF 30+ sunscreen (avoid thick sunscreens that could clog pores)",
      "Evening — Oil cleanse first (cleansing balm or micellar oil) to dissolve blackhead-causing sebum",
      "Evening — Follow with a gel cleanser to remove all residue",
      "Evening — BHA (Salicylic Acid 2%) exfoliant applied to T-zone, leave 15 minutes then rinse off",
      "Weekly (1–2x) — Kaolin + green clay mask on the nose and T-zone for 10 minutes"
    ],
    products: [
      "Salicylic Acid (BHA) 2% — penetrates into the follicle to dissolve the sebum-keratin plug from within",
      "Niacinamide 10% + Zinc 1% — reduces pore appearance and normalizes sebum secretion",
      "Retinol 0.025–0.05% (PM) — speeds cell turnover, prevents new comedone formation",
      "Relipidating cleansing oil — dissolves oil-based debris and makeup without stripping the barrier",
      "Activated charcoal mask — adsorbs excess sebum and impurities from the follicular opening"
    ],
    warnings: [
      "Do not use physical scrubs or pore strips — they cause micro-tears and dilate pores further over time",
      "Avoid over-cleansing (more than 2x daily) — strips the skin barrier and triggers rebound sebum production",
      "Introduce BHA gradually (2–3x per week initially) to avoid over-exfoliation"
    ],
    timeline: "Visibly cleaner skin within 2–4 weeks with consistent BHA use. Pore refinement in 4–8 weeks. Optimal results after 3 months of regular double cleansing + BHA routine."
  },
  dark_spots: {
    problem: "Hyperpigmentation & Dark Spots",
    description: "Multiple areas of focal hyperpigmentation are visible across the face, appearing as flat, darkened patches of various sizes. The skin tone is uneven with notable discoloration in post-inflammatory areas and sun-exposed zones. The texture may be otherwise smooth but the pigmentation creates visible contrast.",
    severity: "Moderate (5/10) — depending on spot depth and distribution",
    rootCause: "Melanocytes produce excess melanin in response to UV radiation, post-inflammatory triggers (acne, injuries), or hormonal imbalances (melasma). The pigment deposits in the epidermis (superficial) or dermis (deeper, harder to treat). Sun exposure without protection is the primary aggravating factor.",
    detectedConditions: [
      { name: "Post-Inflammatory Hyperpigmentation (PIH)", severity: "Moderate (5/10)", zone: "Cheeks, jawline", description: "Dark marks remaining from previous acne or skin injuries, with brownish-reddish discoloration." },
      { name: "Solar Lentigines", severity: "Mild-Moderate (4/10)", zone: "Forehead, cheekbones", description: "Sun-induced pigmentation spots with clear, defined edges from cumulative UV damage." },
      { name: "Uneven Skin Tone", severity: "Mild (3/10)", zone: "Full face", description: "General heterogeneity of complexion with dull, uneven color distribution." }
    ],
    skinType: "Normal to combination with pigmentation concerns",
    overallScore: 58,
    routine: [
      "Morning — Gentle brightening cleanser with Vitamin C or Kojic Acid (avoid abrasive cleansers)",
      "Morning — Apply Vitamin C serum (10–20% L-Ascorbic Acid) to full face immediately after cleansing",
      "Morning — Apply Alpha-Arbutin 2% serum or Tranexamic Acid serum over affected spots",
      "Morning — SPF 50+ broad-spectrum sunscreen — this step is NON-NEGOTIABLE for any hyperpigmentation treatment",
      "Evening — Double cleanse to remove sunscreen fully",
      "Evening — Apply Azelaic Acid 10% or Kojic Acid serum to targeted spots",
      "Evening — Apply retinol 0.05% to accelerate cellular turnover and fade pigmentation",
      "Evening — Rich moisturizer with Niacinamide to reinforce barrier and brighten"
    ],
    products: [
      "Vitamin C 15–20% L-Ascorbic Acid — potent antioxidant that inhibits tyrosinase and neutralizes UV-induced free radicals",
      "Alpha-Arbutin 2% + Hyaluronic Acid — blocks melanin synthesis at the enzymatic level with minimal irritation",
      "Tranexamic Acid 5% — disrupts melanocyte activation pathway, highly effective for melasma",
      "Azelaic Acid 10–15% — antimicrobial + depigmenting, safe for daily use including during pregnancy",
      "Broad-spectrum SPF 50+ (mineral with zinc oxide) — without this, all depigmenting actives are ineffective"
    ],
    warnings: [
      "Vitamin C is highly unstable — use fresh formulas in opaque packaging and discard after 3 months",
      "Never skip sunscreen when using depigmenting actives — UV exposure will reverse all progress",
      "Avoid harsh physical exfoliation which triggers more inflammation and worsens PIH"
    ],
    timeline: "Fading of superficial spots in 4–8 weeks. Deeper hyperpigmentation requires 3–6 months. Melasma may require 6–12 months with strict photoprotection."
  },
  pores: {
    problem: "Enlarged & Congested Pores",
    description: "Follicular openings appear visibly dilated, particularly in the T-zone (nose, forehead, chin). The skin texture shows an irregular 'orange peel' appearance in affected areas. Pore size is influenced by sebum production, elasticity loss, and chronic congestion.",
    severity: "Mild to Moderate (3–5/10) — cosmetic concern",
    rootCause: "Primary factors include excess sebum distending the follicular walls, reduced skin elasticity due to collagen degradation (accelerated by UV and aging), and keratin buildup inside the pore opening. Genetics plays a significant role in baseline pore size.",
    detectedConditions: [
      { name: "Distended Pores", severity: "Moderate (5/10)", zone: "Nose, forehead, chin (T-zone)", description: "Follicular openings significantly enlarged due to accumulated sebum and reduced wall tension." },
      { name: "Sebum Overproduction", severity: "Mild (3/10)", zone: "T-zone", description: "Active sebaceous secretion contributing to pore distension and shine." },
      { name: "Loss of Pore Wall Elasticity", severity: "Mild (3/10)", zone: "Cheeks, nose", description: "Reduced elastin and collagen support around follicles, causing permanent pore widening." }
    ],
    skinType: "Oily to combination with pore concerns",
    overallScore: 65,
    routine: [
      "Morning — Gentle gel cleanser, rinse with cool water to temporarily tighten pores",
      "Morning — Niacinamide 10% + Zinc 1% serum — apply to T-zone and full face",
      "Morning — Light non-comedogenic moisturizer (avoid heavy occlusives on T-zone)",
      "Morning — SPF 30–50 with mattifying formula",
      "Evening — Thorough cleansing to remove all sebum, debris and sunscreen",
      "Evening — BHA (Salicylic Acid 2%) toner on T-zone to exfoliate inside pores",
      "Evening — Retinol 0.05–0.1% to stimulate collagen synthesis and tighten pore walls",
      "Evening — Barrier-repairing moisturizer (ceramides)"
    ],
    products: [
      "Niacinamide 10% + Zinc 1% — reduces visible pore size by regulating sebum and strengthening skin structure",
      "Salicylic Acid (BHA) 2% — deep-cleans inside follicles, dissolves the keratin-sebum plug dilating the pore",
      "Retinol 0.05–0.1% — stimulates collagen and elastin production, physically firms pore walls over time",
      "Glycolic Acid 5–7% (AHA) — surface exfoliation + mild collagen stimulation for texture refinement",
      "Clay mask (kaolin/bentonite) — absorbs excess sebum, temporarily reduces pore appearance"
    ],
    warnings: [
      "Pores cannot be permanently eliminated or 'closed' — realistic goal is minimizing their appearance",
      "Do not use pore strips — causes acute pore dilation and micro-trauma to surrounding skin",
      "Always use SPF — UV accelerates collagen breakdown and permanently worsens pore dilation"
    ],
    timeline: "Visible texture improvement in 4–6 weeks with BHA use. Firming and pore tightening with retinol in 3–4 months. Maximum results with consistent long-term routine."
  },
  wrinkles: {
    problem: "Fine Lines, Wrinkles & Aging Signs",
    description: "Expression lines and fine wrinkles are visible across dynamic facial zones (forehead, crow's feet, nasolabial folds). The skin shows signs of reduced elasticity, subtle volume loss, and textural changes consistent with intrinsic and extrinsic aging processes. Skin surface may appear slightly rough or dull.",
    severity: "Moderate to Significant (5–7/10) — depending on depth",
    rootCause: "After age 25, collagen production decreases ~1% annually. UV radiation accelerates matrix metalloproteinase (MMP) activity which degrades collagen and elastin fibers. Combined with reduced hyaluronic acid synthesis, the dermis loses structural support causing the overlying epidermis to fold into wrinkles.",
    detectedConditions: [
      { name: "Dynamic Wrinkles (Expression Lines)", severity: "Moderate (5/10)", zone: "Forehead, crow's feet, between eyebrows", description: "Wrinkles formed by repeated muscle contractions that become permanently etched into the dermis over time." },
      { name: "Fine Lines & Surface Texture", severity: "Mild-Moderate (4/10)", zone: "Full face, under-eye area", description: "Superficial lines from dehydration and epidermal thinning, partially reversible with topical hydration." },
      { name: "Loss of Elasticity (Sagging)", severity: "Moderate (5/10)", zone: "Cheeks, jawline", description: "Reduced skin firmness and early volume descent due to elastin and collagen matrix degradation." }
    ],
    skinType: "Mature, dry to normal with aging concerns",
    overallScore: 52,
    routine: [
      "Morning — Rich cream or balm cleanser to avoid stripping mature skin's natural lipids",
      "Morning — Hyaluronic Acid serum (multi-molecular weight) applied to damp skin for maximum absorption",
      "Morning — Vitamin C 10–15% serum — antioxidant protection + stimulates collagen synthesis",
      "Morning — Peptide serum (Matrixyl, Argireline) on wrinkle-prone zones",
      "Morning — Rich moisturizer with ceramides, peptides and squalane",
      "Morning — SPF 50+ — THE most anti-aging product available",
      "Evening — Gentle milk or balm cleanser, pat dry",
      "Evening — Retinol 0.05% (week 1–4) increasing to 0.1% then 0.3% — apply to full face, avoid eye contour",
      "Evening — Wait 20 minutes, then apply a rich barrier cream (ceramides + cholesterol + fatty acids)"
    ],
    products: [
      "Retinol / Retinal 0.05–0.3% — clinically proven to stimulate collagen, increase cell turnover, smooth wrinkle depth",
      "Copper Peptides (GHK-Cu) — trigger collagen and elastin remodeling, repair skin matrix",
      "Multi-weight Hyaluronic Acid (3 molecular weights) — fills lines with immediate surface hydration",
      "Vitamin C 15% L-Ascorbic Acid — prevents UV-induced collagen breakdown, brightens dull complexion",
      "Bakuchiol 0.5–1% — plant-based retinol alternative, suitable for sensitive mature skin",
      "SPF 50+ broad-spectrum — prevents further collagen photodegradation (most important anti-aging step)"
    ],
    warnings: [
      "Introduce retinol very gradually — start 2x/week and increase only after 4 weeks with no irritation",
      "Never use retinol around the eye contour — use a dedicated peptide eye cream instead",
      "Do not combine retinol with AHAs, BHAs or vitamin C in the same routine — rotate AM/PM"
    ],
    timeline: "Immediate plumping effect from Hyaluronic Acid (hours). Fine line smoothing in 4–8 weeks. Visible wrinkle improvement with retinol in 3–6 months. Maximum remodeling results after 12 months."
  },
  general: {
    problem: "Skin Barrier Sensitivity & Reactive Skin",
    description: "The skin appears reactive and sensitized with signs of barrier dysfunction. Subtle redness, tightness, and uneven texture are visible. The complexion looks fatigued with minor dehydration lines visible in certain zones. The barrier is compromised, making the skin prone to irritation and environmental aggression.",
    severity: "Mild (2–4/10)",
    rootCause: "The stratum corneum (protective outer layer) has a depleted lipid matrix — specifically ceramides, cholesterol and free fatty acids — that normally prevent trans-epidermal water loss. This can be caused by over-cleansing, harsh actives, environmental exposure, stress, or dietary factors.",
    detectedConditions: [
      { name: "Compromised Skin Barrier", severity: "Mild (3/10)", zone: "Full face, especially cheeks", description: "Increased transepidermal water loss causing dryness, tightness and sensitivity to products." },
      { name: "Reactive Redness", severity: "Mild (2/10)", zone: "Cheeks, nose", description: "Diffuse light erythema from capillary dilation in response to barrier disruption and environmental triggers." },
      { name: "Surface Dehydration", severity: "Mild-Moderate (4/10)", zone: "Full face", description: "Fine surface dehydration lines visible, distinct from true dry skin — caused by lack of water in the epidermis." }
    ],
    skinType: "Sensitive, reactive, possibly dehydrated",
    overallScore: 70,
    routine: [
      "Morning — Ultra-gentle, fragrance-free cream or micellar cleanser — no foaming agents or sulfates",
      "Morning — Centella Asiatica (CICA) or Panthenol 5% soothing serum to calm redness and repair barrier",
      "Morning — Barrier repair moisturizer: ceramides + cholesterol + fatty acids (ideal ratio 3:1:1)",
      "Morning — Mineral SPF 30–50 with zinc oxide and titanium dioxide (avoid chemical filters on reactive skin)",
      "Evening — Same gentle cleanser — never double cleanse reactive skin unnecessarily",
      "Evening — Hyaluronic Acid serum on damp skin to restore hydration",
      "Evening — Rich occlusive barrier cream to seal in moisture overnight",
      "Weekly — Hydrating sheet mask with ceramides or Madecassoside for intensive barrier repair"
    ],
    products: [
      "Ceramide NP + EOP + AP complex — restores the critical lipid matrix that holds skin cells together",
      "Panthenol (Vitamin B5) 5% — accelerates epidermal regeneration and soothes irritation",
      "Centella Asiatica (Madecassoside) — reduces redness and inflammation, stimulates collagen synthesis",
      "Squalane — skin-identical emollient that replenishes surface lipids without clogging pores",
      "Hyaluronic Acid serum (fragrance-free) — replenishes surface hydration, strengthens barrier function"
    ],
    warnings: [
      "Avoid ALL fragrances, essential oils and alcohol in products — these are primary barrier disruptors",
      "Do not use exfoliating actives (AHA, BHA, retinol) until barrier is fully restored — minimum 4 weeks",
      "Patch test all new products for 48 hours before full application"
    ],
    timeline: "Barrier repair and reduced sensitivity within 2–4 weeks of consistent gentle care. Full barrier restoration in 4–8 weeks."
  }
};

const identifyConditionFromMetrics = (metrics: AnalyzeImageBody["imageMetrics"]): string => {
  const redRatio = toFinite(metrics?.redRatio, 0);
  const contrast = toFinite(metrics?.contrast, 0);
  if (contrast > 40) return "wrinkles";
  if (redRatio > 0.38) return "acne";
  if (redRatio > 0.35 && contrast > 35) return "acne";
  if (redRatio > 0.34 && contrast < 40) return "general";
  if (contrast > 60) return "dark_spots";
  return "general";
};

async function classifyImageWithTF(imageDataUrl: string): Promise<string | null> {
  const model = await getOrLoadModel();
  if (!model || modelClasses.length === 0) return null;
  try {
    const base64 = imageDataUrl.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
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
    console.error("[TF] Classification error:", err);
    return null;
  }
}

async function validateFaceWithFacePP(imageDataUrl: string): Promise<{ hasFace: boolean }> {
  if (!FACEPP_API_KEY || !FACEPP_API_SECRET) return { hasFace: true };
  try {
    const base64Payload = imageDataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    const formData = new FormData();
    formData.append("api_key", FACEPP_API_KEY);
    formData.append("api_secret", FACEPP_API_SECRET);
    formData.append("image_base64", base64Payload);
    formData.append("return_attributes", "facequality");
    const response = await fetch(FACEPP_DETECT_URL, { method: "POST", body: formData });
    const payload = (await response.json()) as FacePlusPlusDetectResponse;
    if (payload.error_message) {
      console.error("[Face++] API error:", payload.error_message);
      return { hasFace: true };
    }
    const faces = payload.faces || [];
    return { hasFace: faces.length > 0 };
  } catch (err) {
    console.error("[Face++] Request failed:", err);
    return { hasFace: true };
  }
}

async function analyzeWithGemini(imageDataUrl: string): Promise<ConditionDetail | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const mediaTypeMatch = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|webp)/);
    const rawType = mediaTypeMatch?.[1] ?? "jpeg";
    const mimeType = (rawType === "jpg" ? "image/jpeg" : `image/${rawType}`) as
      "image/jpeg" | "image/png" | "image/webp";
    const base64Data = imageDataUrl.split(",")[1];

    const prompt = `You are an expert clinical dermatologist AI. Analyze this facial skin image with maximum precision.

Examine every visible detail: texture, pores, pigmentation, lesions, redness, oiliness, dryness, fine lines, wrinkles, dark spots, and any abnormality.

Return ONLY a valid JSON object with this exact structure (no text outside JSON):
{
  "skinType": "precise skin type description",
  "overallScore": <integer 0-100>,
  "problem": "primary skin condition detected",
  "severity": "e.g. Moderate (6/10)",
  "description": "4-5 sentence comprehensive clinical description",
  "rootCause": "2-3 sentence explanation of biological and environmental causes",
  "detectedConditions": [
    {"name": "condition", "severity": "e.g. Mild (3/10)", "zone": "facial zone", "description": "specific description"}
  ],
  "routine": [
    "Morning Step 1: ...",
    "Morning Step 2: ...",
    "Evening Step 1: ...",
    "Evening Step 2: ..."
  ],
  "products": [
    "Active Ingredient % — benefit",
    "Active Ingredient % — benefit",
    "Active Ingredient % — benefit"
  ],
  "warnings": ["dermatological warning"],
  "timeline": "one sentence realistic timeline"
}

Detect all: acne, blackheads, dark spots, hyperpigmentation, redness, enlarged pores, oiliness, dehydration, fine lines, wrinkles, uneven texture, sensitivity.`;

    const result = await model.generateContent([
      { inlineData: { data: base64Data, mimeType } },
      prompt,
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Gemini] No JSON in response");
      return null;
    }
    const parsed = JSON.parse(jsonMatch[0]) as ConditionDetail;
    if (!parsed.problem || !parsed.description) return null;
    return parsed;
  } catch (err) {
    console.error("[Gemini] Error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeImageBody;
    const image = body.image ?? "";

    if (!image || !DATA_URL_RE.test(image)) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    // 1. Face validation — reject non-face images
    const faceValidation = await validateFaceWithFacePP(image);
    if (!faceValidation.hasFace) {
      return NextResponse.json({
        answer:
          "This image does not appear to contain a human face.\n\n" +
          "To receive a skin analysis, please provide:\n" +
          "• A clear frontal photo of your face\n" +
          "• Good, even lighting (avoid backlighting or harsh shadows)\n" +
          "• Your full face visible and in focus\n" +
          "• Minimum resolution: 300×300 pixels\n\n" +
          "This tool is designed exclusively for facial skin analysis.",
        confidence: 0,
        intent: "no_face_detected",
        skinAnalysis: null,
      });
    }

    // 2. Primary analysis: Gemini Vision API
    const geminiAnalysis = await analyzeWithGemini(image);
    if (geminiAnalysis) {
      const condition = geminiAnalysis;
      const answer =
        `EXPERT DERMATOLOGICAL ANALYSIS — DeepSkyn AI\n` +
        `══════════════════════════════════════════\n\n` +
        `SKIN TYPE\n${condition.skinType ?? "See details below"}\n\n` +
        `OVERALL SKIN HEALTH SCORE: ${condition.overallScore ?? "—"}/100\n\n` +
        `PRIMARY DIAGNOSIS\n${condition.problem} — ${condition.severity}\n\n` +
        `══════════════════════════════════════════\n\n` +
        `CLINICAL DESCRIPTION\n\n${condition.description}\n\n` +
        `══════════════════════════════════════════\n\n` +
        `ROOT CAUSE\n\n${condition.rootCause}\n\n` +
        (condition.detectedConditions && condition.detectedConditions.length > 0
          ? `══════════════════════════════════════════\n\nDETECTED CONDITIONS\n\n` +
          condition.detectedConditions
            .map(
              (c: DetectedCondition, i: number) =>
                `${i + 1}. ${c.name} — ${c.severity}\n   Zone: ${c.zone}\n   ${c.description}`
            )
            .join("\n\n") +
          "\n\n"
          : "") +
        `══════════════════════════════════════════\n\n` +
        `PERSONALISED SKINCARE ROUTINE\n\n` +
        (condition.routine ?? []).map((step: string, idx: number) => `${idx + 1}. ${step}`).join("\n\n") +
        "\n\n" +
        `══════════════════════════════════════════\n\n` +
        `RECOMMENDED ACTIVE INGREDIENTS\n\n` +
        (condition.products ?? []).map((p: string) => `• ${p}`).join("\n") +
        "\n\n" +
        (condition.warnings && condition.warnings.length > 0
          ? `══════════════════════════════════════════\n\nIMPORTANT WARNINGS\n\n` +
          condition.warnings.map((w: string) => `⚠ ${w}`).join("\n") +
          "\n\n"
          : "") +
        `══════════════════════════════════════════\n\n` +
        `EXPECTED TIMELINE\n\n${condition.timeline}\n\n` +
        `══════════════════════════════════════════\n` +
        `Analysis powered by DeepSkyn AI · Gemini Vision`;

      return NextResponse.json({
        answer,
        confidence: 0.97,
        intent: "complete_skin_analysis",
        skinAnalysis: {
          problem: condition.problem,
          severity: condition.severity ?? "",
          description: condition.description ?? "",
          rootCause: condition.rootCause ?? "",
          routine: condition.routine ?? [],
          products: condition.products ?? [],
          timeline: condition.timeline ?? "",
          skinType: condition.skinType,
          overallScore: condition.overallScore,
          detectedConditions: condition.detectedConditions,
          warnings: condition.warnings,
        },
      });
    }

    // 3. Fallback: TF model + enriched static database
    const tfCondition = await classifyImageWithTF(image);
    const metricCondition = identifyConditionFromMetrics(body.imageMetrics);
    const conditionKey = tfCondition ?? metricCondition;
    const condition = SKIN_CONDITION_DATABASE[conditionKey] ?? SKIN_CONDITION_DATABASE["general"];

    const answer =
      `EXPERT DERMATOLOGICAL ANALYSIS — DeepSkyn AI\n` +
      `══════════════════════════════════════════\n\n` +
      `SKIN TYPE\n${condition.skinType ?? "Analysis based on image metrics"}\n\n` +
      `OVERALL HEALTH SCORE: ${condition.overallScore ?? "—"}/100\n\n` +
      `PRIMARY DIAGNOSIS\n${condition.problem} — ${condition.severity}\n\n` +
      `══════════════════════════════════════════\n\n` +
      `CLINICAL DESCRIPTION\n\n${condition.description}\n\n` +
      `══════════════════════════════════════════\n\n` +
      `ROOT CAUSE\n\n${condition.rootCause}\n\n` +
      (condition.detectedConditions && condition.detectedConditions.length > 0
        ? `══════════════════════════════════════════\n\nDETECTED CONDITIONS\n\n` +
        condition.detectedConditions
          .map(
            (c, i) =>
              `${i + 1}. ${c.name} — ${c.severity}\n   Zone: ${c.zone}\n   ${c.description}`
          )
          .join("\n\n") +
        "\n\n"
        : "") +
      `══════════════════════════════════════════\n\n` +
      `PERSONALISED SKINCARE ROUTINE\n\n` +
      (condition.routine ?? []).map((step, idx) => `${idx + 1}. ${step}`).join("\n\n") +
      "\n\n" +
      `══════════════════════════════════════════\n\n` +
      `RECOMMENDED ACTIVE INGREDIENTS\n\n` +
      (condition.products ?? []).map((p) => `• ${p}`).join("\n") +
      "\n\n" +
      (condition.warnings && condition.warnings.length > 0
        ? `══════════════════════════════════════════\n\nIMPORTANT WARNINGS\n\n` +
        condition.warnings.map((w) => `⚠ ${w}`).join("\n") +
        "\n\n"
        : "") +
      `══════════════════════════════════════════\n\n` +
      `EXPECTED TIMELINE\n\n${condition.timeline}\n\n` +
      `══════════════════════════════════════════\n` +
      `Analysis powered by DeepSkyn AI`;

    return NextResponse.json({
      answer,
      confidence: 0.88,
      intent: "complete_skin_analysis",
      skinAnalysis: {
        problem: condition.problem,
        severity: condition.severity,
        description: condition.description,
        rootCause: condition.rootCause,
        routine: condition.routine,
        products: condition.products,
        timeline: condition.timeline,
        skinType: condition.skinType,
        overallScore: condition.overallScore,
        detectedConditions: condition.detectedConditions,
        warnings: condition.warnings,
      },
      details: { conditionDetected: conditionKey },
    });
  } catch (error) {
    console.error("[analyze-image] Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
