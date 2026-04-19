import * as tf from "@tensorflow/tfjs";

export type TrendDirection = "improving" | "declining" | "stable";
export type TrendLocale = "en" | "fr" | "ar";

export type TrendInputPoint = {
  id?: string | number;
  score: number;
  hydration: number;
  oilProduction: number;
  sensitivity: string | number;
  date?: string;
};

export type TrendFactor = {
  metric: "score" | "hydration" | "oilProduction" | "sensitivity";
  delta: number;
  impact: number;
  movement: "improved" | "worsened" | "neutral";
  explanation: string;
};

export type TrendDriver = {
  metric: TrendFactor["metric"];
  weight: number;
  direction: "improvement" | "decline";
  short: string;
  mechanism: string;
  evidence: string;
};

export type TrendInsight = {
  direction: TrendDirection;
  scoreDelta: number;
  slope: number;
  confidence: number;
  summary: string;
  why: string;
  factors: TrendFactor[];
  improvementDrivers: TrendDriver[];
  declineDrivers: TrendDriver[];
  clarity: {
    headline: string;
    plainWhy: string;
    riskLevel: "low" | "medium" | "high";
    confidenceLabel: string;
    thisWeekPlan: string[];
  };
  recommendations: string[];
  model: {
    samples: number;
    epochs: number;
    finalLoss: number;
    predictedNextScore: number;
  };
};

const SCORE_DELTA_THRESHOLD = 2;
const EPSILON = 1e-6;
const TRAIN_EPOCHS = 140;

type TrainingRow = {
  x: number[];
  y: number;
};

type CachedTrendModel = {
  signature: string;
  model: tf.Sequential;
  xMeans: number[];
  xStds: number[];
  yMean: number;
  yStd: number;
  finalLoss: number;
  epochs: number;
};

export type SerializedDenseLayer = {
  kernel: number[];
  kernelShape: number[];
  bias: number[];
  biasShape: number[];
};

export type SerializedTrendModelArtifact = {
  version: number;
  inputCols: number;
  xMeans: number[];
  xStds: number[];
  yMean: number;
  yStd: number;
  finalLoss: number;
  epochs: number;
  trainedAt: string;
  layers: SerializedDenseLayer[];
};

export type TrendAnalyzeOptions = {
  cacheKey?: string;
  pretrainedArtifact?: SerializedTrendModelArtifact;
  disableTraining?: boolean;
};

const trendModelCache = new Map<string, CachedTrendModel>();

const createCompiledTrendModel = (xCols: number): tf.Sequential => {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [xCols], units: 18, activation: "relu" }),
      tf.layers.dense({ units: 10, activation: "relu" }),
      tf.layers.dense({ units: 1 }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.02),
    loss: "meanSquaredError",
  });

  return model;
};

const parseAnalyzeOptions = (optionsOrCacheKey?: string | TrendAnalyzeOptions): TrendAnalyzeOptions => {
  if (typeof optionsOrCacheKey === "string") {
    return { cacheKey: optionsOrCacheKey };
  }
  return optionsOrCacheKey || {};
};

const serializeModelToArtifact = (
  model: tf.Sequential,
  xMeans: number[],
  xStds: number[],
  yMean: number,
  yStd: number,
  finalLoss: number,
  epochs: number
): SerializedTrendModelArtifact => {
  const weights = model.getWeights();
  const layers: SerializedDenseLayer[] = [];

  for (let i = 0; i < weights.length; i += 2) {
    const kernelTensor = weights[i];
    const biasTensor = weights[i + 1];

    layers.push({
      kernel: Array.from(kernelTensor.dataSync()),
      kernelShape: [...kernelTensor.shape],
      bias: Array.from(biasTensor.dataSync()),
      biasShape: [...biasTensor.shape],
    });
  }

  return {
    version: 1,
    inputCols: xMeans.length,
    xMeans,
    xStds,
    yMean,
    yStd,
    finalLoss,
    epochs,
    trainedAt: new Date().toISOString(),
    layers,
  };
};

const modelFromArtifact = (artifact: SerializedTrendModelArtifact): tf.Sequential => {
  const model = createCompiledTrendModel(artifact.inputCols);
  const tensors: tf.Tensor[] = [];

  for (const layer of artifact.layers) {
    tensors.push(tf.tensor(layer.kernel, layer.kernelShape));
    tensors.push(tf.tensor(layer.bias, layer.biasShape));
  }

  model.setWeights(tensors);
  tensors.forEach((tensor) => tensor.dispose());
  return model;
};

const toMetrics = (points: TrendInputPoint[]): [number, number, number, number][] => {
  const chronological = [...points].reverse();
  return chronological.map((point) => [
    toNumber(point.score),
    toNumber(point.hydration),
    toNumber(point.oilProduction),
    sensitivityToNumeric(point.sensitivity),
  ]) as [number, number, number, number][];
};

export const trainTrendModelArtifactFromSeries = async (
  series: TrendInputPoint[][]
): Promise<SerializedTrendModelArtifact | null> => {
  if (!Array.isArray(series) || !series.length) return null;

  const trainingRows: TrainingRow[] = [];
  for (const points of series) {
    if (!Array.isArray(points) || points.length < 3) continue;
    const metrics = toMetrics(points);
    const rows = buildTrainingRows(metrics);
    if (rows.length) trainingRows.push(...rows);
  }

  if (trainingRows.length < 2) return null;

  const xCols = trainingRows[0].x.length;
  const xMeans = Array.from({ length: xCols }, (_, col) => mean(trainingRows.map((row) => row.x[col])));
  const xStds = Array.from({ length: xCols }, (_, col) => stdev(trainingRows.map((row) => row.x[col]), xMeans[col]));

  const yValues = trainingRows.map((row) => row.y);
  const yMean = mean(yValues);
  const yStd = stdev(yValues, yMean);

  const xNorm = trainingRows.map((row) => row.x.map((value, col) => (value - xMeans[col]) / xStds[col]));
  const yNorm = yValues.map((value) => (value - yMean) / yStd);

  const xs = tf.tensor2d(xNorm);
  const ys = tf.tensor2d(yNorm, [yNorm.length, 1]);

  const model = createCompiledTrendModel(xCols);

  const validationSplit = trainingRows.length >= 8 ? 0.2 : 0;
  const history = await model.fit(xs, ys, {
    epochs: TRAIN_EPOCHS,
    batchSize: Math.min(16, trainingRows.length),
    shuffle: true,
    validationSplit,
    verbose: 0,
    callbacks: validationSplit > 0
      ? [tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 12 })]
      : undefined,
  });

  const finalLoss = safeFinite(Number(history.history.loss?.slice(-1)[0] ?? 1), 1);
  const trainedEpochs = Number(history.epoch.length || TRAIN_EPOCHS);

  const artifact = serializeModelToArtifact(
    model,
    xMeans,
    xStds,
    yMean,
    yStd,
    finalLoss,
    trainedEpochs
  );

  model.dispose();
  xs.dispose();
  ys.dispose();

  return artifact;
};

const buildPointsSignature = (points: TrendInputPoint[]): string => {
  return points
    .map((point) => {
      return [
        String(point.id ?? ""),
        String(point.date ?? ""),
        toNumber(point.score),
        toNumber(point.hydration),
        toNumber(point.oilProduction),
        sensitivityToNumeric(point.sensitivity),
      ].join("|");
    })
    .join("~");
};

const resolveLocale = (rawLocale?: string): TrendLocale => {
  const normalized = String(rawLocale || "en").toLowerCase();
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("ar")) return "ar";
  return "en";
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sensitivityToNumeric = (value: string | number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("low")) return 20;
  if (normalized.includes("medium")) return 55;
  if (normalized.includes("high")) return 85;

  const fallback = Number(value);
  return Number.isFinite(fallback) ? fallback : 55;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const safeFinite = (value: number, fallback: number): number => (Number.isFinite(value) ? value : fallback);

const stdSafe = (value: number): number => (Math.abs(value) < EPSILON ? 1 : value);

const mean = (values: number[]): number => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const stdev = (values: number[], avg: number): number => {
  if (!values.length) return 1;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return stdSafe(Math.sqrt(variance));
};

const denormalize = (value: number, avg: number, sd: number): number => value * sd + avg;

const movementLabel = (metric: TrendFactor["metric"], previous: number, latest: number): TrendFactor["movement"] => {
  const delta = latest - previous;

  if (Math.abs(delta) < 0.5) {
    return "neutral";
  }

  if (metric === "oilProduction") {
    const previousDistance = Math.abs(previous - 50);
    const latestDistance = Math.abs(latest - 50);
    if (Math.abs(previousDistance - latestDistance) < 0.5) return "neutral";
    return latestDistance < previousDistance ? "improved" : "worsened";
  }

  if (metric === "sensitivity") {
    return delta < 0 ? "improved" : "worsened";
  }

  return delta > 0 ? "improved" : "worsened";
};

const buildFactorExplanation = (
  metric: TrendFactor["metric"],
  movement: TrendFactor["movement"],
  delta: number,
  locale: TrendLocale
): string => {
  const absDelta = Math.abs(delta).toFixed(1);

  const copy = {
    en: {
      scoreInc: `Skin score increased by ${absDelta} points.`,
      scoreDec: `Skin score decreased by ${absDelta} points.`,
      scoreStable: "Skin score stayed almost unchanged.",
      hydInc: `Hydration improved by ${absDelta} points.`,
      hydDec: `Hydration dropped by ${absDelta} points.`,
      hydStable: "Hydration stayed stable.",
      oilInc: "Oil production moved closer to a balanced range.",
      oilDec: "Oil production moved away from a balanced range.",
      oilStable: "Oil production stayed close to its previous level.",
      sensInc: `Sensitivity improved (${absDelta} points lower).`,
      sensDec: `Sensitivity increased (${absDelta} points higher).`,
      sensStable: "Sensitivity stayed stable.",
    },
    fr: {
      scoreInc: `Le score de peau a augmente de ${absDelta} points.`,
      scoreDec: `Le score de peau a baisse de ${absDelta} points.`,
      scoreStable: "Le score de peau est reste presque stable.",
      hydInc: `L'hydratation a augmente de ${absDelta} points.`,
      hydDec: `L'hydratation a diminue de ${absDelta} points.`,
      hydStable: "L'hydratation est restee stable.",
      oilInc: "La production de sebum s'est rapprochee d'un niveau equilibre.",
      oilDec: "La production de sebum s'est eloignee d'un niveau equilibre.",
      oilStable: "La production de sebum est restee proche du niveau precedent.",
      sensInc: `La sensibilite s'est amelioree (${absDelta} points de moins).`,
      sensDec: `La sensibilite a augmente (${absDelta} points de plus).`,
      sensStable: "La sensibilite est restee stable.",
    },
    ar: {
      scoreInc: `ارتفع معدل البشرة بمقدار ${absDelta} نقطة.`,
      scoreDec: `انخفض معدل البشرة بمقدار ${absDelta} نقطة.`,
      scoreStable: "بقي معدل البشرة شبه مستقر.",
      hydInc: `تحسن الترطيب بمقدار ${absDelta} نقطة.`,
      hydDec: `انخفض الترطيب بمقدار ${absDelta} نقطة.`,
      hydStable: "بقي الترطيب مستقرا.",
      oilInc: "اقترب إفراز الزيوت من النطاق المتوازن.",
      oilDec: "ابتعد إفراز الزيوت عن النطاق المتوازن.",
      oilStable: "بقي إفراز الزيوت قريبا من المستوى السابق.",
      sensInc: `تحسنت الحساسية (انخفاض ${absDelta} نقطة).`,
      sensDec: `زادت الحساسية (ارتفاع ${absDelta} نقطة).`,
      sensStable: "بقيت الحساسية مستقرة.",
    },
  }[locale];

  if (metric === "score") {
    if (movement === "improved") return copy.scoreInc;
    if (movement === "worsened") return copy.scoreDec;
    return copy.scoreStable;
  }

  if (metric === "hydration") {
    if (movement === "improved") return copy.hydInc;
    if (movement === "worsened") return copy.hydDec;
    return copy.hydStable;
  }

  if (metric === "oilProduction") {
    if (movement === "improved") return copy.oilInc;
    if (movement === "worsened") return copy.oilDec;
    return copy.oilStable;
  }

  if (movement === "improved") return copy.sensInc;
  if (movement === "worsened") return copy.sensDec;
  return copy.sensStable;
};

const buildRecommendations = (factors: TrendFactor[], direction: TrendDirection, locale: TrendLocale): string[] => {
  const output: string[] = [];

  const dominantNegative = factors
    .filter((factor) => factor.movement === "worsened")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2);

  if (dominantNegative.some((factor) => factor.metric === "hydration")) {
    output.push(
      locale === "fr"
        ? "Renforcez la constance d'hydratation: augmentez l'apport en eau et appliquez une creme barriere chaque jour."
        : locale === "ar"
          ? "عززي ثبات الترطيب: زيدي شرب الماء واستخدمي مرطبا داعما للحاجز يوميا."
          : "Strengthen hydration consistency: increase water intake and use barrier-supporting moisturizers daily."
    );
  }

  if (dominantNegative.some((factor) => factor.metric === "oilProduction")) {
    output.push(
      locale === "fr"
        ? "Reequilibrez doucement le sebum: evitez le sur-nettoyage et gardez des produits non comedogenes constants."
        : locale === "ar"
          ? "أعيدي توازن الزيوت بلطف: تجنبي التنظيف المفرط وحافظي على منتجات غير كوميدوغينيك بشكل ثابت."
          : "Rebalance sebum gently: avoid over-cleansing and keep non-comedogenic products consistent."
    );
  }

  if (dominantNegative.some((factor) => factor.metric === "sensitivity")) {
    output.push(
      locale === "fr"
        ? "Reduisez la charge d'irritation: simplifiez les actifs et privilegiez les soins apaisants pendant 1-2 semaines."
        : locale === "ar"
          ? "خففي مسببات التهيج: بسطي المواد الفعالة وركزي على المنتجات المهدئة لمدة 1-2 أسبوع."
          : "Reduce irritation load: simplify active ingredients and prioritize soothing products for 1-2 weeks."
    );
  }

  if (dominantNegative.some((factor) => factor.metric === "score")) {
    output.push(
      locale === "fr"
        ? "Maintenez une bonne adherence a la routine: sommeil stable, gestion du stress et protection solaire reguliere."
        : locale === "ar"
          ? "حافظي على الالتزام بالروتين: نوم منتظم، تقليل التوتر، واستخدام واقي الشمس باستمرار."
          : "Keep routine adherence high: stable sleep, stress control, and regular sunscreen use can recover the global score."
    );
  }

  if (output.length === 0 && direction === "improving") {
    output.push(
      locale === "fr"
        ? "La tendance est positive: gardez une routine stable et evitez d'introduire plusieurs nouveaux produits en meme temps."
        : locale === "ar"
          ? "الاتجاه إيجابي: حافظي على روتين ثابت وتجنبي إدخال عدة منتجات جديدة دفعة واحدة."
          : "Current trend is positive: keep your routine stable and avoid introducing multiple new products at once."
    );
  }

  if (output.length === 0) {
    output.push(
      locale === "fr"
        ? "La tendance est globalement stable: continuez le suivi et comparez apres la prochaine analyse."
        : locale === "ar"
          ? "الاتجاه مستقر غالبا: واصلي المتابعة وقارني بعد التحليل القادم."
          : "Trend is mostly stable: continue monitoring and compare again after your next analysis."
    );
  }

  return output;
};

const metricLabel = (metric: TrendFactor["metric"], locale: TrendLocale): string => {
  if (metric === "oilProduction") {
    if (locale === "fr") return "equilibre du sebum";
    if (locale === "ar") return "توازن الزيوت";
    return "oil balance";
  }
  if (metric === "hydration") {
    if (locale === "fr") return "hydratation";
    if (locale === "ar") return "الترطيب";
    return "hydration";
  }
  if (metric === "sensitivity") {
    if (locale === "fr") return "sensibilite";
    if (locale === "ar") return "الحساسية";
    return "sensitivity";
  }
  if (locale === "fr") return "score global";
  if (locale === "ar") return "النتيجة العامة";
  return "overall score";
};

const buildDriverMechanism = (
  metric: TrendFactor["metric"],
  movement: TrendFactor["movement"],
  locale: TrendLocale
): string => {
  if (metric === "hydration") {
    if (locale === "fr") return movement === "improved" ? "La barriere cutanee semble mieux preservee." : "La barriere cutanee semble fragilisee ou insuffisamment hydratee.";
    if (locale === "ar") return movement === "improved" ? "يبدو أن حاجز البشرة أصبح أكثر استقرارا." : "يبدو أن حاجز البشرة أصبح أضعف أو أقل ترطيبا.";
    return movement === "improved" ? "The skin barrier appears more stable and better supported." : "The skin barrier appears weaker or under-hydrated.";
  }

  if (metric === "oilProduction") {
    if (locale === "fr") return movement === "improved" ? "La secretion sebacee se rapproche d'une zone d'equilibre." : "La secretion sebacee s'eloigne de l'equilibre physiologique.";
    if (locale === "ar") return movement === "improved" ? "إفراز الزيوت يقترب من النطاق المتوازن." : "إفراز الزيوت يبتعد عن التوازن الطبيعي.";
    return movement === "improved" ? "Sebum production moved closer to a balanced physiological range." : "Sebum production moved away from the balanced physiological range.";
  }

  if (metric === "sensitivity") {
    if (locale === "fr") return movement === "improved" ? "La reactivite cutanee diminue, signe d'une meilleure tolerance." : "La reactivite cutanee augmente, possiblement liee a une irritation cumulative.";
    if (locale === "ar") return movement === "improved" ? "انخفضت تفاعلية البشرة مما يشير إلى تحمل أفضل." : "زادت تفاعلية البشرة وربما يرتبط ذلك بتهيج تراكمي.";
    return movement === "improved" ? "Skin reactivity decreased, suggesting better tolerance." : "Skin reactivity increased, which can indicate cumulative irritation.";
  }

  if (locale === "fr") return movement === "improved" ? "L'ensemble des indicateurs convergent vers une amelioration clinique." : "L'ensemble des indicateurs convergent vers une degradation clinique.";
  if (locale === "ar") return movement === "improved" ? "المؤشرات العامة تتجه نحو تحسن واضح." : "المؤشرات العامة تتجه نحو تراجع واضح.";
  return movement === "improved" ? "Global indicators converge toward clinical improvement." : "Global indicators converge toward clinical decline.";
};

const buildEvidence = (metric: TrendFactor["metric"], delta: number, impact: number, locale: TrendLocale): string => {
  const signed = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
  if (locale === "fr") return `Variation ${signed} (${metricLabel(metric, locale)}), impact relatif ${impact.toFixed(2)}x.`;
  if (locale === "ar") return `التغير ${signed} في ${metricLabel(metric, locale)}، وتأثير نسبي ${impact.toFixed(2)}x.`;
  return `Change ${signed} on ${metricLabel(metric, locale)}, relative impact ${impact.toFixed(2)}x.`;
};

const buildClarityLayer = (
  locale: TrendLocale,
  direction: TrendDirection,
  confidence: number,
  scoreDelta: number,
  topImprove: TrendDriver | undefined,
  topDecline: TrendDriver | undefined,
  recommendations: string[]
) => {
  const confidenceLabel =
    confidence >= 0.75
      ? locale === "fr"
        ? "Confiance elevee"
        : locale === "ar"
          ? "موثوقية عالية"
          : "High confidence"
      : confidence >= 0.45
        ? locale === "fr"
          ? "Confiance moyenne"
          : locale === "ar"
            ? "موثوقية متوسطة"
            : "Medium confidence"
        : locale === "fr"
          ? "Confiance moderee"
          : locale === "ar"
            ? "موثوقية محدودة"
            : "Lower confidence";

  const riskLevel: "low" | "medium" | "high" =
    direction === "declining" && scoreDelta < -6
      ? "high"
      : direction === "declining"
        ? "medium"
        : direction === "stable"
          ? "low"
          : "low";

  let headline = "";
  let plainWhy = "";

  if (locale === "fr") {
    if (direction === "improving") {
      headline = `Bonne nouvelle: votre peau s'ameliore (+${scoreDelta.toFixed(1)}).`;
      plainWhy = topImprove
        ? `La principale raison est l'amelioration de ${metricLabel(topImprove.metric, locale)}.`
        : "Plusieurs indicateurs progressent en meme temps.";
    } else if (direction === "declining") {
      headline = `Attention: la tendance est en recul (${Math.abs(scoreDelta).toFixed(1)}).`;
      plainWhy = topDecline
        ? `La cause la plus probable est la deterioration de ${metricLabel(topDecline.metric, locale)}.`
        : "Une baisse combinee de plusieurs indicateurs est observee.";
    } else {
      headline = "Votre peau est globalement stable.";
      plainWhy = "Les variations recentes restent faibles et sans rupture majeure.";
    }
  } else if (locale === "ar") {
    if (direction === "improving") {
      headline = `خبر جيد: بشرتك تتحسن (+${scoreDelta.toFixed(1)}).`;
      plainWhy = topImprove
        ? `السبب الأقوى هو تحسن ${metricLabel(topImprove.metric, locale)}.`
        : "عدة مؤشرات تتحسن معا.";
    } else if (direction === "declining") {
      headline = `تنبيه: الاتجاه يتراجع (${Math.abs(scoreDelta).toFixed(1)}).`;
      plainWhy = topDecline
        ? `السبب الأرجح هو تراجع ${metricLabel(topDecline.metric, locale)}.`
        : "يوجد انخفاض مشترك في أكثر من مؤشر.";
    } else {
      headline = "بشرتك مستقرة بشكل عام.";
      plainWhy = "التغيرات الأخيرة طفيفة ولا توجد قفزة سلبية واضحة.";
    }
  } else {
    if (direction === "improving") {
      headline = `Good news: your skin is improving (+${scoreDelta.toFixed(1)}).`;
      plainWhy = topImprove
        ? `The strongest reason is better ${metricLabel(topImprove.metric, locale)}.`
        : "Several indicators are improving together.";
    } else if (direction === "declining") {
      headline = `Attention: trend is declining (${Math.abs(scoreDelta).toFixed(1)}).`;
      plainWhy = topDecline
        ? `The most likely reason is worse ${metricLabel(topDecline.metric, locale)}.`
        : "Multiple indicators dropped at the same time.";
    } else {
      headline = "Your skin is broadly stable.";
      plainWhy = "Recent variation is small with no major negative shift.";
    }
  }

  const thisWeekPlan = recommendations.slice(0, 3);

  if (confidence < 0.5) {
    const caution =
      locale === "fr"
        ? "Interpretez ce resultat avec prudence: davantage d'analyses amelioreront la fiabilite."
        : locale === "ar"
          ? "فسري هذه النتيجة بحذر: زيادة عدد التحليلات سترفع الموثوقية."
          : "Interpret this result with caution: more analyses will improve reliability.";
    plainWhy = `${plainWhy} ${caution}`.trim();
  }

  return {
    headline,
    plainWhy,
    riskLevel,
    confidenceLabel,
    thisWeekPlan,
  };
};

const buildFeatureVector = (
  current: [number, number, number, number],
  previous?: [number, number, number, number]
): number[] => {
  const prev = previous || current;
  return [
    current[0],
    current[1],
    current[2],
    current[3],
    current[0] - prev[0],
    current[1] - prev[1],
    current[2] - prev[2],
    current[3] - prev[3],
  ];
};

const buildTrainingRows = (metrics: [number, number, number, number][]): TrainingRow[] => {
  const rows: TrainingRow[] = [];

  // Predict next score from current metrics + short-term deltas.
  for (let i = 1; i < metrics.length - 1; i += 1) {
    const previous = metrics[i - 1];
    const current = metrics[i];
    const next = metrics[i + 1];

    rows.push({
      x: buildFeatureVector(current, previous),
      y: next[0],
    });
  }

  return rows;
};

const getMetricStep = (metric: TrendFactor["metric"]): number => {
  if (metric === "score") return 2;
  if (metric === "hydration") return 3;
  if (metric === "oilProduction") return 3;
  return 3;
};

const calcSlope = (scores: number[]): number => {
  if (scores.length < 2) return 0;
  const x = Array.from({ length: scores.length }, (_, index) => index);
  const xMean = mean(x);
  const yMean = mean(scores);
  let num = 0;
  let den = 0;
  for (let i = 0; i < scores.length; i += 1) {
    num += (x[i] - xMean) * (scores[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
};

const buildShortSeriesInsight = (
  metrics: [number, number, number, number][],
  locale: TrendLocale
): TrendInsight => {
  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];
  const earlier = metrics.length > 2 ? metrics[metrics.length - 3] : previous;
  const latestScoreDelta = latest[0] - previous[0];
  const previousScoreDelta = previous[0] - earlier[0];
  const scoreDelta = latestScoreDelta * 0.7 + previousScoreDelta * 0.3;

  let direction: TrendDirection = "stable";
  if (scoreDelta > SCORE_DELTA_THRESHOLD) direction = "improving";
  else if (scoreDelta < -SCORE_DELTA_THRESHOLD) direction = "declining";

  const factorNames: TrendFactor["metric"][] = ["score", "hydration", "oilProduction", "sensitivity"];

  const rawImpacts = factorNames.map((metric, index) => {
    const deltaNow = (latest[index] ?? 0) - (previous[index] ?? 0);
    const deltaPrev = (previous[index] ?? 0) - (earlier[index] ?? 0);
    const blendedDeltaMagnitude = Math.abs(deltaNow) * 0.7 + Math.abs(deltaPrev) * 0.3;
    const scale = getMetricStep(metric);
    return blendedDeltaMagnitude / Math.max(scale, 1);
  });
  const maxImpact = Math.max(...rawImpacts, EPSILON);

  const factors: TrendFactor[] = factorNames.map((metric, index) => {
    const prevValue = previous[index] ?? 0;
    const latestValue = latest[index] ?? 0;
    const delta = latestValue - prevValue;
    const movement = movementLabel(metric, prevValue, latestValue);
    return {
      metric,
      delta,
      impact: Number((rawImpacts[index] / maxImpact).toFixed(2)),
      movement,
      explanation: buildFactorExplanation(metric, movement, delta, locale),
    };
  });

  const improvedFactors = factors
    .filter((factor) => factor.movement === "improved")
    .sort((a, b) => b.impact - a.impact);

  const worsenedFactors = factors
    .filter((factor) => factor.movement === "worsened")
    .sort((a, b) => b.impact - a.impact);

  const improvementDrivers: TrendDriver[] = improvedFactors.map((factor) => ({
    metric: factor.metric,
    weight: factor.impact,
    direction: "improvement",
    short: factor.explanation,
    mechanism: buildDriverMechanism(factor.metric, factor.movement, locale),
    evidence: buildEvidence(factor.metric, factor.delta, factor.impact, locale),
  }));

  const declineDrivers: TrendDriver[] = worsenedFactors.map((factor) => ({
    metric: factor.metric,
    weight: factor.impact,
    direction: "decline",
    short: factor.explanation,
    mechanism: buildDriverMechanism(factor.metric, factor.movement, locale),
    evidence: buildEvidence(factor.metric, factor.delta, factor.impact, locale),
  }));

  const topImprove = improvementDrivers[0];
  const topDecline = declineDrivers[0];

  const why =
    direction === "improving"
      ? topImprove
        ? topImprove.mechanism
        : locale === "fr"
          ? "Une amelioration moderee est observee sur la derniere transition."
          : locale === "ar"
            ? "يوجد تحسن معتدل في آخر انتقال."
            : "A moderate improvement is observed in the latest transition."
      : direction === "declining"
        ? topDecline
          ? topDecline.mechanism
          : locale === "fr"
            ? "Une deterioration moderee est observee sur la derniere transition."
            : locale === "ar"
              ? "يوجد تراجع معتدل في آخر انتقال."
              : "A moderate decline is observed in the latest transition."
        : locale === "fr"
          ? "Les deux dernieres analyses restent proches, sans variation forte."
          : locale === "ar"
            ? "آخر تحليلين متقاربان بدون تغير قوي."
            : "The latest two analyses are close, with no major shift.";

  const summary =
    direction === "declining"
      ? locale === "fr"
        ? `Tendance en baisse (${Math.abs(scoreDelta).toFixed(1)} points sur la derniere transition).`
        : locale === "ar"
          ? `الاتجاه في تراجع (${Math.abs(scoreDelta).toFixed(1)} نقطة في آخر انتقال).`
          : `Trend is declining (${Math.abs(scoreDelta).toFixed(1)} points on the latest transition).`
      : direction === "improving"
        ? locale === "fr"
          ? `Tendance en amelioration (+${scoreDelta.toFixed(1)} points sur la derniere transition).`
          : locale === "ar"
            ? `الاتجاه يتحسن (+${scoreDelta.toFixed(1)} نقطة في آخر انتقال).`
            : `Trend is improving (+${scoreDelta.toFixed(1)} points on the latest transition).`
        : locale === "fr"
          ? "Tendance globalement stable sur la derniere transition."
          : locale === "ar"
            ? "الاتجاه مستقر إجمالا في آخر انتقال."
            : "Trend is broadly stable on the latest transition.";

  const recommendations = buildRecommendations(factors, direction, locale);
  const transitions = metrics.length - 1;
  const confidence = clamp01(
    0.2 +
    Math.min(transitions / 10, 0.2) +
    Math.min(Math.abs(scoreDelta) / 20, 0.16) +
    Math.min(Math.abs(previousScoreDelta) / 24, 0.1)
  );
  const clarity = buildClarityLayer(
    locale,
    direction,
    confidence,
    Number(scoreDelta.toFixed(1)),
    topImprove,
    topDecline,
    recommendations
  );

  return {
    direction,
    scoreDelta: Number(scoreDelta.toFixed(1)),
    slope: Number(calcSlope(metrics.map((row) => row[0])).toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    summary,
    why,
    factors,
    improvementDrivers,
    declineDrivers,
    clarity,
    recommendations,
    model: {
      samples: Math.max(metrics.length - 2, 1),
      epochs: 0,
      finalLoss: 0,
      predictedNextScore: Number((latest[0] + scoreDelta).toFixed(1)),
    },
  };
};

export const analyzeUserTrendWithTensorflow = async (
  points: TrendInputPoint[],
  rawLocale?: string,
  optionsOrCacheKey?: string | TrendAnalyzeOptions
): Promise<TrendInsight | null> => {
  if (!Array.isArray(points) || points.length < 3) {
    return null;
  }

  const locale = resolveLocale(rawLocale);

  const options = parseAnalyzeOptions(optionsOrCacheKey);
  const { cacheKey, pretrainedArtifact, disableTraining } = options;

  const metrics = toMetrics(points);

  const trainingRows = buildTrainingRows(metrics);
  if (trainingRows.length < 2) {
    return buildShortSeriesInsight(metrics, locale);
  }

  const signature = buildPointsSignature(points);
  const xCols = trainingRows[0].x.length;
  let model: tf.Sequential;
  let xMeans: number[];
  let xStds: number[];
  let yMean: number;
  let yStd: number;
  let finalLoss = 1;
  let trainedEpochs = TRAIN_EPOCHS;
  let shouldDisposeModel = false;

  const cached = cacheKey && !pretrainedArtifact ? trendModelCache.get(cacheKey) : undefined;
  const canUseCachedModel =
    Boolean(cached) &&
    Boolean(cacheKey) &&
    cached?.signature === signature;

  if (pretrainedArtifact) {
    if (pretrainedArtifact.inputCols !== xCols || pretrainedArtifact.xMeans.length !== xCols) {
      return null;
    }

    model = modelFromArtifact(pretrainedArtifact);
    xMeans = pretrainedArtifact.xMeans;
    xStds = pretrainedArtifact.xStds;
    yMean = pretrainedArtifact.yMean;
    yStd = pretrainedArtifact.yStd;
    finalLoss = pretrainedArtifact.finalLoss;
    trainedEpochs = pretrainedArtifact.epochs;
    shouldDisposeModel = true;
  } else if (canUseCachedModel && cached) {
    model = cached.model;
    xMeans = cached.xMeans;
    xStds = cached.xStds;
    yMean = cached.yMean;
    yStd = cached.yStd;
    finalLoss = cached.finalLoss;
    trainedEpochs = cached.epochs;
  } else {
    if (disableTraining) {
      return null;
    }

    xMeans = Array.from({ length: xCols }, (_, col) => mean(trainingRows.map((row) => row.x[col])));
    xStds = Array.from({ length: xCols }, (_, col) => stdev(trainingRows.map((row) => row.x[col]), xMeans[col]));

    const yValues = trainingRows.map((row) => row.y);
    yMean = mean(yValues);
    yStd = stdev(yValues, yMean);

    const xNorm = trainingRows.map((row) => row.x.map((value, col) => (value - xMeans[col]) / xStds[col]));
    const yNorm = yValues.map((value) => (value - yMean) / yStd);

    const xs = tf.tensor2d(xNorm);
    const ys = tf.tensor2d(yNorm, [yNorm.length, 1]);

    model = createCompiledTrendModel(xCols);

    const validationSplit = trainingRows.length >= 8 ? 0.2 : 0;
    const history = await model.fit(xs, ys, {
      epochs: TRAIN_EPOCHS,
      batchSize: Math.min(8, trainingRows.length),
      shuffle: true,
      validationSplit,
      verbose: 0,
      callbacks: validationSplit > 0
        ? [tf.callbacks.earlyStopping({ monitor: "val_loss", patience: 12 })]
        : undefined,
    });

    finalLoss = safeFinite(Number(history.history.loss?.slice(-1)[0] ?? 1), 1);
    trainedEpochs = Number(history.epoch.length || TRAIN_EPOCHS);

    if (cacheKey) {
      const previous = trendModelCache.get(cacheKey);
      if (previous) {
        previous.model.dispose();
      }

      trendModelCache.set(cacheKey, {
        signature,
        model,
        xMeans,
        xStds,
        yMean,
        yStd,
        finalLoss,
        epochs: trainedEpochs,
      });
    }

    xs.dispose();
    ys.dispose();

    if (!cacheKey) {
      shouldDisposeModel = true;
    }
  }

  const latest = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];
  const latestFeatures = buildFeatureVector(latest, previous);

  const predictNextScore = (features: number[]): number => {
    return tf.tidy(() => {
      const norm = features.map((value, col) => (value - xMeans[col]) / xStds[col]);
      const prediction = model.predict(tf.tensor2d([norm])) as tf.Tensor;
      const predNorm = prediction.dataSync()[0];
      return denormalize(predNorm, yMean, yStd);
    });
  };

  const predictedNextScore = predictNextScore(latestFeatures);
  const scoreDelta = latest[0] - previous[0];
  const expectedDelta = predictedNextScore - latest[0];
  const sampleTrust = clamp01((trainingRows.length - 1) / 12);
  const modelTrust = clamp01(1 / (1 + Math.max(0, finalLoss)));
  const modelWeight = clamp(0.15 + 0.55 * sampleTrust * modelTrust, 0.15, 0.7);
  const observedWeight = 1 - modelWeight;
  const blendedDelta = scoreDelta * observedWeight + expectedDelta * modelWeight;

  let direction: TrendDirection = "stable";
  if (blendedDelta > SCORE_DELTA_THRESHOLD) direction = "improving";
  else if (blendedDelta < -SCORE_DELTA_THRESHOLD) direction = "declining";

  const confidence = clamp01(
    (0.2 +
      Math.min(trainingRows.length / 30, 0.28) +
      Math.min(Math.abs(blendedDelta) / 24, 0.18) +
      0.24 * modelTrust) *
      (trainingRows.length < 6 ? 0.85 : 1)
  );

  const slope = calcSlope(metrics.map((row) => row[0]));

  const factorNames: TrendFactor["metric"][] = ["score", "hydration", "oilProduction", "sensitivity"];
  const influenceRaw: number[] = factorNames.map((metric, metricIndex) => {
    const plus = [...latestFeatures];
    const minus = [...latestFeatures];
    const step = getMetricStep(metric);
    plus[metricIndex] += step;
    minus[metricIndex] -= step;
    const predPlus = predictNextScore(plus);
    const predMinus = predictNextScore(minus);
    return Math.abs((predPlus - predMinus) / (2 * step));
  });

  const influenceMax = Math.max(...influenceRaw, EPSILON);

  const factors: TrendFactor[] = factorNames.map((metric, index) => {
    const prevValue = previous[index] ?? 0;
    const latestValue = latest[index] ?? 0;
    const delta = latestValue - prevValue;
    const movement = movementLabel(metric, prevValue, latestValue);
    const deltaStrength = Math.min(Math.abs(delta) / Math.max(getMetricStep(metric), 1), 2);
    const weightedImpact = influenceRaw[index] * (0.65 + 0.35 * deltaStrength);

    return {
      metric,
      delta,
      impact: Number((weightedImpact / influenceMax).toFixed(2)),
      movement,
      explanation: buildFactorExplanation(metric, movement, delta, locale),
    };
  });

  const improvedFactors = factors
    .filter((factor) => factor.movement === "improved")
    .sort((a, b) => b.impact - a.impact);

  const worsenedFactors = factors
    .filter((factor) => factor.movement === "worsened")
    .sort((a, b) => b.impact - a.impact);

  const improvementDrivers: TrendDriver[] = improvedFactors.map((factor) => ({
    metric: factor.metric,
    weight: factor.impact,
    direction: "improvement",
    short: factor.explanation,
    mechanism: buildDriverMechanism(factor.metric, factor.movement, locale),
    evidence: buildEvidence(factor.metric, factor.delta, factor.impact, locale),
  }));

  const declineDrivers: TrendDriver[] = worsenedFactors.map((factor) => ({
    metric: factor.metric,
    weight: factor.impact,
    direction: "decline",
    short: factor.explanation,
    mechanism: buildDriverMechanism(factor.metric, factor.movement, locale),
    evidence: buildEvidence(factor.metric, factor.delta, factor.impact, locale),
  }));

  const negativeDrivers = factors
    .filter((factor) => factor.movement === "worsened")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2)
    .map((factor) => factor.metric);

  const positiveDrivers = factors
    .filter((factor) => factor.movement === "improved")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 2)
    .map((factor) => factor.metric);

  const prettify = (metric: string) => {
    if (metric === "oilProduction") {
      if (locale === "fr") return "l'equilibre du sebum";
      if (locale === "ar") return "توازن الزيوت";
      return "oil balance";
    }
    if (metric === "score") {
      if (locale === "fr") return "le score";
      if (locale === "ar") return "النتيجة";
      return "score";
    }
    if (metric === "hydration") {
      if (locale === "fr") return "l'hydratation";
      if (locale === "ar") return "الترطيب";
      return "hydration";
    }
    if (metric === "sensitivity") {
      if (locale === "fr") return "la sensibilite";
      if (locale === "ar") return "الحساسية";
      return "sensitivity";
    }
    return metric;
  };

  let why =
    locale === "fr"
      ? "Aucun changement majeur n'a ete detecte entre les deux dernieres analyses."
      : locale === "ar"
        ? "لم يتم اكتشاف تغيير كبير بين آخر تحليلين."
        : "No major behavioral change was detected between the latest two analyses.";
  if (direction === "declining" && negativeDrivers.length > 0) {
    why =
      locale === "fr"
        ? `La baisse est principalement liee a ${negativeDrivers.map(prettify).join(" et ")}.`
        : locale === "ar"
          ? `يرتبط الانخفاض بشكل أساسي بـ ${negativeDrivers.map(prettify).join(" و ")}.`
          : `The drop is mostly linked to ${negativeDrivers.map(prettify).join(" and ")}.`;
  } else if (direction === "improving" && positiveDrivers.length > 0) {
    why =
      locale === "fr"
        ? `L'amelioration est principalement due a ${positiveDrivers.map(prettify).join(" et ")}.`
        : locale === "ar"
          ? `التحسن يعود أساسا إلى ${positiveDrivers.map(prettify).join(" و ")}.`
          : `The improvement is mainly driven by better ${positiveDrivers.map(prettify).join(" and ")}.`;
  } else if (direction === "stable") {
    why =
      locale === "fr"
        ? "Vos derniers indicateurs ont peu bouge, la tendance globale reste stable."
        : locale === "ar"
          ? "تحركت مؤشراتك الأخيرة بشكل طفيف، لذلك يبقى الاتجاه العام مستقرا."
          : "Your latest indicators moved only slightly, so the global trend remains stable.";
  }

  const summary =
    direction === "declining"
      ? locale === "fr"
        ? `La tendance de votre peau est en baisse (${Math.abs(blendedDelta).toFixed(1)} points).`
        : locale === "ar"
          ? `اتجاه بشرتك يتراجع (${Math.abs(blendedDelta).toFixed(1)} نقطة).`
          : `Your skin trend is declining (${Math.abs(blendedDelta).toFixed(1)} points).`
      : direction === "improving"
        ? locale === "fr"
          ? `La tendance de votre peau s'ameliore (+${blendedDelta.toFixed(1)} points).`
          : locale === "ar"
            ? `اتجاه بشرتك يتحسن (+${blendedDelta.toFixed(1)} نقطة).`
            : `Your skin trend is improving (+${blendedDelta.toFixed(1)} points).`
        : locale === "fr"
          ? "La tendance de votre peau est actuellement stable."
          : locale === "ar"
            ? "اتجاه بشرتك مستقر حاليا."
            : "Your skin trend is currently stable.";

  const recommendations = buildRecommendations(factors, direction, locale);
  const clarity = buildClarityLayer(
    locale,
    direction,
    confidence,
    Number(blendedDelta.toFixed(1)),
    improvementDrivers[0],
    declineDrivers[0],
    recommendations
  );

  if (shouldDisposeModel) {
    model.dispose();
  }

  return {
    direction,
    scoreDelta: Number(blendedDelta.toFixed(1)),
    slope: Number(slope.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    summary,
    why,
    factors,
    improvementDrivers,
    declineDrivers,
    clarity,
    recommendations,
    model: {
      samples: trainingRows.length,
      epochs: trainedEpochs,
      finalLoss: Number(finalLoss.toFixed(4)),
      predictedNextScore: Number(predictedNextScore.toFixed(1)),
    },
  };
};
