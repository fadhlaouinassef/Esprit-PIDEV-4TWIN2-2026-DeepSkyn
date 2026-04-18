import { trainHam10000MetadataModel } from "./ham10000MetadataModel";

async function run() {
  console.log("[ham10000] Debut entrainement TensorFlow.js (metadata analyses)...");

  const result = await trainHam10000MetadataModel();

  console.log("[ham10000] Entrainement termine.");
  console.log(`[ham10000] Lignes: ${result.rows} | train: ${result.trainCount} | test: ${result.testCount}`);
  console.log(`[ham10000] Features: ${result.inputSize} | classes: ${result.classes.join(", ")}`);
  console.log(
    `[ham10000] Train loss=${result.finalLoss.toFixed(4)} acc=${result.finalAccuracy.toFixed(4)} | ` +
      `Test loss=${result.evalLoss.toFixed(4)} acc=${result.evalAccuracy.toFixed(4)}`
  );
}

run().catch((error) => {
  console.error("[ham10000] Echec entrainement:", error);
  process.exitCode = 1;
});
