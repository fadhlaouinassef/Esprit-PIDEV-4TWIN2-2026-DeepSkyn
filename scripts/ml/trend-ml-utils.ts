import prisma from "../../src/lib/prisma";
import {
  analyzeUserTrendWithTensorflow,
  SerializedTrendModelArtifact,
  TrendInputPoint,
} from "../../src/modele/analysisTrendModel";

export type AnalysisRow = {
  user_id: number;
  id: number;
  score: number;
  hydration: number;
  clarity: number;
  calmness: number;
  created_at: Date;
};

export type Metrics = {
  samples: number;
  mae: number;
  rmse: number;
  directionAccuracy: number;
};

type UserSeriesContext = {
  userId: number;
  fullDesc: TrendInputPoint[];
  testCount: number;
  valCount: number;
  trainStart: number;
};

type Bounds = {
  min: number;
  max: number;
};

type FeatureBounds = {
  score: Bounds;
  hydration: Bounds;
  oilProduction: Bounds;
  sensitivity: Bounds;
};

export type PreparedDataset = {
  contexts: UserSeriesContext[];
  trainSeries: TrendInputPoint[][];
  valSeriesCount: number;
  testSeriesCount: number;
};

const hardClamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const quantile = (values: number[], q: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

const iqrBounds = (values: number[], hard: Bounds): Bounds => {
  if (values.length < 4) return hard;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return {
    min: hardClamp(low, hard.min, hard.max),
    max: hardClamp(high, hard.min, hard.max),
  };
};

const toSensitivityNumeric = (value: string | number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("low")) return 20;
  if (normalized.includes("medium")) return 55;
  if (normalized.includes("high")) return 85;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 55;
};

const buildPoint = (row: AnalysisRow): TrendInputPoint => ({
  id: row.id,
  score: Number(row.score),
  hydration: Number(row.hydration),
  oilProduction: Math.round(100 - Number(row.clarity || 0)),
  sensitivity: Number(row.calmness || 0) < 50 ? "High" : Number(row.calmness || 0) < 75 ? "Medium" : "Low",
  date: row.created_at.toISOString(),
});

export const toSign = (value: number): number => {
  if (value > 2) return 1;
  if (value < -2) return -1;
  return 0;
};

export const fetchAnalysisRows = async (): Promise<AnalysisRow[]> => {
  return await prisma.skinScoreAnalysis.findMany({
    where: { trigger: "final" },
    select: {
      user_id: true,
      id: true,
      score: true,
      hydration: true,
      clarity: true,
      calmness: true,
      created_at: true,
    },
    orderBy: [{ user_id: "asc" }, { created_at: "desc" }],
  }) as AnalysisRow[];
};

const splitCounts = (n: number) => {
  const testCount = Math.max(1, Math.floor(n * 0.15));
  const valCount = Math.max(1, Math.floor(n * 0.15));
  const trainCount = n - testCount - valCount;
  return { testCount, valCount, trainCount };
};

const buildFeatureBounds = (trainPoints: TrendInputPoint[]): FeatureBounds => {
  const scores = trainPoints.map((p) => Number(p.score));
  const hydrations = trainPoints.map((p) => Number(p.hydration));
  const oils = trainPoints.map((p) => Number(p.oilProduction));
  const sensitivities = trainPoints.map((p) => toSensitivityNumeric(p.sensitivity));

  return {
    score: iqrBounds(scores, { min: 0, max: 100 }),
    hydration: iqrBounds(hydrations, { min: 0, max: 100 }),
    oilProduction: iqrBounds(oils, { min: 0, max: 100 }),
    sensitivity: iqrBounds(sensitivities, { min: 0, max: 100 }),
  };
};

const cleanPoint = (point: TrendInputPoint, bounds: FeatureBounds): TrendInputPoint => {
  const score = hardClamp(Number(point.score), bounds.score.min, bounds.score.max);
  const hydration = hardClamp(Number(point.hydration), bounds.hydration.min, bounds.hydration.max);
  const oilProduction = hardClamp(Number(point.oilProduction), bounds.oilProduction.min, bounds.oilProduction.max);
  const sensitivity = hardClamp(toSensitivityNumeric(point.sensitivity), bounds.sensitivity.min, bounds.sensitivity.max);

  return {
    ...point,
    score: Number(score.toFixed(3)),
    hydration: Number(hydration.toFixed(3)),
    oilProduction: Number(oilProduction.toFixed(3)),
    sensitivity: Number(sensitivity.toFixed(3)),
  };
};

export const prepareTemporalDataset = (rows: AnalysisRow[]): PreparedDataset => {
  const byUser = new Map<number, TrendInputPoint[]>();
  for (const row of rows) {
    const list = byUser.get(row.user_id) || [];
    list.push(buildPoint(row));
    byUser.set(row.user_id, list);
  }

  const rawContexts: UserSeriesContext[] = [];
  for (const [userId, fullDesc] of byUser.entries()) {
    const n = fullDesc.length;
    if (n < 8) continue;
    const { testCount, valCount, trainCount } = splitCounts(n);
    if (trainCount < 3) continue;

    rawContexts.push({
      userId,
      fullDesc,
      testCount,
      valCount,
      trainStart: testCount + valCount,
    });
  }

  const trainPointsPool = rawContexts.flatMap((ctx) => ctx.fullDesc.slice(ctx.trainStart));
  if (trainPointsPool.length < 3) {
    return {
      contexts: [],
      trainSeries: [],
      valSeriesCount: 0,
      testSeriesCount: 0,
    };
  }

  const bounds = buildFeatureBounds(trainPointsPool);

  const contexts = rawContexts.map((ctx) => ({
    ...ctx,
    fullDesc: ctx.fullDesc.map((point) => cleanPoint(point, bounds)),
  }));

  const trainSeries = contexts
    .map((ctx) => ctx.fullDesc.slice(ctx.trainStart))
    .filter((series) => series.length >= 3);

  const valSeriesCount = contexts.filter((ctx) => ctx.valCount > 0).length;
  const testSeriesCount = contexts.filter((ctx) => ctx.testCount > 0).length;

  return {
    contexts,
    trainSeries,
    valSeriesCount,
    testSeriesCount,
  };
};

const emptyMetrics = (): Metrics => ({
  samples: 0,
  mae: 0,
  rmse: 0,
  directionAccuracy: 0,
});

export const evaluateSplitMetrics = async (
  artifact: SerializedTrendModelArtifact,
  contexts: PreparedDataset["contexts"],
  split: "val" | "test"
): Promise<Metrics> => {
  let tested = 0;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let correctDirection = 0;

  for (const ctx of contexts) {
    const start = split === "test" ? 0 : ctx.testCount;
    const end = split === "test" ? ctx.testCount - 1 : ctx.testCount + ctx.valCount - 1;
    if (end < start) continue;

    for (let targetIdx = start; targetIdx <= end; targetIdx += 1) {
      const history = ctx.fullDesc.slice(targetIdx + 1);
      if (history.length < 3) continue;

      const actualLatest = Number(ctx.fullDesc[targetIdx].score);
      const previous = Number(ctx.fullDesc[targetIdx + 1]?.score);
      if (!Number.isFinite(previous)) continue;

      const insight = await analyzeUserTrendWithTensorflow(history, "en", {
        pretrainedArtifact: artifact,
        disableTraining: true,
      });

      if (!insight) continue;

      const predictedLatest = Number(insight.model.predictedNextScore);
      const error = predictedLatest - actualLatest;
      const predictedDelta = predictedLatest - previous;
      const actualDelta = actualLatest - previous;

      sumAbsError += Math.abs(error);
      sumSquaredError += error * error;
      tested += 1;

      if (toSign(predictedDelta) === toSign(actualDelta)) {
        correctDirection += 1;
      }
    }
  }

  if (!tested) return emptyMetrics();

  return {
    samples: tested,
    mae: sumAbsError / tested,
    rmse: Math.sqrt(sumSquaredError / tested),
    directionAccuracy: (correctDirection / tested) * 100,
  };
};

export const evaluateTemporalCrossValidation = async (
  artifact: SerializedTrendModelArtifact,
  contexts: PreparedDataset["contexts"],
  folds: number[] = [0.6, 0.7, 0.8]
): Promise<Metrics> => {
  let tested = 0;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let correctDirection = 0;

  for (const ctx of contexts) {
    const trainDesc = ctx.fullDesc.slice(ctx.trainStart);
    if (trainDesc.length < 6) continue;

    const trainAsc = [...trainDesc].reverse();

    for (const ratio of folds) {
      const targetAscIdx = Math.floor(trainAsc.length * ratio);
      if (targetAscIdx < 4 || targetAscIdx >= trainAsc.length) continue;

      const historyAsc = trainAsc.slice(0, targetAscIdx);
      const historyDesc = [...historyAsc].reverse();

      const actualLatest = Number(trainAsc[targetAscIdx].score);
      const previous = Number(trainAsc[targetAscIdx - 1].score);

      const insight = await analyzeUserTrendWithTensorflow(historyDesc, "en", {
        pretrainedArtifact: artifact,
        disableTraining: true,
      });

      if (!insight) continue;

      const predictedLatest = Number(insight.model.predictedNextScore);
      const error = predictedLatest - actualLatest;
      const predictedDelta = predictedLatest - previous;
      const actualDelta = actualLatest - previous;

      sumAbsError += Math.abs(error);
      sumSquaredError += error * error;
      tested += 1;

      if (toSign(predictedDelta) === toSign(actualDelta)) {
        correctDirection += 1;
      }
    }
  }

  if (!tested) return emptyMetrics();

  return {
    samples: tested,
    mae: sumAbsError / tested,
    rmse: Math.sqrt(sumSquaredError / tested),
    directionAccuracy: (correctDirection / tested) * 100,
  };
};

export const formatMetrics = (label: string, metrics: Metrics) => {
  return `${label} -> samples: ${metrics.samples}, MAE: ${metrics.mae.toFixed(4)}, RMSE: ${metrics.rmse.toFixed(4)}, direction: ${metrics.directionAccuracy.toFixed(2)}%`;
};
