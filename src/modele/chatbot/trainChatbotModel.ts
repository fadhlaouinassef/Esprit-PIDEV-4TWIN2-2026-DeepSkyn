import {
  prepareChatbotDatasets,
  trainAndEvaluateChatbotModel,
} from "./chatbotModel";

async function run() {
  console.log("[chatbot] Demarrage du pipeline ML chatbot...");
  console.log("[chatbot] Etape 1/6 Raw Data -> Loading datasets sources");

  const prepared = await prepareChatbotDatasets();
  console.log("[chatbot] Etape 2-5/6 Cleaning, Preprocessing, Feature Engineering, Split termines.");
  console.log(
    `[chatbot] Datasets prepares: raw=${prepared.rawCount}, clean=${prepared.cleanedCount}, train=${prepared.trainCount}, test=${prepared.testCount}, vocab=${prepared.vocabularySize}`
  );

  console.log("[chatbot] Etape 6/6 Model Training + Evaluation...");
  const report = await trainAndEvaluateChatbotModel();

  console.log("[chatbot] -------- Training Metrics --------");
  console.log(`[chatbot] Accuracy: ${report.metrics.accuracy}`);
  console.log(`[chatbot] Precision (macro): ${report.metrics.macroPrecision}`);
  console.log(`[chatbot] Recall (macro): ${report.metrics.macroRecall}`);
  console.log(`[chatbot] F1-score (macro): ${report.metrics.macroF1}`);
  console.log(
    `[chatbot] Samples -> train=${report.metrics.trainSize}, test=${report.metrics.testSize}, vocab=${report.metrics.vocabularySize}, epochs=${report.metrics.epochs}`
  );

  console.log("[chatbot] Per-class metrics:");
  for (const item of report.metrics.classes) {
    console.log(
      `[chatbot] ${item.label}: precision=${item.precision}, recall=${item.recall}, f1=${item.f1}, support=${item.support}`
    );
  }

  console.log("[chatbot] Confusion matrix:");
  for (const row of report.metrics.confusionMatrix) {
    console.log(`[chatbot] ${row.join(" ")}`);
  }

  console.log("[chatbot] Modele pret. Rapport sauve dans src/modele/artifacts/chatbot-training-report.json");
}

run().catch((error) => {
  console.error("[chatbot] Echec de l'entrainement:", error);
  process.exitCode = 1;
});
