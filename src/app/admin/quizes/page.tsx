
"use client";

import { useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import {
    Plus,
    Search,
    MoreHorizontal,
    SquarePen,
    Trash2,
    ChevronDown,
    BookOpenCheck,
    FileText,
    PlusCircle,
    X,
    Check,
    GripVertical,
    ArrowLeft,
    SlidersHorizontal,
    Eye,
    BrainCircuit,
    ListChecks,
    Globe,
    Palette,
    Monitor,
    CircleHelp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    text: string;
    type: string; // Using string instead of union for easier state updates in this mock
    options: Option[];
    correctAnswer?: string;
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    questionCount: number;
    status: string;
    iconType: 'globe' | 'palette' | 'monitor' | 'help'; // Changed from string icon to iconType
    questions: Question[];
}

// Mock Data
const MOCK_QUIZZES: Quiz[] = [
    {
        id: "1",
        title: "General Knowledge",
        description: "A variety of fun questions about the world.",
        questionCount: 12,
        status: "active",
        iconType: "globe",
        questions: [
            { id: "q1_1", text: "What is the capital of France?", type: "input", correctAnswer: "Paris", options: [] },
            {
                id: "q1_2", text: "Which planet is known as the Red Planet?", type: "choice", options: [
                    { id: "o1", text: "Mars", isCorrect: true },
                    { id: "o2", text: "Jupiter", isCorrect: false },
                    { id: "o3", text: "Venus", isCorrect: false }
                ]
            }
        ]
    },
    {
        id: "2",
        title: "Product Design 101",
        description: "Master the fundamentals of user-centered design.",
        questionCount: 8,
        status: "active",
        iconType: "palette",
        questions: [
            { id: "q2_1", text: "What does UX stand for?", type: "input", correctAnswer: "User Experience", options: [] },
            {
                id: "q2_2", text: "Which color is traditionally associated with 'Success' in UI?", type: "choice", options: [
                    { id: "o1", text: "Green", isCorrect: true },
                    { id: "o2", text: "Red", isCorrect: false },
                    { id: "o3", text: "Blue", isCorrect: false }
                ]
            }
        ]
    },
    {
        id: "3",
        title: "Frontend Fundamentals",
        description: "HTML, CSS, and basic JavaScript principles.",
        questionCount: 15,
        status: "draft",
        iconType: "monitor",
        questions: [
            { id: "q3_1", text: "What does HTML stand for?", type: "input", correctAnswer: "HyperText Markup Language", options: [] }
        ]
    }
];

const MOCK_QUESTIONS: Question[] = [
    {
        id: "q1",
        text: "What is your favorite design principle?",
        type: "input",
        correctAnswer: "Minimalism",
        options: []
    },
    {
        id: "q2",
        text: "Which of these are primary colors?",
        type: "choice",
        options: [
            { id: "o1", text: "Red", isCorrect: true },
            { id: "o2", text: "Blue", isCorrect: true },
            { id: "o3", text: "Yellow", isCorrect: true },
            { id: "o4", text: "Green", isCorrect: false }
        ]
    },
    {
        id: "q3",
        text: "Select your hobbies",
        type: "choice",
        options: [
            { id: "o5", text: "Gaming", isCorrect: false },
            { id: "o6", text: "Reading", isCorrect: false },
            { id: "o7", text: "Traveling", isCorrect: false }
        ]
    }
];

export default function QuizzesPage() {
    const [view, setView] = useState<"list" | "edit">("list");
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

    const handleEditQuiz = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setQuestions(quiz.questions || MOCK_QUESTIONS); // Load the quiz's specific questions
        setView("edit");
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            id: `q${Date.now()}`,
            text: "",
            type: "choice",
            options: [
                { id: `o${Date.now()}-1`, text: "Option 1", isCorrect: false }
            ]
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleRemoveQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleUpdateQuestion = (id: string, updates: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const handleAddOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, { id: `o${Date.now()}`, text: "", isCorrect: false }]
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

    const toggleCorrectOption = (questionId: string, optionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options.map(o => o.id === optionId ? { ...o, isCorrect: !o.isCorrect } : o)
                };
            }
            return q;
        }));
    };

    const getQuizIcon = (type: string, className?: string) => {
        switch (type) {
            case 'globe': return <Globe className={className} />;
            case 'palette': return <Palette className={className} />;
            case 'monitor': return <Monitor className={className} />;
            default: return <CircleHelp className={className} />;
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
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
                                        Quiz Management
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-11">Create and manage assessment quizzes for your users.</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedQuiz({ id: "new", title: "New Quiz", description: "", questionCount: 0, status: "draft", iconType: "help", questions: [] }); setView("edit"); }}
                                    className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-900 dark:bg-white dark:border-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm"
                                >
                                    <Plus className="size-5" />
                                    <span>Create Quiz</span>
                                </button>
                            </div>

                            {/* Stats & Search */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center px-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
                                    <Search className="size-5 text-gray-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="Search quizzes by title or category..."
                                        className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200"
                                    />
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center px-4 shadow-sm border border-gray-100 dark:border-gray-700/50 font-bold text-gray-600 dark:text-gray-300">
                                    {MOCK_QUIZZES.length} Total Quizzes
                                </div>
                            </div>

                            {/* Quiz Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                {MOCK_QUIZZES.map((quiz) => (
                                    <motion.div
                                        key={quiz.id}
                                        layout
                                        className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 relative overflow-hidden transition-all duration-300"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                                                <MoreHorizontal className="size-5 text-gray-400" />
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="size-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shadow-inner">
                                                {getQuizIcon(quiz.iconType, "size-8 text-blue-600 dark:text-blue-400")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{quiz.title}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                                    {quiz.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
                                                    <ListChecks className="size-3.5 text-blue-500" />
                                                    {quiz.questionCount} Questions
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${quiz.status === 'active'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
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
                                                    onClick={() => handleEditQuiz(quiz)}
                                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
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
                                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Questions Preview</h4>
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
                                                                                    <div key={opt.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${opt.isCorrect ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500'}`}>
                                                                                        <div className={`size-2 rounded-full ${opt.isCorrect ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                                                                        {opt.text}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl px-3 py-2">
                                                                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Text Answer Preview</p>
                                                                                <p className="text-xs text-blue-500 dark:text-blue-300 italic">" {q.correctAnswer || "Awaited user input..."} "</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {quiz.questions.length === 0 && (
                                                            <p className="text-center py-4 text-xs text-gray-400 italic">No questions added yet.</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                {/* Add New Card */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setSelectedQuiz({ id: "new", title: "New Quiz", description: "", questionCount: 0, status: "draft", iconType: "help", questions: [] }); setView("edit"); }}
                                    className="flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-colors h-full min-h-[220px]"
                                >
                                    <div className="size-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                                        <Plus className="size-8 text-blue-500" />
                                    </div>
                                    <span className="font-bold text-gray-500 dark:text-gray-400">Add New Quiz</span>
                                </motion.button>
                            </div>
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
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Editing Quiz</span>
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">{selectedQuiz?.title}</h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                                        <Eye className="size-4" />
                                        Preview
                                    </button>
                                    <button className="bg-gray-900 border border-gray-900 dark:bg-white dark:border-white text-white dark:text-gray-900 px-6 py-2.5 rounded-2xl font-bold transition-all active:scale-95 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm">
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Left Column: Quiz Info */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="size-5 text-blue-500" />
                                            <h3 className="font-bold text-gray-900 dark:text-white">Quiz Details</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Title</label>
                                                <input
                                                    type="text"
                                                    defaultValue={selectedQuiz?.title}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Description</label>
                                                <textarea
                                                    rows={4}
                                                    defaultValue={selectedQuiz?.description}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Category</label>
                                                <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none">
                                                    <option>General Knowledge</option>
                                                    <option>Design</option>
                                                    <option>Development</option>
                                                    <option>Personal Finance</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-lg text-white">
                                        <h4 className="font-bold flex items-center gap-2 mb-4">
                                            <SlidersHorizontal className="size-5" />
                                            Settings
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Randomize questions</span>
                                                <div className="w-12 h-6 bg-white/20 rounded-full relative">
                                                    <div className="absolute top-1 right-1 size-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Show results at end</span>
                                                <div className="w-12 h-6 bg-blue-400 rounded-full relative">
                                                    <div className="absolute top-1 right-1 size-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Pass score %</span>
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
                                            Questions ({questions.length})
                                        </h3>
                                        <button
                                            onClick={handleAddQuestion}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all"
                                        >
                                            <PlusCircle className="size-4" />
                                            Add Question
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
                                                                    placeholder={`Question ${qIndex + 1}`}
                                                                    className="w-full text-lg font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <select
                                                                value={q.type}
                                                                onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value })}
                                                                className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
                                                            >
                                                                <option value="choice">Multiple Choice</option>
                                                                <option value="input">Text Input</option>
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
                                                                        <button
                                                                            onClick={() => toggleCorrectOption(q.id, opt.id)}
                                                                            className={`size-6 rounded-full flex items-center justify-center transition-all ${opt.isCorrect
                                                                                ? 'bg-green-500 text-white'
                                                                                : 'border-2 border-gray-200 dark:border-gray-600'
                                                                                }`}
                                                                        >
                                                                            {opt.isCorrect && <Check className="size-4" />}
                                                                        </button>
                                                                        <input
                                                                            type="text"
                                                                            value={opt.text}
                                                                            onChange={(e) => handleUpdateOption(q.id, opt.id, e.target.value)}
                                                                            placeholder={`Option ${optIndex + 1}`}
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
                                                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 ml-9 mt-2 transition-all"
                                                                >
                                                                    <Plus className="size-4" />
                                                                    Add Choice
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="pl-9">
                                                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mb-2">Expected Answer:</p>
                                                                    <input
                                                                        type="text"
                                                                        value={q.correctAnswer || ""}
                                                                        onChange={(e) => handleUpdateQuestion(q.id, { correctAnswer: e.target.value })}
                                                                        placeholder="e.g. Minimalism..."
                                                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white"
                                                                    />
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic px-1">
                                                                        Users will need to type this exactly to get the point.
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
                                        <span className="font-bold">Append New Question</span>
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
