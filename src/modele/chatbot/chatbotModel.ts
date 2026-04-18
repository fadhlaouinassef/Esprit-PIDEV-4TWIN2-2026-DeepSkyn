import * as tf from "@tensorflow/tfjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

type IntentLabel =
  | "product_recommendation"
  | "price_analysis"
  | "ingredient_insight"
  | "routine_advice"
  | "dataset_facts"
  | "health_warning"
  | "out_of_scope";

type CsvRow = Record<string, string>;

type TrainingExample = {
  text: string;
  label: IntentLabel;
};

type ProductRecord = {
  name: string;
  url: string | null;
  type: string;
  ingredients: string[];
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
  diabetesRows: number;
  avgStars: number;
  avgSkinCarePrice: number;
  avgProductPrice: number;
  topRatedTitles: string[];
  topProductTypes: Array<{ type: string; count: number }>;
  topProductKinds: Array<{ kind: string; count: number }>;
  topBrands: Array<{ brand: string; count: number }>;
  brands: string[];
  topIngredients: Array<{ ingredient: string; count: number }>;
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

type ProductQuestionFocus = {
  asksIngredients: boolean;
  asksPrice: boolean;
  asksEffects: boolean;
  asksComparison: boolean;
  asksRecommendation: boolean;
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
  "routine_advice",
  "dataset_facts",
  "health_warning",
  "out_of_scope",
];

const TRAIN_EPOCHS = 95;
const LEARNING_RATE = 0.015;
const MIN_CONFIDENCE = 0.33;

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

const tokenize = (value: string): string[] => {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
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
  const cleaned = value.replace(/[^0-9.]/g, "").trim();
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
  return raw
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => item.replace(/['\"]/g, "").trim().toLowerCase())
    .filter((item) => item.length > 1);
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
  return brand || "";
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

const includesAny = (text: string, terms: string[]): boolean => {
  return terms.some((term) => text.includes(term));
};

const parseQuestionFocus = (question: string): ProductQuestionFocus => {
  const normalized = normalizeText(question);
  return {
    asksIngredients: includesAny(normalized, ["ingredient", "ingredients", "inci", "actif", "composition"]),
    asksPrice: includesAny(normalized, ["prix", "price", "coute", "cost", "cher", "budget"]),
    asksEffects: includesAny(normalized, ["effet", "effets", "benefice", "benefices", "side effect", "indesirable", "risque"]),
    asksComparison: includesAny(normalized, ["ou", "versus", "vs", "compare", "difference", "mieux"]),
    asksRecommendation: includesAny(normalized, ["recommande", "recommend", "meilleur", "best", "conseille", "adapte"]),
  };
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

const buildConcernSummary = (concerns: string[]): string => {
  if (concerns.length === 0) return "besoins generaux";
  return concerns.join(", ");
};

const productsByBrand = (brand: string, stats: DatasetStats): ProductRecord[] => {
  return stats.products.filter((product) => extractBrand(product.name) === brand);
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

  const mapProductRow = (row: CsvRow, source: string): ProductRecord => ({
    name: row.product_name || "Unknown product",
    url: row.product_url || null,
    type: (row.product_type || "general").toLowerCase(),
    ingredients: parseIngredientList(row.clean_ingreds || ""),
    price: parsePrice(row.price),
    source,
  });

  const productsCombined = [
    ...productsRaw.map((row) => mapProductRow(row, "clean")),
    ...productsParapharmacieRaw.map((row) => mapProductRow(row, "parapharmacie")),
  ];

  // Keep one canonical product per name and prefer richer entries.
  const productsByName = new Map<string, ProductRecord>();
  for (const product of productsCombined) {
    const key = normalizeText(product.name);
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

  const products = [...productsByName.values()];

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

  const topProductKinds = countTop(products.map((item) => inferProductKind(item)), 10).map((item) => ({
    kind: item.value,
    count: item.count,
  }));

  const topBrands = countTop(
    products.map((item) => extractBrand(item.name)).filter((brand) => brand.length > 0),
    60
  )
    .filter((item) => item.count >= 2)
    .map((item) => ({ brand: item.value, count: item.count }));

  const brands = [
    ...new Set(products.map((item) => extractBrand(item.name)).filter((brand) => brand.length > 0)),
  ];

  const topIngredients = countTop(products.flatMap((item) => item.ingredients), 6).map((item) => ({
    ingredient: item.value,
    count: item.count,
  }));

  return {
    skinCareRows: skinCare.length,
    productsRows: products.length,
    productsRowsClean: productsRaw.length,
    productsRowsParapharmacie: productsParapharmacieRaw.length,
    diabetesRows: diabetes.length,
    avgStars: round(mean(skinCare.map((item) => item.stars))),
    avgSkinCarePrice: round(mean(skinCare.map((item) => item.price ?? 0).filter((p) => p > 0))),
    avgProductPrice: round(mean(products.map((item) => item.price ?? 0).filter((p) => p > 0))),
    topRatedTitles,
    topProductTypes: topTypes,
    topProductKinds,
    topBrands,
    brands,
    topIngredients,
    highRiskDiabetesRatio: round(mean(diabetes.map((item) => (item.outcome > 0 ? 1 : 0))), 3),
    avgGlucose: round(mean(diabetes.map((item) => item.glucose))),
    avgBmi: round(mean(diabetes.map((item) => item.bmi))),
    products,
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
    base.push({ text: `donne les produits de la marque ${brand}`, label: "product_recommendation" });
    base.push({ text: `prix des produits ${brand}`, label: "price_analysis" });
    base.push({ text: `ingredients typiques de ${brand}`, label: "ingredient_insight" });
    base.push({ text: `effets secondaires possibles des produits ${brand}`, label: "product_recommendation" });
  }

  const productSamples = stats.products
    .filter((item) => item.name.length > 5)
    .sort((a, b) => b.ingredients.length - a.ingredients.length)
    .slice(0, 220);

  for (const product of productSamples) {
    const kind = inferProductKind(product);
    const brand = extractBrand(product.name);
    base.push({ text: `explique le produit ${product.name}`, label: "product_recommendation" });
    base.push({ text: `ingredients de ${product.name}`, label: "ingredient_insight" });
    base.push({ text: `prix de ${product.name}`, label: "price_analysis" });
    base.push({ text: `ce ${kind} est il bien pour peau sensible`, label: "product_recommendation" });
    if (brand) {
      base.push({ text: `meilleur ${kind} de ${brand}`, label: "product_recommendation" });
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

  return base;
};

const buildVocabulary = (examples: TrainingExample[]): string[] => {
  const bucket = new Set<string>();
  for (const example of examples) {
    for (const token of tokenize(example.text)) {
      bucket.add(token);
    }
  }

  return [...bucket].sort();
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

const pickProductByNeed = (question: string, stats: DatasetStats): ProductRecord | null => {
  const normalized = normalizeText(question);
  const requestedKind = detectRequestedProductKind(question);
  const concerns = detectSkinConcerns(question);
  const budgetMax = parseBudgetMax(question);
  const exactName = stats.products.find((product) => normalized.includes(normalizeText(product.name)));
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

const findExactProductMatch = (question: string, stats: DatasetStats): ProductRecord | null => {
  const normalized = normalizeText(question);
  return (
    stats.products.find((product) => normalized.includes(normalizeText(product.name))) || null
  );
};

const findMatchedBrand = (question: string, stats: DatasetStats): string | null => {
  const normalized = normalizeText(question);
  const sortedBrands = [...stats.brands].sort((a, b) => b.length - a.length);
  return sortedBrands.find((brand) => textHasBrand(normalized, brand)) || null;
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

const priceText = (price: number | null): string => {
  if (price === null || !Number.isFinite(price) || price <= 0) return "prix non disponible";
  return `${round(toTnd(price), 2)} TND (~${round(price, 2)} GBP)`;
};

const priceTextTnd = (price: number | null): string => {
  if (price === null || !Number.isFinite(price) || price <= 0) return "prix non disponible";
  return `${round(toTnd(price), 2)} TND`;
};

const productLinkText = (product: ProductRecord): string => {
  return product.url ? ` Lien: ${product.url}.` : "";
};

const formatProductExample = (product: ProductRecord): string => {
  return `${product.name} (${toTitleCase(product.type)}, ${priceTextTnd(product.price)})${productLinkText(product)}`;
};

const buildSuggestions = (): string[] => {
  return [
    "What is the best moisturizer in your data?",
    "Give me a simple AM/PM routine.",
    "Which ingredients appear most frequently?",
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

  if (intent === "product_recommendation") {
    const focus = parseQuestionFocus(question);
    const requestedKind = detectRequestedProductKind(question);
    const concerns = detectSkinConcerns(question);
    const budgetMax = parseBudgetMax(question);
    const exactProduct = findExactProductMatch(question, stats);

    if (exactProduct) {
      const insight = getProductInsight(exactProduct);
      const ingredientsText = insight.keyIngredients.length
        ? insight.keyIngredients.join(", ")
        : "Ingredients non disponibles";
      const benefitsText = insight.benefits.length
        ? insight.benefits.join("; ")
        : "Benefices dependants de la formule complete";
      const cautionsText = insight.cautions.length
        ? insight.cautions.join("; ")
        : "Pas de signal d'alerte majeur detecte";
      const productKind = toTitleCase(inferProductKind(exactProduct));
      const urlText = exactProduct.url ? ` Voir le produit: ${exactProduct.url}.` : "";

      if (focus.asksIngredients && !focus.asksEffects && !focus.asksPrice) {
        return `Voici les ingredients principaux de ${exactProduct.name}: ${ingredientsText}.${urlText}`;
      }

      if (focus.asksPrice && !focus.asksIngredients && !focus.asksEffects) {
        return `Le prix estime de ${exactProduct.name} est ${priceTextTnd(exactProduct.price)}.${urlText}`;
      }

      if (focus.asksEffects && !focus.asksIngredients && !focus.asksPrice) {
        return `Pour ${exactProduct.name}, les effets attendus sont: ${benefitsText}. Precautions possibles: ${cautionsText}. Profil detecte: ${buildConcernSummary(concerns)}.${urlText}`;
      }

      return `Voici un resume clair pour ${exactProduct.name} (${productKind}): prix estime ${priceTextTnd(exactProduct.price)}, ingredients cles ${ingredientsText}, effets attendus ${benefitsText}, precautions ${cautionsText}.${urlText}`;
    }

    if (requestedKind) {
      const kindProducts = stats.products
        .filter((product) => inferProductKind(product) === requestedKind)
        .sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));

      if (kindProducts.length > 0 && !findMatchedBrand(question, stats)) {
        const budgetFiltered = budgetMax
          ? kindProducts.filter((item) => (item.price ?? 9999) <= budgetMax)
          : kindProducts;
        const scopedProducts = budgetFiltered.length > 0 ? budgetFiltered : kindProducts;
        const avgKindPrice = avgPrice(kindProducts);
        const preview = scopedProducts
          .slice(0, 3)
          .map((item) => formatProductExample(item))
          .join(" | ");

        if (focus.asksPrice && !focus.asksRecommendation) {
          return `Pour la categorie ${toTitleCase(requestedKind)}, nous avons ${kindProducts.length} produits. Le prix moyen est ${priceTextTnd(avgKindPrice)}. Exemples utiles: ${preview}`;
        }

        if (focus.asksIngredients && !focus.asksRecommendation) {
          const topKindIngredients = countTop(
            kindProducts.flatMap((item) => item.ingredients),
            8
          ).map((item) => toTitleCase(item.value));
          return `Dans la categorie ${toTitleCase(requestedKind)}, les ingredients les plus frequents sont: ${topKindIngredients.join(", ")}. Analyse basee sur ${kindProducts.length} produits.`;
        }

        if (focus.asksRecommendation || !focus.asksEffects) {
          const best = scopedProducts
            .map((item) => ({
              item,
              score: scoreProductForQuestion(item, question, concerns, requestedKind, budgetMax),
            }))
            .sort((a, b) => b.score - a.score || (a.item.price ?? 9999) - (b.item.price ?? 9999))[0]?.item;

          if (best) {
            return `Je vous recommande ${best.name} pour votre besoin (${buildConcernSummary(concerns)}${budgetMax ? `, budget max ${priceTextTnd(budgetMax)}` : ""}). Prix estime: ${priceTextTnd(best.price)}.${productLinkText(best)} Autres options: ${preview}`;
          }

          return `Je vous propose ${kindProducts[0].name} en premiere option (${priceTextTnd(kindProducts[0].price)}).${productLinkText(kindProducts[0])} Autres options: ${preview}`;
        }
      }
    }

    const matchedBrand = findMatchedBrand(question, stats);
    if (matchedBrand) {
      const brandProducts = productsByBrand(matchedBrand, stats)
        .sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999));

      if (brandProducts.length > 0) {
        const preview = brandProducts
          .slice(0, 3)
          .map((product) => formatProductExample(product))
          .join(" | ");

        const cheapest = brandProducts[0];
        const priciest = [...brandProducts].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];

        if (focus.asksComparison) {
          const normalized = normalizeText(question);
          const otherBrand = stats.brands.find(
            (brand) => brand !== matchedBrand && textHasBrand(normalized, brand)
          );

          if (otherBrand) {
            const otherProducts = productsByBrand(otherBrand, stats);
            const thisAvg = avgPrice(brandProducts);
            const otherAvg = avgPrice(otherProducts);
            return `Comparaison ${matchedBrand.toUpperCase()} vs ${otherBrand.toUpperCase()}: ${brandProducts.length} produits contre ${otherProducts.length}. Prix moyen: ${priceTextTnd(thisAvg)} contre ${priceTextTnd(otherAvg)}. Exemples ${matchedBrand.toUpperCase()}: ${preview}`;
          }
        }

        if (focus.asksIngredients) {
          const topBrandIngredients = countTop(
            brandProducts.flatMap((item) => item.ingredients),
            8
          ).map((item) => toTitleCase(item.value));
          return `Pour la marque ${matchedBrand.toUpperCase()}, les ingredients les plus frequents sont: ${topBrandIngredients.join(", ")}. Analyse sur ${brandProducts.length} produits.`;
        }

        if (focus.asksPrice) {
          return `Pour ${matchedBrand.toUpperCase()}, j'ai trouve ${brandProducts.length} produits. Prix moyen: ${priceTextTnd(avgPrice(brandProducts))}. Le moins cher: ${cheapest.name} (${priceTextTnd(cheapest.price)}). Le plus cher: ${priciest.name} (${priceTextTnd(priciest.price)}).`;
        }

        if (focus.asksEffects) {
          const representative = pickProductByNeed(question, stats) || cheapest;
          const insight = getProductInsight(representative);
          const benefitsText = insight.benefits.length
            ? insight.benefits.join("; ")
            : "Benefices dependants de la formule precise";
          const cautionsText = insight.cautions.length
            ? insight.cautions.join("; ")
            : "Pas de signal d'alerte majeur detecte";
          return `Pour la marque ${matchedBrand.toUpperCase()}, un bon exemple est ${representative.name}. Effets attendus: ${benefitsText}. Precautions possibles: ${cautionsText}.${productLinkText(representative)}`;
        }

        if (focus.asksRecommendation) {
          const scopedByBudget = budgetMax
            ? brandProducts.filter((item) => (item.price ?? 9999) <= budgetMax)
            : brandProducts;
          const candidates = scopedByBudget.length > 0 ? scopedByBudget : brandProducts;
          const recommended = [...candidates]
            .map((item) => ({
              item,
              score: scoreProductForQuestion(item, question, concerns, requestedKind, budgetMax),
            }))
            .sort((a, b) => b.score - a.score || (a.item.price ?? 9999) - (b.item.price ?? 9999))[0]?.item;

          if (!recommended) {
            return `Marque detectee: ${matchedBrand.toUpperCase()}. Aucun produit n'a pu etre recommande pour ce contexte.`;
          }

          return `Je vous recommande ${recommended.name} (${toTitleCase(recommended.type)}) pour la marque ${matchedBrand.toUpperCase()}. Prix estime: ${priceTextTnd(recommended.price)}.${productLinkText(recommended)} Alternatives: ${preview}`;
        }

        return `Voici ce que j'ai trouve pour la marque ${matchedBrand.toUpperCase()}: ${brandProducts.length} produits. Exemples: ${preview} Vous pouvez me demander le prix, les ingredients, les effets ou une recommandation personnalisee.`;
      }
    }

    const picked = pickProductByNeed(question, stats);
    const selected = picked?.name || stats.topRatedTitles[0] || "CeraVe Facial Moisturising Lotion SPF 25";
    const selectedPrice = picked?.price ?? null;
    const insight = picked ? getProductInsight(picked) : null;
    const ingredientsText = insight?.keyIngredients.length
      ? insight.keyIngredients.join(", ")
      : "Ingredients non disponibles";
    const benefitsText = insight?.benefits.length
      ? insight.benefits.join("; ")
      : "Benefices dependants de la formule complete";
    const cautionsText = insight?.cautions.length
      ? insight.cautions.join("; ")
      : "Pas de signal d'alerte majeur detecte dans les ingredients disponibles";
    const typeText = picked?.type ? toTitleCase(picked.type) : "General";
    const sourceText = picked?.source ? picked.source : "clean";
    const urlText = picked?.url ? ` Voir le produit: ${picked.url}.` : "";

    if (focus.asksIngredients && !focus.asksEffects && !focus.asksPrice) {
      return `Pour ${selected}, les ingredients cles sont: ${ingredientsText}.${urlText}`;
    }

    if (focus.asksPrice && !focus.asksIngredients && !focus.asksEffects) {
      return `Le prix estime de ${selected} (${typeText}) est ${priceTextTnd(selectedPrice)}. Estimation basee sur notre base de produits.${urlText}`;
    }

    if (focus.asksEffects && !focus.asksIngredients && !focus.asksPrice) {
      return `Pour ${selected}, les effets attendus sont: ${benefitsText}. Precautions possibles: ${cautionsText}.${urlText}`;
    }

    return `Je vous recommande ${selected} (${typeText}). Prix estime: ${priceTextTnd(selectedPrice)}. Pourquoi ce choix: correspondance avec votre question et notre base de ${stats.productsRows} produits (${topTypes}). Ingredients cles: ${ingredientsText}. Effets attendus: ${benefitsText}. Precautions: ${cautionsText}. Source: ${sourceText}.${urlText}`;
  }

  if (intent === "price_analysis") {
    const requestedKind = detectRequestedProductKind(question);
    if (requestedKind) {
      const kindProducts = stats.products.filter((product) => inferProductKind(product) === requestedKind);
      if (kindProducts.length > 0) {
        const cheapest = [...kindProducts].sort((a, b) => (a.price ?? 9999) - (b.price ?? 9999))[0];
        const priciest = [...kindProducts].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))[0];
        return `Prix pour ${toTitleCase(requestedKind)}: ${kindProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(kindProducts))}. Le moins cher: ${cheapest.name} (${priceTextTnd(cheapest.price)}). Le plus cher: ${priciest.name} (${priceTextTnd(priciest.price)}).${productLinkText(cheapest)}`;
      }
    }

    const matchedBrand = findMatchedBrand(question, stats);
    if (matchedBrand) {
      const brandProducts = productsByBrand(matchedBrand, stats);
      if (brandProducts.length > 0) {
        return `Prix pour ${matchedBrand.toUpperCase()}: ${brandProducts.length} produits, prix moyen ${priceTextTnd(avgPrice(brandProducts))}.`;
      }
    }

    return `Dans nos donnees, le prix moyen est ${priceTextTnd(stats.avgProductPrice)} pour la base ingredients et ${priceTextTnd(stats.avgSkinCarePrice)} pour la base skin_care. Note moyenne observee: ${stats.avgStars}/5.`;
  }

  if (intent === "ingredient_insight") {
    const requestedKind = detectRequestedProductKind(question);
    if (requestedKind) {
      const kindProducts = stats.products.filter((product) => inferProductKind(product) === requestedKind);
      if (kindProducts.length > 0) {
        const topKindIngredients = countTop(
          kindProducts.flatMap((item) => item.ingredients),
          8
        ).map((item) => toTitleCase(item.value));
        return `Ingredients frequents pour ${toTitleCase(requestedKind)}: ${topKindIngredients.join(", ")}. Analyse sur ${kindProducts.length} produits.`;
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
        return `Ingredients frequents pour la marque ${matchedBrand.toUpperCase()}: ${topBrandIngredients.join(", ")}. Analyse sur ${brandProducts.length} produits.`;
      }
    }

    return `Les ingredients les plus frequents dans la base sont: ${topIngredients}. Cette analyse est basee sur ${stats.productsRows} produits.`;
  }

  if (intent === "routine_advice") {
    const concerns = detectSkinConcerns(question);
    if (concerns.includes("acne") || concerns.includes("oily")) {
      return "Routine ciblee peau grasse/imparfaite: AM = cleanser doux + serum niacinamide + SPF 30+, PM = cleanser doux + actif salicylique progressif + hydratant non comedogene. Introduire un seul actif a la fois sur 10-14 jours.";
    }

    if (concerns.includes("dry") || concerns.includes("sensitive")) {
      return "Routine ciblee peau seche/sensible: AM = cleanser creme doux + serum hydratant (hyaluronate/glycerin) + creme barriere + SPF 30+, PM = cleanser doux + creme riche ceramides/panthenol. Eviter la surcharge d'actifs irritants.";
    }

    return "Precise routine: AM = gentle cleanser + hydrating serum + SPF 30+, PM = gentle cleanser + one active (niacinamide or mild salicylic acid) + barrier moisturizer. Add only one new active every 10-14 days.";
  }

  if (intent === "dataset_facts") {
    return `Le modele est entraine avec 4 CSV: skin_care (${stats.skinCareRows} lignes), skincare_products_clean (${stats.productsRowsClean}), skincare_productsparapharmacie (${stats.productsRowsParapharmacie}), diabetes (${stats.diabetesRows}). Produits fusionnes (sans doublons): ${stats.productsRows}. Confiance courante: ${round(confidence, 3)}.`;
  }

  if (intent === "health_warning") {
    return `Dataset signal: Outcome=1 ratio in diabetes is about ${round(stats.highRiskDiabetesRatio * 100, 1)}%, average glucose ${stats.avgGlucose}, average BMI ${stats.avgBmi}. This is informational and not a medical diagnosis.`;
  }

  return "I can answer precisely about product recommendations, ingredients, prices, routines, and CSV statistics. Please rephrase your question within that scope.";
};

const pickIntentWithoutModel = (question: string, stats: DatasetStats): IntentLabel => {
  const normalized = normalizeText(question);

  if (hasProductOrBrandSignal(question, stats)) return "product_recommendation";

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

const trainRuntime = async (): Promise<ChatbotRuntime> => {
  await tf.ready();
  await tf.setBackend("cpu");

  const stats = await buildStats();
  const examples = buildTrainingSet(stats);
  const vocabulary = buildVocabulary(examples);
  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const labelToIndex = Object.fromEntries(
    INTENT_LABELS.map((label, index) => [label, index])
  ) as Record<IntentLabel, number>;

  const xsBuffer = examples.map((example) => vectorize(example.text, vocabulary));
  const ysBuffer = examples.map((example) => labelToIndex[example.label]);

  const xs = tf.tensor2d(xsBuffer, [xsBuffer.length, vocabulary.length]);
  const ysIndices = tf.tensor1d(ysBuffer, "int32");
  const ys = tf.oneHot(ysIndices, INTENT_LABELS.length).asType("float32");

  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      name: `chatbot_dense_1_${runId}`,
      inputShape: [vocabulary.length],
      units: 64,
      activation: "relu",
      kernelInitializer: "glorotUniform",
    })
  );
  model.add(tf.layers.dropout({ name: `chatbot_dropout_${runId}`, rate: 0.2 }));
  model.add(
    tf.layers.dense({
      name: `chatbot_dense_mid_${runId}`,
      units: 32,
      activation: "relu",
      kernelInitializer: "glorotUniform",
    })
  );
  model.add(tf.layers.dropout({ name: `chatbot_dropout_mid_${runId}`, rate: 0.1 }));
  model.add(
    tf.layers.dense({
      name: `chatbot_dense_2_${runId}`,
      units: INTENT_LABELS.length,
      activation: "softmax",
    })
  );

  model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(xs, ys, {
    epochs: TRAIN_EPOCHS,
    batchSize: Math.min(16, examples.length),
    shuffle: true,
    validationSplit: 0.15,
    verbose: 0,
  });

  xs.dispose();
  ysIndices.dispose();
  ys.dispose();

  return {
    model,
    vocabulary,
    labelToIndex,
    indexToLabel: INTENT_LABELS,
    stats,
  };
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
      answer: "Ask your skincare question and I will answer with model-backed data.",
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
  const hasSignal = hasProductOrBrandSignal(trimmed, runtime.stats);
  const intent: IntentLabel = hasSignal
    ? "product_recommendation"
    : bestConfidence >= MIN_CONFIDENCE
      ? predictedIntent
      : "out_of_scope";
  const finalConfidence = hasSignal ? Math.max(bestConfidence, 0.62) : bestConfidence;

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
  const intent = pickIntentWithoutModel(trimmed, stats);
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
