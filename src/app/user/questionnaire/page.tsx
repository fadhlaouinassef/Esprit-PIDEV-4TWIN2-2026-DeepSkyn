"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { Composer, AIModel } from "@/app/components/user/Composer";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
    id: string;
    text: string;
    type: "choice" | "text";
    options?: string[];
}

const QUESTIONS: Question[] = [
    {
        id: "intro",
        text: "Hello! I'm your DeepSkyn assistant. To get started, what is your skin type?",
        type: "choice",
        options: ["Dry", "Oily", "Combination", "Normal", "Sensitive"]
    },
    {
        id: "concern",
        text: "What is your main skin concern today?",
        type: "choice",
        options: ["Acne", "Wrinkles", "Dark Spots", "Dehydration", "Redness"]
    },
    {
        id: "routine",
        text: "Do you already have a skincare routine? Please describe it briefly if possible.",
        type: "text"
    },
    {
        id: "photo",
        text: "For a more accurate analysis, you can upload a photo of the affected area or describe your symptoms to me.",
        type: "text"
    }
];

export default function QuestionnairePage() {
    const [selectedModel, setSelectedModel] = useState<AIModel>("google/gemini-2.0-flash-001");
    const [currentStep, setCurrentStep] = useState(0);
    const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; image?: string }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ role: "assistant", content: QUESTIONS[0].text }]);
        }
    }, [messages.length]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isStreaming]);

    const handleUserResponse = (content: string, imageData?: string) => {
        if (isStreaming) return;

        const userMsg = { role: "user" as const, content, image: imageData };
        setMessages(prev => [...prev, userMsg]);

        setIsStreaming(true);

        setTimeout(() => {
            const nextStep = currentStep + 1;
            if (nextStep < QUESTIONS.length) {
                setCurrentStep(nextStep);
                setMessages(prev => [...prev, { role: "assistant", content: QUESTIONS[nextStep].text }]);
            } else {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "Thank you for your answers! I'm preparing your personalized analysis. You'll receive a notification in a few minutes. ✨"
                }]);
                setCurrentStep(QUESTIONS.length); // End
            }
            setIsStreaming(false);
        }, 1200);
    };

    const currentQuestion = currentStep < QUESTIONS.length ? QUESTIONS[currentStep] : null;

    return (
        <UserLayout userName="Nassef" userPhoto="/avatar.png">
            <div className="mx-auto w-full max-w-[800px] flex flex-col h-[calc(100vh-180px)] relative">
                {/* Header with Progress */}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Skin Analysis
                        </h2>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {Math.min(currentStep + 1, QUESTIONS.length)} / {QUESTIONS.length}
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(Math.min(currentStep + (messages[messages.length - 1]?.role === 'user' ? 1 : 0), QUESTIONS.length) / QUESTIONS.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
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
                </div>

                {/* Interaction Overlay (at bottom) */}
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
                            {!isStreaming && (currentQuestion?.type === "text" || currentStep >= QUESTIONS.length) && (messages[messages.length - 1]?.role === "assistant" || currentStep >= QUESTIONS.length) && (
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
            </div>
        </UserLayout>
    );
}
