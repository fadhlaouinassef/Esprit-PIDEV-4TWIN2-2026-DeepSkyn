import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import prisma from "../../src/lib/prisma";
import {
  SerializedTrendModelArtifact,
  trainTrendModelArtifactFromSeries,
} from "../../src/modele/analysisTrendModel";
import {
  evaluateSplitMetrics,
  evaluateTemporalCrossValidation,
  fetchAnalysisRows,
  formatMetrics,
  prepareTemporalDataset,
} from "./trend-ml-utils";

type RunReport = {
  run: number;
  trainedAt: string;
  finalLoss: number;
  epochs: number;
  trainUsers: number;
  trainSeries: number;
  val: {
    samples: number;
    mae: number;
    rmse: number;
    directionAccuracy: number;
  };
  temporalCv: {
    samples: number;
    mae: number;
    rmse: number;
    directionAccuracy: number;
  };
};

const clampRunCount = (value: number): number => {
  if (!Number.isFinite(value)) return 3;
  return Math.min(10, Math.max(1, Math.floor(value)));
};

const sampleSeriesForRun = <T>(series: T[], ratio: number): T[] => {
  if (series.length <= 1) return [...series];
  const target = Math.max(1, Math.floor(series.length * ratio));
  const shuffled = [...series].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, target);
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
  const rows = await fetchAnalysisRows();

  if (!rows.length) {
    console.log("No analyses found. Nothing to train.");
    return;
  }

  const dataset = prepareTemporalDataset(rows);
  if (!dataset.trainSeries.length) {
    console.log("Not enough data after strict temporal split. Need users with richer history.");
    return;
  }

  const runCount = clampRunCount(Number(process.env.ML_RUNS || 3));
  const runReports: RunReport[] = [];

  let bestArtifact: SerializedTrendModelArtifact | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestRunIndex = -1;

  for (let run = 1; run <= runCount; run += 1) {
    const sampledSeries = sampleSeriesForRun(dataset.trainSeries, 0.9);
    const artifact = await trainTrendModelArtifactFromSeries(sampledSeries);
    if (!artifact) {
      console.log(`Run ${run}: training failed (artifact null).`);
      continue;
    }

    const valMetrics = await evaluateSplitMetrics(artifact, dataset.contexts, "val");
    const cvMetrics = await evaluateTemporalCrossValidation(artifact, dataset.contexts);
    const score = valMetrics.mae + 0.3 * cvMetrics.mae;

    runReports.push({
      run,
      trainedAt: artifact.trainedAt,
      finalLoss: artifact.finalLoss,
      epochs: artifact.epochs,
      trainUsers: dataset.contexts.length,
      trainSeries: sampledSeries.length,
      val: valMetrics,
      temporalCv: cvMetrics,
    });

    console.log(`Run ${run}/${runCount}`);
    console.log(formatMetrics("Validation", valMetrics));
    console.log(formatMetrics("Temporal CV", cvMetrics));

    if (score < bestScore) {
      bestScore = score;
      bestArtifact = artifact;
      bestRunIndex = run;
    }
  }

  if (!bestArtifact) {
    console.log("All runs failed. No artifact produced.");
    return;
  }

  const outPath = path.join(process.cwd(), "src", "modele", "artifacts", "trend-model.json");
  const reportPath = path.join(process.cwd(), "src", "modele", "artifacts", "trend-training-report.json");
  const historyPath = path.join(process.cwd(), "src", "modele", "artifacts", "trend-metrics-history.json");

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(bestArtifact, null, 2), "utf8");

  const finalTest = await evaluateSplitMetrics(bestArtifact, dataset.contexts, "test");
  const temporalCv = await evaluateTemporalCrossValidation(bestArtifact, dataset.contexts);

  const report = {
    generatedAt: new Date().toISOString(),
    runCount,
    bestRun: bestRunIndex,
    bestScore,
    artifact: {
      epochs: bestArtifact.epochs,
      finalLoss: bestArtifact.finalLoss,
      inputCols: bestArtifact.inputCols,
      trainedAt: bestArtifact.trainedAt,
    },
    data: {
      users: dataset.contexts.length,
      trainSeries: dataset.trainSeries.length,
      valSeriesCount: dataset.valSeriesCount,
      testSeriesCount: dataset.testSeriesCount,
    },
    metrics: {
      temporalCv,
      strictTest: finalTest,
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
    temporalCv: report.metrics.temporalCv,
    strictTest: report.metrics.strictTest,
    users: report.data.users,
    trainSeries: report.data.trainSeries,
  });
  await writeFile(historyPath, JSON.stringify(history, null, 2), "utf8");

  console.log("Trend model trained and saved:", outPath);
  console.log("Training report:", reportPath);
  console.log("Metrics history:", historyPath);
  console.log(`Best run: ${bestRunIndex}/${runCount}`);
  console.log("Epochs:", bestArtifact.epochs);
  console.log("Final loss:", bestArtifact.finalLoss.toFixed(6));
  console.log("Input cols:", bestArtifact.inputCols);
  console.log(formatMetrics("Strict test", finalTest));
  console.log(formatMetrics("Temporal CV", temporalCv));
}

main()
  .catch((error) => {
    console.error("Training script error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
