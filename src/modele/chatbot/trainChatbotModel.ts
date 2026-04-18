import { warmupChatbotModel } from "./chatbotModel";

async function run() {
  console.log("[chatbot] Demarrage de l'entrainement TensorFlow.js...");
  await warmupChatbotModel();
  console.log("[chatbot] Modele pret (CSV charges + entrainement termine).");
}

run().catch((error) => {
  console.error("[chatbot] Echec de l'entrainement:", error);
  process.exitCode = 1;
});
