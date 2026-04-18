import { NextResponse } from "next/server";
import {
  answerChatbotQuestion,
  answerChatbotQuestionWithoutModel,
  resetChatbotRuntime,
  warmupChatbotModel,
} from "@/modele/chatbot/chatbotModel";

export const runtime = "nodejs";

const FALLBACK_CHATBOT_RESPONSE = {
  answer:
    "Je rencontre un probleme technique temporaire. Reessayez votre question produit (marque, ingredients, effets, prix) dans quelques secondes.",
  confidence: 0,
  intent: "out_of_scope",
  suggestions: [
    "Connais-tu les produits SVR ?",
    "Explique les ingredients de ce produit",
    "Quels effets secondaires possibles ?",
  ],
};

const isRecoverableTfError = (error: unknown): boolean => {
  const message = String((error as { message?: string })?.message || error || "").toLowerCase();
  return (
    message.includes("already registered") ||
    message.includes("variable with name")
  );
};

export async function POST(request: Request) {
  let question = "";

  try {
    let body: { question?: string };
    try {
      body = (await request.json()) as { question?: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Missing question" },
        { status: 400 }
      );
    }

    const response = await answerChatbotQuestion(question);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (question && isRecoverableTfError(error)) {
      try {
        resetChatbotRuntime();
        const retryResponse = await answerChatbotQuestion(question);
        return NextResponse.json(retryResponse, { status: 200 });
      } catch (retryError) {
        console.error("Chatbot retry failed:", retryError);
      }
    }

    if (question) {
      try {
        // Last-resort fallback without TensorFlow runtime.
        const fallbackAnswer = await answerChatbotQuestionWithoutModel(question);
        return NextResponse.json(fallbackAnswer, { status: 200 });
      } catch (fallbackError) {
        console.error("Chatbot heuristic fallback failed:", fallbackError);
      }
    }

    console.error("Chatbot route error:", error);
    return NextResponse.json(FALLBACK_CHATBOT_RESPONSE, { status: 200 });
  }
}

export async function GET() {
  try {
    await warmupChatbotModel();
    return NextResponse.json({ status: "ready" }, { status: 200 });
  } catch (error) {
    console.error("Chatbot warmup error:", error);
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
