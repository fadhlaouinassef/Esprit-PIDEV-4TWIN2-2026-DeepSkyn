"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sun,
    Moon,
    Calendar,
    CheckCircle2,
    Circle,
    ChevronRight,
    Info,
    AlertTriangle,
    Flame,
    Clock,
    Play,
    RotateCcw,
    Sparkles,
    ArrowRight,
    Droplets,
    ShieldCheck,
    MoreVertical,
    Timer
} from "lucide-react";
import { UserLayout } from "@/app/ui/UserLayout";
import { toast } from "sonner";

// --- Types ---
type RoutineType = "morning" | "night" | "weekly";

interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    instruction: string;
    tip?: string;
    warning?: string;
    ingredient?: string;
}

interface RoutineStep {
    id: string;
    product: Product;
    completed: boolean;
    timeToWait?: number; // in seconds
}

// --- Mock Data ---
const PRODUCTS: Record<string, Product> = {
    cleanser: {
        id: "p1",
        name: "Squalane Cleanser",
        brand: "The Ordinary",
        category: "Step 1: Cleanser",
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=200&auto=format&fit=crop",
        instruction: "2 pumps, massage for 60s on dry skin, then rinse.",
        ingredient: "Squalane & Lipophilic Esters",
        tip: "Use lukewarm water to prevent irritation."
    },
    toner: {
        id: "p2",
        name: "Hyaluronic Acid 2% + B5",
        brand: "Lumina Skin",
        category: "Step 2: Toner/Serum",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop",
        instruction: "Apply 3 drops on damp skin and pat gently.",
        ingredient: "Hyaluronic Acid",
        tip: "Applying to damp skin boosts hydration 10x."
    },
    vitaminC: {
        id: "p3",
        name: "Vitamin C suspension 23%",
        brand: "DeepSkyn Lab",
        category: "Step 3: Treatment",
        image: "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop",
        instruction: "Small pea-sized amount. Avoid eye area.",
        ingredient: "L-Ascorbic Acid",
        warning: "May cause slight tingling. Do not mix with Niacinamide."
    },
    moisturizer: {
        id: "p4",
        name: "Natural Moisturizing Factors",
        brand: "CeraVe",
        category: "Step 4: Moisturizer",
        image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=200&auto=format&fit=crop",
        instruction: "Nickel-sized amount. Apply after serums.",
        ingredient: "Ceramides & Amino Acids"
    },
    sunscreen: {
        id: "p5",
        name: "Anthelios Melt-in Milk",
        brand: "La Roche-Posay",
        category: "Step 5: Protection",
        image: "https://images.unsplash.com/photo-1556228515-919086f74644?q=80&w=200&auto=format&fit=crop",
        instruction: "Apply generously. Reapply every 2 hours.",
        tip: "The most important step for anti-aging."
    }
};

const INITIAL_ROUTINES: Record<RoutineType, RoutineStep[]> = {
    morning: [
        { id: "s1", product: PRODUCTS.cleanser, completed: true },
        { id: "s2", product: PRODUCTS.toner, completed: true },
        { id: "s3", product: PRODUCTS.vitaminC, completed: false, timeToWait: 60 },
        { id: "s4", product: PRODUCTS.moisturizer, completed: false },
        { id: "s5", product: PRODUCTS.sunscreen, completed: false },
    ],
    night: [
        { id: "e1", product: PRODUCTS.cleanser, completed: false },
        { id: "e2", product: PRODUCTS.toner, completed: false },
        { id: "e3", product: PRODUCTS.moisturizer, completed: false },
    ],
    weekly: [
        { id: "w1", product: PRODUCTS.cleanser, completed: false },
        { id: "w2", product: PRODUCTS.toner, completed: false },
        { id: "w3", product: PRODUCTS.moisturizer, completed: false },
    ]
};

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
    const percentage = (current / total) * 100;
    return (
        <div className="relative flex items-center justify-center p-6 bg-card dark:bg-card/40 border border-border/50 rounded-3xl shadow-xl shadow-primary/5">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted/20"
                    />
                    <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        strokeLinecap="round"
                        className="text-primary"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-foreground">{current}/{total}</span>
                </div>
            </div>
            <div className="ml-6 flex-1">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Morning Progress</h4>
                <p className="text-lg font-bold text-foreground leading-tight">
                    {percentage === 100 ? "Sparkle time! ✨" : percentage > 50 ? "Halfway there!" : "Keep glowing!"}
                </p>
            </div>
        </div>
    );
};

export default function RoutinePage() {
    const [activeTab, setActiveTab] = useState<RoutineType>("morning");
    const [steps, setSteps] = useState(INITIAL_ROUTINES);
    const [userName] = useState("Nassef");

    const currentSteps = steps[activeTab];
    const completedCount = currentSteps.filter(s => s.completed).length;

    const toggleStep = (stepId: string) => {
        setSteps(prev => ({
            ...prev,
            [activeTab]: prev[activeTab].map(step =>
                step.id === stepId ? { ...step, completed: !step.completed } : step
            )
        }));

        // Trigger toast on completion
        const step = currentSteps.find(s => s.id === stepId);
        if (step && !step.completed) {
            toast.success(`${step.product.name} applied! ✨`, {
                description: "Your skin thanks you.",
                position: "bottom-right",
            });
        }
    };

    return (
        <UserLayout userName={userName} userPhoto="/avatar.png">
            <div className="min-h-full py-6 px-4 md:px-8 max-w-[1200px] mx-auto relative">

                {/* Header Section */}
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            Good Morning, {userName}
                        </h1>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {["Dry", "Sensitive", "Eco-Conscious"].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-auto min-w-[300px]"
                    >
                        <ProgressBar current={completedCount} total={currentSteps.length} />
                    </motion.div>
                </header>

                {/* Tab Switcher */}
                <div className="flex p-1.5 bg-muted/30 backdrop-blur-md rounded-[24px] border border-border/50 mb-10 w-fit">
                    {[
                        { id: "morning", label: "Morning", icon: Sun },
                        { id: "night", label: "Night", icon: Moon },
                        { id: "weekly", label: "Weekly", icon: Calendar },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as RoutineType)}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                ? "bg-card text-foreground shadow-lg shadow-black/5 border border-border/10"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : ""}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    {/* Main List */}
                    <div className="lg:col-span-8 space-y-6">
                        <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-3 uppercase tracking-tighter">
                            {activeTab} Routine Steps
                            <span className="h-px flex-1 bg-border/50" />
                        </h3>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {currentSteps.map((step, index) => (
                                    <motion.div
                                        key={step.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`group relative bg-card border transition-all duration-300 rounded-[32px] overflow-hidden ${step.completed
                                            ? "border-green-500/20 bg-green-500/[0.02] opacity-80"
                                            : "border-border shadow-sm hover:shadow-xl hover:border-primary/20"
                                            }`}
                                    >
                                        <div className="p-6 md:p-8 flex items-center gap-6">
                                            {/* Step Number/Indicator */}
                                            <button
                                                onClick={() => toggleStep(step.id)}
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${step.completed
                                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                                    : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20"
                                                    }`}
                                            >
                                                {step.completed ? <CheckCircle2 className="w-8 h-8" /> : <span className="text-xl font-black">{index + 1}</span>}
                                            </button>

                                            {/* Product Info */}
                                            <div className="flex-1 flex gap-4 md:gap-8 items-center min-w-0">
                                                <div className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden border border-border flex-shrink-0 bg-white">
                                                    <img src={step.product.image} alt={step.product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{step.product.category}</span>
                                                        {activeTab === 'morning' && !step.completed && <Sun className="w-3 h-3 text-amber-500 opacity-50" />}
                                                    </div>
                                                    <h4 className="text-lg font-black text-foreground truncate">{step.product.name}</h4>
                                                    <p className="text-sm text-muted-foreground font-medium truncate">{step.product.instruction}</p>
                                                </div>
                                            </div>

                                            {/* Action Icon */}
                                            <div className="flex-shrink-0">
                                                {step.timeToWait && !step.completed && (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase">
                                                        <Timer className="w-3.5 h-3.5" /> {step.timeToWait}s Wait
                                                    </div>
                                                )}
                                                {!step.completed && (
                                                    <button
                                                        onClick={() => toggleStep(step.id)}
                                                        className="p-3 rounded-2xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all ml-2"
                                                    >
                                                        <Play className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Details (Optional UI Enhancement) */}
                                        {!step.completed && (
                                            <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/30 bg-muted/10">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-2">Instructions</span>
                                                    <p className="text-xs font-bold text-foreground leading-relaxed">{step.product.instruction}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-2">DeepSkyn Tip</span>
                                                    <div className="flex gap-2">
                                                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                                                        <p className="text-xs font-bold text-primary/80 leading-relaxed italic">"{step.product.tip || "Consistency is key for visible results."}"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Bottom CTA */}
                        <div className="pt-8">
                            <button className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                                <RotateCcw className="w-5 h-5" /> Continue Routine Session
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Insights */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Consistency Card */}
                        <div className="bg-card border border-border rounded-[40px] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-lg font-black text-foreground">Consistency</h4>
                                <span className="text-primary font-black">92%</span>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-8">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                                    <div key={day + i} className="flex flex-col items-center gap-2">
                                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-all ${i < 3 ? "bg-green-500 text-white shadow-lg shadow-green-500/20" :
                                            i === 3 ? "bg-slate-900 text-white shadow-xl scale-110 ring-2 ring-primary/20" :
                                                "bg-muted text-muted-foreground/40"
                                            }`}>
                                            {i < 3 ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-4 h-4 opacity-30" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">{day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="p-5 bg-muted/30 border border-border/50 rounded-3xl flex items-center gap-4 group hover:bg-muted/50 transition-colors">
                                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    <Flame className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-bold text-foreground">
                                    7-Day Streak! <span className="text-muted-foreground font-medium italic">You're glowing.</span>
                                </p>
                            </div>
                        </div>

                        {/* Skin Tip of the Day */}
                        <div className="relative group bg-slate-900 border border-slate-800 rounded-[40px] p-8 text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/10 rounded-xl">
                                        <Droplets className="w-5 h-5 text-primary" />
                                    </div>
                                    <h4 className="text-lg font-black tracking-tight">Daily Insight</h4>
                                </div>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed mb-6">
                                    Always apply your SPF, even on cloudy days. UV rays can penetrate through clouds and windows, causing premature aging and sensitive skin flare-ups.
                                </p>
                                <button className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                    Read deep dive <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Shelf Life Alert */}
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Shelf Life Alert
                                </h4>
                            </div>

                            <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-[24px]">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h5 className="text-sm font-black text-foreground leading-tight">Vitamin C Serum</h5>
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-0.5">Expires in 12 days</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer info */}
                <footer className="mt-20 text-center pb-10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                        © 2025 Lumina Skincare Routine Tracker • Formulated with DeepSkyn AI
                    </p>
                </footer>

            </div>
        </UserLayout>
    );
}
