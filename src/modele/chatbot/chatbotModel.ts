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
  type: string;
  ingredients: string[];
  price: number | null;
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
  diabetesRows: number;
  avgStars: number;
  avgSkinCarePrice: number;
  avgProductPrice: number;
  topRatedTitles: string[];
  topProductTypes: Array<{ type: string; count: number }>;
  topIngredients: Array<{ ingredient: string; count: number }>;
  highRiskDiabetesRatio: number;
  avgGlucose: number;
  avgBmi: number;
  products: ProductRecord[];
  skinCare: SkinCareRecord[];
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

const TRAIN_EPOCHS = 80;
const LEARNING_RATE = 0.03;
const MIN_CONFIDENCE = 0.33;

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

const buildStats = async (): Promise<DatasetStats> => {
  const basePath = path.join(process.cwd(), "src", "modele");
  const skinCareRaw = await parseCsv(path.join(basePath, "skin_care.csv"));
  const productsRaw = await parseCsv(path.join(basePath, "skincare_products_clean.csv"));
  const diabetesRaw = await parseCsv(path.join(basePath, "diabetes.csv"));

  const skinCare: SkinCareRecord[] = skinCareRaw.map((row) => ({
    title: row.title || "Unknown product",
    stars: safeNumber(row.stars, 0),
    vote: safeNumber(row.vote, 0),
    price: parsePrice(row.price),
  }));

  const products: ProductRecord[] = productsRaw.map((row) => ({
    name: row.product_name || "Unknown product",
    type: (row.product_type || "general").toLowerCase(),
    ingredients: parseIngredientList(row.clean_ingreds || ""),
    price: parsePrice(row.price),
  }));

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

  const topIngredients = countTop(products.flatMap((item) => item.ingredients), 6).map((item) => ({
    ingredient: item.value,
    count: item.count,
  }));

  return {
    skinCareRows: skinCare.length,
    productsRows: products.length,
    diabetesRows: diabetes.length,
    avgStars: round(mean(skinCare.map((item) => item.stars))),
    avgSkinCarePrice: round(mean(skinCare.map((item) => item.price ?? 0).filter((p) => p > 0))),
    avgProductPrice: round(mean(products.map((item) => item.price ?? 0).filter((p) => p > 0))),
    topRatedTitles,
    topProductTypes: topTypes,
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
  const byType = stats.products.filter((product) => normalized.includes(product.type));

  const candidates = byType.length > 0 ? byType : stats.products;
  const scored = candidates
    .map((product) => {
      const titleTokens = tokenize(product.name);
      const overlap = titleTokens.filter((token) => normalized.includes(token)).length;
      return { product, score: overlap };
    })
    .sort((a, b) => b.score - a.score || (a.product.price ?? 9999) - (b.product.price ?? 9999));

  return scored[0]?.product || null;
};

const priceText = (price: number | null): string => {
  if (price === null || !Number.isFinite(price) || price <= 0) return "prix non disponible";
  return `${round(price, 2)} GBP`;
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
    const picked = pickProductByNeed(question, stats);
    const selected = picked?.name || stats.topRatedTitles[0] || "CeraVe Facial Moisturising Lotion SPF 25";
    const selectedPrice = picked?.price ?? null;

    return `I recommend: ${selected}. Estimated price: ${priceText(selectedPrice)}. This recommendation is grounded on ${stats.productsRows} products and the most represented categories (${topTypes}).`;
  }

  if (intent === "price_analysis") {
    return `In the datasets, average price is around ${stats.avgProductPrice} GBP (ingredients dataset) and ${stats.avgSkinCarePrice} GBP (skin_care dataset). Observed mean rating is ${stats.avgStars}/5.`;
  }

  if (intent === "ingredient_insight") {
    return `Most frequent ingredients are: ${topIngredients}. This is extracted from ${stats.productsRows} product entries and helps target hydration, barrier support, and tolerance.`;
  }

  if (intent === "routine_advice") {
    return "Precise routine: AM = gentle cleanser + hydrating serum + SPF 30+, PM = gentle cleanser + one active (niacinamide or mild salicylic acid) + barrier moisturizer. Add only one new active every 10-14 days.";
  }

  if (intent === "dataset_facts") {
    return `The model is trained from 3 CSV files: skin_care (${stats.skinCareRows} rows), skincare_products_clean (${stats.productsRows} rows), diabetes (${stats.diabetesRows} rows). Current confidence: ${round(confidence, 3)}.`;
  }

  if (intent === "health_warning") {
    return `Dataset signal: Outcome=1 ratio in diabetes is about ${round(stats.highRiskDiabetesRatio * 100, 1)}%, average glucose ${stats.avgGlucose}, average BMI ${stats.avgBmi}. This is informational and not a medical diagnosis.`;
  }

  return "I can answer precisely about product recommendations, ingredients, prices, routines, and CSV statistics. Please rephrase your question within that scope.";
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
      units: 32,
      activation: "relu",
      kernelInitializer: "glorotUniform",
    })
  );
  model.add(tf.layers.dropout({ name: `chatbot_dropout_${runId}`, rate: 0.15 }));
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
  const intent: IntentLabel = bestConfidence >= MIN_CONFIDENCE ? predictedIntent : "out_of_scope";

  const answer = composeResponse(trimmed, intent, bestConfidence, runtime.stats);
  return {
    answer,
    confidence: round(bestConfidence, 4),
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
