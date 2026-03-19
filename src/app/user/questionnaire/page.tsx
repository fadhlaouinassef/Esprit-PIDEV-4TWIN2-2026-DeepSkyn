"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { Composer, AIModel } from "@/app/components/user/Composer";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loader2, CheckCircle2, Award, Zap } from "lucide-react";

interface Question {
    id: number;
    text: string;
    type: "choice" | "text" | string;
    options?: string[];
    quizId?: number;
}

interface AnalysisResult {
    analysis: string;
    score: number;
}

// N8N Webhook Proxy URL
const N8N_WEBHOOK_URL = "/api/quiz/n8n";

export default function QuestionnairePage() {
    const { data: session, status: sessionStatus } = useSession();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const [selectedModel, setSelectedModel] = useState<AIModel>("google/gemini-2.0-flash-001");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; image?: string }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [answersSoFar, setAnswersSoFar] = useState<{ questionId: number; answer: string }[]>([]);
    const [quizId, setQuizId] = useState<number>(1);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial call to get the first question
    useEffect(() => {
        if (sessionStatus !== "loading" && messages.length === 0 && !isStreaming && !currentQuestion && !analysisResult) {
            console.log("🚀 Starting initial questionnaire fetch...");
            fetchNextStep([]);
        }
    }, [sessionStatus, userId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isStreaming, isAnalyzing]);

    const fetchNextStep = async (currentAnswers: { questionId: number; answer: string }[], lastAnswerData?: { questionId: number; answer: string }) => {
        setIsStreaming(true);
        try {
            const payload = {
                userId: userId || 0,
                quizId,
                answersSoFar: currentAnswers,
                lastQuestionId: lastAnswerData?.questionId,
                lastAnswer: lastAnswerData?.answer
            };

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || "n8n unreachable");
            }

            const data = await response.json();
            console.log("📥 Received from n8n:", JSON.stringify(data, null, 2));
            
            // Robust parsing for various n8n response formats
            let result = Array.isArray(data) ? data[0] : data;
            
            // Unpack if result is { json: ... } or { body: ... }
            if (result && result.json) result = result.json;
            if (result && result.body) result = result.body;

            console.log("🔍 Parsed final result:", result);

            if (result && result.status === "continue" && (result.nextQuestion || result.text)) {
                const nextQ = result.nextQuestion || { text: result.text, id: Date.now(), type: 'TEXT' };
                setCurrentQuestion({
                    id: nextQ.id,
                    text: nextQ.text,
                    type: String(nextQ.type).toUpperCase() === "CHOICE" ? "choice" : "text",
                    options: nextQ.options,
                    quizId: nextQ.quizId
                });
                if (nextQ.quizId) setQuizId(nextQ.quizId);
                setMessages(prev => [...prev, { role: "assistant", content: nextQ.text }]);
            } else if (result && result.status === "complete") {
                setCurrentQuestion(null);
                setIsAnalyzing(true);
                setTimeout(() => {
                    setAnalysisResult({
                        analysis: result.analysis || "Analysis complete.",
                        score: result.score || 85
                    });
                    setIsAnalyzing(false);
                }, 3000);
            } else {
                console.warn("⚠️ Unexpected n8n format or empty response", result);
                if (messages.length === 0) {
                   setMessages(prev => [...prev, { role: "assistant", content: "I'm ready when you are. If you see this, n8n might be returning an empty response." }]);
                }
            }
        } catch (error: any) {
            console.error("❌ Fetch next step error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: `Connection Error: ${error.message}. Please check if n8n is running and its webhook is active.` }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleUserResponse = (content: string, imageData?: string) => {
        console.log("📝 handleUserResponse triggered with:", content);
        
        if (isStreaming) {
            console.warn("🚫 Already streaming, ignoring response.");
            return;
        }
        if (!currentQuestion) {
            console.warn("🚫 No current question, ignoring response.");
            return;
        }
        if (isAnalyzing) {
            console.warn("🚫 Still analyzing, ignoring response.");
            return;
        }

        const userMsg = { role: "user" as const, content, image: imageData };
        setMessages(prev => [...prev, userMsg]);

        const newAnswer = { questionId: currentQuestion.id, answer: content };
        const updatedAnswers = [...answersSoFar, newAnswer];
        
        console.log("✅ State updated with new answer. Calling fetchNextStep...");
        setAnswersSoFar(updatedAnswers);
        fetchNextStep(updatedAnswers, newAnswer);
    };

    return (
        <UserLayout userName={session?.user?.name || "User"} userPhoto={session?.user?.image || "/avatar.png"}>
            <div className="mx-auto w-full max-w-[800px] flex flex-col h-[calc(100vh-180px)] relative">
                {/* Header with Progress */}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Skin Analysis
                        </h2>
                        {!analysisResult && (
                            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {answersSoFar.length + (currentQuestion ? 1 : 0)} Questions
                            </span>
                        )}
                    </div>
                    {!analysisResult && (
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (answersSoFar.length / 10) * 100)}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    )}
                </div>

                {/* Chat Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-6 pb-64 custom-scrollbar pr-2 scroll-smooth"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm relative ${msg.role === "user"
                                    ? "bg-primary text-white rounded-tr-none shadow-primary/20"
                                    : "bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none shadow-gray-200/50 dark:shadow-none"
                                    }`}>
                                    {msg.image && (
                                        <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                                            <img src={msg.image} alt="Upload" className="max-w-full h-auto max-h-72 object-cover" />
                                        </div>
                                    )}
                                    <p className="text-[17px] leading-relaxed font-medium">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isStreaming && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-400">DeepSkyn is thinking</span>
                                <div className="flex gap-1">
                                    <div className="size-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                                    <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl gap-6 mt-8"
                        >
                            <div className="relative">
                                <Loader2 className="size-16 text-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="size-6 text-primary" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analyzing your skin...</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                                    Our AI is processing your answers to generate a personalized skincare routine.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {analysisResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 mt-8 pb-10"
                        >
                            {/* Score Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-primary to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/20 flex flex-col items-center justify-center text-center">
                                    <Award className="size-10 mb-2 opacity-80" />
                                    <span className="text-sm font-bold uppercase tracking-wider opacity-80">Skin Score</span>
                                    <div className="text-5xl font-black mt-1">{analysisResult.score}<span className="text-xl opacity-60">/100</span></div>
                                </div>
                                
                                <div className="md:col-span-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="size-5 text-green-500" />
                                        <h4 className="font-bold text-gray-900 dark:text-white">Analysis Complete</h4>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Based on your data, we've identified the key areas for your skincare journey.
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Analysis */}
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Personalized Analysis</h3>
                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {analysisResult.analysis.split('\n').map((line, i) => (
                                        <p key={i} className="mb-4">{line}</p>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => window.location.href = "/user/routines"}
                                    className="mt-6 w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                                >
                                    View My New Routine
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Interaction Overlay (at bottom) */}
                {!analysisResult && !isAnalyzing && (
                <div className="absolute bottom-0 left-0 right-0 py-10 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-[#0b0b0f] dark:via-[#0b0b0f]/95 z-20 pointer-events-none">
                    <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 pointer-events-none">
                        <AnimatePresence mode="wait">
                            {/* Choice UI */}
                            {!isStreaming && currentQuestion?.type === "choice" && messages[messages.length - 1]?.role === "assistant" && (
                                <motion.div
                                    key="choices"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="pointer-events-auto flex flex-wrap justify-center gap-3"
                                >
                                    {currentQuestion.options?.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => handleUserResponse(opt)}
                                            className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-bold hover:border-primary hover:text-primary hover:shadow-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group"
                                        >
                                            <div className="size-2.5 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-primary transition-colors"></div>
                                            {opt}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Text Input UI */}
                            {!isStreaming && (currentQuestion?.type === "text" || !currentQuestion) && (messages[messages.length - 1]?.role === "assistant") && (
                                <motion.div
                                    key="composer"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="w-full pointer-events-auto"
                                >
                                    <Composer
                                        onSend={handleUserResponse}
                                        onStop={() => setIsStreaming(false)}
                                        isStreaming={isStreaming}
                                        selectedModel={selectedModel}
                                        onModelChange={setSelectedModel}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                )}
            </div>
        </UserLayout>
    );
}
