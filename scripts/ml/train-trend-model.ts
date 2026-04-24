import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  analyzeUserTrendWithTensorflow,
  SerializedTrendModelArtifact,
  trainTrendModelArtifactFromSeries,
  TrendInputPoint,
} from "../../src/modele/analysisTrendModel";

type CsvRow = {
  age: number;
  gender: string;
  hydrationLevel: string;
  oilLevel: string;
  sensitivity: string;
  humidity: number;
  temperature: number;
  skinType: string;
};

type Metrics = {
  samples: number;
  mae: number;
  rmse: number;
  directionAccuracy: number;
};

type RunReport = {
  run: number;
  config: {
    hiddenLayers: number[];
    learningRate: number;
  };
  trainedAt: string;
  finalLoss: number;
  epochs: number;
  trainSeries: number;
  val: Metrics;
  temporalCv: Metrics;
};

type SegmentedMetrics = {
  skinType: Record<string, Metrics>;
  ageGroup: Record<string, Metrics>;
};

const getAgeGroup = (age: number): string => {
  if (age < 25) return "Under 25";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  return "45+";
};

const evaluateSegmentedMetrics = async (
  artifact: SerializedTrendModelArtifact,
  rows: CsvRow[]
): Promise<SegmentedMetrics> => {
  const result: SegmentedMetrics = {
    skinType: {},
    ageGroup: {},
  };

  const types = Array.from(new Set(rows.map(r => r.skinType)));
  const ages = ["Under 25", "25-34", "35-44", "45+"];

  for (const type of types) {
    const typeRows = rows.filter(r => r.skinType === type);
    const series = buildSeriesFromCsv(typeRows);
    result.skinType[type] = await evaluateSplitMetrics(artifact, series);
  }

  for (const age of ages) {
    const ageRows = rows.filter(r => getAgeGroup(r.age) === age);
    const series = buildSeriesFromCsv(ageRows);
    result.ageGroup[age] = await evaluateSplitMetrics(artifact, series);
  }

  return result;
};

const emptyMetrics = (): Metrics => ({
  samples: 0,
  mae: 0,
  rmse: 0,
  directionAccuracy: 0,
});

const formatMetrics = (label: string, metrics: Metrics): string => {
  return `${label} -> samples: ${metrics.samples}, MAE: ${metrics.mae.toFixed(4)}, RMSE: ${metrics.rmse.toFixed(4)}, direction: ${metrics.directionAccuracy.toFixed(2)}%`;
};

const toSign = (value: number): number => {
  if (value > 2) return 1;
  if (value < -2) return -1;
  return 0;
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const levelToNumeric = (value: string): number => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "low") return 25;
  if (normalized === "medium") return 55;
  if (normalized === "high") return 82;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 55;
};

const skinTypeToScore = (value: string): number => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "normal") return 82;
  if (normalized === "combination") return 64;
  if (normalized === "oily") return 52;
  if (normalized === "dry") return 38;
  return 58;
};

const parseCsvRows = async (filePath: string): Promise<CsvRow[]> => {
  const raw = await readFile(filePath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: CsvRow[] = [];

  const col = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const ageCol = col("Age");
  const genderCol = col("Gender");
  const hydrationCol = col("Hydration_Level");
  const oilCol = col("Oil_Level");
  const sensitivityCol = col("Sensitivity");
  const humidityCol = col("Humidity");
  const temperatureCol = col("Temperature");
  const skinTypeCol = col("Skin_Type");

  const required = [ageCol, genderCol, hydrationCol, oilCol, sensitivityCol, humidityCol, temperatureCol, skinTypeCol];
  if (required.some((idx) => idx < 0)) {
    throw new Error("Skin_Type.csv is missing one or more required columns.");
  }

  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);

    const age = Number(cols[ageCol]);
    const humidity = Number(cols[humidityCol]);
    const temperature = Number(cols[temperatureCol]);

    if (!Number.isFinite(age) || !Number.isFinite(humidity) || !Number.isFinite(temperature)) {
      continue;
    }

    rows.push({
      age,
      gender: cols[genderCol] || "",
      hydrationLevel: cols[hydrationCol] || "",
      oilLevel: cols[oilCol] || "",
      sensitivity: cols[sensitivityCol] || "",
      humidity,
      temperature,
      skinType: cols[skinTypeCol] || "",
    });
  }

  return rows;
};

const rowToPoint = (row: CsvRow, idx: number, seriesId: number): TrendInputPoint => {
  const hydration = levelToNumeric(row.hydrationLevel);
  const oilProduction = levelToNumeric(row.oilLevel);
  const sensitivity = levelToNumeric(row.sensitivity);
  const environmentPenalty = Math.max(0, row.temperature - 28) * 0.6 + Math.max(0, 35 - row.humidity) * 0.35;
  const agePenalty = Math.max(0, row.age - 40) * 0.25;
  const baseScore = skinTypeToScore(row.skinType);

  const score = Math.max(0, Math.min(100, baseScore + (hydration - 55) * 0.08 - (oilProduction - 55) * 0.04 - agePenalty - environmentPenalty));

  return {
    id: `${seriesId}-${idx}`,
    score: Number(score.toFixed(3)),
    hydration,
    oilProduction,
    sensitivity,
    date: new Date(Date.UTC(2024, 0, 1 + idx)).toISOString(),
  };
};

const buildSeriesFromCsv = (rows: CsvRow[]): TrendInputPoint[][] => {
  const sorted = [...rows].sort((a, b) => {
    if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
    return a.age - b.age;
  });

  const chunkSize = Number(process.env.ML_SERIES_LENGTH || 14);
  const stride = Number(process.env.ML_SERIES_STRIDE || 7);
  const series: TrendInputPoint[][] = [];

  for (let start = 0, seriesId = 1; start < sorted.length; start += Math.max(1, stride), seriesId += 1) {
    const chunk = sorted.slice(start, start + Math.max(5, chunkSize));
    if (chunk.length < 5) continue;

    const chronological = chunk.map((row, idx) => rowToPoint(row, idx, seriesId));
    const desc = [...chronological].reverse();
    series.push(desc);
  }

  return series;
};

const splitSeries = (series: TrendInputPoint[][]) => {
  const total = series.length;
  if (total < 3) {
    return {
      trainSeries: [...series],
      valSeries: [...series],
      testSeries: [...series],
    };
  }

  const trainCount = Math.max(1, Math.floor(total * 0.7));
  const valCount = Math.max(1, Math.floor(total * 0.15));
  const testCount = Math.max(1, total - trainCount - valCount);

  const trainEnd = Math.min(total, trainCount);
  const valEnd = Math.min(total, trainEnd + valCount);

  let trainSeries = series.slice(0, trainEnd);
  let valSeries = series.slice(trainEnd, valEnd);
  let testSeries = series.slice(valEnd, valEnd + testCount);

  if (!valSeries.length) valSeries = [...trainSeries];
  if (!testSeries.length) testSeries = [...valSeries];
  if (!trainSeries.length) trainSeries = [...series];

  return { trainSeries, valSeries, testSeries };
};

const sampleSeriesForRun = <T>(series: T[], ratio: number): T[] => {
  if (series.length <= 1) return [...series];
  const target = Math.max(1, Math.floor(series.length * ratio));
  const shuffled = [...series].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, target);
};

const evaluateSplitMetrics = async (
  artifact: SerializedTrendModelArtifact,
  series: TrendInputPoint[][]
): Promise<Metrics> => {
  let tested = 0;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let correctDirection = 0;

  for (const seq of series) {
    if (!Array.isArray(seq) || seq.length < 4) continue;

    const actualLatest = Number(seq[0].score);
    const previous = Number(seq[1].score);
    const history = seq.slice(1);

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

  if (!tested) return emptyMetrics();

  return {
    samples: tested,
    mae: sumAbsError / tested,
    rmse: sumSquaredError / tested,
    directionAccuracy: (correctDirection / tested) * 100,
  };
};

const evaluateTemporalCrossValidation = async (
  artifact: SerializedTrendModelArtifact,
  series: TrendInputPoint[][],
  folds: number[] = [0.6, 0.7, 0.8]
): Promise<Metrics> => {
  let tested = 0;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let correctDirection = 0;

  for (const seq of series) {
    if (seq.length < 6) continue;
    const asc = [...seq].reverse();

    for (const ratio of folds) {
      const targetAscIdx = Math.floor(asc.length * ratio);
      if (targetAscIdx < 4 || targetAscIdx >= asc.length) continue;

      const historyAsc = asc.slice(0, targetAscIdx);
      const historyDesc = [...historyAsc].reverse();

      const actualLatest = Number(asc[targetAscIdx].score);
      const previous = Number(asc[targetAscIdx - 1].score);

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
    rmse: sumSquaredError / tested,
    directionAccuracy: (correctDirection / tested) * 100,
  };
};

const readJsonArray = async <T>(filePath: string): Promise<T[]> => {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function main() {
  const configuredDatasetPath = process.env.ML_DATASET_PATH?.trim();
  const datasetPath = configuredDatasetPath
    ? path.isAbsolute(configuredDatasetPath)
      ? configuredDatasetPath
      : path.join(process.cwd(), configuredDatasetPath)
    : path.join(process.cwd(), "src", "modele", "datasets", "Skin_Type.csv");

  const rows = await parseCsvRows(datasetPath);
  if (!rows.length) {
    console.log("Dataset is empty. Nothing to train.");
    return;
  }

  const allSeries = buildSeriesFromCsv(rows);
  if (!allSeries.length) {
    console.log("Dataset could not be transformed into temporal series.");
    return;
  }

  const { trainSeries, valSeries, testSeries } = splitSeries(allSeries);

  // Hyperparameter Grid Search Lite
  const hiddenConfigs = [[18, 10], [24, 12, 8], [32, 16]];
  const learningRates = [0.01, 0.02, 0.005];
  
  const runReports: RunReport[] = [];
  let bestArtifact: SerializedTrendModelArtifact | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestRunIndex = -1;

  let runCounter = 1;
  for (const hidden of hiddenConfigs) {
    for (const lr of learningRates) {
      console.log(`\nRun ${runCounter}: layers=${hidden.join("-")}, lr=${lr}`);
      
      const sampledSeries = sampleSeriesForRun(trainSeries, 0.95);
      const artifact = await trainTrendModelArtifactFromSeries(sampledSeries, {
        hiddenLayers: hidden,
        learningRate: lr,
        epochs: 200,
        patience: 20,
        validationSplit: 0.15
      });

      if (!artifact) {
        console.log(`Run ${runCounter}: training failed (artifact null).`);
        continue;
      }

      const valMetrics = await evaluateSplitMetrics(artifact, valSeries);
      const cvMetrics = await evaluateTemporalCrossValidation(artifact, trainSeries);
      
      // Score: prioritizing MAE and Direction Accuracy
      const score = valMetrics.mae + (1 - valMetrics.directionAccuracy / 100) * 10;

      runReports.push({
        run: runCounter,
        config: { hiddenLayers: hidden, learningRate: lr },
        trainedAt: artifact.trainedAt,
        finalLoss: artifact.finalLoss,
        epochs: artifact.epochs,
        trainSeries: sampledSeries.length,
        val: valMetrics,
        temporalCv: cvMetrics,
      });

      console.log(formatMetrics("Validation", valMetrics));
      console.log(formatMetrics("Temporal CV", cvMetrics));

      if (score < bestScore) {
        bestScore = score;
        bestArtifact = artifact;
        bestRunIndex = runCounter;
      }
      runCounter++;
    }
  }

  if (!bestArtifact) {
    console.log("All runs failed. No artifact produced.");
    return;
  }

  const outDir = path.join(process.cwd(), "src", "modele", "artifacts");
  const outPath = path.join(outDir, "trend-model.json");
  const reportPath = path.join(outDir, "trend-training-report.json");
  const historyPath = path.join(outDir, "trend-metrics-history.json");

  await mkdir(outDir, { recursive: true });
  const finalTest = await evaluateSplitMetrics(bestArtifact, testSeries);
  const temporalCv = await evaluateTemporalCrossValidation(bestArtifact, trainSeries);
  const segmented = await evaluateSegmentedMetrics(bestArtifact, rows);

  // Attach final metrics to artifact for app confidence calculation
  bestArtifact.metrics = {
    mae: finalTest.mae,
    directionAccuracy: finalTest.directionAccuracy / 100, // normalized to 0-1
  };

  await writeFile(outPath, JSON.stringify(bestArtifact, null, 2), "utf8");

  const report = {
    generatedAt: new Date().toISOString(),
    bestRun: bestRunIndex,
    bestScore,
    artifact: {
      epochs: bestArtifact.epochs,
      finalLoss: bestArtifact.finalLoss,
      inputCols: bestArtifact.inputCols,
      trainedAt: bestArtifact.trainedAt,
      config: bestArtifact.config,
    },
    history: bestArtifact.history,
    data: {
      totalSamples: rows.length,
      trainSeries: trainSeries.length,
      valSeriesCount: valSeries.length,
      testSeriesCount: testSeries.length,
    },
    metrics: {
      temporalCv,
      strictTest: finalTest,
      segmented,
    },
    runs: runReports,
  };

  await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  const history = await readJsonArray<Record<string, unknown>>(historyPath);
  history.push({
    generatedAt: report.generatedAt,
    bestRun: report.bestRun,
    bestScore: report.bestScore,
    epochs: report.artifact.epochs,
    finalLoss: report.artifact.finalLoss,
    lr: report.artifact.config?.learningRate,
    layers: report.artifact.config?.hiddenLayers.join("-"),
    temporalCv: report.metrics.temporalCv,
    strictTest: report.metrics.strictTest,
  });
  await writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");

  console.log("\n==========================================");
  console.log("Trend model boosted and saved:", outPath);
  console.log("Detailed report available:", reportPath);
  console.log("Best run config:", bestArtifact.config);
  console.log("Final Test MAE:", finalTest.mae.toFixed(4));
  console.log("Direction Accuracy:", finalTest.directionAccuracy.toFixed(2), "%");
  console.log("==========================================\n");
}

main().catch((error) => {
  console.error("Training script error:", error);
  process.exitCode = 1;
});
