"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { Composer, AIModel } from "@/app/components/user/Composer";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loader2, Award, Zap, Droplets, Sun, Moon, ShieldCheck, AlertTriangle, Sparkles, Star, TrendingUp, ChevronRight, ArrowRight, Upload, Camera, X, History, Lock, Crown, Clock3, Pencil, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { RoutineItemScraper } from "@/app/components/user/RoutineItemScraper";
import { CameraModal } from "@/app/components/user/CameraModal";
import { AudioToggleButton } from "@/app/components/user/AudioToggleButton";
import { useLocale, useTranslations } from "next-intl";

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
        detailedImmediate?: RecommendationDetail[];
        detailedWeekly?: RecommendationDetail[];
        detailedAvoid?: RecommendationDetail[];
    };
    routine?: {
        morning?: string[];
        evening?: string[];
        morningDetailed?: RoutineStepDetail[];
        eveningDetailed?: RoutineStepDetail[];
    };
    confidence?: number;
}

type RecommendationDetail = {
    title: string;
    description?: string;
    why?: string;
    how?: string;
    when?: string;
    frequency?: string;
    productType?: string;
    cautions?: string;
};

type RoutineStepDetail = {
    step?: number;
    name: string;
    purpose?: string;
    instruction?: string;
    why?: string;
    frequency?: string;
    timing?: string;
    notes?: string;
};

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
    recommendations?: unknown;
    routine?: unknown;
};

type AnalysisAccess = {
    loading: boolean;
    isPremium: boolean;
    canCreateAnalysis: boolean;
    nextAvailableAt: string | null;
    remainingMs: number;
    maxSurveyImages: number;
    productRecommendationsEnabled: boolean;
    autoRoutineEnabled: boolean;
};

// N8N Webhook Proxy URL
const N8N_WEBHOOK_URL = "/api/quiz/n8n";
const QUESTIONNAIRE_ROUTINE_FEEDBACK_HIDE_UNTIL_KEY = "deepskyn:questionnaire:routine-feedback:hideUntil";
const QUESTIONNAIRE_ROUTINE_FEEDBACK_HIDE_MS = 14 * 24 * 60 * 60 * 1000;

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

const keepAnalysisOnly = (rawAnalysis: string): string => {
    const normalized = String(rawAnalysis || "").trim();
    if (!normalized) return "";

    // Remove recommendation sections even when "Recommendations:" appears inline in a paragraph.
    const recommendationMarker = /(?:^|\s)(?:\*\*)?\s*(?:recommendations?|recommandations?)\s*:\s*(?:\*\*)?/i;
    const markerMatch = recommendationMarker.exec(normalized);
    const withoutRecommendationBlock = markerMatch
        ? normalized.slice(0, markerMatch.index).trim()
        : normalized;

    const cleaned = withoutRecommendationBlock
        .split("\n")
        .filter((line) => !/^\s*\d+\.\s*\*\*?(?:recommendations?|recommandations?)?/i.test(line))
        .join("\n")
        .trim();

    return cleaned;
};

const toReadableLabel = (value: string): string =>
    String(value || '')
        .replace(/\*\*/g, '')
        .replace(/["']/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const stringifyAnalysisValue = (value: unknown): string[] => {
    if (value == null) return [];

    if (typeof value === 'string') {
        const cleaned = value.trim();
        return cleaned ? [`* ${cleaned}`] : [];
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return [`* ${String(value)}`];
    }

    if (Array.isArray(value)) {
        return value
            .flatMap((entry) => {
                if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
                    const text = String(entry).trim();
                    return text ? [`* ${text}`] : [];
                }

                if (entry && typeof entry === 'object') {
                    const chunks: string[] = [];
                    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
                        const label = toReadableLabel(k);
                        if (!label) continue;

                        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                            const text = String(v).trim();
                            if (text) chunks.push(`${label}: ${text}`);
                        }
                    }

                    if (chunks.length > 0) {
                        return [`* ${chunks.join(' | ')}`];
                    }
                }

                return [];
            })
            .filter(Boolean);
    }

    if (typeof value === 'object') {
        const lines: string[] = [];
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            const label = toReadableLabel(k);
            if (!label) continue;

            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                const text = String(v).trim();
                if (text) lines.push(`* ${label}: ${text}`);
                continue;
            }

            if (Array.isArray(v)) {
                lines.push(`* ${label}:`);
                lines.push(...stringifyAnalysisValue(v));
                continue;
            }
        }

        return lines;
    }

    return [];
};

const normalizeAnalysisForDisplay = (raw: unknown): string => {
    const rawText = String(raw || '').trim();
    if (!rawText) return '';

    const cleanedRaw = keepAnalysisOnly(rawText);

    try {
        const parsed = JSON.parse(rawText) as Record<string, unknown>;
        const analysisPayload = parsed?.analysis;

        if (typeof analysisPayload === 'string') {
            return keepAnalysisOnly(analysisPayload);
        }

        if (analysisPayload && typeof analysisPayload === 'object') {
            const lines: string[] = [];
            for (const [sectionKey, sectionValue] of Object.entries(analysisPayload as Record<string, unknown>)) {
                const section = toReadableLabel(sectionKey);
                if (!section) continue;

                lines.push(`${section}`);
                const block = stringifyAnalysisValue(sectionValue);
                if (block.length > 0) {
                    lines.push(...block);
                }
            }

            const finalText = lines.join('\n').trim();
            if (finalText) return finalText;
        }

        const alternate = [parsed?.text, parsed?.summary, parsed?.message]
            .find((entry) => typeof entry === 'string' && String(entry).trim()) as string | undefined;
        if (alternate) return keepAnalysisOnly(alternate);
    } catch {
        // Not JSON - keep existing markdown/text format.
    }

    return cleanedRaw;
};

const extractAnalysisText = (value: unknown): string => {
    if (typeof value === 'string') {
        return normalizeAnalysisForDisplay(value);
    }

    if (!value || typeof value !== 'object') return '';

    const source = value as Record<string, unknown>;
    const candidates = [
        source.analysis,
        source.text,
        source.content,
        source.summary,
        source.message,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return normalizeAnalysisForDisplay(candidate);
        }
    }

    return '';
};

const isGenericAnalysisText = (value: string): boolean => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return true;

    const genericPatterns = [
        'analysis complete.',
        'analysis complete',
        'skin analysis is ready.',
        'skin analysis is ready',
        'questionnaire completed. ready for final gemini analysis.',
        'questionnaire complete',
    ];

    return genericPatterns.some((pattern) => normalized === pattern);
};

const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
                const candidate = item as { title?: unknown; name?: unknown; text?: unknown };
                const first = [candidate.title, candidate.name, candidate.text].find((entry) => typeof entry === 'string');
                return typeof first === 'string' ? first.trim() : '';
            }
            return '';
        })
        .filter(Boolean);
};

const normalizeRecommendationDetails = (value: unknown): RecommendationDetail[] => {
    if (!Array.isArray(value)) return [];

    const normalized: RecommendationDetail[] = [];

    value.forEach((item) => {
        if (typeof item === 'string') {
            const label = item.trim();
            if (!label) return;
            normalized.push({ title: label });
            return;
        }

        if (!item || typeof item !== 'object') return;

        const raw = item as Record<string, unknown>;
        const title = String(raw.title || raw.name || raw.product || raw.action || '').trim();
        if (!title) return;

        normalized.push({
            title,
            description: String(raw.description || raw.desc || '').trim() || undefined,
            why: String(raw.why || raw.reason || raw.benefit || '').trim() || undefined,
            how: String(raw.how || raw.usage || raw.instructions || '').trim() || undefined,
            when: String(raw.when || raw.timing || '').trim() || undefined,
            frequency: String(raw.frequency || raw.freq || '').trim() || undefined,
            productType: String(raw.productType || raw.type || '').trim() || undefined,
            cautions: String(raw.cautions || raw.warning || raw.warnings || '').trim() || undefined,
        });
    });

    return normalized;
};

const normalizeRoutineDetails = (value: unknown): RoutineStepDetail[] => {
    if (!Array.isArray(value)) return [];

    const normalized: RoutineStepDetail[] = [];

    value.forEach((item, index) => {
        if (typeof item === 'string') {
            const name = item.trim();
            if (!name) return;
            normalized.push({ step: index + 1, name });
            return;
        }

        if (!item || typeof item !== 'object') return;

        const raw = item as Record<string, unknown>;
        const name = String(raw.name || raw.title || raw.action || '').trim();
        if (!name) return;

        normalized.push({
            step: Number(raw.step) > 0 ? Number(raw.step) : index + 1,
            name,
            purpose: String(raw.purpose || raw.goal || '').trim() || undefined,
            instruction: String(raw.instruction || raw.how || raw.usage || '').trim() || undefined,
            why: String(raw.why || raw.reason || '').trim() || undefined,
            frequency: String(raw.frequency || raw.freq || '').trim() || undefined,
            timing: String(raw.timing || raw.when || '').trim() || undefined,
            notes: String(raw.notes || raw.note || '').trim() || undefined,
        });
    });

    return normalized;
};

const normalizeN8nRecommendations = (result: Record<string, unknown>) => {
    const source = (result.recommendations && typeof result.recommendations === 'object')
        ? (result.recommendations as Record<string, unknown>)
        : {};

    const immediate = toStringList(source.immediate);
    const weekly = toStringList(source.weekly);
    const avoid = toStringList(source.avoid);

    const detailedImmediate = normalizeRecommendationDetails(
        source.detailedImmediate || source.immediateDetailed || source.immediateItems || source.itemsImmediate
    );
    const detailedWeekly = normalizeRecommendationDetails(
        source.detailedWeekly || source.weeklyDetailed || source.weeklyItems || source.itemsWeekly
    );
    const detailedAvoid = normalizeRecommendationDetails(
        source.detailedAvoid || source.avoidDetailed || source.avoidItems || source.itemsAvoid
    );

    const hasContent =
        immediate.length > 0 ||
        weekly.length > 0 ||
        avoid.length > 0 ||
        detailedImmediate.length > 0 ||
        detailedWeekly.length > 0 ||
        detailedAvoid.length > 0;

    if (!hasContent) return undefined;

    return {
        immediate,
        weekly,
        avoid,
        detailedImmediate,
        detailedWeekly,
        detailedAvoid,
    };
};

const normalizeN8nRoutine = (result: Record<string, unknown>) => {
    const source = (result.routine && typeof result.routine === 'object')
        ? (result.routine as Record<string, unknown>)
        : {};

    const morningDetailed = normalizeRoutineDetails(
        source.morningDetailed || source.morningSteps || source.morning
    );
    const eveningDetailed = normalizeRoutineDetails(
        source.eveningDetailed || source.eveningSteps || source.evening
    );

    const morning = toStringList(source.morning);
    const evening = toStringList(source.evening);

    const hasContent =
        morning.length > 0 ||
        evening.length > 0 ||
        morningDetailed.length > 0 ||
        eveningDetailed.length > 0;

    if (!hasContent) return undefined;

    return {
        morning: morning.length > 0 ? morning : morningDetailed.map((item) => item.name),
        evening: evening.length > 0 ? evening : eveningDetailed.map((item) => item.name),
        morningDetailed,
        eveningDetailed,
    };
};

export default function QuestionnairePage() {
    const t = useTranslations("userQuestionnaire");
    const locale = useLocale();
    const { data: session, status: sessionStatus } = useSession();
    const parsedUserId = session?.user?.id ? Number(session.user.id) : NaN;
    const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;

    const [selectedModel, setSelectedModel] = useState<AIModel>("google/gemini-2.0-flash-001");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; image?: string }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImageStep, setIsImageStep] = useState(false);
    const [isSubmittingImages, setIsSubmittingImages] = useState(false);
    const [imageStepAlert, setImageStepAlert] = useState<string | null>(null);
    const [topSuccessAlert, setTopSuccessAlert] = useState<string | null>(null);
    const [pendingFinalResult, setPendingFinalResult] = useState<Record<string, unknown> | null>(null);
    const [uploadedSurveyImages, setUploadedSurveyImages] = useState<UploadedSurveyImage[]>([]);
    const [isDraggingImages, setIsDraggingImages] = useState(false);
    const [latestProgressAnalysisId, setLatestProgressAnalysisId] = useState<number | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [answersSoFar, setAnswersSoFar] = useState<{ questionId: number; answer: string }[]>([]);
    const [questionFlow, setQuestionFlow] = useState<Question[]>([]);
    const [selectedChoiceOptionIds, setSelectedChoiceOptionIds] = useState<string[]>([]);
    const [editingAnswerIndex, setEditingAnswerIndex] = useState<number | null>(null);
    const [returnQuestionAfterEdit, setReturnQuestionAfterEdit] = useState<Question | null>(null);
    const [quizId, setQuizId] = useState<number>(1);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<number | string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<"questionnaire" | "photos-only">("questionnaire");
    const [analysisAccess, setAnalysisAccess] = useState<AnalysisAccess>({
        loading: true,
        isPremium: false,
        canCreateAnalysis: true,
        nextAvailableAt: null,
        remainingMs: 0,
        maxSurveyImages: 1,
        productRecommendationsEnabled: false,
        autoRoutineEnabled: false,
    });
    const [showPostAnalysisFeedbackModal, setShowPostAnalysisFeedbackModal] = useState(false);
    const [redirectToRoutineAfterFeedback, setRedirectToRoutineAfterFeedback] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackPublish, setFeedbackPublish] = useState(true);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackSaved, setFeedbackSaved] = useState(false);
    const questionnaireSessionIdRef = useRef(`qs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const topSuccessAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const questionnaireContainerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const analysisRef = useRef<HTMLDivElement>(null);
    const editableQuestionRefs = useRef<Record<number, HTMLButtonElement | null>>({});
    const questionFlowRef = useRef<Question[]>([]);
    const maxSurveyImages = Math.max(1, analysisAccess.maxSurveyImages || 1);
    const n8nAnalyzingMessage = locale.startsWith("fr")
        ? "Analyse en cours. Veuillez patienter..."
        : locale.startsWith("ar")
            ? "التحليل قيد التقدم. يرجى الانتظار..."
            : "Analysis in progress. Please wait...";

    useEffect(() => {
        return () => {
            if (topSuccessAlertTimerRef.current) {
                clearTimeout(topSuccessAlertTimerRef.current);
            }
        };
    }, []);

    const getImageValidationToastMessage = (code?: string, fallback?: string): string => {
        switch (code) {
            case 'FACE_NOT_DETECTED':
                return t('toasts.faceNotDetected');
            case 'MULTIPLE_FACES':
                return t('toasts.multipleFacesDetected');
            case 'FACE_NOT_FRONTAL':
                return t('toasts.faceNotFrontal');
            case 'IMAGE_BLURRY':
                return t('toasts.imageBlurry');
            case 'BAD_FRAMING':
                return t('toasts.badFraming');
            case 'FACE_API_NOT_CONFIGURED':
                return t('toasts.faceApiNotConfigured');
            case 'FACE_API_AUTH_ERROR':
                return t('toasts.faceApiAuthError');
            case 'FACE_API_ERROR':
                return fallback || t('toasts.faceApiError');
            default:
                return fallback || t('toasts.invalidImageForAnalysis');
        }
    };

    const rebuildMessages = useCallback(
        (answers: { questionId: number; answer: string }[], flow: Question[], nextAssistantMessage?: string) => {
            const rebuilt: { role: "assistant" | "user"; content: string; image?: string }[] = [];

            answers.forEach((answer, index) => {
                const question = flow[index];
                if (question?.text) {
                    rebuilt.push({ role: "assistant", content: question.text });
                }
                rebuilt.push({ role: "user", content: answer.answer });
            });

            if (nextAssistantMessage) {
                rebuilt.push({ role: "assistant", content: nextAssistantMessage });
            }

            return rebuilt;
        },
        []
    );

    const buildDedupedFlow = useCallback(
        (answersCount: number, nextQuestion: Question) => {
            const baseFlow = questionFlowRef.current.slice(0, answersCount);

            // Never append a question that was already asked to avoid duplicated prompts.
            if (baseFlow.some((q) => Number(q.id) === Number(nextQuestion.id))) {
                return baseFlow;
            }

            const lastQuestion = baseFlow[baseFlow.length - 1];
            if (lastQuestion && Number(lastQuestion.id) === Number(nextQuestion.id)) {
                return baseFlow;
            }

            return [...baseFlow, nextQuestion];
        },
        []
    );

    const scrollToQuestionnaireBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (typeof window === "undefined") return;

        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior,
                });
            }

            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior,
            });
        });
    }, []);

    useEffect(() => {
        if (sessionStatus === "loading") return;

        if (sessionStatus !== "authenticated") {
            setAnalysisAccess((prev) => ({
                ...prev,
                loading: false,
                canCreateAnalysis: false,
            }));
            return;
        }

        let cancelled = false;

        const fetchAnalysisAccess = async () => {
            try {
                const response = await fetch('/api/quiz/skin-score', { method: 'GET' });
                if (!response.ok) {
                    throw new Error(t('errors.loadAccessStatus'));
                }

                const data = await response.json();
                if (cancelled) return;

                setAnalysisAccess({
                    loading: false,
                    isPremium: Boolean(data?.isPremium),
                    canCreateAnalysis: Boolean(data?.canCreateAnalysis),
                    nextAvailableAt: data?.nextAvailableAt ? String(data.nextAvailableAt) : null,
                    remainingMs: Number(data?.remainingMs || 0),
                    maxSurveyImages: Number(data?.limits?.maxSurveyImages || 1),
                    productRecommendationsEnabled: Boolean(data?.limits?.productRecommendationsEnabled),
                    autoRoutineEnabled: Boolean(data?.limits?.autoRoutineEnabled),
                });
            } catch (error) {
                console.error('Failed to fetch analysis access:', error);
                if (cancelled) return;

                setAnalysisAccess((prev) => ({
                    ...prev,
                    loading: false,
                }));
            }
        };

        fetchAnalysisAccess();

        return () => {
            cancelled = true;
        };
    }, [sessionStatus, t]);

    const finalizeAndSaveAnalysis = async (result: Record<string, unknown>) => {
        setCurrentQuestion(null);
        setIsAnalyzing(true);

        const startedAt = Date.now();

        try {
            let computed: Partial<AnalysisResult> | null = null;
            const parsedN8nRecommendations = normalizeN8nRecommendations(result);
            const parsedN8nRoutine = normalizeN8nRoutine(result);
            const incomingAnalysis = extractAnalysisText(result.analysis);
            const hasIncomingAnalysis = incomingAnalysis.length > 0 && !isGenericAnalysisText(incomingAnalysis);

            if (userId) {
                const incomingScore = Number(result.score);
                const response = await fetch('/api/quiz/skin-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        quizId,
                        // Keep old logic: prioritize detailed final analysis from n8n when valid.
                        finalSummaryOverride: hasIncomingAnalysis ? incomingAnalysis : '',
                        finalScoreOverride: Number.isFinite(incomingScore) ? incomingScore : undefined,
                        finalRecommendationsOverride: parsedN8nRecommendations,
                        finalRoutineOverride: parsedN8nRoutine,
                        mode: analysisMode === 'photos-only' ? 'images-only' : 'questionnaire',
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
                        recommendations: (data.recommendations && typeof data.recommendations === 'object')
                            ? (data.recommendations as AnalysisResult['recommendations'])
                            : undefined,
                        routine: (data.routine && typeof data.routine === 'object')
                            ? (data.routine as AnalysisResult['routine'])
                            : undefined,
                        confidence: Number(data.confidence || 0),
                    };
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    if (response.status === 429) {
                        setAnalysisAccess((prev) => ({
                            ...prev,
                            loading: false,
                            canCreateAnalysis: false,
                            nextAvailableAt: errorData?.nextAvailableAt ? String(errorData.nextAvailableAt) : prev.nextAvailableAt,
                            remainingMs: Number(errorData?.remainingMs || prev.remainingMs || 0),
                        }));
                        toast.error(errorData?.error || 'Vous avez atteint la limite d\'une analyse par 24h.');
                        return;
                    }

                    throw new Error(errorData?.error || 'Failed to compute analysis score.');
                }
            }

            const incomingScore = Number(result.score);
            const hasIncomingScore = Number.isFinite(incomingScore);

            const fallbackScore = hasIncomingScore ? incomingScore : 85;

            const elapsed = Date.now() - startedAt;
            const minLoaderDuration = 1200;
            if (elapsed < minLoaderDuration) {
                await new Promise((resolve) => setTimeout(resolve, minLoaderDuration - elapsed));
            }

            setAnalysisResult({
                analysis: hasIncomingAnalysis
                    ? incomingAnalysis
                    : normalizeAnalysisForDisplay(String(computed?.analysis || t('analysis.complete'))),
                score: Number.isFinite(computed?.score)
                    ? Number(computed?.score)
                    : fallbackScore,
                scoreEau: computed?.scoreEau,
                agePeau: computed?.agePeau,
                skinType: computed?.skinType,
                strengths: computed?.strengths,
                concerns: computed?.concerns,
                recommendations: parsedN8nRecommendations || computed?.recommendations,
                routine: parsedN8nRoutine || computed?.routine,
                confidence: computed?.confidence,
            });
        } catch (error) {
            console.error('❌ Finalize analysis error:', error);
            const incomingAnalysis = extractAnalysisText(result.analysis);
            setAnalysisResult({
                analysis: normalizeAnalysisForDisplay(incomingAnalysis || t('analysis.complete')),
                score: Number(result.score || 85)
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const stopSpeaking = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
        }
    }, []);

    const speakQuestion = useCallback((text: string, index: number | string) => {
        if (typeof window === 'undefined') return;

        if (speakingIndex === index) {
            stopSpeaking();
            return;
        }

        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);

        // Dynamic language detection
        if (/[\u0600-\u06FF]/.test(text)) {
            utterance.lang = 'ar-SA';
        } else if (/[éèàùâêîôûëïü]/.test(text.toLowerCase())) {
            utterance.lang = 'fr-FR';
        } else {
            utterance.lang = 'en-US';
        }

        utterance.rate = 1.0; // Slightly faster for a modern feel
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setSpeakingIndex(null);
        };

        utterance.onerror = () => {
            setSpeakingIndex(null);
        };

        setSpeakingIndex(index);
        window.speechSynthesis.speak(utterance);
    }, [speakingIndex, stopSpeaking]);

    // Auto-read new question and its suggestions/options if enabled
    useEffect(() => {
        if (autoSpeech && currentQuestion && !analysisResult) {
            let fullText = currentQuestion.text;

            // Read options if they exist
            if (currentQuestion.type === "choice" && currentQuestion.options && currentQuestion.options.length > 0) {
                const isFrench = /[éèàùâêîôûëïü]/.test(fullText.toLowerCase()) ||
                    fullText.toLowerCase().includes('votre') ||
                    fullText.toLowerCase().includes('analyse');

                const prefix = isFrench ? ". Suggestions : " : ". Suggestions are: ";
                const optionsText = currentQuestion.options.map(opt => opt.text).join(", ");
                fullText += prefix + optionsText;
            }

            if (speakingIndex !== `q-${currentQuestion.id}`) {
                speakQuestion(fullText, `q-${currentQuestion.id}`);
            }
        }
    }, [currentQuestion, autoSpeech, analysisResult, speakQuestion, speakingIndex]);

    // Read analysis automatically if it just appeared
    useEffect(() => {
        if (autoSpeech && analysisResult && analysisResult.analysis && speakingIndex !== "analysis") {
            speakQuestion(analysisResult.analysis, "analysis");
        }
    }, [analysisResult, autoSpeech, speakQuestion, speakingIndex]);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const continueToRoutine = () => {
        window.location.href = "/user/routines";
    };

    const getRoutineFeedbackHideUntil = () => {
        if (typeof window === "undefined") return 0;
        const rawValue = window.localStorage.getItem(QUESTIONNAIRE_ROUTINE_FEEDBACK_HIDE_UNTIL_KEY);
        const parsedValue = Number(rawValue || 0);
        return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const setRoutineFeedbackHideUntil = (delayMs = QUESTIONNAIRE_ROUTINE_FEEDBACK_HIDE_MS) => {
        if (typeof window === "undefined") return;
        const hideUntil = Date.now() + delayMs;
        window.localStorage.setItem(QUESTIONNAIRE_ROUTINE_FEEDBACK_HIDE_UNTIL_KEY, String(hideUntil));
    };

    const openRoutineFeedbackModal = () => {
        const hideUntil = getRoutineFeedbackHideUntil();
        if (hideUntil > Date.now()) {
            continueToRoutine();
            return;
        }

        setRedirectToRoutineAfterFeedback(true);
        setFeedbackSaved(false);
        setShowPostAnalysisFeedbackModal(true);
    };

    const closeRoutineFeedbackModalAndContinue = () => {
        setShowPostAnalysisFeedbackModal(false);
        setRoutineFeedbackHideUntil();
        if (redirectToRoutineAfterFeedback) {
            setRedirectToRoutineAfterFeedback(false);
            continueToRoutine();
        }
    };

    const submitPostAnalysisFeedback = async (e: React.FormEvent) => {
        e.preventDefault();

        if (feedbackRating < 1 || feedbackRating > 5) {
            toast.error("Please choose a rating between 1 and 5.");
            return;
        }

        if (feedbackMessage.trim().length > 400) {
            toast.error("Message must be 400 characters or less.");
            return;
        }

        setFeedbackSubmitting(true);
        setFeedbackSaved(false);
        try {
            const response = await fetch('/api/user/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: feedbackRating,
                    message: feedbackMessage.trim(),
                    publish: feedbackPublish,
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || 'Failed to save feedback.');
            }

            setFeedbackSaved(true);
            setFeedbackMessage("");
            setShowPostAnalysisFeedbackModal(false);
            setRoutineFeedbackHideUntil();
            if (redirectToRoutineAfterFeedback) {
                setRedirectToRoutineAfterFeedback(false);
                continueToRoutine();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to save feedback.';
            toast.error(message);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    // Initial call to get the first question
    useEffect(() => {
        if (
            sessionStatus === "authenticated" &&
            !analysisAccess.loading &&
            analysisAccess.canCreateAnalysis &&
            messages.length === 0 &&
            !isStreaming &&
            !currentQuestion &&
            !analysisResult
        ) {
            console.log("🚀 Starting initial questionnaire fetch...");
            fetchNextStep([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus, analysisAccess.loading, analysisAccess.canCreateAnalysis]);

    // Scroll to bottom during chat — but NOT once the analysis result is shown
    useEffect(() => {
        if (analysisResult) return; // let the user scroll freely
        scrollToQuestionnaireBottom("smooth");
    }, [messages, isStreaming, isAnalyzing, analysisResult, currentQuestion, scrollToQuestionnaireBottom]);

    // When analysis first appears, scroll to the analysis section
    useEffect(() => {
        if (analysisResult && analysisRef.current) {
            setTimeout(() => {
                analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [analysisResult]);

    useEffect(() => {
        if (!currentQuestion || currentQuestion.type !== "choice") {
            setSelectedChoiceOptionIds([]);
            return;
        }

        const existingAnswer = answersSoFar.find((item) => item.questionId === currentQuestion.id)?.answer;
        if (!existingAnswer || !currentQuestion.options?.length) {
            setSelectedChoiceOptionIds([]);
            return;
        }

        const normalizedTokens = existingAnswer
            .split(',')
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);

        const matchedIds = currentQuestion.options
            .filter((opt) => normalizedTokens.includes(opt.text.trim().toLowerCase()))
            .map((opt) => opt.id);

        setSelectedChoiceOptionIds(matchedIds);
    }, [currentQuestion, answersSoFar]);

    useEffect(() => {
        questionFlowRef.current = questionFlow;
    }, [questionFlow]);

    useEffect(() => {
        if (editingAnswerIndex === null) return;

        const targetQuestionBubble = editableQuestionRefs.current[editingAnswerIndex];
        if (!targetQuestionBubble) return;

        targetQuestionBubble.scrollIntoView({ behavior: "smooth", block: "center" });
        targetQuestionBubble.focus();
    }, [editingAnswerIndex]);

    useEffect(() => {
        const container = questionnaireContainerRef.current;
        if (!container) return;

        const onWheel = (event: WheelEvent) => {
            if (analysisResult) return;

            const chatContainer = scrollRef.current;
            if (!chatContainer) return;

            const maxScrollTop = Math.max(0, chatContainer.scrollHeight - chatContainer.clientHeight);
            if (maxScrollTop <= 0) return;

            event.preventDefault();
            event.stopPropagation();

            const nextScrollTop = Math.min(
                maxScrollTop,
                Math.max(0, chatContainer.scrollTop + event.deltaY)
            );

            chatContainer.scrollTop = nextScrollTop;
        };

        container.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            container.removeEventListener("wheel", onWheel);
        };
    }, [analysisResult]);

    const handleSkipToPhotos = () => {
        setAnalysisMode("photos-only");
        setIsImageStep(true);
        setCurrentQuestion(null);
        setPendingFinalResult({ status: "complete" });

        const skipMsg = t('skip.message') || "Direct analysis with photos. Add your images below.";
        setMessages([{ role: "assistant", content: skipMsg }]);
        
        if (questionnaireContainerRef.current) {
            questionnaireContainerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                outputMode: "analysis_only",
                includeRecommendations: false,
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
                const normalizedQuestion: Question = {
                    id: normalizedQuestionId,
                    text: normalizedQuestionText,
                    type: normalizeQuestionType(nextQ.type),
                    options: normalizeOptions(nextQ.options),
                    quizId: nextQ.quizId
                };
                const nextFlow = buildDedupedFlow(currentAnswers.length, normalizedQuestion);
                const existingPendingQuestion = questionFlowRef.current[currentAnswers.length];
                const questionToDisplay = nextFlow[currentAnswers.length] || existingPendingQuestion || normalizedQuestion;

                setCurrentQuestion({
                    ...questionToDisplay,
                });
                setQuestionFlow(nextFlow);
                if (nextQ.quizId) setQuizId(nextQ.quizId);
                setMessages(rebuildMessages(currentAnswers, nextFlow, questionToDisplay.text));
            } else if (result && result.status === "complete") {
                setPendingFinalResult(result as Record<string, unknown>);
                setIsImageStep(true);
                setCurrentQuestion(null);
                const completionMessage = `Quiz complete. Add up to ${maxSurveyImages} image${maxSurveyImages > 1 ? 's' : ''} (drag and drop, gallery, or camera) to enrich the Gemini analysis.`;
                setMessages(rebuildMessages(currentAnswers, questionFlowRef.current, completionMessage));
            } else {
                console.warn("⚠️ Unexpected n8n format or empty response", result);
                if (messages.length === 0) {
                    setMessages(prev => [...prev, { role: "assistant", content: t('messages.ready') }]);
                }
            }
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("❌ Fetch next step error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: t('messages.connectionError', { error: err.message || t('errors.unexpected') }) }]);
        } finally {
            setIsStreaming(false);
        }
    };

    const appendFiles = async (incomingFiles: FileList | File[]) => {
        const files = Array.from(incomingFiles).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;

        const remaining = maxSurveyImages - uploadedSurveyImages.length;
        if (remaining <= 0) {
            toast.error(t('toasts.maxImages', { count: maxSurveyImages }));
            return;
        }

        if (files.length > remaining) {
            toast.warning(t('toasts.maxImagesWarning', { count: maxSurveyImages }));
        }

        const selected = files.slice(0, remaining);
        const converted: UploadedSurveyImage[] = [];

        for (const file of selected) {
            const dataUrl = await fileToCompressedDataUrl(file);
            const parsed = dataUrlToInlinePart(dataUrl);
            if (parsed) converted.push(parsed);
        }

        setUploadedSurveyImages((prev) => [...prev, ...converted].slice(0, maxSurveyImages));
    };

    const onImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setImageStepAlert(null);
            await appendFiles(files);
        }
        event.target.value = '';
    };

    const handleCameraCapture = async (dataUrl: string) => {
        const parsed = dataUrlToInlinePart(dataUrl);
        if (parsed) {
            setImageStepAlert(null);
            // Check limits again just in case
            if (uploadedSurveyImages.length >= maxSurveyImages) {
                toast.error(t('toasts.maxImages', { count: maxSurveyImages }));
                return;
            }
            setUploadedSurveyImages((prev) => [...prev, parsed].slice(0, maxSurveyImages));
            const successMessage = t('toasts.photoCaptured');
            setTopSuccessAlert(successMessage);

            if (topSuccessAlertTimerRef.current) {
                clearTimeout(topSuccessAlertTimerRef.current);
            }

            topSuccessAlertTimerRef.current = setTimeout(() => {
                setTopSuccessAlert(null);
            }, 2600);
        }
    };

    const submitImageStep = async () => {
        if (!pendingFinalResult) {
            return;
        }

        if (!userId) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: t('messages.userSessionMissing') },
            ]);
            return;
        }

        setIsSubmittingImages(true);
        setImageStepAlert(null);
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
                    throw new Error(analysisError.error || t('errors.createAnalysisForImages'));
                }

                const analysisData = await analysisResponse.json().catch(() => ({}));
                const createdAnalysisId = Number(analysisData?.analysisId);
                if (!Number.isFinite(createdAnalysisId)) {
                    throw new Error(t('errors.analysisIdMissingAfterCreate'));
                }

                analysisId = createdAnalysisId;
                setLatestProgressAnalysisId(createdAnalysisId);
            }

            if (uploadedSurveyImages.length > 0) {
                if (!analysisId) {
                    throw new Error(t('errors.analysisIdRequired'));
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

                    const readableError = getImageValidationToastMessage(
                        typeof storeError?.code === 'string' ? storeError.code : undefined,
                        typeof storeError?.error === 'string' ? storeError.error : undefined
                    );

                    setImageStepAlert(readableError);

                    if (storeError?.code) {
                        return;
                    }

                    throw new Error(storeError.error || t('errors.storeImages'));
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
                    outputMode: "analysis_only",
                    includeRecommendations: true,
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
                throw new Error(errData.detail || errData.error || t('errors.imageAnalysisFailed'));
            }

            const result = parseN8nResult(await response.json());

            setIsImageStep(false);
            setPendingFinalResult(null);
            await finalizeAndSaveAnalysis((result && result.status === 'complete') ? result : pendingFinalResult);
        } catch (error: unknown) {
            const err = error as { message?: string };
            setImageStepAlert(t('messages.finalizeWithImagesError', { error: err.message || t('errors.unknown') }));
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
                    outputMode: "analysis_only",
                    includeRecommendations: true,
                    answersSoFar,
                    forceFinalAnalysis: true,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || t('errors.finalAnalysisFailed'));
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
                    content: t('messages.finalizeError', { error: err.message || t('errors.unknown') }),
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
        scrollToQuestionnaireBottom("auto");

        if (editingAnswerIndex !== null) {
            const updatedAnswers = answersSoFar.map((item, idx) =>
                idx === editingAnswerIndex
                    ? { ...item, answer: content }
                    : item
            );

            const nextQuestion = returnQuestionAfterEdit;
            setAnswersSoFar(updatedAnswers);
            setEditingAnswerIndex(null);
            setReturnQuestionAfterEdit(null);

            if (nextQuestion) {
                setCurrentQuestion(nextQuestion);
                setMessages(rebuildMessages(updatedAnswers, questionFlow, nextQuestion.text));
                scrollToQuestionnaireBottom("auto");
            } else {
                setMessages(rebuildMessages(updatedAnswers, questionFlow));
                scrollToQuestionnaireBottom("auto");
            }

            return;
        }

        const newAnswer = { questionId: currentQuestion.id, answer: content };
        const updatedAnswers = [...answersSoFar, newAnswer];

        console.log("✅ State updated with new answer. Calling fetchNextStep...");
        setAnswersSoFar(updatedAnswers);
        setIsStreaming(true);

        fetchNextStep(updatedAnswers, newAnswer);
    };

    const handleChoiceToggle = (optionId: string) => {
        setSelectedChoiceOptionIds((prev) =>
            prev.includes(optionId)
                ? prev.filter((id) => id !== optionId)
                : [...prev, optionId]
        );
    };

    const submitChoiceSelection = () => {
        if (!currentQuestion || currentQuestion.type !== "choice") return;

        const selectedOptions = (currentQuestion.options || []).filter((opt) => selectedChoiceOptionIds.includes(opt.id));
        if (selectedOptions.length === 0) {
            toast.error("Choisissez au moins une reponse.");
            return;
        }

        const formattedAnswer = selectedOptions.map((opt) => opt.text).join(", ");
        handleUserResponse(formattedAnswer);
    };

    const handleGoBackToPreviousQuestion = () => {
        if (isStreaming || isAnalyzing || isImageStep || answersSoFar.length === 0) return;

        const previousQuestionIndex = answersSoFar.length - 1;
        const previousQuestion = questionFlow[previousQuestionIndex];
        if (!previousQuestion) return;

        const truncatedAnswers = answersSoFar.slice(0, previousQuestionIndex);
        setAnswersSoFar(truncatedAnswers);
        setCurrentQuestion(previousQuestion);
        setMessages(rebuildMessages(truncatedAnswers, questionFlow, previousQuestion.text));
    };

    const handleEditAnswerAt = (answerIndex: number) => {
        if (isStreaming || isAnalyzing || isImageStep) return;
        if (answerIndex < 0 || answerIndex >= answersSoFar.length) return;

        const targetQuestion = questionFlow[answerIndex];
        if (!targetQuestion) return;

        const pendingQuestion = questionFlow[answersSoFar.length] || currentQuestion;
        setEditingAnswerIndex(answerIndex);
        setReturnQuestionAfterEdit(pendingQuestion || null);
        setCurrentQuestion(targetQuestion);
        setMessages(rebuildMessages(answersSoFar, questionFlow));
    };

    const cancelEditMode = () => {
        if (editingAnswerIndex === null) return;

        setEditingAnswerIndex(null);
        setReturnQuestionAfterEdit(null);

        const pendingQuestion = questionFlow[answersSoFar.length] || returnQuestionAfterEdit || currentQuestion;
        if (pendingQuestion) {
            setCurrentQuestion(pendingQuestion);
            setMessages(rebuildMessages(answersSoFar, questionFlow, pendingQuestion.text));
            return;
        }

        setMessages(rebuildMessages(answersSoFar, questionFlow));
    };

    return (
        <UserLayout userName={session?.user?.name || t('userDefaultName')} userPhoto={session?.user?.image || "/avatar.png"}>
            {topSuccessAlert && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-1000000 w-[min(92vw,640px)] rounded-2xl border border-emerald-300 bg-emerald-500 text-white shadow-2xl px-5 py-4">
                    <div className="flex items-center gap-3">
                        <CircleCheck className="size-5 shrink-0" />
                        <p className="text-base font-semibold">{topSuccessAlert}</p>
                    </div>
                </div>
            )}
            <div
                ref={questionnaireContainerRef}
                className="mx-auto w-full max-w-[800px] flex flex-col relative space-y-6"
            >
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>{t('breadcrumb.user')}</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-medium">{t('breadcrumb.skinAnalysis')}</span>
                </nav>

                {/* Header with Progress */}
                <div className="mb-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('header.title')}
                            </h2>
                            <AudioToggleButton
                                enabled={autoSpeech}
                                onToggle={() => {
                                    if (autoSpeech) stopSpeaking();
                                    setAutoSpeech(!autoSpeech);
                                }}
                            />
                        </div>
                        {!analysisResult && analysisAccess.canCreateAnalysis && (
                            <div className="flex items-center gap-2">
                                {!isImageStep && (
                                    <button
                                        onClick={handleSkipToPhotos}
                                        className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full"
                                    >
                                        <ChevronRight className="size-3" />
                                        {t('skip.button')}
                                    </button>
                                )}
                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {t('header.questions', { count: answersSoFar.length + (currentQuestion ? 1 : 0) })}
                                </span>
                            </div>
                        )}
                    </div>
                    {!analysisResult && analysisAccess.canCreateAnalysis && (
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

                {!analysisAccess.loading && !analysisResult && !analysisAccess.canCreateAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-amber-200 bg-amber-50/80 dark:bg-amber-900/10 dark:border-amber-800/40 p-6 shadow-sm"
                    >
                        <div className="flex items-start gap-4">
                            <div className="size-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Lock className="size-5 text-amber-700 dark:text-amber-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-black text-amber-900 dark:text-amber-200">{t('limit.title')}</h3>
                                <p className="text-sm mt-1 text-amber-800 dark:text-amber-300">
                                    {t('limit.description')}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-black/20 text-amber-800 dark:text-amber-200">
                                        <Clock3 className="size-3.5" />
                                        {t('limit.nextAnalysis')}: {analysisAccess.nextAvailableAt ? new Date(analysisAccess.nextAvailableAt).toLocaleString() : t('limit.lessThan24h')}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = '/user/analyzes'}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-xs font-bold text-amber-900 dark:text-amber-200"
                                    >
                                        <History className="size-3.5" />
                                        {t('limit.viewMyAnalyses')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = '/user/billing'}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                    >
                                        <Crown className="size-3.5" />
                                        {t('limit.goPremium')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Chat Area / Analysis Area */}
                <div
                    ref={scrollRef}
                    className={`space-y-6 pr-2 ${analysisResult
                        ? "" // let <main> scroll naturally with mouse wheel
                        : "overflow-y-auto max-h-[60vh] pb-2 custom-scrollbar scroll-smooth overscroll-contain" // chat mode: keep answers near the question
                        }`}
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            (() => {
                                const isAnsweredAssistantQuestion = msg.role === "assistant" && i % 2 === 0 && i / 2 < answersSoFar.length;
                                const editableAnswerIndex = isAnsweredAssistantQuestion ? i / 2 : null;
                                const isEditable = editableAnswerIndex !== null;
                                const isEditingThisQuestion = editingAnswerIndex !== null && editableAnswerIndex === editingAnswerIndex;
                                const isEditedUserReply = editingAnswerIndex !== null && msg.role === "user" && i === (editingAnswerIndex * 2) + 1;
                                const isCurrentEditedQuestionBubble = editingAnswerIndex !== null && i === editingAnswerIndex * 2;

                                if (editingAnswerIndex !== null && !isCurrentEditedQuestionBubble) {
                                    return null;
                                }

                                if (isEditedUserReply) {
                                    return null;
                                }

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <button
                                            ref={(el) => {
                                                if (editableAnswerIndex !== null) {
                                                    editableQuestionRefs.current[editableAnswerIndex] = el;
                                                }
                                            }}
                                            type="button"
                                            onClick={() => {
                                                if (editableAnswerIndex !== null) {
                                                    handleEditAnswerAt(editableAnswerIndex);
                                                }
                                            }}
                                            disabled={!isEditable || isStreaming || isAnalyzing || isImageStep}
                                            title={isEditable ? "Click to edit this question" : undefined}
                                            className={`max-w-[85%] rounded-3xl p-5 shadow-sm relative text-left transition-all ${msg.role === "user"
                                                ? "bg-primary text-white rounded-tr-none shadow-primary/20"
                                                : "bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white rounded-tl-none shadow-gray-200/50 dark:shadow-none"
                                                } ${isEditable ? "group pr-14 cursor-pointer hover:scale-[1.01] hover:ring-2 hover:ring-primary/30" : "cursor-default"} ${isEditingThisQuestion ? "ring-2 ring-primary/40" : ""}`}
                                        >
                                            {isEditable && (
                                                <span
                                                    className={`absolute top-3 right-2 inline-flex size-7 items-center justify-center rounded-full border border-primary/30 bg-white/90 text-primary shadow-sm transition-opacity ${isEditingThisQuestion ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                                                    aria-hidden="true"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </span>
                                            )}
                                            {msg.image && (
                                                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                                                    <img src={msg.image} alt="Upload" className="max-w-full h-auto max-h-72 object-cover" />
                                                </div>
                                            )}
                                            <p className="text-[17px] leading-relaxed font-medium">{msg.content}</p>
                                        </button>
                                    </motion.div>
                                );
                            })()
                        ))}
                    </AnimatePresence>

                    {isStreaming && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-400">{t('thinking')}</span>
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
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('analyzingTitle')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                                    {t('analyzingDescription')}
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
                                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{t('result.analysisComplete')}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white leading-tight">{t('result.yourSkinScore')}</h3>
                                        <p className="mt-1 text-sm text-white/70">
                                            {analysisResult.score >= 80 ? t('result.scoreExcellent') :
                                                analysisResult.score >= 60 ? t('result.scoreGood') :
                                                    t('result.scoreNeedsCare')}
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
                                                    <TrendingUp className="size-3" /> {t('result.age')} {analysisResult.agePeau}
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
                                            <span>{t('result.analysisConfidence')}</span>
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
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Award className="size-5 text-primary" />
                                            <h4 className="font-bold text-gray-900 dark:text-white text-base">{t('result.personalizedAnalysis')}</h4>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {(() => {
                                            const lines = analysisResult.analysis
                                                .split('\n')
                                                .map((line) => line.trim())
                                                .filter(Boolean);

                                            const looksLikePoints = lines.some((line) => /^(\*\s+|\-\s+|•\s+|\d+\.\s+)/.test(line));

                                            if (!looksLikePoints) {
                                                return lines.map((line, i) => (
                                                    /^\*\*(.+)\*\*$/.test(line)
                                                        ? <p key={i} className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">{line.replace(/^\*\*(.+)\*\*$/, "$1")}</p>
                                                        : <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{line}</p>
                                                ));
                                            }

                                            return lines.map((line, i) => {
                                                const headerMatch = line.match(/^\*\*(.+)\*\*$/);
                                                if (headerMatch) {
                                                    return (
                                                        <p key={i} className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed mt-3 first:mt-0">
                                                            {headerMatch[1]}
                                                        </p>
                                                    );
                                                }

                                                const isBullet = /^(\*\s+|\-\s+|•\s+|\d+\.\s+)/.test(line);
                                                if (!isBullet) {
                                                    return (
                                                        <p key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{line}</p>
                                                    );
                                                }

                                                const content = line.replace(/^(\*\s+|\-\s+|•\s+|\d+\.\s+)/, "").trim();
                                                return (
                                                    <div key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                                                        <ChevronRight className="size-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <span>{content}</span>
                                                    </div>
                                                );
                                            });
                                        })()}
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
                                                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{t('result.strongPoints')}</h4>
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
                                                <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm">{t('result.priorityConcerns')}</h4>
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
                            {analysisAccess.productRecommendationsEnabled && (
                                !!analysisResult.recommendations?.immediate?.length ||
                                !!analysisResult.recommendations?.detailedImmediate?.length
                            ) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap className="size-5 text-amber-500" />
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{t('result.immediateRecommendations')}</h4>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {(() => {
                                                const detailedItems = analysisResult.recommendations?.detailedImmediate || [];
                                                const fallbackItems = analysisResult.recommendations?.immediate || [];

                                                if (detailedItems.length > 0) {
                                                    return detailedItems.map((item, idx) => (
                                                        <li key={`detailed-immediate-${idx}`} className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-shrink-0 size-5 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{idx + 1}</div>
                                                                <div className="min-w-0 space-y-1.5">
                                                                    <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200 leading-relaxed">{item.title}</p>
                                                                    {item.description ? <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{item.description}</p> : null}
                                                                    {item.why ? <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-gray-900 dark:text-gray-100">Why:</span> {item.why}</p> : null}
                                                                    {item.how ? <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-bold text-gray-900 dark:text-gray-100">How:</span> {item.how}</p> : null}
                                                                    {(item.when || item.frequency || item.productType) ? (
                                                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                                                                            {item.productType ? <span className="font-semibold text-gray-700 dark:text-gray-300">Type: {item.productType}. </span> : null}
                                                                            {item.when ? <span>When: {item.when}. </span> : null}
                                                                            {item.frequency ? <span>Frequency: {item.frequency}.</span> : null}
                                                                        </p>
                                                                    ) : null}
                                                                    {item.cautions ? <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-relaxed"><span className="font-bold">Caution:</span> {item.cautions}</p> : null}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ));
                                                }

                                                return fallbackItems.map((item, idx) => (
                                                    <li key={`immediate-${idx}`} className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
                                                        <div className="flex-shrink-0 size-5 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{idx + 1}</div>
                                                        <span className="text-xs text-gray-700 dark:text-gray-300">{item}</span>
                                                    </li>
                                                ));
                                            })()}
                                        </ul>
                                    </motion.div>
                                )}

                            {/* ── Morning / Evening Routines ── */}
                            {(
                                !!analysisResult.routine?.morning?.length ||
                                !!analysisResult.routine?.evening?.length ||
                                !!analysisResult.routine?.morningDetailed?.length ||
                                !!analysisResult.routine?.eveningDetailed?.length
                            ) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        {(!!analysisResult.routine?.morning?.length || !!analysisResult.routine?.morningDetailed?.length) && (
                                            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/40 p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="size-8 rounded-full bg-amber-400 flex items-center justify-center">
                                                        <Sun className="size-4 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">{t('result.morningRoutine')}</h4>
                                                </div>
                                                <ol className="space-y-4">
                                                    {(() => {
                                                        const detailed = analysisResult.routine?.morningDetailed || [];

                                                        if (detailed.length > 0) {
                                                            return detailed.map((item, idx) => {
                                                                const actionLabel = item.name;
                                                                return (
                                                                    <li key={`morning-detailed-${idx}`} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-amber-200/30">
                                                                        <div className="flex items-start gap-2">
                                                                            <span className="flex-shrink-0 size-4 rounded-full bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-[9px] font-black flex items-center justify-center mt-0.5">{Number(item.step) > 0 ? item.step : idx + 1}</span>
                                                                            <div className="min-w-0">
                                                                                <span className="text-xs text-amber-900 dark:text-amber-100 font-bold">{item.name}</span>
                                                                                {item.purpose ? <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 mt-1 leading-relaxed"><span className="font-bold">Why:</span> {item.purpose}</p> : null}
                                                                                {item.instruction ? <p className="text-[11px] text-amber-900/90 dark:text-amber-100/90 mt-1 leading-relaxed"><span className="font-bold">How:</span> {item.instruction}</p> : null}
                                                                                {(item.frequency || item.timing) ? <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 mt-1 leading-relaxed">{item.timing ? `When: ${item.timing}. ` : ''}{item.frequency ? `Frequency: ${item.frequency}.` : ''}</p> : null}
                                                                                {item.notes ? <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">{item.notes}</p> : null}
                                                                            </div>
                                                                        </div>
                                                                        <RoutineItemScraper action={actionLabel} />
                                                                    </li>
                                                                );
                                                            });
                                                        }

                                                        return (analysisResult.routine?.morning || []).map((item, idx) => (
                                                            <li key={`morning-${idx}`} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-amber-200/30">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="flex-shrink-0 size-4 rounded-full bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 text-[9px] font-black flex items-center justify-center mt-0.5">{idx + 1}</span>
                                                                    <span className="text-xs text-amber-900 dark:text-amber-100 font-bold">{item}</span>
                                                                </div>
                                                                <RoutineItemScraper action={item} />
                                                            </li>
                                                        ));
                                                    })()}
                                                </ol>
                                            </div>
                                        )}
                                        {(!!analysisResult.routine?.evening?.length || !!analysisResult.routine?.eveningDetailed?.length) && (
                                            <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/40 p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="size-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                                        <Moon className="size-4 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">{t('result.eveningRoutine')}</h4>
                                                </div>
                                                <ol className="space-y-4">
                                                    {(() => {
                                                        const detailed = analysisResult.routine?.eveningDetailed || [];

                                                        if (detailed.length > 0) {
                                                            return detailed.map((item, idx) => {
                                                                const actionLabel = item.name;
                                                                return (
                                                                    <li key={`evening-detailed-${idx}`} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-indigo-200/30">
                                                                        <div className="flex items-start gap-2">
                                                                            <span className="flex-shrink-0 size-4 rounded-full bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 text-[9px] font-black flex items-center justify-center mt-0.5">{Number(item.step) > 0 ? item.step : idx + 1}</span>
                                                                            <div className="min-w-0">
                                                                                <span className="text-xs text-indigo-900 dark:text-indigo-100 font-bold">{item.name}</span>
                                                                                {item.purpose ? <p className="text-[11px] text-indigo-800/90 dark:text-indigo-200/80 mt-1 leading-relaxed"><span className="font-bold">Why:</span> {item.purpose}</p> : null}
                                                                                {item.instruction ? <p className="text-[11px] text-indigo-900/90 dark:text-indigo-100/90 mt-1 leading-relaxed"><span className="font-bold">How:</span> {item.instruction}</p> : null}
                                                                                {(item.frequency || item.timing) ? <p className="text-[11px] text-indigo-800/80 dark:text-indigo-200/80 mt-1 leading-relaxed">{item.timing ? `When: ${item.timing}. ` : ''}{item.frequency ? `Frequency: ${item.frequency}.` : ''}</p> : null}
                                                                                {item.notes ? <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">{item.notes}</p> : null}
                                                                            </div>
                                                                        </div>
                                                                        <RoutineItemScraper action={actionLabel} />
                                                                    </li>
                                                                );
                                                            });
                                                        }

                                                        return (analysisResult.routine?.evening || []).map((item, idx) => (
                                                            <li key={`evening-${idx}`} className="flex flex-col gap-2 p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-indigo-200/30">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="flex-shrink-0 size-4 rounded-full bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 text-[9px] font-black flex items-center justify-center mt-0.5">{idx + 1}</span>
                                                                    <span className="text-xs text-indigo-900 dark:text-indigo-100 font-bold">{item}</span>
                                                                </div>
                                                                <RoutineItemScraper action={item} />
                                                            </li>
                                                        ));
                                                    })()}
                                                </ol>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                            {/* ── CTA ── */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <motion.button
                                    onClick={openRoutineFeedbackModal}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-500/30 text-base"
                                >
                                    <Sparkles className="size-5" />
                                    {t('result.viewRoutine')}
                                    <ArrowRight className="size-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => window.location.href = "/user/analyzes"}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl transition-all shadow-lg text-base"
                                >
                                    <History className="size-5 text-[#156d95]" />
                                    {t('result.viewHistory')}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Interaction Overlay (at bottom) */}
                {!analysisResult && !isAnalyzing && analysisAccess.canCreateAnalysis && (
                    <div className="mt-2 pb-6">
                        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
                            <AnimatePresence mode="wait">
                                {isImageStep && (
                                    <motion.div
                                        key="image-step"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="w-full"
                                    >
                                        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-xl space-y-4">
                                            {isSubmittingImages && (
                                                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
                                                    <Loader2 className="size-4 animate-spin text-primary" />
                                                    <p className="text-xs font-semibold text-primary">
                                                        {n8nAnalyzingMessage}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{t('images.title')}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('images.addForGemini', { count: maxSurveyImages })}</p>
                                                </div>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                                    {uploadedSurveyImages.length}/{maxSurveyImages}
                                                </span>
                                            </div>

                                            {imageStepAlert && (
                                                <div className="rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700 px-4 py-3">
                                                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{imageStepAlert}</p>
                                                </div>
                                            )}

                                            <input
                                                ref={imageInputRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
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
                                                className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${isDraggingImages
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/30'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center text-center gap-2">
                                                    <Upload className="size-6 text-primary" />
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t('images.dragHere')}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('images.orUseButtons')}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => imageInputRef.current?.click()}
                                                    disabled={uploadedSurveyImages.length >= maxSurveyImages}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold disabled:opacity-50"
                                                >
                                                    <Upload className="size-3.5" />
                                                    {t('images.addFromGallery')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCameraOpen(true)}
                                                    disabled={uploadedSurveyImages.length >= maxSurveyImages}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs font-bold disabled:opacity-50"
                                                >
                                                    <Camera className="size-3.5" />
                                                    {t('images.takePhoto')}
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
                                                                aria-label={t('images.remove')}
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
                                                    {t('images.continueWithout')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={submitImageStep}
                                                    disabled={isSubmittingImages}
                                                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-60"
                                                >
                                                    {isSubmittingImages ? t('images.analyzing') : t('images.analyzeWithGemini')}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Choice UI */}
                                {!isImageStep && !isStreaming && currentQuestion?.type === "choice" && (
                                    <motion.div
                                        key="choices"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="w-full flex flex-col items-center gap-4"
                                    >
                                        {editingAnswerIndex !== null && (
                                            <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-primary">
                                                    Edit mode active
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditMode}
                                                    className="px-3 py-1.5 rounded-lg border border-primary/30 bg-white text-[11px] font-semibold text-primary"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[36vh] overflow-y-auto pr-1">
                                            {currentQuestion.options?.map((opt) => {
                                                const selected = selectedChoiceOptionIds.includes(opt.id);

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleChoiceToggle(opt.id)}
                                                        className={`px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-2 group text-left ${selected
                                                            ? "bg-primary text-white border-primary shadow-primary/20"
                                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white hover:border-primary hover:text-primary"
                                                            }`}
                                                    >
                                                        <div className={`size-2.5 rounded-full transition-colors ${selected
                                                            ? "bg-white"
                                                            : "bg-gray-200 dark:bg-gray-700 group-hover:bg-primary"
                                                            }`}></div>
                                                        <span className="leading-snug">{opt.text}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={submitChoiceSelection}
                                                disabled={selectedChoiceOptionIds.length === 0}
                                                className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-60"
                                            >
                                                {editingAnswerIndex !== null ? "Save changes" : "Submit choices"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Text Input UI */}
                                {!isImageStep && !isStreaming && (currentQuestion?.type === "text" || (!currentQuestion && messages[messages.length - 1]?.role === "assistant")) && (
                                    <motion.div
                                        key="composer"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="w-full space-y-3"
                                    >
                                        {answersSoFar.length > 0 && editingAnswerIndex === null && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                                Click on a question in the conversation to edit it.
                                            </p>
                                        )}
                                        {editingAnswerIndex !== null && (
                                            <div className="w-full rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-primary">
                                                    Edit mode active
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={cancelEditMode}
                                                    className="px-3 py-1.5 rounded-lg border border-primary/30 bg-white text-[11px] font-semibold text-primary"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        {answersSoFar.length > 0 && editingAnswerIndex === null && (
                                            <div className="flex">
                                                <button
                                                    type="button"
                                                    onClick={handleGoBackToPreviousQuestion}
                                                    className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-[11px] font-semibold text-primary"
                                                >
                                                    Previous question
                                                </button>
                                            </div>
                                        )}
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

            <AnimatePresence>
                {showPostAnalysisFeedbackModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                    >
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={closeRoutineFeedbackModalAndContinue}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-2xl"
                        >
                            <button
                                type="button"
                                onClick={closeRoutineFeedbackModalAndContinue}
                                className="absolute top-3 right-3 rounded-full p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="pr-8">
                                <h4 className="font-bold text-gray-900 dark:text-white text-base">How helpful was this analysis?</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share quick feedback, then we will take you to your routine page.</p>
                            </div>

                            <form onSubmit={submitPostAnalysisFeedback} className="space-y-4 mt-5">
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => {
                                        const active = value <= feedbackRating;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setFeedbackRating(value)}
                                                className={`inline-flex size-9 items-center justify-center rounded-full border transition-all ${active
                                                    ? "border-amber-300 bg-amber-50 text-amber-500"
                                                    : "border-gray-200 bg-white text-gray-300 hover:text-amber-400 dark:border-gray-700 dark:bg-gray-900"
                                                    }`}
                                            >
                                                <Star size={16} className={active ? "fill-current" : ""} />
                                            </button>
                                        );
                                    })}
                                    <span className="text-xs font-bold text-gray-500">{feedbackRating}/5</span>
                                </div>

                                <textarea
                                    rows={3}
                                    maxLength={400}
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    placeholder="Optional: tell us what could be improved"
                                    className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />

                                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={feedbackPublish}
                                        onChange={(e) => setFeedbackPublish(e.target.checked)}
                                        className="size-4 rounded border-gray-300"
                                    />
                                    Allow display in public testimonials
                                </label>

                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={closeRoutineFeedbackModalAndContinue}
                                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                                    >
                                        Later
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={feedbackSubmitting}
                                        className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-60"
                                    >
                                        {feedbackSubmitting ? "Saving..." : feedbackSaved ? "Saved" : "Submit feedback"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
            />
        </UserLayout>
    );
}
