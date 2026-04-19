import { readFile } from "node:fs/promises";
import path from "node:path";
import prisma from "../../src/lib/prisma";
import {
  SerializedTrendModelArtifact,
} from "../../src/modele/analysisTrendModel";
import {
  evaluateSplitMetrics,
  evaluateTemporalCrossValidation,
  fetchAnalysisRows,
  formatMetrics,
  prepareTemporalDataset,
} from "./trend-ml-utils";

async function main() {
  const modelPath = path.join(process.cwd(), "src", "modele", "artifacts", "trend-model.json");
  const modelRaw = await readFile(modelPath, "utf8");
  const artifact = JSON.parse(modelRaw) as SerializedTrendModelArtifact;

  const rows = await fetchAnalysisRows();
  const dataset = prepareTemporalDataset(rows);

  if (!dataset.contexts.length) {
    console.log("No valid temporal dataset for testing.");
    return;
  }

  const valMetrics = await evaluateSplitMetrics(artifact, dataset.contexts, "val");
  const testMetrics = await evaluateSplitMetrics(artifact, dataset.contexts, "test");
  const cvMetrics = await evaluateTemporalCrossValidation(artifact, dataset.contexts);

  console.log("Trend model test results");
  console.log(formatMetrics("Strict validation", valMetrics));
  console.log(formatMetrics("Strict test", testMetrics));
  console.log(formatMetrics("Temporal CV", cvMetrics));
}

main()
  .catch((error) => {
    console.error("Test script error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
