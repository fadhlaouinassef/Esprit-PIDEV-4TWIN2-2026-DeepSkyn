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
    problem: "Acné et Imperfections",
    description: "Présence de comédons, papules ou pustules inflammatoires.",
    severity: "Modérée (dépend de la densité des lésions)",
    rootCause: "Excès de sébum, accumulation de cellules mortes et prolifération bactérienne (C. acnes).",
    routine: [
      "Nettoyer avec un gel moussant doux au pH neutre",
      "Appliquer un sérum à l'acide salicylique (BHA) sur les zones cibles",
      "Hydrater avec un fluide léger non comédogène",
      "Protéger avec un SPF 30+ matifiant chaque matin"
    ],
    products: [
      "Acide Salicylique 2% (Exfoliant lipophile)",
      "Niacinamide 10% (Régulateur de sébum et apaisant)",
      "Peroxyde de Benzoyle (Antibactérien puissant)"
    ],
    timeline: "4 à 8 semaines pour une réduction visible des lésions."
  },
  "blackheads": {
    problem: "Points Noirs (Comédons Ouverts)",
    description: "Pores obstrués par du sébum ayant noirci au contact de l'air.",
    severity: "Légère à Modérée",
    rootCause: "Accumulation de sébum et kératine dans les follicules pileux dilatés.",
    routine: [
      "Double nettoyage chaque soir (huile démaquillante + gel nettoyant)",
      "Exfoliation chimique régulière (BHA)",
      "Masque à l'argile hebdomadaire (Argile blanche ou verte)",
      "Application de soins hydratants légers à base d'eau"
    ],
    products: [
      "Huile de nettoyage relipidante",
      "Sérum à l'Acide Salicylique (BHA)",
      "Masque au Charbon actif"
    ],
    timeline: "2 à 4 semaines pour une peau plus nette."
  },
  "dark_spots": {
    problem: "Taches Brunes (Hyperpigmentation)",
    description: "Zones de décoloration sombres résultant d'un surplus de mélanine.",
    severity: "Variable selon l'ancienneté des taches",
    rootCause: "Exposition solaire répétée, cicatrices post-inflammatoires ou mélasma.",
    routine: [
      "Nettoyage illuminateur doux",
      "Application de Vitamine C concentrée le matin",
      "Traitement ciblé à l'Alpha-Arbutine ou Acide Azélaïque le soir",
      "Protection solaire SPF 50+ stricte (ré-application toutes les 2h)"
    ],
    products: [
      "Vitamine C 10-20% (Antioxydant et éclaircissant)",
      "Alpha-Arbutine 2% + Acide Hyaluronique",
      "Crème solaire haute protection à large spectre"
    ],
    timeline: "3 à 6 mois de traitement rigoureux."
  },
  "pores": {
    problem: "Pores Dilatés",
    description: "Apparence marquée des orifices folliculaires, souvent en zone T.",
    severity: "Esthétique",
    rootCause: "Élasticité réduite de la peau ou production de sébum importante.",
    routine: [
      "Nettoyage à l'eau fraîche pour tonifier",
      "Sérum au Niacinamide pour normaliser les pores",
      "Exfoliation douce (AHA / Lactic Acid)",
      "Hydratation équilibrante non grasse"
    ],
    products: [
      "Niacinamide 10% + Zinc 1%",
      "Lotion à l'Acide Glycolique",
      "Sérum au Rétinol pour améliorer la texture globale"
    ],
    timeline: "4 à 6 semaines pour un grain de peau affiné."
  },
  "wrinkles": {
    problem: "Rides et Signes de l'Âge",
    description: "Lignes fines ou marques profondes dues à l'affaiblissement structurel.",
    severity: "Modérée à Prononcée",
    rootCause: "Réduction naturelle du collagène, stress oxydatif et UV.",
    routine: [
      "Nettoyage avec un baume ou lait onctueux",
      "Sérum aux Peptides ou Facteurs de croissance",
      "Traitement au Rétinol ou Rétinal le soir (commencer 2x par semaine)",
      "Crème barrière riche et protection solaire quotidienne"
    ],
    products: [
      "Rétinol pur ou Bakuchiol (alternative douce)",
      "Sérum aux Multi-Peptides (Copper Peptides)",
      "Acide Hyaluronique de différents poids moléculaires"
    ],
    timeline: "Hydratation immédiate, amélioration des rides en 3 à 6 mois."
  },
  "general": {
    problem: "Sensibilité ou Fatigue Cutanée",
    description: "Peau réactive montrant des signes de déshydratation ou rougeurs légères.",
    severity: "Légère",
    rootCause: "Barrière cutanée affaiblie, stress environnemental ou fatigue.",
    routine: [
      "Nettoyage ultra-doux (sans parfum)",
      "Sérum apaisant à la Centella Asiatica ou Panthénol",
      "Hydratation barrière (Céramides)",
      "SPF minéral protecteur"
    ],
    products: [
      "Sérum au Panthénol (B5)",
      "Crème aux Céramides et Squalane",
      "Eau thermale apaisante"
    ],
    timeline: "Apaisement en quelques jours."
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
  
      `ANALYSE DERMATOLOGIQUE EXPERTE\n` +
      `______________________________________\n\n` +
      `DIAGNOSTIC PRINCIPAL\n\n` +
      `${condition.problem}\n` +
      `Sévérité : ${condition.severity}\n\n` +
      `_______________________________________\n\n` +
      `DESCRIPTION DES SYMPTÔMES\n\n` +
      `${condition.description}\n\n` +
      `_______________________________________\n\n` +
      `CAUSE RACINE\n\n` +
      `${condition.rootCause}\n\n` +
      `_______________________________________\n\n` +
      `ROUTINE DE SOINS ETAPE PAR ETAPE\n\n` +
      (condition.routine || []).map((step, idx) => `${idx + 1}. ${step}`).join('\n\n') + `\n\n` +
      `_______________________________________\n\n` +
      `ACTIFS ET PRODUITS RECOMMANDES\n\n` +
      (condition.products || []).map(p => `- ${p}`).join('\n') + `\n\n` +
      `_______________________________________\n\n` +
      `TIMELINE DES RESULTATS\n\n` +
      `${condition.timeline}\n\n` +
      `_______________________________________\n\n` +
      `Note : Cette analyse experte est générée par l'IA DeepSkyn.`;



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
