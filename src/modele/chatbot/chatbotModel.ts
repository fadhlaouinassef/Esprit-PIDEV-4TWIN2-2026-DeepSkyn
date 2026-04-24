import * as tf from "@tensorflow/tfjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type IntentLabel =
  | "product_recommendation"
  | "price_analysis"
  | "ingredient_insight"
  | "brand_info"
  | "product_comparison"
  | "routine_advice"
  | "dataset_facts"
  | "health_warning"
  | "out_of_scope";

type CsvRow = Record<string, string>;

type TrainingExample = {
  text: string;
  label: IntentLabel;
};

type CleanedTrainingExample = TrainingExample & {
  cleanedText: string;
};

type PreprocessedTrainingExample = CleanedTrainingExample & {
  tokens: string[];
};

type EncodedTrainingExample = PreprocessedTrainingExample & {
  vector: number[];
  labelIndex: number;
};

type DatasetSplit = {
  train: EncodedTrainingExample[];
  test: EncodedTrainingExample[];
};

type ClassMetrics = {
  label: IntentLabel;
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

type ConfusionHotspot = {
  actual: IntentLabel;
  predicted: IntentLabel;
  count: number;
};

type UnseenQuestionEval = {
  question: string;
  expected: IntentLabel;
  predicted: IntentLabel;
  confidence: number;
  correct: boolean;
};

type UnseenEvalSummary = {
  accuracy: number;
  total: number;
  correct: number;
  cases: UnseenQuestionEval[];
};

export type ChatbotTrainingMetrics = {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  classes: ClassMetrics[];
  confusionMatrix: number[][];
  trainSize: number;
  testSize: number;
  vocabularySize: number;
  epochs: number;
  confusionHotspots: ConfusionHotspot[];
  validationBestAccuracy: number;
  selectedTrainingConfig: {
    learningRate: number;
    epochs: number;
    batchSize: number;
    units1: number;
    units2: number;
    dropout1: number;
    dropout2: number;
  };
  unseenEvaluation?: UnseenEvalSummary;
};

type PreparedDatasetSummary = {
  rawCount: number;
  cleanedCount: number;
  trainCount: number;
  testCount: number;
  vocabularySize: number;
};

export type ChatbotPipelineReport = {
  generatedAt: string;
  summary: PreparedDatasetSummary;
  metrics: ChatbotTrainingMetrics;
  improvementLoop: {
    userFeedbackPath: string;
    loadedFeedbackExamples: number;
  };
};

type PrepareDatasetOptions = {
  trainRatio?: number;
  writeFiles?: boolean;
};

type TrainingConfig = {
  learningRate: number;
  epochs: number;
  batchSize: number;
  units1: number;
  units2: number;
  dropout1: number;
  dropout2: number;
};

type TrainingPipelineArtifacts = {
  stats: DatasetStats;
  examplesRaw: TrainingExample[];
  examplesClean: CleanedTrainingExample[];
  examplesPreprocessed: PreprocessedTrainingExample[];
  split: DatasetSplit;
  vocabulary: string[];
  labelToIndex: Record<IntentLabel, number>;
  feedbackExamplesLoaded: number;
};

type ProductRecord = {
  name: string;
  brand: string;
  url: string | null;
  type: string;
  productCategory: string;
  ingredients: string[];
  ingredientCount: number;
  activeIngredients: string[];
  hasActiveIngredient: boolean;
  concerns: string[];
  skinType: string[];
  price: number | null;
  source: string;
};

type SkinCareRecord = {
  title: string;
  stars: number;
  vote: number;
  price: number | null;
};

type DiabetesRecord = {
  glucose: number;
  bmi: number;
  outcome: number;
};

type DatasetStats = {
  skinCareRows: number;
  productsRows: number;
  productsRowsClean: number;
  productsRowsParapharmacie: number;
  duplicateProductsRemoved: number;
  missingPriceCount: number;
  missingBrandCount: number;
  missingIngredientsCount: number;
  diabetesRows: number;
  avgStars: number;
  avgSkinCarePrice: number;
  avgProductPrice: number;
  minProductPrice: number;
  maxProductPrice: number;
  topRatedTitles: string[];
  topProductTypes: Array<{ type: string; count: number }>;
  topProductKinds: Array<{ kind: string; count: number }>;
  topBrands: Array<{ brand: string; count: number }>;
  brands: string[];
  topIngredients: Array<{ ingredient: string; count: number }>;
  topConcerns: Array<{ concern: string; count: number }>;
  topSkinTypes: Array<{ skinType: string; count: number }>;
  activeIngredientCoverage: number;
  highRiskDiabetesRatio: number;
  avgGlucose: number;
  avgBmi: number;
  products: ProductRecord[];
  skinCare: SkinCareRecord[];
};

type ProductInsight = {
  benefits: string[];
  cautions: string[];
  keyIngredients: string[];
};

type IngredientRule = {
  matchers: string[];
  benefits: string[];
  cautions?: string[];
  helpsConcerns?: string[];
};

type ChatbotRuntime = {
  model: tf.Sequential;
  vocabulary: string[];
  labelToIndex: Record<IntentLabel, number>;
  indexToLabel: IntentLabel[];
  stats: DatasetStats;
};

export type ChatbotAnswer = {
  answer: string;
  confidence: number;
  intent: IntentLabel;
  suggestions: string[];
};

const STOPWORDS = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "et",
  "eux",
  "il",
  "je",
  "la",
  "le",
  "les",
  "leur",
  "lui",
  "ma",
  "mais",
  "me",
  "meme",
  "mes",
  "moi",
  "mon",
  "ne",
  "nos",
  "notre",
  "nous",
  "on",
  "ou",
  "par",
  "pas",
  "pour",
  "qu",
  "que",
  "qui",
  "sa",
  "se",
  "ses",
  "son",
  "sur",
  "ta",
  "te",
  "tes",
  "toi",
  "ton",
  "tu",
  "un",
  "une",
  "vos",
  "votre",
  "vous",
  "what",
  "which",
  "when",
  "where",
  "why",
  "how",
  "the",
  "is",
  "are",
  "for",
  "with",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "my",
  "your",
]);

const INTENT_LABELS: IntentLabel[] = [
  "product_recommendation",
  "price_analysis",
  "ingredient_insight",
  "brand_info",
  "product_comparison",
  "routine_advice",
  "dataset_facts",
  "health_warning",
  "out_of_scope",
];

const TRAIN_EPOCHS = 95;
const LEARNING_RATE = 0.015;
const MIN_CONFIDENCE = 0.33;

const USER_FEEDBACK_DATASET_PATH = path.join(
  process.cwd(),
  "src",
  "modele",
  "datasets",
  "chatbot",
  "user_feedback_examples.json"
);

const TRAINING_CANDIDATES: TrainingConfig[] = [
  {
    learningRate: LEARNING_RATE,
    epochs: TRAIN_EPOCHS,
    batchSize: 16,
    units1: 64,
    units2: 32,
    dropout1: 0.2,
    dropout2: 0.1,
  },
  {
    learningRate: 0.01,
    epochs: 120,
    batchSize: 20,
    units1: 72,
    units2: 36,
    dropout1: 0.25,
    dropout2: 0.15,
  },
];

const MIN_SAMPLES_PER_INTENT: Record<IntentLabel, number> = {
  product_recommendation: 220,
  price_analysis: 120,
  ingredient_insight: 120,
  brand_info: 120,
  product_comparison: 120,
  routine_advice: 120,
  dataset_facts: 120,
  health_warning: 120,
  out_of_scope: 120,
};

const MAX_SAMPLES_PER_INTENT: Record<IntentLabel, number> = {
  product_recommendation: 260,
  price_analysis: 160,
  ingredient_insight: 160,
  brand_info: 160,
  product_comparison: 160,
  routine_advice: 160,
  dataset_facts: 160,
  health_warning: 160,
  out_of_scope: 160,
};

const EXTRA_INTENT_EXAMPLES: Record<IntentLabel, string[]> = {
  product_recommendation: [
    "recommend a light moisturizer for sensitive skin",
    "suggest a serum for dark spots",
    "quel produit me conseillez vous pour acne",
    "best cleanser for oily skin",
    "je veux une creme hydratante non comedogene",
  ],
  price_analysis: [
    "compare prices between cleansers and serums",
    "donne moi la fourchette de prix des produits",
    "which category is the most expensive",
    "prix moyen des produits pour peau sensible",
    "is this product expensive in your dataset",
  ],
  ingredient_insight: [
    "explain what ceramides do",
    "benefits of niacinamide for oily skin",
    "ingredient analysis for sensitive skin",
    "quels actifs pour la barriere cutanee",
    "does salicylic acid help acne",
  ],
  brand_info: [
    "products from cerave",
    "show me products by la roche posay",
    "infos sur la marque svr",
    "what brands are in your dataset",
    "donne les produits de la marque bioderma",
  ],
  product_comparison: [
    "compare cerave foaming cleanser and cetaphil gentle cleanser",
    "which is better serum or cream for dry skin",
    "compare prices between cerave and bioderma",
    "difference between niacinamide serum and vitamin c serum",
    "compare these two products",
  ],
  routine_advice: [
    "donne moi une routine simple pour debutant",
    "routine peau mixte matin soir",
    "how many steps should my night routine have",
    "quelle routine pour peau acneique et sensible",
    "build me an anti dark spot routine",
    "routine minimaliste pour peau reactive",
    "what order should i apply skincare products",
    "routine with cleanser serum moisturizer spf",
    "je cherche une routine anti age douce",
    "can you suggest a weekly routine schedule",
    "routine AM PM for dehydrated skin",
    "comment construire une routine sans irritation",
    "routine visage pour peau seche en hiver",
    "routine ete pour peau grasse",
    "best beginner skincare routine for men",
  ],
  dataset_facts: [
    "how many products are in your merged dataset",
    "list the data sources used for training",
    "combien de produits uniques apres nettoyage",
    "what is the vocabulary size of the model",
    "how many train and test samples do you have",
    "what csv files are loaded by the chatbot",
    "dataset summary please",
    "statistiques du dataset chatbot",
    "nombre de lignes par fichier csv",
    "quel est le nombre de classes du modele",
    "what are the intent labels",
    "how much data is used for training",
    "quelle proportion train test utilisez vous",
    "dataset quality metrics",
    "show me data preprocessing stats",
  ],
  health_warning: [
    "is high glucose linked to skin issues",
    "can diabetes affect skin healing",
    "what does high bmi imply for skin health",
    "donnees diabetiques et risques cutanes",
    "explain metabolic risk and skin",
    "does insulin resistance impact acne",
    "is this a medical diagnosis",
    "health warning about glucose and skin",
    "difference between info and diagnosis",
    "can i replace doctor advice with this model",
    "warning for diabetic skincare",
    "quels risques metabolique pour la peau",
    "impact du diabete sur hydratation cutanee",
    "skin complications and elevated glucose",
    "medical disclaimer for your answers",
  ],
  out_of_scope: [
    "write me a javascript sorting algorithm",
    "tell me a football result",
    "compose a rap song",
    "quelle est la capitale du japon",
    "convert pdf to word",
    "who won the world cup",
    "solve this calculus equation",
    "raconte moi une histoire",
    "book me a flight ticket",
    "show latest crypto prices",
    "write a cover letter",
    "generate a logo for my startup",
    "predict tomorrow weather",
    "comment installer windows",
    "find me a movie to watch",
  ],
};

const VARIANT_PREFIXES = [
  "",
  "please ",
  "can you ",
  "could you ",
  "help me ",
  "j ai besoin de ",
  "je veux ",
  "donne moi ",
];

const VARIANT_SUFFIXES = [
  "",
  " now",
  " please",
  " with details",
  " in simple words",
  " rapidement",
  " en francais",
  " for my case",
];

const PRODUCT_KIND_KEYWORDS: Array<{ kind: string; keywords: string[] }> = [
  { kind: "serum", keywords: ["serum"] },
  { kind: "gel", keywords: ["gel"] },
  { kind: "cleanser", keywords: ["cleanser", "wash", "foam", "mousse"] },
  { kind: "moisturizer", keywords: ["moistur", "lotion", "cream", "hydrat"] },
  { kind: "toner", keywords: ["toner", "mist"] },
  { kind: "mask", keywords: ["mask", "patch"] },
  { kind: "balm", keywords: ["balm"] },
  { kind: "sunscreen", keywords: ["spf", "sunscreen", "sun", "uv"] },
  { kind: "eye-care", keywords: ["eye", "contour"] },
  { kind: "exfoliant", keywords: ["peel", "exfol", "aha", "bha", "glycolic", "salicylic"] },
];

const PRODUCT_TYPE_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: "cleanser", aliases: ["cleanser", "face wash", "washing", "nettoyant", "foam", "gel wash"] },
  { canonical: "serum", aliases: ["serum", "serums", "concentrate"] },
  { canonical: "moisturizer", aliases: ["moisturizer", "moisturiser", "cream", "creme", "lotion", "hydrating cream"] },
  { canonical: "toner", aliases: ["toner", "mist", "essence water"] },
  { canonical: "sunscreen", aliases: ["sunscreen", "sun screen", "spf", "uv"] },
  { canonical: "mask", aliases: ["mask", "sheet mask", "sleeping mask", "patch"] },
  { canonical: "balm", aliases: ["balm", "baume"] },
  { canonical: "eye-care", aliases: ["eye", "eye cream", "contour eyes"] },
  { canonical: "exfoliant", aliases: ["exfoliant", "peeling", "aha", "bha"] },
];

const BRAND_CANONICAL_MAP: Record<string, string> = {
  "cerave": "cerave",
  "cera ve": "cerave",
  "la roche posay": "la roche posay",
  "larocheposay": "la roche posay",
  "la roche-posay": "la roche posay",
  "loreal": "loreal",
  "l oreal": "loreal",
  "loreal paris": "loreal",
  "la mer": "la mer",
  "paulas choice": "paulas choice",
  "paula s choice": "paulas choice",
};

const ACTIVE_INGREDIENT_MATCHERS = [
  "niacinamide",
  "hyaluronic acid",
  "sodium hyaluronate",
  "salicylic acid",
  "retinol",
  "retinal",
  "adapalene",
  "azelaic acid",
  "glycolic acid",
  "lactic acid",
  "vitamin c",
  "ascorbic acid",
  "ceramide",
  "panthenol",
  "zinc",
  "peptide",
];

const INGREDIENT_RULES: IngredientRule[] = [
  {
    matchers: ["niacinamide"],
    benefits: ["Regule l'exces de sebum et aide a uniformiser le teint"],
    helpsConcerns: ["acne", "oily", "spots", "pores"],
  },
  {
    matchers: ["hyaluronic", "hyaluronate", "sodium hyaluronate"],
    benefits: ["Hydratation intense et soutien de la barriere cutanee"],
    helpsConcerns: ["dry", "dehydrated", "sensitive"],
  },
  {
    matchers: ["glycerin"],
    benefits: ["Humectant cle qui retient l'eau dans la peau"],
    helpsConcerns: ["dry", "dehydrated", "sensitive"],
  },
  {
    matchers: ["ceramide", "ceramides", "cholesterol", "phytosphingosine"],
    benefits: ["Renforce la barriere cutanee et limite la perte en eau"],
    helpsConcerns: ["dry", "sensitive", "redness"],
  },
  {
    matchers: ["salicylic", "salicylate"],
    benefits: ["Aide a desobstruer les pores et reduire les imperfections"],
    cautions: ["Peut asscher ou irriter si usage trop frequent"],
    helpsConcerns: ["acne", "oily", "pores"],
  },
  {
    matchers: ["retinol", "retinoid", "retinal"],
    benefits: ["Soutient le renouvellement cellulaire et les signes de l'age"],
    cautions: ["Introduire progressivement, irritation possible"],
    helpsConcerns: ["aging", "texture", "spots"],
  },
  {
    matchers: ["vitamin c", "ascorb", "sodium ascorbyl", "ascorbyl"],
    benefits: ["Aide l'eclat du teint et les taches"],
    cautions: ["Peut picoter sur peau reactive"],
    helpsConcerns: ["spots", "dull", "aging"],
  },
  {
    matchers: ["panthenol", "allantoin", "centella", "madecassoside", "bisabolol"],
    benefits: ["Apaisant et reparateur pour peau sensible"],
    helpsConcerns: ["sensitive", "redness", "irritation"],
  },
  {
    matchers: ["alcohol denat", "denatured alcohol"],
    benefits: [],
    cautions: ["Peut sensibiliser les peaux seches/sensibles"],
  },
  {
    matchers: ["fragrance", "parfum", "perfume", "limonene", "linalool", "citral"],
    benefits: [],
    cautions: ["Parfum/allergenes potentiels pour peaux reactives"],
  },
  {
    matchers: ["spf", "octocrylene", "avobenzone", "titanium dioxide", "zinc oxide"],
    benefits: ["Contribue a la protection UV quotidienne"],
    helpsConcerns: ["spots", "aging", "redness"],
  },
];

type GlobalChatbotState = {
  runtimePromise: Promise<ChatbotRuntime> | null;
};

const globalChatbot = globalThis as typeof globalThis & {
  __deepskynChatbotState?: GlobalChatbotState;
};

const chatbotState: GlobalChatbotState =
  globalChatbot.__deepskynChatbotState ||
  (globalChatbot.__deepskynChatbotState = {
    runtimePromise: null,
  });

const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isUsefulToken = (token: string): boolean => {
  if (!token || token.length < 2) return false;
  if (STOPWORDS.has(token)) return false;
  if (/^\d+$/.test(token)) return false;
  if (/^(ml|g|oz|kg|pack|pcs|piece|size|various|shade|shades)$/.test(token)) return false;
  return true;
};

const tokenizeNormalized = (normalized: string): string[] => {
  const rawTokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const cleaned = rawTokens.filter((token) => isUsefulToken(token));
  const ngrams: string[] = [];

  for (let i = 0; i < cleaned.length - 1; i++) {
    const bigram = `${cleaned[i]}_${cleaned[i + 1]}`;
    if (bigram.length <= 40) ngrams.push(bigram);
  }

  return [...cleaned, ...ngrams];
};

const tokenize = (value: string): string[] => {
  return tokenizeNormalized(normalizeText(value));
};

const normalizeTrainingQuestion = (value: string): string => {
  const normalized = normalizeText(value)
    .replace(/\bpls\b/g, "please")
    .replace(/\bprixx\b/g, "prix")
    .replace(/\bproduitss\b/g, "produits")
    .replace(/\bingredientss\b/g, "ingredients")
    .replace(/\bcomparer\b/g, "compare")
    .trim();
  return normalized;
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsv = async (filePath: string): Promise<CsvRow[]> => {
  const raw = await readFile(filePath, "utf-8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((column) => column.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: CsvRow = {};

    for (let j = 0; j < header.length; j++) {
      row[header[j]] = (cells[j] || "").trim();
    }

    rows.push(row);
  }

  return rows;
};

const parsePrice = (value: string): number | null => {
  if (!value) return null;
  const normalized = String(value)
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = normalized.replace(/[^0-9.]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;

  if (!value.includes(".") && parsed > 1000) {
    return parsed / 100;
  }

  return parsed;
};

const safeNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseIngredientList = (raw: string): string[] => {
  if (!raw) return [];

  const normalized = String(raw)
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/[|]/g, ",")
    .replace(/[;]/g, ",");

  return normalized
    .split(",")
    .map((item) => normalizeText(item.replace(/['\"]/g, "").trim().toLowerCase()))
    .filter((item) => item.length > 1)
    .filter((item, index, all) => all.indexOf(item) === index);
};

const normalizeBrandName = (value: string): string => {
  const normalized = normalizeText(value);
  if (!normalized) return "unknown";
  return BRAND_CANONICAL_MAP[normalized] || normalized;
};

const normalizeProductType = (value: string): string => {
  const normalized = normalizeText(value);
  if (!normalized) return "general";

  for (const item of PRODUCT_TYPE_ALIASES) {
    if (item.aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      return item.canonical;
    }
  }

  return normalized;
};

const parseTagList = (raw: string): string[] => {
  if (!raw) return [];
  return raw
    .split(/[,;|/]/)
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 1)
    .filter((item, index, all) => all.indexOf(item) === index);
};

const extractActiveIngredients = (ingredients: string[]): string[] => {
  const matches = new Set<string>();
  for (const ingredient of ingredients) {
    for (const active of ACTIVE_INGREDIENT_MATCHERS) {
      if (ingredient.includes(active)) {
        matches.add(active);
      }
    }
  }
  return [...matches];
};

const inferConcernsFromIngredients = (ingredients: string[]): string[] => {
  const concerns = new Set<string>();

  for (const ingredient of ingredients) {
    if (ingredient.includes("salicylic") || ingredient.includes("niacinamide")) concerns.add("acne");
    if (ingredient.includes("hyaluronic") || ingredient.includes("glycerin") || ingredient.includes("ceramide")) concerns.add("hydration");
    if (ingredient.includes("panthenol") || ingredient.includes("allantoin") || ingredient.includes("centella")) concerns.add("sensitivity");
    if (ingredient.includes("vitamin c") || ingredient.includes("retinol") || ingredient.includes("azelaic")) concerns.add("spots");
    if (ingredient.includes("retinol") || ingredient.includes("peptide") || ingredient.includes("glycolic")) concerns.add("aging");
  }

  return [...concerns];
};

const BRAND_STOPWORDS = new Set([
  "est",
  "sont",
  "quel",
  "quels",
  "quelle",
  "quelles",
  "produit",
  "produits",
  "skincare",
  "la",
  "le",
  "les",
  "de",
  "des",
  "du",
  "d",
  "l",
  "the",
  "a",
  "an",
  "by",
  "for",
  "with",
  "and",
  "skin",
  "care",
  "anti",
  "super",
]);

const extractBrand = (productName: string): string => {
  const tokens = String(productName || "")
    .replace(/[^a-zA-Z]+/g, " ")
    .split(/\s+/)
    .map((chunk) => normalizeText(chunk))
    .filter((chunk) => chunk.length > 0);

  const brand = tokens.find((token) => token.length >= 3 && !BRAND_STOPWORDS.has(token));
  return normalizeBrandName(brand || "");
};

const textHasBrand = (normalizedQuestion: string, brand: string): boolean => {
  if (!brand) return false;

  if (brand.includes(" ")) {
    return normalizedQuestion.includes(brand);
  }

  return tokenize(normalizedQuestion).includes(brand);
};

const toTitleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

const inferProductKind = (product: ProductRecord): string => {
  const normalized = `${normalizeText(product.name)} ${normalizeText(product.type)}`;
  for (const mapping of PRODUCT_KIND_KEYWORDS) {
    if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
      return mapping.kind;
    }
  }

  return normalizeText(product.type || "general") || "general";
};

const detectRequestedProductKind = (question: string): string | null => {
  const normalized = normalizeText(question);
  for (const mapping of PRODUCT_KIND_KEYWORDS) {
    if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
      return mapping.kind;
    }
  }

  return null;
};

const countTop = (items: string[], take = 6): Array<{ value: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([value, count]) => ({ value, count }));
};

const isBrandTokenPlausible = (value: string): boolean => {
  if (!value || value === "unknown") return false;
  if (value.length < 3 || value.length > 28) return false;
  if (!/^[a-z0-9\s]+$/.test(value)) return false;
  if (BRAND_STOPWORDS.has(value)) return false;
  return true;
};

const includesAny = (text: string, terms: string[]): boolean => {
  return terms.some((term) => text.includes(term));
};

const uniqueExamples = (examples: TrainingExample[]): TrainingExample[] => {
  const seen = new Set<string>();
  const output: TrainingExample[] = [];

  for (const item of examples) {
    const normalized = normalizeText(item.text);
    if (!normalized) continue;
    const key = `${item.label}::${normalized}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ text: item.text.trim(), label: item.label });
  }

  return output;
};

const sanitizeTrainingText = (text: string): string => {
  const normalized = normalizeTrainingQuestion(text);
  return normalized.length > 0 ? normalized : text.trim();
};

const loadUserFeedbackExamples = async (): Promise<TrainingExample[]> => {
  try {
    const raw = await readFile(USER_FEEDBACK_DATASET_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Array<{ text?: string; label?: string }>;

    if (!Array.isArray(parsed)) return [];

    const accepted = new Set<IntentLabel>(INTENT_LABELS);
    const rows: TrainingExample[] = [];
    for (const item of parsed) {
      const text = String(item?.text || "").trim();
      const label = String(item?.label || "") as IntentLabel;
      if (!text || !accepted.has(label)) continue;
      rows.push({ text, label });
    }

    return uniqueExamples(rows);
  } catch {
    return [];
  }
};

const buildHardNegativeExamples = (stats: DatasetStats): TrainingExample[] => {
  const hard: TrainingExample[] = [];
  const topBrands = stats.topBrands.slice(0, 12).map((item) => item.brand);

  for (const brand of topBrands) {
    hard.push({ text: `compare ${brand} and ${brand} products`, label: "product_comparison" });
    hard.push({ text: `brand info ${brand}`, label: "brand_info" });
    hard.push({ text: `price of ${brand} products`, label: "price_analysis" });
  }

  hard.push({ text: "ingredients list of this product", label: "ingredient_insight" });
  hard.push({ text: "what ingredients are inside this serum", label: "ingredient_insight" });
  hard.push({ text: "products from this brand", label: "brand_info" });
  hard.push({ text: "difference between product a and product b", label: "product_comparison" });

  return hard;
};

const buildVariantText = (text: string, index: number): string => {
  const prefix = VARIANT_PREFIXES[index % VARIANT_PREFIXES.length];
  const suffix = VARIANT_SUFFIXES[Math.floor(index / VARIANT_PREFIXES.length) % VARIANT_SUFFIXES.length];
  const base = normalizeText(text);
  return `${prefix}${base}${suffix}`.trim();
};

const rebalanceExamples = (examples: TrainingExample[]): TrainingExample[] => {
  const byLabel = new Map<IntentLabel, TrainingExample[]>();

  for (const label of INTENT_LABELS) {
    byLabel.set(label, []);
  }

  for (const item of uniqueExamples(examples)) {
    byLabel.get(item.label)?.push(item);
  }

  for (const label of INTENT_LABELS) {
    const bucket = byLabel.get(label) || [];
    const extras = EXTRA_INTENT_EXAMPLES[label] || [];

    for (const text of extras) {
      bucket.push({ text, label });
    }

    let idx = 0;
    while (bucket.length < MIN_SAMPLES_PER_INTENT[label]) {
      const source = (bucket[idx % bucket.length] || extras[idx % Math.max(extras.length, 1)] || "help") as TrainingExample | string;
      const sourceText = typeof source === "string" ? source : source.text;
      bucket.push({
        text: buildVariantText(sourceText, idx),
        label,
      });
      idx += 1;
      if (idx > 6000) break;
    }

    const dedupedBucket = uniqueExamples(bucket);
    const maxAllowed = MAX_SAMPLES_PER_INTENT[label];
    byLabel.set(label, dedupedBucket.slice(0, Math.min(dedupedBucket.length, maxAllowed)));
  }

  return INTENT_LABELS.flatMap((label) => byLabel.get(label) || []);
};

const detectSkinConcerns = (question: string): string[] => {
  const normalized = normalizeText(question);
  const concerns = new Set<string>();

  if (includesAny(normalized, ["acne", "imperfection", "bouton", "pores"])) concerns.add("acne");
  if (includesAny(normalized, ["grasse", "oily", "sebum"])) concerns.add("oily");
  if (includesAny(normalized, ["seche", "dry", "deshydrate", "dehydrated"])) concerns.add("dry");
  if (includesAny(normalized, ["sensible", "sensitive", "reactive", "irrite", "redness", "rougeur"])) concerns.add("sensitive");
  if (includesAny(normalized, ["tache", "spots", "pigment", "dull", "terne"])) concerns.add("spots");
  if (includesAny(normalized, ["rides", "aging", "anti age", "fermete", "texture"])) concerns.add("aging");

  return [...concerns];
};

const parseBudgetMax = (question: string): number | null => {
  const normalized = normalizeText(question);
  const match = normalized.match(/(moins de|under|max|maximum|budget)\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const parsed = Number(match[2]);
  return Number.isFinite(parsed) ? parsed : null;
};

const productsByBrand = (brand: string, stats: DatasetStats): ProductRecord[] => {
  const canonical = normalizeBrandName(brand);
  return stats.products.filter((product) => product.brand === canonical);
};

const avgPrice = (products: ProductRecord[]): number => {
  const prices = products.map((item) => item.price ?? 0).filter((item) => item > 0);
  return round(mean(prices));
};

const scoreProductForQuestion = (
  product: ProductRecord,
  question: string,
  concerns: string[],
  requestedKind: string | null,
  budgetMax: number | null
): number => {
  const normalized = normalizeText(question);
  const titleTokens = tokenize(product.name);
  const overlap = titleTokens.filter((token) => normalized.includes(token)).length;
  const kindScore = requestedKind && inferProductKind(product) === requestedKind ? 4 : 0;
  const ingredientNameScore = product.ingredients.some((item) => normalized.includes(normalizeText(item))) ? 2 : 0;

  let concernScore = 0;
  for (const concern of concerns) {
    for (const rule of INGREDIENT_RULES) {
      if (!(rule.helpsConcerns || []).includes(concern)) continue;
      const matched = rule.matchers.some((matcher) =>
        product.ingredients.some((ingredient) => normalizeText(ingredient).includes(matcher))
      );
      if (matched) concernScore += 2;
    }
  }

  let budgetScore = 0;
  if (budgetMax !== null && product.price !== null) {
    budgetScore = product.price <= budgetMax ? 2 : -2;
  }

  let sensitivityPenalty = 0;
  if (concerns.includes("sensitive")) {
    const normalizedIngredients = product.ingredients.map((item) => normalizeText(item));
    const hasPotentialIrritant = normalizedIngredients.some(
      (item) => item.includes("alcohol denat") || item.includes("parfum") || item.includes("fragrance")
    );
    sensitivityPenalty = hasPotentialIrritant ? -2 : 0;
  }

  return overlap + kindScore + ingredientNameScore + concernScore + budgetScore + sensitivityPenalty;
};

const buildStats = async (): Promise<DatasetStats> => {
  const datasetsPath = path.join(process.cwd(), "src", "modele", "datasets");
  const skinCareRaw = await parseCsv(path.join(datasetsPath, "skin_care.csv"));
  const productsRaw = await parseCsv(path.join(datasetsPath, "skincare_products_clean.csv"));
  const productsParapharmacieRaw = await parseCsv(
    path.join(datasetsPath, "skincare_productsparapharmacie.csv")
  );
  const diabetesRaw = await parseCsv(path.join(datasetsPath, "diabetes.csv"));

  const skinCare: SkinCareRecord[] = skinCareRaw.map((row) => ({
    title: row.title || "Unknown product",
    stars: safeNumber(row.stars, 0),
    vote: safeNumber(row.vote, 0),
    price: parsePrice(row.price),
  }));

  const readFirst = (row: CsvRow, keys: string[]): string => {
    for (const key of keys) {
      const value = String(row[key] || "").trim();
      if (value) return value;
    }
    return "";
  };

  const mapProductRow = (row: CsvRow, source: string): ProductRecord => {
    const nameRaw = readFirst(row, ["product_name", "title", "name"]);
    const typeRaw = readFirst(row, ["product_type", "type", "category"]);
    const ingredientsRaw = readFirst(row, ["clean_ingreds", "ingredients", "inci"]);
    const brandRaw = readFirst(row, ["brand", "product_brand"]);
    const skinTypeRaw = readFirst(row, ["skin_type", "skin_types"]);
    const concernsRaw = readFirst(row, ["concerns", "concern", "skin_concerns"]);

    const name = nameRaw || "Unknown product";
    const inferredBrand = extractBrand(name);
    const brand = normalizeBrandName(brandRaw || inferredBrand || "unknown");
    const ingredients = parseIngredientList(ingredientsRaw || "");
    const concerns = parseTagList(concernsRaw);
    const concernsInferred = inferConcernsFromIngredients(ingredients);
    const mergedConcerns = [...new Set([...concerns, ...concernsInferred])];
    const skinType = parseTagList(skinTypeRaw);
    const activeIngredients = extractActiveIngredients(ingredients);

    return {
      name,
      brand,
      url: readFirst(row, ["product_url", "url", "link"]) || null,
      type: normalizeProductType(typeRaw || "general"),
      productCategory: inferProductKind({
        name,
        brand,
        url: null,
        type: normalizeProductType(typeRaw || "general"),
        productCategory: "general",
        ingredients,
        ingredientCount: ingredients.length,
        activeIngredients,
        hasActiveIngredient: activeIngredients.length > 0,
        concerns: mergedConcerns,
        skinType,
        price: null,
        source,
      }),
      ingredients,
      ingredientCount: ingredients.length,
      activeIngredients,
      hasActiveIngredient: activeIngredients.length > 0,
      concerns: mergedConcerns,
      skinType,
      price: parsePrice(readFirst(row, ["price", "product_price", "sale_price"])),
      source,
    };
  };

  const productsCombined = [
    ...productsRaw.map((row) => mapProductRow(row, "clean")),
    ...productsParapharmacieRaw.map((row) => mapProductRow(row, "parapharmacie")),
  ];

  // Keep one canonical product per (brand, name) and prefer richer entries.
  const productsByName = new Map<string, ProductRecord>();
  for (const product of productsCombined) {
    const key = `${product.brand}::${normalizeText(product.name)}`;
    const existing = productsByName.get(key);
    if (!existing) {
      productsByName.set(key, product);
      continue;
    }

    const existingScore =
      existing.ingredients.length + (existing.price ? 1 : 0) + (existing.url ? 1 : 0);
    const candidateScore =
      product.ingredients.length + (product.price ? 1 : 0) + (product.url ? 1 : 0);

    if (candidateScore > existingScore) {
      productsByName.set(key, product);
    }
  }

  const duplicateProductsRemoved = productsCombined.length - productsByName.size;
  const products = [...productsByName.values()];

  const pricesKnown = products.map((item) => item.price).filter((p): p is number => p !== null && p > 0);
  const priceMedianFallback = pricesKnown.length > 0
    ? [...pricesKnown].sort((a, b) => a - b)[Math.floor(pricesKnown.length / 2)]
    : 0;

  const productsFilled = products.map((product) => ({
    ...product,
    price: product.price ?? (priceMedianFallback > 0 ? round(priceMedianFallback, 2) : null),
  }));

  const missingPriceCount = products.filter((item) => item.price === null).length;
  const missingBrandCount = products.filter((item) => !item.brand || item.brand === "unknown").length;
  const missingIngredientsCount = products.filter((item) => item.ingredients.length === 0).length;

  const diabetes: DiabetesRecord[] = diabetesRaw.map((row) => ({
    glucose: safeNumber(row.Glucose, 0),
    bmi: safeNumber(row.BMI, 0),
    outcome: safeNumber(row.Outcome, 0),
  }));

  const topRatedTitles = [...skinCare]
    .sort((a, b) => {
      const scoreA = a.stars * Math.max(1, Math.log10(a.vote + 10));
      const scoreB = b.stars * Math.max(1, Math.log10(b.vote + 10));
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((item) => item.title);

  const topTypes = countTop(products.map((item) => item.type), 5).map((item) => ({
    type: item.value,
    count: item.count,
  }));

  const topProductKinds = countTop(productsFilled.map((item) => item.productCategory || inferProductKind(item)), 10).map((item) => ({
    kind: item.value,
    count: item.count,
  }));

  const topBrands = countTop(
    productsFilled.map((item) => item.brand).filter((brand) => brand.length > 0 && brand !== "unknown"),
    60
  )
    .filter((item) => isBrandTokenPlausible(item.value))
    .filter((item) => item.count >= 2)
    .map((item) => ({ brand: item.value, count: item.count }));

  const brands = [
    ...new Set(
      productsFilled
        .map((item) => item.brand)
        .filter((brand) => brand.length > 0 && brand !== "unknown" && isBrandTokenPlausible(brand))
    ),
  ];

  const topIngredients = countTop(productsFilled.flatMap((item) => item.ingredients), 10).map((item) => ({
    ingredient: item.value,
    count: item.count,
  }));

  const topConcerns = countTop(productsFilled.flatMap((item) => item.concerns), 8).map((item) => ({
    concern: item.value,
    count: item.count,
  }));

  const topSkinTypes = countTop(productsFilled.flatMap((item) => item.skinType), 6).map((item) => ({
    skinType: item.value,
    count: item.count,
  }));

  const activeIngredientCoverage = productsFilled.length === 0
    ? 0
    : round(productsFilled.filter((item) => item.hasActiveIngredient).length / productsFilled.length, 3);

  const minProductPrice = pricesKnown.length > 0 ? round(Math.min(...pricesKnown), 2) : 0;
  const maxProductPrice = pricesKnown.length > 0 ? round(Math.max(...pricesKnown), 2) : 0;

  return {
    skinCareRows: skinCare.length,
    productsRows: productsFilled.length,
    productsRowsClean: productsRaw.length,
    productsRowsParapharmacie: productsParapharmacieRaw.length,
    duplicateProductsRemoved,
    missingPriceCount,
    missingBrandCount,
    missingIngredientsCount,
    diabetesRows: diabetes.length,
    avgStars: round(mean(skinCare.map((item) => item.stars))),
    avgSkinCarePrice: round(mean(skinCare.map((item) => item.price ?? 0).filter((p) => p > 0))),
    avgProductPrice: round(mean(pricesKnown)),
    minProductPrice,
    maxProductPrice,
    topRatedTitles,
    topProductTypes: topTypes,
    topProductKinds,
    topBrands,
    brands,
    topIngredients,
    topConcerns,
    topSkinTypes,
    activeIngredientCoverage,
    highRiskDiabetesRatio: round(mean(diabetes.map((item) => (item.outcome > 0 ? 1 : 0))), 3),
    avgGlucose: round(mean(diabetes.map((item) => item.glucose))),
    avgBmi: round(mean(diabetes.map((item) => item.bmi))),
    products: productsFilled,
    skinCare,
  };
};

const buildTrainingSet = (stats: DatasetStats): TrainingExample[] => {
  const base: TrainingExample[] = [
    { text: "quel produit est bon pour peau seche", label: "product_recommendation" },
    { text: "recommend a moisturizer for dry skin", label: "product_recommendation" },
    { text: "donne moi une recommandation produit", label: "product_recommendation" },
    { text: "quel est le meilleur produit", label: "product_recommendation" },

    { text: "quel est le prix moyen des produits", label: "price_analysis" },
    { text: "combien coute un soin dans vos donnees", label: "price_analysis" },
    { text: "what is the average skincare price", label: "price_analysis" },
    { text: "produit cher ou pas", label: "price_analysis" },

    { text: "quels ingredients sont les plus frequents", label: "ingredient_insight" },
    { text: "ingredient for hydration", label: "ingredient_insight" },
    { text: "niacinamide ou hyaluronic acid", label: "ingredient_insight" },
    { text: "donne les actifs importants", label: "ingredient_insight" },

    { text: "products from cerave", label: "brand_info" },
    { text: "donne moi les produits de la marque svr", label: "brand_info" },
    { text: "infos marque bioderma", label: "brand_info" },
    { text: "what brands are available", label: "brand_info" },

    { text: "compare cerave and bioderma", label: "product_comparison" },
    { text: "difference between cleanser and serum", label: "product_comparison" },
    { text: "compare prices of two products", label: "product_comparison" },
    { text: "which is better for acne serum or cream", label: "product_comparison" },

    { text: "quelle routine pour peau sensible", label: "routine_advice" },
    { text: "routine matin et soir", label: "routine_advice" },
    { text: "how should i build a routine", label: "routine_advice" },
    { text: "conseil routine anti acne", label: "routine_advice" },

    { text: "combien de lignes dans vos csv", label: "dataset_facts" },
    { text: "what datasets are used", label: "dataset_facts" },
    { text: "statistiques de vos donnees", label: "dataset_facts" },
    { text: "sources du modele", label: "dataset_facts" },

    { text: "diabete et peau", label: "health_warning" },
    { text: "high glucose impact on skin", label: "health_warning" },
    { text: "risque metabolique", label: "health_warning" },
    { text: "est ce que jai le diabete", label: "health_warning" },

    { text: "raconte une blague", label: "out_of_scope" },
    { text: "write me a poem", label: "out_of_scope" },
  ];

  for (const type of stats.topProductTypes) {
    base.push({ text: `recommend ${type.type} for my skin`, label: "product_recommendation" });
    base.push({ text: `je cherche ${type.type} pour ma peau`, label: "product_recommendation" });
  }

  for (const kind of stats.topProductKinds.slice(0, 10)) {
    base.push({ text: `je veux un ${kind.kind} pour peau sensible`, label: "product_recommendation" });
    base.push({ text: `best ${kind.kind} for dry skin`, label: "product_recommendation" });
    base.push({ text: `prix moyen des ${kind.kind}`, label: "price_analysis" });
    base.push({ text: `ingredients importants dans ${kind.kind}`, label: "ingredient_insight" });
  }

  for (const brand of stats.topBrands.slice(0, 45).map((item) => item.brand)) {
    base.push({ text: `tu connais les produits ${brand}`, label: "product_recommendation" });
    base.push({ text: `donne les produits de la marque ${brand}`, label: "brand_info" });
    base.push({ text: `prix des produits ${brand}`, label: "price_analysis" });
    base.push({ text: `ingredients typiques de ${brand}`, label: "ingredient_insight" });
    base.push({ text: `compare ${brand} avec les autres marques`, label: "product_comparison" });
    base.push({ text: `effets secondaires possibles des produits ${brand}`, label: "brand_info" });
  }

  const topBrandNames = stats.topBrands.slice(0, 10).map((item) => item.brand);
  for (let i = 0; i < topBrandNames.length - 1; i++) {
    base.push({ text: `compare ${topBrandNames[i]} and ${topBrandNames[i + 1]}`, label: "product_comparison" });
  }

  const productSamples = stats.products
    .filter((item) => item.name.length > 5)
    .sort((a, b) => b.ingredients.length - a.ingredients.length)
    .slice(0, 220);

  for (const product of productSamples) {
    const kind = inferProductKind(product);
    const brand = product.brand;
    base.push({ text: `explique le produit ${product.name}`, label: "product_recommendation" });
    base.push({ text: `ingredients de ${product.name}`, label: "ingredient_insight" });
    base.push({ text: `prix de ${product.name}`, label: "price_analysis" });
    base.push({ text: `compare ${product.name} with other ${kind}`, label: "product_comparison" });
    base.push({ text: `ce ${kind} est il bien pour peau sensible`, label: "product_recommendation" });
    if (brand) {
      base.push({ text: `meilleur ${kind} de ${brand}`, label: "product_recommendation" });
      base.push({ text: `donne les infos de marque ${brand}`, label: "brand_info" });
    }
  }

  for (const ingredient of stats.topIngredients) {
    base.push({ text: `ingredient ${ingredient.ingredient} est il utile`, label: "ingredient_insight" });
    base.push({ text: `what does ${ingredient.ingredient} do for skin`, label: "ingredient_insight" });
  }

  for (const title of stats.topRatedTitles.slice(0, 3)) {
    base.push({ text: `product ${title} is it good`, label: "product_recommendation" });
    base.push({ text: `prix de ${title}`, label: "price_analysis" });
  }

  base.push(...buildHardNegativeExamples(stats));

  return rebalanceExamples(base);
};

const vectorize = (text: string, vocabulary: string[]): number[] => {
  const tokens = tokenize(text);
  const vector = new Array(vocabulary.length).fill(0);
  const freq = new Map<string, number>();

  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  for (let i = 0; i < vocabulary.length; i++) {
    vector[i] = freq.get(vocabulary[i]) || 0;
  }

  return vector;
};

const dedupeExamples = (examples: TrainingExample[]): CleanedTrainingExample[] => {
  const seen = new Set<string>();
  const cleaned: CleanedTrainingExample[] = [];

  for (const item of examples) {
    const cleanedText = sanitizeTrainingText(item.text);
    if (!cleanedText) continue;

    const key = `${item.label}::${cleanedText}`;
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push({
      text: item.text.trim(),
      label: item.label,
      cleanedText,
    });
  }

  return cleaned;
};

const preprocessExamples = (
  examples: CleanedTrainingExample[]
): PreprocessedTrainingExample[] => {
  return examples
    .map((item) => ({
      ...item,
      tokens: tokenize(item.cleanedText),
    }))
    .filter((item) => item.tokens.length > 0);
};

const buildVocabularyFromPreprocessed = (
  examples: PreprocessedTrainingExample[]
): string[] => {
  const docsCount = Math.max(1, examples.length);
  const df = new Map<string, number>();

  for (const example of examples) {
    const uniq = new Set(example.tokens);
    for (const token of uniq) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const protectedTokens = new Set([
    "price",
    "prix",
    "ingredient",
    "ingredients",
    "brand",
    "marque",
    "compare",
    "routine",
    "acne",
  ]);

  const bucket = [...df.entries()]
    .filter(([token, freq]) => {
      if (protectedTokens.has(token)) return true;
      if (freq < 2) return false;
      if (freq / docsCount > 0.92) return false;
      return token.length >= 2 && token.length <= 40;
    })
    .map(([token]) => token);

  return bucket.sort();
};

const encodeExamples = (
  examples: PreprocessedTrainingExample[],
  vocabulary: string[],
  labelToIndex: Record<IntentLabel, number>
): EncodedTrainingExample[] => {
  return examples.map((item) => ({
    ...item,
    vector: vectorize(item.cleanedText, vocabulary),
    labelIndex: labelToIndex[item.label],
  }));
};

const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const shuffleWithSeed = <T>(items: T[], seed: number): T[] => {
  const random = seededRandom(seed);
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = clone[i];
    clone[i] = clone[j];
    clone[j] = tmp;
  }
  return clone;
};

const stratifiedSplit = (
  encoded: EncodedTrainingExample[],
  trainRatio: number
): DatasetSplit => {
  const grouped = new Map<IntentLabel, EncodedTrainingExample[]>();
  for (const item of encoded) {
    const list = grouped.get(item.label) || [];
    list.push(item);
    grouped.set(item.label, list);
  }

  const train: EncodedTrainingExample[] = [];
  const test: EncodedTrainingExample[] = [];

  for (const label of INTENT_LABELS) {
    const rows = grouped.get(label) || [];
    const shuffled = shuffleWithSeed(rows, 97 + label.length * 17);
    const minTrain = rows.length > 1 ? 1 : rows.length;
    const idealTrain = Math.floor(rows.length * trainRatio);
    const trainCount = Math.min(rows.length - (rows.length > 1 ? 1 : 0), Math.max(minTrain, idealTrain));

    train.push(...shuffled.slice(0, trainCount));
    test.push(...shuffled.slice(trainCount));
  }

  return {
    train: shuffleWithSeed(train, 2026),
    test: shuffleWithSeed(test, 2602),
  };
};

const buildConfusionMatrix = (
  trueIndices: number[],
  predictedIndices: number[],
  classesCount: number
): number[][] => {
  const matrix = Array.from({ length: classesCount }, () =>
    new Array(classesCount).fill(0)
  );

  for (let i = 0; i < trueIndices.length; i++) {
    const actual = trueIndices[i] ?? 0;
    const predicted = predictedIndices[i] ?? 0;
    matrix[actual][predicted] += 1;
  }

  return matrix;
};

const computeMetricsFromConfusion = (matrix: number[][]): ChatbotTrainingMetrics => {
  const classes: ClassMetrics[] = [];
  let total = 0;
  let correct = 0;

  for (let i = 0; i < matrix.length; i++) {
    const tp = matrix[i][i];
    const rowSum = matrix[i].reduce((sum, value) => sum + value, 0);
    const colSum = matrix.reduce((sum, row) => sum + row[i], 0);
    const fp = colSum - tp;
    const fn = rowSum - tp;
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    classes.push({
      label: INTENT_LABELS[i],
      precision: round(precision, 4),
      recall: round(recall, 4),
      f1: round(f1, 4),
      support: rowSum,
    });

    total += rowSum;
    correct += tp;
  }

  const macroPrecision = mean(classes.map((item) => item.precision));
  const macroRecall = mean(classes.map((item) => item.recall));
  const macroF1 = mean(classes.map((item) => item.f1));

  const hotspots: ConfusionHotspot[] = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (i === j) continue;
      const count = matrix[i][j];
      if (count > 0) {
        hotspots.push({
          actual: INTENT_LABELS[i],
          predicted: INTENT_LABELS[j],
          count,
        });
      }
    }
  }

  hotspots.sort((a, b) => b.count - a.count);

  return {
    accuracy: total === 0 ? 0 : round(correct / total, 4),
    macroPrecision: round(macroPrecision, 4),
    macroRecall: round(macroRecall, 4),
    macroF1: round(macroF1, 4),
    classes,
    confusionMatrix: matrix,
    trainSize: 0,
    testSize: total,
    vocabularySize: 0,
    epochs: TRAIN_EPOCHS,
    confusionHotspots: hotspots.slice(0, 10),
    validationBestAccuracy: 0,
    selectedTrainingConfig: {
      learningRate: LEARNING_RATE,
      epochs: TRAIN_EPOCHS,
      batchSize: 16,
      units1: 64,
      units2: 32,
      dropout1: 0.2,
      dropout2: 0.1,
    },
  };
};

const evaluateUnseenQuestions = async (runtime: ChatbotRuntime): Promise<UnseenEvalSummary> => {
  const cases: Array<{ question: string; expected: IntentLabel }> = [
    { question: "best product for acne under 50", expected: "product_recommendation" },
    { question: "products from cerave", expected: "brand_info" },
    { question: "compare cerave and bioderma", expected: "product_comparison" },
    { question: "ingredients in cerave hydrating cleanser", expected: "ingredient_insight" },
    { question: "price of cerave hydrating cleanser", expected: "price_analysis" },
    { question: "give me routine for sensitive skin", expected: "routine_advice" },
    { question: "how many products in your dataset", expected: "dataset_facts" },
    { question: "is this medical diagnosis", expected: "health_warning" },
    { question: "write me a football story", expected: "out_of_scope" },
  ];

  const outputs: UnseenQuestionEval[] = [];
  let correct = 0;

  for (const item of cases) {
    const vector = vectorize(item.question, runtime.vocabulary);
    const input = tf.tensor2d([vector], [1, runtime.vocabulary.length]);
    const prediction = runtime.model.predict(input) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());

    input.dispose();
    prediction.dispose();

    let bestIndex = 0;
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > probabilities[bestIndex]) {
        bestIndex = i;
      }
    }

    const predicted = runtime.indexToLabel[bestIndex] || "out_of_scope";
    const isCorrect = predicted === item.expected;
    if (isCorrect) correct += 1;

    outputs.push({
      question: item.question,
      expected: item.expected,
      predicted,
      confidence: round(probabilities[bestIndex] || 0, 4),
      correct: isCorrect,
    });
  }

  return {
    accuracy: round(correct / Math.max(1, cases.length), 4),
    total: cases.length,
    correct,
    cases: outputs,
  };
};

const persistPreparedDatasets = async (
  artifacts: TrainingPipelineArtifacts,
  metrics?: ChatbotTrainingMetrics
): Promise<void> => {
  const outputDir = path.join(process.cwd(), "src", "modele", "datasets", "chatbot");
  const artifactsDir = path.join(process.cwd(), "src", "modele", "artifacts");

  await mkdir(outputDir, { recursive: true });
  await mkdir(artifactsDir, { recursive: true });

  const rawPath = path.join(outputDir, "raw_training_examples.json");
  const cleanedPath = path.join(outputDir, "cleaned_training_examples.json");
  const preprocessedPath = path.join(outputDir, "preprocessed_training_examples.json");
  const featuresPath = path.join(outputDir, "feature_engineering.json");
  const splitPath = path.join(outputDir, "train_test_split.json");
  const reportPath = path.join(artifactsDir, "chatbot-training-report.json");

  await writeFile(rawPath, JSON.stringify(artifacts.examplesRaw, null, 2), "utf-8");
  await writeFile(
    cleanedPath,
    JSON.stringify(
      artifacts.examplesClean.map((item) => ({
        text: item.text,
        label: item.label,
        cleanedText: item.cleanedText,
      })),
      null,
      2
    ),
    "utf-8"
  );
  await writeFile(
    preprocessedPath,
    JSON.stringify(
      artifacts.examplesPreprocessed.map((item) => ({
        text: item.text,
        label: item.label,
        cleanedText: item.cleanedText,
        tokens: item.tokens,
      })),
      null,
      2
    ),
    "utf-8"
  );
  await writeFile(
    featuresPath,
    JSON.stringify(
      {
        vocabulary: artifacts.vocabulary,
        vocabularySize: artifacts.vocabulary.length,
        labelToIndex: artifacts.labelToIndex,
        productFeatureSummary: {
          productsRows: artifacts.stats.productsRows,
          duplicateProductsRemoved: artifacts.stats.duplicateProductsRemoved,
          missingPriceCount: artifacts.stats.missingPriceCount,
          missingBrandCount: artifacts.stats.missingBrandCount,
          missingIngredientsCount: artifacts.stats.missingIngredientsCount,
          minProductPrice: artifacts.stats.minProductPrice,
          maxProductPrice: artifacts.stats.maxProductPrice,
          avgProductPrice: artifacts.stats.avgProductPrice,
          activeIngredientCoverage: artifacts.stats.activeIngredientCoverage,
          topConcerns: artifacts.stats.topConcerns,
          topSkinTypes: artifacts.stats.topSkinTypes,
          topIngredients: artifacts.stats.topIngredients,
        },
      },
      null,
      2
    ),
    "utf-8"
  );
  await writeFile(
    splitPath,
    JSON.stringify(
      {
        train: artifacts.split.train.map((item) => ({
          text: item.text,
          label: item.label,
          labelIndex: item.labelIndex,
        })),
        test: artifacts.split.test.map((item) => ({
          text: item.text,
          label: item.label,
          labelIndex: item.labelIndex,
        })),
      },
      null,
      2
    ),
    "utf-8"
  );

  if (metrics) {
    const report: ChatbotPipelineReport = {
      generatedAt: new Date().toISOString(),
      summary: {
        rawCount: artifacts.examplesRaw.length,
        cleanedCount: artifacts.examplesClean.length,
        trainCount: artifacts.split.train.length,
        testCount: artifacts.split.test.length,
        vocabularySize: artifacts.vocabulary.length,
      },
      metrics,
      improvementLoop: {
        userFeedbackPath: USER_FEEDBACK_DATASET_PATH,
        loadedFeedbackExamples: artifacts.feedbackExamplesLoaded,
      },
    };
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");
  }
};

const pickProductByNeed = (question: string, stats: DatasetStats): ProductRecord | null => {
  const normalized = normalizeText(question);
  const requestedKind = detectRequestedProductKind(question);
  const concerns = detectSkinConcerns(question);
  const budgetMax = parseBudgetMax(question);
  const exactName = findProductByNameSignal(question, stats);
  if (exactName) return exactName;

  const matchedBrand = findMatchedBrand(question, stats);
  if (matchedBrand) {
    const brandProducts = productsByBrand(matchedBrand, stats);

    const scoredBrandProducts = brandProducts
      .map((product) => ({
        product,
        score: scoreProductForQuestion(product, question, concerns, requestedKind, budgetMax),
      }))
      .sort((a, b) => b.score - a.score || (a.product.price ?? 9999) - (b.product.price ?? 9999));

    if (scoredBrandProducts.length > 0) {
      return scoredBrandProducts[0].product;
    }
  }

  const byType = stats.products.filter((product) => normalized.includes(product.type));
  const byKind = requestedKind
    ? stats.products.filter((product) => inferProductKind(product) === requestedKind)
    : [];

  const candidates = byKind.length > 0 ? byKind : byType.length > 0 ? byType : stats.products;
  const scored = candidates
    .map((product) => {
      const score = scoreProductForQuestion(product, question, concerns, requestedKind, budgetMax);
      return { product, score };
    })
    .sort((a, b) => b.score - a.score || (a.product.price ?? 9999) - (b.product.price ?? 9999));

  return scored[0]?.product || null;
};

const findMatchedBrand = (question: string, stats: DatasetStats): string | null => {
  const normalized = normalizeText(question);
  const sortedBrands = [...stats.brands].sort((a, b) => b.length - a.length);
  return sortedBrands.find((brand) => textHasBrand(normalized, brand)) || null;
};

const findMatchedBrands = (question: string, stats: DatasetStats): string[] => {
  const normalized = normalizeText(question);
  return [...stats.brands]
    .sort((a, b) => b.length - a.length)
    .filter((brand) => textHasBrand(normalized, brand));
};

const findProductByNameSignal = (question: string, stats: DatasetStats): ProductRecord | null => {
  const normalized = normalizeText(question);
  const exact = stats.products.find((product) => normalized.includes(normalizeText(product.name)));
  if (exact) return exact;

  const questionTokens = tokenize(question);
  let bestScore = 0;
  let best: ProductRecord | null = null;

  for (const product of stats.products) {
    const nameTokens = tokenize(product.name);
    const overlap = nameTokens.filter((token) => questionTokens.includes(token)).length;
    if (overlap > bestScore && overlap >= 2) {
      bestScore = overlap;
      best = product;
    }
  }

  return best;
};

const hasProductOrBrandSignal = (question: string, stats: DatasetStats): boolean => {
  const normalized = normalizeText(question);

  if (stats.products.some((product) => normalized.includes(normalizeText(product.name)))) {
    return true;
  }

  return stats.brands.some((brand) => textHasBrand(normalized, brand));
};

const getProductInsight = (product: ProductRecord): ProductInsight => {
  const ingredients = product.ingredients.map((item) => normalizeText(item));
  const benefits = new Set<string>();
  const cautions = new Set<string>();

  for (const rule of INGREDIENT_RULES) {
    const matched = rule.matchers.some((matcher) => ingredients.some((ing) => ing.includes(matcher)));
    if (!matched) continue;

    for (const benefit of rule.benefits) {
      benefits.add(benefit);
    }

    for (const caution of rule.cautions || []) {
      cautions.add(caution);
    }
  }

  if (product.type.includes("eye")) {
    benefits.add("Cible la zone peri-orbitaire et la deshydratation locale");
  }
  if (product.type.includes("cleanser")) {
    benefits.add("Concu pour nettoyer la peau sans etape complexe");
  }
  if (product.type.includes("moisturizer") || product.type.includes("cream")) {
    benefits.add("Apporte confort et protection de la barriere");
  }

  const keyIngredients = product.ingredients
    .slice(0, 8)
    .map((item) => toTitleCase(item));

  return {
    benefits: [...benefits],
    cautions: [...cautions],
    keyIngredients,
  };
};

const GBP_TO_TND = 3.95;

const toTnd = (gbp: number): number => {
  return gbp * GBP_TO_TND;
};

const priceTextTnd = (price: number | null): string => {
  if (price === null || !Number.isFinite(price) || price <= 0) return "prix non disponible";
  return `${round(toTnd(price), 2)} TND`;
};

const productLinkText = (product: ProductRecord): string => {
  return product.url ? ` Link: ${product.url}.` : "";
};

const maybeLinkLine = (product: ProductRecord): string => {
  return product.url ? `Lien produit: ${product.url}` : "";
};

const lineJoin = (lines: string[]): string => lines.filter((line) => line.trim().length > 0).join("\n");

const formatName = (value: string): string => {
  return toTitleCase(value || "Produit");
};

const detectComparisonSignal = (question: string): boolean => {
  const normalized = normalizeText(question);
  return includesAny(normalized, ["compare", "comparison", "versus", "vs", "difference", "diff", "better"]);
};

const findMentionedProducts = (question: string, stats: DatasetStats): ProductRecord[] => {
  const normalized = normalizeText(question);
  const strict = stats.products
    .filter((product) => normalized.includes(normalizeText(product.name)))
    .slice(0, 2);

  if (strict.length >= 2) return strict;

  const best = findProductByNameSignal(question, stats);
  if (!best) return strict;

  const fallback = strict.some((item) => item.name === best.name) ? strict : [...strict, best];
  return fallback.slice(0, 2);
};

const compareTwoProducts = (left: ProductRecord, right: ProductRecord): string => {
  const leftSet = new Set(left.ingredients);
  const sharedIngredients = right.ingredients.filter((item) => leftSet.has(item)).slice(0, 8);
  const concernsUnion = [...new Set([...left.concerns, ...right.concerns])].slice(0, 6);

  return [
    `Comparison between ${left.name} and ${right.name}:`,
    `${left.name}: type ${toTitleCase(left.type)}, brand ${toTitleCase(left.brand)}, price ${priceTextTnd(left.price)}.`,
    `${right.name}: type ${toTitleCase(right.type)}, brand ${toTitleCase(right.brand)}, price ${priceTextTnd(right.price)}.`,
    `Shared ingredients: ${sharedIngredients.length > 0 ? sharedIngredients.map((x) => toTitleCase(x)).join(", ") : "none detected"}.`,
    `Main concerns covered: ${concernsUnion.length > 0 ? concernsUnion.join(", ") : "not explicitly tagged"}.`,
  ].join(" ");
};

const inferIntentByRules = (question: string, stats: DatasetStats): IntentLabel => {
  const normalized = normalizeText(question);
  const matchedBrand = findMatchedBrand(question, stats);

  if (detectComparisonSignal(question)) return "product_comparison";

  if (includesAny(normalized, ["best", "recommend", "recommand", "meilleur", "suggest", "conseille"])) {
    return "product_recommendation";
  }

  if (
    normalized.includes("prix") ||
    normalized.includes("price") ||
    normalized.includes("coute") ||
    normalized.includes("cost")
  ) {
    return "price_analysis";
  }

  if (
    normalized.includes("ingredient") ||
    normalized.includes("ingredients") ||
    normalized.includes("actif") ||
    normalized.includes("inci")
  ) {
    return "ingredient_insight";
  }

  if (matchedBrand && (includesAny(normalized, ["brand", "marque", "from", "produits"]) || !hasProductOrBrandSignal(question, stats))) {
    return "brand_info";
  }

  if (hasProductOrBrandSignal(question, stats)) return "product_recommendation";

  if (normalized.includes("routine") || normalized.includes("matin") || normalized.includes("soir")) {
    return "routine_advice";
  }

  if (
    normalized.includes("csv") ||
    normalized.includes("donnees") ||
    normalized.includes("datasets") ||
    normalized.includes("dataset")
  ) {
    return "dataset_facts";
  }

  if (
    normalized.includes("diab") ||
    normalized.includes("glucose") ||
    normalized.includes("bmi") ||
    normalized.includes("metabol")
  ) {
    return "health_warning";
  }

  return "out_of_scope";
};

const buildSuggestions = (): string[] => {
  return [
    "Quel est le meilleur produit pour l'acne ?",
    "Montre-moi les produits CeraVe",
    "Quels sont les ingredients de ce produit ?",
    "Quel est le prix de ce produit ?",
    "Compare CeraVe et Bioderma",
  ];
};

const composeResponse = (
  question: string,
  intent: IntentLabel,
  confidence: number,
  stats: DatasetStats
): string => {
  const topIngredients = stats.topIngredients.slice(0, 3).map((item) => item.ingredient).join(", ");
  const topTypes = stats.topProductTypes.slice(0, 3).map((item) => item.type).join(", ");

  if (intent === "out_of_scope") {
    return "Je peux surtout t'aider sur les produits skincare: recommandations, prix, ingredients, comparaison entre marques/produits et routines simples.";
  }

  if (intent === "dataset_facts") {
    return lineJoin([
      `Voici un resume simple de la base:`,
      `- Produits skincare analyses: ${stats.productsRows}`,
      `- Nombre de marques: ${stats.brands.length}`,
      `- Prix moyen observe: ${priceTextTnd(stats.avgProductPrice)}`,
      `- Qualite des donnees: ${round(stats.activeIngredientCoverage * 100, 1)}% de couverture en ingredients actifs`,
      "Si tu veux, je peux te donner un resume pour une marque precise.",
    ]);
  }

  if (intent === "health_warning") {
    return lineJoin([
      "Information generale (non medicale):",
      `- Ratio risque eleve observe dans le dataset: ${round(stats.highRiskDiabetesRatio * 100, 1)}%`,
      `- Glucose moyen: ${stats.avgGlucose}`,
      `- BMI moyen: ${stats.avgBmi}`,
      "Pour un conseil de sante, il faut toujours consulter un professionnel.",
    ]);
  }

  if (intent === "brand_info") {
    const matchedBrand = findMatchedBrand(question, stats);
    if (matchedBrand) {
      const brandProducts = productsByBrand(matchedBrand, stats);
      if (brandProducts.length > 0) {
        const topBrandTypes = countTop(brandProducts.map((item) => item.type), 3).map((item) => item.value);
        const topBrandIngredients = countTop(brandProducts.flatMap((item) => item.ingredients), 5)
          .map((item) => toTitleCase(item.value));
        const cheapest = [...brandProducts].sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999))[0];
        return lineJoin([
          `Marque: ${toTitleCase(matchedBrand)}`,
          `- Nombre de produits trouves: ${brandProducts.length}`,
          `- Categories principales: ${topBrandTypes.map((x) => toTitleCase(x)).join(", ") || "Non disponible"}`,
          `- Ingredients souvent presents: ${topBrandIngredients.join(", ") || "Non disponible"}`,
          `- Prix moyen: ${priceTextTnd(avgPrice(brandProducts))}`,
          `- Exemple abordable: ${formatName(cheapest.name)} (${priceTextTnd(cheapest.price)})`,
          maybeLinkLine(cheapest),
        ]);
      }
    }

    const topBrandsText = stats.topBrands.slice(0, 8).map((item) => toTitleCase(item.brand)).join(", ");
    return `Marques populaires dans la base: ${topBrandsText}. Dis-moi une marque et je te donne une reponse claire (produits, prix, ingredients).`;
  }

  if (intent === "product_comparison") {
    const matchedBrands = findMatchedBrands(question, stats);
    if (matchedBrands.length >= 2) {
      const leftBrandProducts = productsByBrand(matchedBrands[0], stats);
      const rightBrandProducts = productsByBrand(matchedBrands[1], stats);
      return lineJoin([
        `Comparaison marques: ${toTitleCase(matchedBrands[0])} vs ${toTitleCase(matchedBrands[1])}`,
        `- ${toTitleCase(matchedBrands[0])}: ${leftBrandProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(leftBrandProducts))}`,
        `- ${toTitleCase(matchedBrands[1])}: ${rightBrandProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(rightBrandProducts))}`,
        "Si tu veux, je peux aussi comparer 2 produits precis de ces marques.",
      ]);
    }

    const namedProducts = findMentionedProducts(question, stats);
    if (namedProducts.length >= 2) {
      return compareTwoProducts(namedProducts[0], namedProducts[1]);
    }

    const mentionedKinds = PRODUCT_KIND_KEYWORDS
      .filter((item) => item.keywords.some((keyword) => normalizeText(question).includes(keyword)))
      .map((item) => item.kind)
      .slice(0, 2);

    if (mentionedKinds.length >= 2) {
      const leftItems = stats.products.filter((item) => inferProductKind(item) === mentionedKinds[0]);
      const rightItems = stats.products.filter((item) => inferProductKind(item) === mentionedKinds[1]);
      return lineJoin([
        `Comparaison categories: ${toTitleCase(mentionedKinds[0])} vs ${toTitleCase(mentionedKinds[1])}`,
        `- ${toTitleCase(mentionedKinds[0])}: ${leftItems.length} produits, prix moyen ${priceTextTnd(avgPrice(leftItems))}`,
        `- ${toTitleCase(mentionedKinds[1])}: ${rightItems.length} produits, prix moyen ${priceTextTnd(avgPrice(rightItems))}`,
      ]);
    }

    const leftBrand = findMatchedBrand(question, stats);
    if (leftBrand) {
      const leftBrandProducts = productsByBrand(leftBrand, stats);
      const competitor = stats.topBrands.map((item) => item.brand).find((brand) => brand !== leftBrand);
      if (competitor) {
        const rightBrandProducts = productsByBrand(competitor, stats);
        return lineJoin([
          `Comparaison marques: ${toTitleCase(leftBrand)} vs ${toTitleCase(competitor)}`,
          `- ${toTitleCase(leftBrand)}: ${leftBrandProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(leftBrandProducts))}`,
          `- ${toTitleCase(competitor)}: ${rightBrandProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(rightBrandProducts))}`,
        ]);
      }
    }

    return "Pour une comparaison claire, donne-moi 2 produits, 2 marques ou 2 categories (ex: cleanser vs serum).";
  }

  if (intent === "routine_advice") {
    const concerns = detectSkinConcerns(question);
    if (concerns.includes("acne") || concerns.includes("oily")) {
      return lineJoin([
        "Routine simple pour peau acneique/grasse:",
        "- Matin: nettoyant doux + serum niacinamide + SPF 30+",
        "- Soir: nettoyant doux + actif salicylique (progressivement) + hydratant non comedogene",
        "Conseil: ajoute un seul actif a la fois.",
      ]);
    }

    if (concerns.includes("dry") || concerns.includes("sensitive")) {
      return lineJoin([
        "Routine simple pour peau seche/sensible:",
        "- Matin: nettoyant creme + serum hydratant + creme barriere + SPF 30+",
        "- Soir: nettoyant doux + creme riche en ceramides/panthenol",
        "Conseil: evite de cumuler plusieurs actifs irritants.",
      ]);
    }

    return lineJoin([
      "Routine de base:",
      "- Matin: nettoyant doux + serum hydratant + SPF 30+",
      "- Soir: nettoyant doux + un actif leger + creme hydratante",
      "Si tu veux, je peux personnaliser selon ton type de peau.",
    ]);
  }

  if (intent === "price_analysis") {
    const exactProduct = findProductByNameSignal(question, stats);
    if (exactProduct) {
      return lineJoin([
        `Prix de ${formatName(exactProduct.name)}: ${priceTextTnd(exactProduct.price)}`,
        `- Marque: ${toTitleCase(exactProduct.brand)}`,
        `- Categorie: ${toTitleCase(exactProduct.type)}`,
        maybeLinkLine(exactProduct),
      ]);
    }

    const requestedKind = detectRequestedProductKind(question);
    if (requestedKind) {
      const kindProducts = stats.products.filter((product) => inferProductKind(product) === requestedKind);
      if (kindProducts.length > 0) {
        const cheapest = [...kindProducts].sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999))[0];
        const priciest = [...kindProducts].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
        return lineJoin([
          `Prix pour la categorie ${toTitleCase(requestedKind)}:`,
          `- Nombre de produits: ${kindProducts.length}`,
          `- Prix moyen: ${priceTextTnd(avgPrice(kindProducts))}`,
          `- Moins cher: ${formatName(cheapest.name)} (${priceTextTnd(cheapest.price)})`,
          `- Plus cher: ${formatName(priciest.name)} (${priceTextTnd(priciest.price)})`,
          maybeLinkLine(cheapest),
        ]);
      }
    }

    const matchedBrand = findMatchedBrand(question, stats);
    if (matchedBrand) {
      const brandProducts = productsByBrand(matchedBrand, stats);
      if (brandProducts.length > 0) {
        return lineJoin([
          `Prix pour la marque ${toTitleCase(matchedBrand)}:`,
          `- Nombre de produits: ${brandProducts.length}`,
          `- Prix moyen: ${priceTextTnd(avgPrice(brandProducts))}`,
        ]);
      }
    }

    return lineJoin([
      `Dans la base, le prix moyen des produits est ${priceTextTnd(stats.avgProductPrice)}.`,
      `La note moyenne observee est ${stats.avgStars}/5.`,
      "Dis-moi un produit ou une marque pour une reponse plus precise.",
    ]);
  }

  if (intent === "ingredient_insight") {
    const exactProduct = findProductByNameSignal(question, stats);
    if (exactProduct) {
      const ingredientsText = exactProduct.ingredients.length > 0
        ? exactProduct.ingredients.slice(0, 20).map((item) => toTitleCase(item)).join(", ")
        : "Ingredients not available";
      const activeText = exactProduct.activeIngredients.map((item) => toTitleCase(item)).join(", ") || "Aucun detecte";
      return lineJoin([
        `Ingredients de ${formatName(exactProduct.name)}:`,
        ingredientsText,
        `Actifs principaux: ${activeText}`,
      ]);
    }

    const requestedKind = detectRequestedProductKind(question);
    if (requestedKind) {
      const kindProducts = stats.products.filter((product) => inferProductKind(product) === requestedKind);
      if (kindProducts.length > 0) {
        const topKindIngredients = countTop(
          kindProducts.flatMap((item) => item.ingredients),
          8
        ).map((item) => toTitleCase(item.value));
        return lineJoin([
          `Ingredients frequents pour ${toTitleCase(requestedKind)}:`,
          topKindIngredients.join(", "),
          `Analyse basee sur ${kindProducts.length} produits.`,
        ]);
      }
    }

    const matchedBrand = findMatchedBrand(question, stats);
    if (matchedBrand) {
      const brandProducts = productsByBrand(matchedBrand, stats);
      if (brandProducts.length > 0) {
        const topBrandIngredients = countTop(
          brandProducts.flatMap((item) => item.ingredients),
          8
        ).map((item) => toTitleCase(item.value));
        return lineJoin([
          `Ingredients frequents pour ${toTitleCase(matchedBrand)}:`,
          topBrandIngredients.join(", "),
          `Analyse basee sur ${brandProducts.length} produits.`,
        ]);
      }
    }

    return lineJoin([
      "Ingredients les plus frequents dans la base:",
      topIngredients,
      `Analyse basee sur ${stats.productsRows} produits.`,
    ]);
  }

  const picked = pickProductByNeed(question, stats);
  if (picked) {
    const insight = getProductInsight(picked);
    const ingredientsText = insight.keyIngredients.length
      ? insight.keyIngredients.join(", ")
      : "Ingredients not available";
    const benefitsText = insight.benefits.length
      ? insight.benefits.join("; ")
      : "Benefits depend on full formula";
    const cautionsText = insight.cautions.length
      ? insight.cautions.join("; ")
      : "No major caution signal detected";

    return lineJoin([
      `Je te recommande: ${formatName(picked.name)}`,
      `- Type: ${toTitleCase(picked.type)}`,
      `- Prix estime: ${priceTextTnd(picked.price)}`,
      `- Ingredients cles: ${ingredientsText}`,
      `- Ce que ce produit peut apporter: ${benefitsText}`,
      `- Attention: ${cautionsText}`,
      maybeLinkLine(picked),
    ]);
  }

  return lineJoin([
    `Je peux te proposer des produits adaptes (categories populaires: ${topTypes}).`,
    "Dis-moi simplement: ton type de peau, ton besoin (acne, taches, sensibilite...) et ton budget.",
  ]);
};

const pickIntentWithoutModel = (question: string, stats: DatasetStats): IntentLabel => {
  return inferIntentByRules(question, stats);
};

const isInScopeQuestion = (question: string, stats: DatasetStats): boolean => {
  const normalized = normalizeText(question);

  if (hasProductOrBrandSignal(question, stats)) return true;

  const scopeTerms = [
    "skin",
    "skincare",
    "peau",
    "product",
    "produit",
    "ingredient",
    "ingredients",
    "marque",
    "brand",
    "compare",
    "comparison",
    "difference",
    "vs",
    "versus",
    "price",
    "prix",
    "routine",
    "acne",
    "oily",
    "dry",
    "sensitive",
    "serum",
    "cleanser",
    "moisturizer",
    "spf",
    "dataset",
    "csv",
    "diabetes",
    "glucose",
    "bmi",
    "metabolic",
  ];

  return scopeTerms.some((term) => normalized.includes(term));
};

const buildTrainingPipeline = async (
  options: PrepareDatasetOptions = {}
): Promise<TrainingPipelineArtifacts> => {
  const trainRatio = options.trainRatio ?? 0.8;
  const stats = await buildStats();
  const feedbackExamples = await loadUserFeedbackExamples();
  const examplesRaw = uniqueExamples([...buildTrainingSet(stats), ...feedbackExamples]);
  const examplesClean = dedupeExamples(examplesRaw);
  const examplesPreprocessed = preprocessExamples(examplesClean);

  const labelToIndex = Object.fromEntries(
    INTENT_LABELS.map((label, index) => [label, index])
  ) as Record<IntentLabel, number>;

  const vocabulary = buildVocabularyFromPreprocessed(examplesPreprocessed);
  const encoded = encodeExamples(examplesPreprocessed, vocabulary, labelToIndex);
  const split = stratifiedSplit(encoded, trainRatio);

  const artifacts: TrainingPipelineArtifacts = {
    stats,
    examplesRaw,
    examplesClean,
    examplesPreprocessed,
    split,
    vocabulary,
    labelToIndex,
    feedbackExamplesLoaded: feedbackExamples.length,
  };

  if (options.writeFiles) {
    await persistPreparedDatasets(artifacts);
  }

  return artifacts;
};

const evaluateModel = async (
  model: tf.Sequential,
  split: DatasetSplit,
  vocabularySize: number
): Promise<ChatbotTrainingMetrics> => {
  const testVectors = split.test.map((item) => item.vector);
  const trueIndices = split.test.map((item) => item.labelIndex);

  if (testVectors.length === 0) {
    return {
      accuracy: 0,
      macroPrecision: 0,
      macroRecall: 0,
      macroF1: 0,
      classes: INTENT_LABELS.map((label) => ({
        label,
        precision: 0,
        recall: 0,
        f1: 0,
        support: 0,
      })),
      confusionMatrix: Array.from({ length: INTENT_LABELS.length }, () =>
        new Array(INTENT_LABELS.length).fill(0)
      ),
      trainSize: split.train.length,
      testSize: 0,
      vocabularySize,
      epochs: TRAIN_EPOCHS,
      confusionHotspots: [],
      validationBestAccuracy: 0,
      selectedTrainingConfig: {
        learningRate: LEARNING_RATE,
        epochs: TRAIN_EPOCHS,
        batchSize: 16,
        units1: 64,
        units2: 32,
        dropout1: 0.2,
        dropout2: 0.1,
      },
    };
  }

  const xTest = tf.tensor2d(testVectors, [testVectors.length, vocabularySize]);
  const predictionsTensor = model.predict(xTest) as tf.Tensor;
  const predictedIndicesTensor = predictionsTensor.argMax(1);
  const predictedIndices = Array.from(await predictedIndicesTensor.data()).map((x) => Number(x));

  xTest.dispose();
  predictionsTensor.dispose();
  predictedIndicesTensor.dispose();

  const confusionMatrix = buildConfusionMatrix(trueIndices, predictedIndices, INTENT_LABELS.length);
  const summary = computeMetricsFromConfusion(confusionMatrix);

  return {
    ...summary,
    trainSize: split.train.length,
    testSize: split.test.length,
    vocabularySize,
    epochs: TRAIN_EPOCHS,
  };
};

type TrainedRuntimeResult = {
  runtime: ChatbotRuntime;
  metrics: ChatbotTrainingMetrics;
  preparedSummary: PreparedDatasetSummary;
  feedbackExamplesLoaded: number;
};

const trainWithPipeline = async (
  options: PrepareDatasetOptions = {}
): Promise<TrainedRuntimeResult> => {
  await tf.ready();
  await tf.setBackend("cpu");

  const artifacts = await buildTrainingPipeline(options);
  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const xsTrainBuffer = artifacts.split.train.map((item) => item.vector);
  const ysTrainBuffer = artifacts.split.train.map((item) => item.labelIndex);

  const xsTrain = tf.tensor2d(xsTrainBuffer, [xsTrainBuffer.length, artifacts.vocabulary.length]);
  const ysTrainIndices = tf.tensor1d(ysTrainBuffer, "int32");
  const ysTrain = tf.oneHot(ysTrainIndices, INTENT_LABELS.length).asType("float32");

  const createModel = (config: TrainingConfig, modelSuffix: string): tf.Sequential => {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        name: `chatbot_dense_1_${modelSuffix}`,
        inputShape: [artifacts.vocabulary.length],
        units: config.units1,
        activation: "relu",
        kernelInitializer: "glorotUniform",
      })
    );
    model.add(tf.layers.dropout({ name: `chatbot_dropout_1_${modelSuffix}`, rate: config.dropout1 }));
    model.add(
      tf.layers.dense({
        name: `chatbot_dense_2_${modelSuffix}`,
        units: config.units2,
        activation: "relu",
        kernelInitializer: "glorotUniform",
      })
    );
    model.add(tf.layers.dropout({ name: `chatbot_dropout_2_${modelSuffix}`, rate: config.dropout2 }));
    model.add(
      tf.layers.dense({
        name: `chatbot_dense_out_${modelSuffix}`,
        units: INTENT_LABELS.length,
        activation: "softmax",
      })
    );

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  };

  let bestModel: tf.Sequential | null = null;
  let bestConfig = TRAINING_CANDIDATES[0];
  let bestValAcc = -1;

  for (let i = 0; i < TRAINING_CANDIDATES.length; i++) {
    const config = TRAINING_CANDIDATES[i];
    const model = createModel(config, `${runId}_${i}`);

    const history = await model.fit(xsTrain, ysTrain, {
      epochs: config.epochs,
      batchSize: Math.min(config.batchSize, Math.max(8, artifacts.split.train.length)),
      shuffle: true,
      validationSplit: Math.min(0.22, Math.max(0.12, 24 / Math.max(artifacts.split.train.length, 1))),
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: "val_loss",
          patience: 10,
          minDelta: 0.0008,
        }),
      ],
      verbose: 0,
    });

    const valHistory = (history.history.val_acc || history.history.val_accuracy || []) as number[];
    const candidateBestVal = valHistory.length > 0 ? Math.max(...valHistory.map((x) => Number(x || 0))) : 0;

    if (candidateBestVal > bestValAcc) {
      if (bestModel) bestModel.dispose();
      bestModel = model;
      bestConfig = config;
      bestValAcc = candidateBestVal;
    } else {
      model.dispose();
    }
  }

  const model = bestModel || createModel(bestConfig, `${runId}_fallback`);

  xsTrain.dispose();
  ysTrainIndices.dispose();
  ysTrain.dispose();

  const metricsBase = await evaluateModel(model, artifacts.split, artifacts.vocabulary.length);

  const runtime: ChatbotRuntime = {
    model,
    vocabulary: artifacts.vocabulary,
    labelToIndex: artifacts.labelToIndex,
    indexToLabel: INTENT_LABELS,
    stats: artifacts.stats,
  };

  const unseenEvaluation = await evaluateUnseenQuestions(runtime);
  const metrics: ChatbotTrainingMetrics = {
    ...metricsBase,
    validationBestAccuracy: round(bestValAcc, 4),
    selectedTrainingConfig: {
      learningRate: bestConfig.learningRate,
      epochs: bestConfig.epochs,
      batchSize: Math.min(bestConfig.batchSize, Math.max(8, artifacts.split.train.length)),
      units1: bestConfig.units1,
      units2: bestConfig.units2,
      dropout1: bestConfig.dropout1,
      dropout2: bestConfig.dropout2,
    },
    unseenEvaluation,
  };

  if (options.writeFiles) {
    await persistPreparedDatasets(artifacts, metrics);
  }

  return {
    runtime,
    metrics,
    preparedSummary: {
      rawCount: artifacts.examplesRaw.length,
      cleanedCount: artifacts.examplesClean.length,
      trainCount: artifacts.split.train.length,
      testCount: artifacts.split.test.length,
      vocabularySize: artifacts.vocabulary.length,
    },
    feedbackExamplesLoaded: artifacts.feedbackExamplesLoaded,
  };
};

const trainRuntime = async (): Promise<ChatbotRuntime> => {
  const { runtime } = await trainWithPipeline({ writeFiles: false, trainRatio: 0.8 });
  return runtime;
};

export const prepareChatbotDatasets = async (): Promise<PreparedDatasetSummary> => {
  const artifacts = await buildTrainingPipeline({ writeFiles: true, trainRatio: 0.8 });
  return {
    rawCount: artifacts.examplesRaw.length,
    cleanedCount: artifacts.examplesClean.length,
    trainCount: artifacts.split.train.length,
    testCount: artifacts.split.test.length,
    vocabularySize: artifacts.vocabulary.length,
  };
};

export const trainAndEvaluateChatbotModel = async (): Promise<ChatbotPipelineReport> => {
  const { metrics, preparedSummary, feedbackExamplesLoaded } = await trainWithPipeline({
    writeFiles: true,
    trainRatio: 0.8,
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: preparedSummary,
    metrics,
    improvementLoop: {
      userFeedbackPath: USER_FEEDBACK_DATASET_PATH,
      loadedFeedbackExamples: feedbackExamplesLoaded,
    },
  };
};

export const addUserFeedbackTrainingExample = async (
  text: string,
  label: IntentLabel
): Promise<{ saved: boolean; total: number }> => {
  const normalizedText = String(text || "").trim();
  if (!normalizedText || !INTENT_LABELS.includes(label)) {
    return { saved: false, total: 0 };
  }

  const existing = await loadUserFeedbackExamples();
  const merged = uniqueExamples([...existing, { text: normalizedText, label }]);

  await mkdir(path.dirname(USER_FEEDBACK_DATASET_PATH), { recursive: true });
  await writeFile(USER_FEEDBACK_DATASET_PATH, JSON.stringify(merged, null, 2), "utf-8");

  return { saved: true, total: merged.length };
};

const getRuntime = async (): Promise<ChatbotRuntime> => {
  if (!chatbotState.runtimePromise) {
    chatbotState.runtimePromise = trainRuntime().catch((error) => {
      chatbotState.runtimePromise = null;
      throw error;
    });
  }

  return chatbotState.runtimePromise;
};

export const answerChatbotQuestion = async (question: string): Promise<ChatbotAnswer> => {
  const trimmed = String(question || "").trim();
  if (!trimmed) {
    return {
      answer: "Pose ta question skincare (produit, prix, ingredients, comparaison) et je te reponds clairement.",
      confidence: 0,
      intent: "out_of_scope",
      suggestions: buildSuggestions(),
    };
  }

  const runtime = await getRuntime();
  const vector = vectorize(trimmed, runtime.vocabulary);
  const input = tf.tensor2d([vector], [1, runtime.vocabulary.length]);
  const prediction = runtime.model.predict(input) as tf.Tensor;
  const probabilities = Array.from(await prediction.data());

  input.dispose();
  prediction.dispose();

  let bestIndex = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[bestIndex]) {
      bestIndex = i;
    }
  }

  const bestConfidence = probabilities[bestIndex] || 0;
  const predictedIntent = runtime.indexToLabel[bestIndex] || "out_of_scope";
  const ruleIntent = inferIntentByRules(trimmed, runtime.stats);
  const hasSignal = hasProductOrBrandSignal(trimmed, runtime.stats);
  const inScope = isInScopeQuestion(trimmed, runtime.stats);
  const explicitRuleIntents = new Set<IntentLabel>([
    "price_analysis",
    "ingredient_insight",
    "brand_info",
    "product_comparison",
  ]);
  const intent: IntentLabel = !inScope
    ? "out_of_scope"
    : explicitRuleIntents.has(ruleIntent)
      ? ruleIntent
      : bestConfidence >= MIN_CONFIDENCE && predictedIntent !== "out_of_scope"
        ? ruleIntent === "brand_info" || ruleIntent === "product_comparison"
          ? ruleIntent
          : predictedIntent
        : ruleIntent;

  const finalConfidence =
    intent === "out_of_scope"
      ? bestConfidence
      : intent === ruleIntent || hasSignal
        ? Math.max(bestConfidence, 0.62)
        : bestConfidence;

  const answer = composeResponse(trimmed, intent, finalConfidence, runtime.stats);
  return {
    answer,
    confidence: round(finalConfidence, 4),
    intent,
    suggestions: buildSuggestions(),
  };
};

export const answerChatbotQuestionWithoutModel = async (
  question: string
): Promise<ChatbotAnswer> => {
  const trimmed = String(question || "").trim();
  if (!trimmed) {
    return {
      answer: "Posez votre question skincare et je repondrai avec les donnees produits.",
      confidence: 0,
      intent: "out_of_scope",
      suggestions: buildSuggestions(),
    };
  }

  const stats = await buildStats();
  const intent = isInScopeQuestion(trimmed, stats)
    ? pickIntentWithoutModel(trimmed, stats)
    : "out_of_scope";
  const confidence = intent === "out_of_scope" ? 0.25 : 0.61;

  return {
    answer: composeResponse(trimmed, intent, confidence, stats),
    confidence: round(confidence, 4),
    intent,
    suggestions: buildSuggestions(),
  };
};

export const warmupChatbotModel = async (): Promise<void> => {
  await getRuntime();
};

export const resetChatbotRuntime = (): void => {
  chatbotState.runtimePromise = null;
  tf.disposeVariables();
};
