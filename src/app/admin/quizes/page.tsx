
"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import {
    Plus,
    Search,
    MoreHorizontal,
    SquarePen,
    Trash2,
    ChevronDown,
    ChevronRight,
    BookOpenCheck,
    FileText,
    PlusCircle,
    X,
    GripVertical,
    ArrowLeft,
    SlidersHorizontal,
    Eye,
    BrainCircuit,
    ListChecks,
    Globe,
    Palette,
    Monitor,
    CircleHelp,
    Droplets,
    Sparkles,
    FlaskConical,
    HeartPulse,
    UserCircle
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Types
interface Option {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    type: string;
    options: Option[];
    correctAnswer?: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    questionCount: number;
    status: string;
    iconType: string;
    questions: Question[];
}

export default function QuizzesPage() {
    const t = useTranslations("adminQuizzes");
    const [view, setView] = useState<"list" | "edit">("list");
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const filteredQuizzes = quizzes.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.iconType.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || q.iconType === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/quiz?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            // Transform backend data to match UI types if necessary
            const formattedData = data.map((q: any) => ({
                id: q.id.toString(),
                title: q.titre,
                description: q.description || "",
                questionCount: q.questions?.length || 0,
                status: "active",
                iconType: q.type || "help",
                questions: q.questions?.map((ques: any) => ({
                    id: ques.id.toString(),
                    text: ques.question,
                    type: ques.type_reponse === 'multiple_choice' ? 'choice' : 'input',
                    options: (ques.reponse_options ? JSON.parse(ques.reponse_options) : []).map((opt: any, idx: number) => ({
                        id: typeof opt === 'string' ? `o-${idx}-${opt}` : (opt?.id || `o-${idx}`),
                        text: typeof opt === 'string' ? opt : (opt?.text || "")
                    })),
                    correctAnswer: ""
                })) || []
            }));
            setQuizzes(formattedData);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveQuiz = async () => {
        if (!selectedQuiz) return;
        if (!selectedQuiz.title.trim()) {
            toast.error(t("toasts.enterTitle"));
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading(t("toasts.saving"));

        try {
            const isNew = selectedQuiz.id === "new";
            const method = isNew ? 'POST' : 'PATCH';
            const url = isNew ? '/api/quiz' : `/api/quiz/${selectedQuiz.id}`;

            const quizBody = {
                titre: selectedQuiz.title,
                type: selectedQuiz.iconType,
                description: selectedQuiz.description,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizBody)
            });

            if (!res.ok) throw new Error(t("toasts.saveQuizError"));

            const savedQuiz = await res.json();
            const quizId = savedQuiz.id;

            // 1. Delete questions that were removed in UI
            for (const id of deletedQuestionIds) {
                if (!id.startsWith('q')) { // Only delete if it's a real database ID
                    await fetch(`/api/quiz/questions/${id}`, { method: 'DELETE' });
                }
            }

            // 2. Sync questions (Add or Update)
            console.log(`Syncing ${questions.length} questions for quiz ${quizId}`);
            let qCount = 0;

            for (const q of questions) {
                const idStr = q.id.toString();
                const isNewQuestion = idStr.startsWith('q');
                const qMethod = isNewQuestion ? 'POST' : 'PATCH';
                const qUrl = isNewQuestion ? `/api/quiz/${quizId}/questions` : `/api/quiz/questions/${idStr}`;

                const qBody = {
                    question: q.text || t("defaults.untitledQuestion"),
                    type_reponse: q.type === 'choice' ? 'multiple_choice' : 'input',
                    options: q.type === 'choice' ? JSON.stringify(q.options) : null,
                    quiz_id: Number(quizId)
                };

                console.log(`Syncing question: ${idStr} via ${qMethod} at ${qUrl}`);

                const qRes = await fetch(qUrl, {
                    method: qMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(qBody),
                    cache: 'no-store'
                });

                if (qRes.ok) {
                    qCount++;
                } else {
                    const errorData = await qRes.json();
                    console.error("Failed to sync question:", q.id, errorData);
                    toast.error(t("toasts.syncQuestionError", { question: q.text.substring(0, 10), error: errorData.error || "" }));
                }
            }

            toast.success(t("toasts.savedQuizQuestions", { count: qCount }), { id: toastId });
            await fetchQuizzes();
            setDeletedQuestionIds([]);
            setView("list");
        } catch (error) {
            console.error('Failed to save quiz:', error);
            toast.error(t("toasts.saveError"), { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuiz = async (id: string) => {
        if (!confirm(t("confirmDelete"))) return;

        const toastId = toast.loading(t("toasts.deleting"));
        try {
            const res = await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(t("toasts.deleted"), { id: toastId });
                fetchQuizzes();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.error('Failed to delete quiz:', error);
            toast.error(t("toasts.deleteError"), { id: toastId });
        }
    };

    const handleEditQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setQuestions(quiz.questions || []);
        setDeletedQuestionIds([]); // Reset deletions tracker
        setView("edit");
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            id: `q${Date.now()}`,
            text: "",
            type: "choice",
            options: [
                { id: `o${Date.now()}-1`, text: t('questions.optionTemplate', { number: 1 }) }
            ]
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleRemoveQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
        if (!id.startsWith('q')) {
            setDeletedQuestionIds(prev => [...prev, id]);
        }
    };

    const handleUpdateQuestion = (id: string, updates: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleAddOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, { id: `o${Date.now()}`, text: "" }]
                };
            }
            return q;
        }));
    };

    const handleRemoveOption = (questionId: string, optionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.filter(o => o.id !== optionId)
                };
            }
            return q;
        }));
    };

    const handleUpdateOption = (questionId: string, optionId: string, text: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => o.id === optionId ? { ...o, text } : o)
                };
            }
            return q;
        }));
    };

    const getCategoryLabel = (type: string) => {
        switch (type) {
            case 'droplets': return t('categories.skinType');
            case 'sparkles': return t('categories.skinGlow');
            case 'flask': return t('categories.ingredients');
            case 'health': return t('categories.medical');
            case 'user': return t('categories.personal');
            case 'globe': return t('categories.general');
            default: return t('categories.other');
        }
    };

    const getStatusLabel = (status: string, t: any) => {
        switch (status) {
            case 'active': return t('statuses.active');
            case 'draft': return t('statuses.draft');
            default: return t('statuses.unknown');
        }
    };

    const getQuizIcon = (type: string, className?: string) => {
        switch (type) {
            case 'droplets': return <Droplets className={className} />;
            case 'sparkles': return <Sparkles className={className} />;
            case 'flask': return <FlaskConical className={className} />;
            case 'health': return <HeartPulse className={className} />;
            case 'user': return <UserCircle className={className} />;
            case 'globe': return <Globe className={className} />;
            default: return <CircleHelp className={className} />;
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{t("breadcrumb.admin")}</span>
                    <ChevronRight size={14} />
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{t("breadcrumb.quizzes")}</span>
                </nav>

                <AnimatePresence mode="wait">
                    {view === "list" ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 backdrop-blur-xl">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                        <BrainCircuit className="size-8 text-blue-600 dark:text-blue-400" />
                                        {t("header.title")}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-11">{t("header.subtitle")}</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedQuiz({ id: "new", title: "New Quiz", description: "", questionCount: 0, status: "draft", iconType: "help", questions: [] }); setQuestions([]); setDeletedQuestionIds([]); setView("edit"); }}
                                    className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-900 dark:bg-white dark:border-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm"
                                >
                                    <Plus className="size-5" />
                                    <span>{t("actions.createQuiz")}</span>
                                </button>
                            </div>

                            {/* Stats & Search */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-5 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center px-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
                                    <Search className="size-5 text-gray-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder={t("search.placeholder")}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200"
                                    />
                                </div>
                                <div className="md:col-span-4 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center px-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
                                    <SlidersHorizontal className="size-5 text-gray-400 mr-3" />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
                                    >
                                        <option value="all" className="bg-white dark:bg-gray-800">{t("filters.allCategories")}</option>
                                        <option value="droplets" className="bg-white dark:bg-gray-800">{t("categories.skinType")}</option>
                                        <option value="sparkles" className="bg-white dark:bg-gray-800">{t("categories.skinGlow")}</option>
                                        <option value="flask" className="bg-white dark:bg-gray-800">{t("categories.ingredients")}</option>
                                        <option value="health" className="bg-white dark:bg-gray-800">{t("categories.medical")}</option>
                                        <option value="user" className="bg-white dark:bg-gray-800">{t("categories.personal")}</option>
                                        <option value="globe" className="bg-white dark:bg-gray-800">{t("categories.general")}</option>
                                    </select>
                                </div>
                                <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center px-4 shadow-sm border border-gray-100 dark:border-gray-700/50 font-bold text-gray-600 dark:text-gray-300 h-14">
                                    {filteredQuizzes.length === quizzes.length ? t("stats.totalQuizzes", { count: quizzes.length }) : t("stats.foundQuizzes", { found: filteredQuizzes.length, total: quizzes.length })}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                    {filteredQuizzes.map((quiz) => (
                                        <motion.div
                                            key={quiz.id}
                                            layout
                                            className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 relative overflow-hidden transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="size-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-inner">
                                                        {getQuizIcon(quiz.iconType, "size-8 text-blue-600 dark:text-blue-400")}
                                                    </div>
                                                    <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-800">
                                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                                            {t("labels.category")}: {getCategoryLabel(quiz.iconType)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight">{quiz.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                                        {quiz.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        <ListChecks className="size-3.5 text-blue-500" />
                                                        {quiz.questionCount} {t('preview.questions')}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${quiz.status === 'active'
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                            {getStatusLabel(quiz.status, t)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedQuizId(expandedQuizId === quiz.id ? null : quiz.id)}
                                                        className={`p-3 bg-gray-50 dark:bg-gray-700/50 text-gray-500 rounded-2xl transition-all ${expandedQuizId === quiz.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''}`}
                                                    >
                                                        <ChevronDown className={`size-5 transition-transform duration-300 ${expandedQuizId === quiz.id ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuiz(quiz.id)}
                                                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-sm"
                                                        title={t("actions.deleteQuiz")}
                                                    >
                                                        <Trash2 className="size-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditQuiz(quiz)}
                                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
                                                        title={t("actions.editQuiz")}
                                                    >
                                                        <SquarePen className="size-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Question Preview */}
                                            <AnimatePresence>
                                                {expandedQuizId === quiz.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700/50 space-y-4">
                                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{t("preview.questions")}</h4>
                                                            {quiz.questions.map((q, idx) => (
                                                                <div key={q.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/30">
                                                                    <div className="flex items-start gap-3">
                                                                        <span className="shrink-0 size-6 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                                                                            {idx + 1}
                                                                        </span>
                                                                        <div className="space-y-3 flex-1">
                                                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug">{q.text}</p>

                                                                            {q.type === 'choice' ? (
                                                                                <div className="grid grid-cols-1 gap-2">
                                                                                    {q.options.map(opt => (
                                                                                        <div key={opt.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500">
                                                                                            {opt.text}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl px-3 py-2">
                                                                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">{t("preview.textAnswer")}</p>
                                                                                    <p className="text-xs text-blue-500 dark:text-blue-300 italic">" {q.correctAnswer || t("preview.awaitingInput")} "</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {quiz.questions.length === 0 && (
                                                                <p className="text-center py-4 text-xs text-gray-400 italic">{t("preview.noQuestions")}</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { setSelectedQuiz({ id: "new", title: "New Quiz", description: "", questionCount: 0, status: "draft", iconType: "help", questions: [] }); setQuestions([]); setDeletedQuestionIds([]); setView("edit"); }}
                                        className="flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-colors h-full min-h-[220px]"
                                    >
                                        <div className="size-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                                            <Plus className="size-8 text-blue-500" />
                                        </div>
                                        <span className="font-bold text-gray-500 dark:text-gray-400">{t("actions.addNewQuiz")}</span>
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Editor Header */}
                            <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-4 md:p-6 rounded-3xl shadow-lg border border-white/20 dark:border-gray-700/50">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setView("list")}
                                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <ArrowLeft className="size-5" />
                                    </button>
                                    <div>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t("editor.editingQuiz")}</span>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedQuiz?.title}</h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                        <Eye className="size-4" />
                                        {t("actions.preview")}
                                    </button>
                                    <button
                                        onClick={handleSaveQuiz}
                                        disabled={isSaving}
                                        className="bg-gray-900 border border-gray-900 dark:bg-white dark:border-white text-white dark:text-gray-900 px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm disabled:opacity-50"
                                    >
                                        {isSaving ? t("actions.saving") : t("actions.saveChanges")}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Left Column: Quiz Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="size-5 text-blue-500" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">{t("editor.quizDetails")}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t("fields.title")}</label>
                                                <input
                                                    type="text"
                                                    value={selectedQuiz?.title || ""}
                                                    onChange={(e) => setSelectedQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t("fields.description")}</label>
                                                <textarea
                                                    rows={4}
                                                    value={selectedQuiz?.description || ""}
                                                    onChange={(e) => setSelectedQuiz(prev => prev ? { ...prev, description: e.target.value } : null)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">{t("fields.category")}</label>
                                                <select
                                                    value={selectedQuiz?.iconType}
                                                    onChange={(e) => setSelectedQuiz(prev => prev ? { ...prev, iconType: e.target.value as any } : null)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="droplets">{t("categories.skinType")}</option>
                                                    <option value="sparkles">{t("categories.skinGlow")}</option>
                                                    <option value="flask">{t("categories.ingredients")}</option>
                                                    <option value="health">{t("categories.medical")}</option>
                                                    <option value="user">{t("categories.personal")}</option>
                                                    <option value="globe">{t("categories.general")}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-lg text-white">
                                        <h4 className="font-bold flex items-center gap-2 mb-4">
                                            <SlidersHorizontal className="size-5" />
                                            {t("editor.settings")}
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t("editor.randomizeQuestions")}</span>
                                                <div className="w-12 h-6 bg-white/20 rounded-full relative">
                                                    <div className="absolute top-1 right-1 size-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t("editor.showResultsAtEnd")}</span>
                                                <div className="w-12 h-6 bg-blue-400 rounded-full relative">
                                                    <div className="absolute top-1 right-1 size-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{t("editor.passScore")}</span>
                                                <span className="font-black">70</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Questions */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <BookOpenCheck className="size-6 text-blue-500" />
                                            {t("questions.title", { count: questions.length })}
                                        </h3>
                                        <button
                                            onClick={handleAddQuestion}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all"
                                        >
                                            <PlusCircle className="size-4" />
                                            {t("questions.addQuestion")}
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {questions.map((q, qIndex) => (
                                            <motion.div
                                                key={q.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
                                                        <GripVertical className="size-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={q.text}
                                                                    onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                                                                    placeholder={t('questions.questionPlaceholder', { number: qIndex + 1 })}
                                                                    className="w-full text-lg font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <select
                                                                value={q.type}
                                                                onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value })}
                                                                className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
                                                            >
                                                                <option value="choice">{t("questions.multipleChoice")}</option>
                                                                <option value="input">{t("questions.textInput")}</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleRemoveQuestion(q.id)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            >
                                                                <X className="size-5" />
                                                            </button>
                                                        </div>

                                                        {q.type === 'choice' ? (
                                                            <div className="space-y-3 pl-2">
                                                                {q.options.map((opt, optIndex) => (
                                                                    <div key={opt.id} className="flex items-center gap-3 group">
                                                                        <input
                                                                            type="text"
                                                                            value={opt.text}
                                                                            onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                                                            placeholder={t('questions.optionPlaceholder', { number: optIndex + 1 })}
                                                                            className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:text-gray-200"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleRemoveOption(q.id, opt.id)}
                                                                            className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                                                        >
                                                                            <X className="size-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => handleAddOption(q.id)}
                                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mt-2 transition-all"
                                                                >
                                                                    <Plus className="size-4" />
                                                                    {t("questions.addChoice")}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="pl-9">
                                                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">{t("questions.expectedAnswer")}</p>
                                                                    <input
                                                                        type="text"
                                                                        value={q.correctAnswer || ""}
                                                                        onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                                                                        placeholder={t("questions.expectedPlaceholder")}
                                                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                                                                    />
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic px-1">
                                                                        {t("questions.expectedHint")}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleAddQuestion}
                                        className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group"
                                    >
                                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                                            <Plus className="size-6" />
                                        </div>
                                        <span className="font-bold">{t("questions.appendNew")}</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
