import { NextResponse } from "next/server";
import {
  answerChatbotQuestion,
  resetChatbotRuntime,
  warmupChatbotModel,
} from "@/modele/chatbot/chatbotModel";

export const runtime = "nodejs";

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
    const body = (await request.json()) as { question?: string };
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

    console.error("Chatbot route error:", error);
    return NextResponse.json(
      { error: "Internal chatbot error" },
      { status: 500 }
    );
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
