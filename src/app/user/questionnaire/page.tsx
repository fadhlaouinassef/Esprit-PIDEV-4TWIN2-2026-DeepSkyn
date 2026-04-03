"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { Composer, AIModel } from "@/app/components/user/Composer";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loader2, Award, Zap, Droplets, Sun, Moon, ShieldCheck, AlertTriangle, Sparkles, Star, TrendingUp, ChevronRight, ArrowRight, Upload, Camera, X, History, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { RoutineItemScraper } from "@/app/components/user/RoutineItemScraper";

interface Question {
    id: number;
    text: string;
    type: "choice" | "text" | string;
    options?: Array<{ id: string; text: string }>;
    quizId?: number;
}

interface AnalysisResult {
    analysis: string;
    score: number;
    scoreEau?: number;
    agePeau?: number;
    skinType?: string;
    strengths?: string[];
    concerns?: string[];
    recommendations?: {
        immediate?: string[];
        weekly?: string[];
        avoid?: string[];
    };
    routine?: {
        morning?: string[];
        evening?: string[];
    };
    confidence?: number;
}

interface UploadedSurveyImage {
    dataUrl: string;
    mimeType: string;
    base64: string;
}

type N8nResult = {
    status?: string;
    nextQuestion?: {
        id?: number;
        text?: string;
        type?: string;
        options?: unknown;
        quizId?: number;
    };
    text?: string;
    analysis?: string;
    score?: number;
};

// N8N Webhook Proxy URL
const N8N_WEBHOOK_URL = "/api/quiz/n8n";

const normalizeQuestionType = (rawType: unknown): "choice" | "text" => {
    const normalized = String(rawType || "").toLowerCase();
    return ["choice", "multiple_choice", "mcq"].includes(normalized) ? "choice" : "text";
};

const normalizeOptions = (rawOptions: unknown): Array<{ id: string; text: string }> => {
    const list = Array.isArray(rawOptions)
        ? rawOptions
        : rawOptions && typeof rawOptions === "object"
            ? Object.values(rawOptions as Record<string, unknown>)
            : [];

    return list
        .map((opt, index) => {
            if (typeof opt === "string") {
                return { id: `opt-${index}-${opt}`, text: opt };
            }

            if (opt && typeof opt === "object") {
                const optionObj = opt as { id?: string; text?: string; label?: string };
                const text = optionObj.text || optionObj.label || "";
                if (!text.trim()) return null;

                return {
                    id: optionObj.id || `opt-${index}-${text}`,
                    text,
                };
            }

            return null;
        })
        .filter((opt): opt is { id: string; text: string } => Boolean(opt));
};

const dataUrlToInlinePart = (dataUrl: string): UploadedSurveyImage | null => {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return null;

    return {
        dataUrl,
        mimeType: match[1],
        base64: match[2],
    };
};

const fileToCompressedDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const source = new Image();
            source.onload = () => {
                const maxSide = 1280;
                const ratio = Math.min(1, maxSide / Math.max(source.width, source.height));
                const width = Math.max(1, Math.round(source.width * ratio));
                const height = Math.max(1, Math.round(source.height * ratio));

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas not supported in this browser.'));
                    return;
                }

                ctx.drawImage(source, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            source.onerror = () => reject(new Error('Failed to decode selected image.'));
            source.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read selected image.'));
        reader.readAsDataURL(file);
    });

const parseN8nResult = (raw: unknown): N8nResult | null => {
    let result = Array.isArray(raw) ? raw[0] : raw;

    if (result && typeof result === 'object' && 'json' in (result as Record<string, unknown>)) {
        result = (result as Record<string, unknown>).json;
    }
    if (result && typeof result === 'object' && 'body' in (result as Record<string, unknown>)) {
        result = (result as Record<string, unknown>).body;
    }

    if (!result || typeof result !== 'object') return null;
    return result as N8nResult;
};

export default function QuestionnairePage() {
    const { data: session, status: sessionStatus } = useSession();
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    const [selectedModel, setSelectedModel] = useState<AIModel>("google/gemini-2.0-flash-001");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; image?: string }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImageStep, setIsImageStep] = useState(false);
    const [isSubmittingImages, setIsSubmittingImages] = useState(false);
    const [pendingFinalResult, setPendingFinalResult] = useState<Record<string, unknown> | null>(null);
    const [uploadedSurveyImages, setUploadedSurveyImages] = useState<UploadedSurveyImage[]>([]);
    const [isDraggingImages, setIsDraggingImages] = useState(false);
    const [latestProgressAnalysisId, setLatestProgressAnalysisId] = useState<number | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [answersSoFar, setAnswersSoFar] = useState<{ questionId: number; answer: string }[]>([]);
    const [quizId, setQuizId] = useState<number>(1);
    const questionnaireSessionIdRef = useRef(`qs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const analysisRef = useRef<HTMLDivElement>(null);

    const finalizeAndSaveAnalysis = async (result: Record<string, unknown>) => {
        setCurrentQuestion(null);
        setIsAnalyzing(true);

        const startedAt = Date.now();

        try {
            let computed: Partial<AnalysisResult> | null = null;

            if (userId) {
                const incomingAnalysis = String(result.analysis || '').trim();
                const incomingScore = Number(result.score);
                const response = await fetch('/api/quiz/skin-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        quizId,
                        finalSummaryOverride: incomingAnalysis,
                        finalScoreOverride: Number.isFinite(incomingScore) ? incomingScore : undefined,
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    computed = {
                        analysis: String(data.analysis || ''),
                        score: Number(data.score),
                        scoreEau: Number(data.scoreEau),
                        agePeau: Number(data.agePeau),
                        skinType: String(data.skinType || ''),
                        strengths: Array.isArray(data.strengths) ? data.strengths : [],
                        concerns: Array.isArray(data.concerns) ? data.concerns : [],
                        recommendations: data.recommendations,
                        routine: data.routine,
                        confidence: Number(data.confidence || 0),
                    };
                }
            }

            const incomingAnalysis = String(result.analysis || '').trim();
            const incomingScore = Number(result.score);
            const hasIncomingAnalysis = incomingAnalysis.length > 0;
            const hasIncomingScore = Number.isFinite(incomingScore);

            const fallbackAnalysis = hasIncomingAnalysis ? incomingAnalysis : 'Analysis complete.';
            const fallbackScore = hasIncomingScore ? incomingScore : 85;

            const elapsed = Date.now() - startedAt;
            const minLoaderDuration = 1200;
            if (elapsed < minLoaderDuration) {
                await new Promise((resolve) => setTimeout(resolve, minLoaderDuration - elapsed));
            }

            setAnalysisResult({
                // Final n8n/Gemini output has priority for displayed final result.
                analysis: hasIncomingAnalysis ? incomingAnalysis : (computed?.analysis || fallbackAnalysis),
                score: hasIncomingScore
                    ? incomingScore
                    : (Number.isFinite(computed?.score) ? Number(computed?.score) : fallbackScore),
                scoreEau: computed?.scoreEau,
                agePeau: computed?.agePeau,
                skinType: computed?.skinType,
                strengths: computed?.strengths,
                concerns: computed?.concerns,
                recommendations: computed?.recommendations,
                routine: computed?.routine,
                confidence: computed?.confidence,
            });
        } catch (error) {
            console.error('❌ Finalize analysis error:', error);
            setAnalysisResult({
                analysis: String(result.analysis || 'Analysis complete.'),
                score: Number(result.score || 85)
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Initial call to get the first question
    useEffect(() => {
        if (sessionStatus !== "loading" && messages.length === 0 && !isStreaming && !currentQuestion && !analysisResult) {
            console.log("🚀 Starting initial questionnaire fetch...");
            fetchNextStep([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus, userId]);

    // Scroll to bottom during chat — but NOT once the analysis result is shown
    useEffect(() => {
        if (analysisResult) return; // let the user scroll freely
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isStreaming, isAnalyzing, analysisResult]);

    // When analysis first appears, scroll to the analysis section
    useEffect(() => {
        if (analysisResult && analysisRef.current) {
            setTimeout(() => {
                analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [analysisResult]);

    const fetchNextStep = async (currentAnswers: { questionId: number; answer: string }[], lastAnswerData?: { questionId: number; answer: string }) => {
        setIsStreaming(true);
        try {
            if (lastAnswerData && userId) {
                const saveResponse = await fetch('/api/quiz/save-answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        quizId,
                        questionId: lastAnswerData.questionId,
                        answer: lastAnswerData.answer,
                    })
                });

                if (saveResponse.ok) {
                    const saveData = await saveResponse.json().catch(() => null);
                    const analysisId = Number(saveData?.analysis?.analysisId);
                    if (Number.isFinite(analysisId)) {
                        setLatestProgressAnalysisId(analysisId);
                    }
                }
            }

            const payload = {
                userId: userId || 0,
                quizId,
                model: selectedModel,
                sessionId: questionnaireSessionIdRef.current,
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
            const result = parseN8nResult(data);

            console.log("🔍 Parsed final result:", result);

            if (result && result.status === "continue" && (result.nextQuestion || result.text)) {
                const nextQ = result.nextQuestion || { text: result.text, id: Date.now(), type: 'TEXT' };
                const normalizedQuestionId = Number(nextQ.id || Date.now());
                const normalizedQuestionText = String(nextQ.text || 'Please continue.');
                setCurrentQuestion({
                    id: normalizedQuestionId,
                    text: normalizedQuestionText,
                    type: normalizeQuestionType(nextQ.type),
                    options: normalizeOptions(nextQ.options),
                    quizId: nextQ.quizId
                });
                if (nextQ.quizId) setQuizId(nextQ.quizId);
                setMessages(prev => [...prev, { role: "assistant", content: normalizedQuestionText }]);
            } else if (result && result.status === "complete") {
                setPendingFinalResult(result as Record<string, unknown>);
                setIsImageStep(true);
                setCurrentQuestion(null);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content:
                            "Quiz complete. Add up to 5 images (drag and drop, gallery, or camera) to enrich the Gemini analysis.",
                    },
                ]);
            } else {
                console.warn("⚠️ Unexpected n8n format or empty response", result);
                if (messages.length === 0) {
                   setMessages(prev => [...prev, { role: "assistant", content: "I'm ready when you are. If you see this, n8n might be returning an empty response." }]);
                }
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("❌ Fetch next step error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: `Connection Error: ${err.message || 'Unexpected error'}. Please check if n8n is running and its webhook is active.` }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const appendFiles = async (incomingFiles: FileList | File[]) => {
        const files = Array.from(incomingFiles).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;

        const remaining = 5 - uploadedSurveyImages.length;
        if (remaining <= 0) {
            toast.error('Maximum 5 images autorisees.');
            return;
        }

        if (files.length > remaining) {
            toast.warning('Maximum 5 images autorisees. Veuillez retirer des images avant d\'en ajouter.');
        }

        const selected = files.slice(0, remaining);
        const converted: UploadedSurveyImage[] = [];

        for (const file of selected) {
            const dataUrl = await fileToCompressedDataUrl(file);
            const parsed = dataUrlToInlinePart(dataUrl);
            if (parsed) converted.push(parsed);
        }

        setUploadedSurveyImages((prev) => [...prev, ...converted].slice(0, 5));
    };

    const onImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            await appendFiles(files);
        }
        event.target.value = '';
    };

    const submitImageStep = async () => {
        if (!pendingFinalResult) {
            return;
        }

        if (!userId) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'User session not found. Please sign in again and restart the questionnaire.' },
            ]);
            return;
        }

        setIsSubmittingImages(true);
        try {
            let analysisId = latestProgressAnalysisId;

            // If no progressive analysis snapshot exists yet, create one now so images
            // are always linked to a real analysis record.
            if (!analysisId && uploadedSurveyImages.length > 0) {
                const analysisResponse = await fetch('/api/quiz/skin-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, quizId }),
                });

                if (!analysisResponse.ok) {
                    const analysisError = await analysisResponse.json().catch(() => ({}));
                    throw new Error(analysisError.error || 'Unable to create an analysis to attach images.');
                }

                const analysisData = await analysisResponse.json().catch(() => ({}));
                const createdAnalysisId = Number(analysisData?.analysisId);
                if (!Number.isFinite(createdAnalysisId)) {
                    throw new Error('analysisId is missing after analysis creation.');
                }

                analysisId = createdAnalysisId;
                setLatestProgressAnalysisId(createdAnalysisId);
            }

            if (uploadedSurveyImages.length > 0) {
                if (!analysisId) {
                    throw new Error('analysisId is required to save images.');
                }

                const storeResponse = await fetch('/api/quiz/image-survey', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        analysisId,
                        images: uploadedSurveyImages.map((item) => item.dataUrl),
                    }),
                });

                if (!storeResponse.ok) {
                    const storeError = await storeResponse.json().catch(() => ({}));
                    throw new Error(storeError.error || 'Unable to store images in the database.');
                }
            }

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    quizId,
                    model: selectedModel,
                    sessionId: questionnaireSessionIdRef.current,
                    answersSoFar,
                    imageParts: uploadedSurveyImages.map((img) => ({
                        inline_data: {
                            mime_type: img.mimeType,
                            data: img.base64,
                        },
                    })),
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || 'Image analysis request failed');
            }

            const result = parseN8nResult(await response.json());

            setIsImageStep(false);
            setPendingFinalResult(null);
            await finalizeAndSaveAnalysis((result && result.status === 'complete') ? result : pendingFinalResult);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Unable to finalize analysis with images: ${err.message || 'unknown error'}.`,
                },
            ]);
        } finally {
            setIsSubmittingImages(false);
        }
    };

    const skipImageStep = async () => {
        if (!pendingFinalResult) return;

        setIsSubmittingImages(true);
        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || 0,
                    quizId,
                    model: selectedModel,
                    sessionId: questionnaireSessionIdRef.current,
                    answersSoFar,
                    forceFinalAnalysis: true,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || 'Final analysis request failed');
            }

            const result = parseN8nResult(await response.json());
            setIsImageStep(false);
            setPendingFinalResult(null);
            await finalizeAndSaveAnalysis((result && result.status === 'complete') ? result : pendingFinalResult);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Unable to finalize analysis: ${err.message || 'unknown error'}.`,
                },
            ]);
        } finally {
            setIsSubmittingImages(false);
        }
    };

    const handleUserResponse = async (content: string, imageData?: string) => {
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
        setIsStreaming(true);

        fetchNextStep(updatedAnswers, newAnswer);
    };

    return (
        <UserLayout userName={session?.user?.name || "User"} userPhoto={session?.user?.image || "/avatar.png"}>
            <div className={`mx-auto w-full max-w-[800px] flex flex-col relative space-y-6 ${
                analysisResult ? "" : "h-[calc(100vh-180px)]"
            }`}>
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>User</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-medium">Skin Analysis</span>
                </nav>

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

                {/* Chat Area / Analysis Area */}
                <div
                    ref={scrollRef}
                    className={`space-y-6 pr-2 ${
                        analysisResult
                            ? "" // let <main> scroll naturally with mouse wheel
                            : "flex-1 overflow-y-auto pb-64 custom-scrollbar scroll-smooth" // chat mode: inner scroll
                    }`}
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
                            ref={analysisRef}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="space-y-5 mt-4 pb-10"
                        >
                            {/* ── Hero Score Banner ── */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 shadow-2xl shadow-purple-500/30">
                                {/* decorative blobs */}
                                <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-3xl" />
                                <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-white/10 blur-2xl" />

                                <div className="relative flex items-center gap-6">
                                    {/* Score Ring */}
                                    <div className="flex-shrink-0 relative size-24">
                                        <svg className="size-24 -rotate-90" viewBox="0 0 88 88">
                                            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                                            <motion.circle
                                                cx="44" cy="44" r="36"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 36}`}
                                                initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 36 * (1 - analysisResult.score / 100) }}
                                                transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-white leading-none">{analysisResult.score}</span>
                                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">/100</span>
                                        </div>
                                    </div>
                                    {/* Title */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="size-4 text-yellow-300" />
                                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Analysis Complete</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white leading-tight">Your Skin Score</h3>
                                        <p className="mt-1 text-sm text-white/70">
                                            {analysisResult.score >= 80 ? "Excellent skin health! Keep it up." :
                                             analysisResult.score >= 60 ? "Good health with room to improve." :
                                             "Your skin needs some extra care."}
                                        </p>
                                        {/* Stat pills */}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {analysisResult.skinType && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">
                                                    <Star className="size-3" /> {analysisResult.skinType}
                                                </span>
                                            )}
                                            {analysisResult.agePeau !== undefined && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">
                                                    <TrendingUp className="size-3" /> Age {analysisResult.agePeau}
                                                </span>
                                            )}
                                            {analysisResult.scoreEau !== undefined && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-bold">
                                                    <Droplets className="size-3" /> {analysisResult.scoreEau}/100
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Confidence Bar */}
                                {analysisResult.confidence ? (
                                    <div className="mt-5">
                                        <div className="flex justify-between text-xs text-white/60 mb-1 font-semibold">
                                            <span>Analysis Confidence</span>
                                            <span>{analysisResult.confidence}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-white"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${analysisResult.confidence}%` }}
                                                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* ── Personalized Analysis Text ── */}
                            {analysisResult.analysis && (
                                <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Award className="size-5 text-primary" />
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">Your Personalized Analysis</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {analysisResult.analysis.split('\n').filter(l => l.trim()).map((line, i) => (
                                            <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Strengths & Concerns Row ── */}
                            {(!!analysisResult.strengths?.length || !!analysisResult.concerns?.length) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {!!analysisResult.strengths?.length && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 p-5"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Strong Points</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {analysisResult.strengths.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <ChevronRight className="size-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-emerald-900 dark:text-emerald-200">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                    {!!analysisResult.concerns?.length && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.25 }}
                                            className="rounded-3xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/40 p-5"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />
                                                <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">Priority Concerns</h4>
                                            </div>
                                            <ul className="space-y-2">
                                                {analysisResult.concerns.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <ChevronRight className="size-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-rose-900 dark:text-rose-200">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* ── Immediate Recommendations ── */}
                            {!!analysisResult.recommendations?.immediate?.length && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 shadow-sm"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap className="size-5 text-amber-500" />
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Immediate Recommendations</h4>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {analysisResult.recommendations.immediate.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                                <div className="flex-shrink-0 size-5 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{idx + 1}</div>
                                                <span className="text-xs text-gray-700 dark:text-gray-300">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}

                            {/* ── Morning / Evening Routines ── */}
                            {(!!analysisResult.routine?.morning?.length || !!analysisResult.routine?.evening?.length) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {!!analysisResult.routine?.morning?.length && (
                                        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/40 p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="size-8 rounded-full bg-amber-400 flex items-center justify-center">
                                                    <Sun className="size-4 text-white" />
                                                </div>
                                                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Morning Routine</h4>
                                            </div>
                                              <ol className="space-y-4">
                                                {analysisResult.routine.morning.map((item, idx) => (
                                                  <li key={idx} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-amber-200/30">
                                                    <div className="flex items-start gap-2">
                                                      <span className="flex-shrink-0 size-4 rounded-full bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-[9px] font-black flex items-center justify-center mt-0.5">{idx + 1}</span>
                                                      <span className="text-xs text-amber-900 dark:text-amber-100 font-bold">{item}</span>
                                                    </div>
                                                    <RoutineItemScraper action={item} />
                                                  </li>
                                                ))}
                                              </ol>
                                        </div>
                                    )}
                                    {!!analysisResult.routine?.evening?.length && (
                                        <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/40 p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="size-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                                    <Moon className="size-4 text-white" />
                                                </div>
                                                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Evening Routine</h4>
                                            </div>
                                              <ol className="space-y-4">
                                                {analysisResult.routine.evening.map((item, idx) => (
                                                  <li key={idx} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-indigo-200/30">
                                                    <div className="flex items-start gap-2">
                                                      <span className="flex-shrink-0 size-4 rounded-full bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 text-[9px] font-black flex items-center justify-center mt-0.5">{idx + 1}</span>
                                                      <span className="text-xs text-indigo-900 dark:text-indigo-100 font-bold">{item}</span>
                                                    </div>
                                                    <RoutineItemScraper action={item} />
                                                  </li>
                                                ))}
                                              </ol>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── CTA ── */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <motion.button
                                    onClick={() => window.location.href = "/user/routines"}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/30 text-base"
                                >
                                    <Sparkles className="size-5" />
                                    View Routine
                                    <ArrowRight className="size-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => window.location.href = "/user/Analyzes"}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-all shadow-lg text-base"
                                >
                                    <History className="size-5 text-[#156d95]" />
                                    View History
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Interaction Overlay (at bottom) */}
                {!analysisResult && !isAnalyzing && (
                <div className="absolute bottom-0 left-0 right-0 py-10 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-[#0b0b0f] dark:via-[#0b0b0f]/95 z-20 pointer-events-none">
                    <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 pointer-events-none">
                        <AnimatePresence mode="wait">
                            {isImageStep && (
                                <motion.div
                                    key="image-step"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="w-full pointer-events-auto"
                                >
                                    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white">Add images for Gemini</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Maximum 5 images. Gallery, camera, or drag and drop.</p>
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                                {uploadedSurveyImages.length}/5
                                            </span>
                                        </div>

                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={onImageFileChange}
                                        />

                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={onImageFileChange}
                                        />

                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDraggingImages(true);
                                            }}
                                            onDragLeave={() => setIsDraggingImages(false)}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                setIsDraggingImages(false);
                                                if (e.dataTransfer.files?.length) {
                                                    await appendFiles(e.dataTransfer.files);
                                                }
                                            }}
                                            className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${
                                                isDraggingImages
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30'
                                            }`}
                                        >
                                            <div className="flex flex-col items-center text-center gap-2">
                                                <Upload className="size-6 text-primary" />
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Drag your images here</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">or use the buttons below</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => imageInputRef.current?.click()}
                                                disabled={uploadedSurveyImages.length >= 5}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold disabled:opacity-50"
                                            >
                                                <Upload className="size-3.5" />
                                                Add from gallery
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                disabled={uploadedSurveyImages.length >= 5}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold disabled:opacity-50"
                                            >
                                                <Camera className="size-3.5" />
                                                Take a photo
                                            </button>
                                        </div>

                                        {uploadedSurveyImages.length > 0 && (
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                {uploadedSurveyImages.map((img, index) => (
                                                    <div key={`${img.base64.slice(0, 12)}-${index}`} className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                                        <img src={img.dataUrl} alt={`survey-${index}`} className="h-20 w-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setUploadedSurveyImages((prev) => prev.filter((_, i) => i !== index))}
                                                            className="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                            aria-label="Remove"
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={skipImageStep}
                                                disabled={isSubmittingImages}
                                                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200"
                                            >
                                                Continue without images
                                            </button>
                                            <button
                                                type="button"
                                                onClick={submitImageStep}
                                                disabled={isSubmittingImages}
                                                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-60"
                                            >
                                                {isSubmittingImages ? 'Analyzing...' : 'Analyze with Gemini'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Choice UI */}
                            {!isImageStep && !isStreaming && currentQuestion?.type === "choice" && messages[messages.length - 1]?.role === "assistant" && (
                                <motion.div
                                    key="choices"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="pointer-events-auto flex flex-wrap justify-center gap-3"
                                >
                                    {currentQuestion.options?.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleUserResponse(opt.text)}
                                            className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-bold hover:border-primary hover:text-primary hover:shadow-2xl transition-all shadow-xl active:scale-95 flex items-center gap-3 group"
                                        >
                                            <div className="size-2.5 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-primary transition-colors"></div>
                                            {opt.text}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Text Input UI */}
                            {!isImageStep && !isStreaming && (currentQuestion?.type === "text" || !currentQuestion) && (messages[messages.length - 1]?.role === "assistant") && (
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
