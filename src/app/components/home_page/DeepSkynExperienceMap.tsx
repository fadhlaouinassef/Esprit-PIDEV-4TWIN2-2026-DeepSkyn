"use client";

import { useEffect, useMemo, useState, type ComponentType, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  User,
  ClipboardList,
  ScanFace,
  Droplets,
  ShoppingBag,
  ShieldCheck,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { LoadingLink } from "@/app/components/LoadingLink";

const ONBOARDING_KEY = "deepskyn_experience_map_v2";
const OPEN_EVENT_NAME = "deepskyn:open-experience-map";

type ExperienceStep = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  gradient: string;
  icon: ComponentType<{ className?: string }>;
};

const EXPERIENCE_STEPS: ExperienceStep[] = [
  {
    id: "welcome",
    title: "Welcome to DeepSkyn",
    subtitle: "Your journey to glowing skin begins here",
    description:
      "DeepSkyn uses artificial intelligence to revolutionize your beauty routine. Follow this guide to discover how to transform your skin.",
    ctaLabel: "Start the Experience",
    ctaHref: "/signup",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    icon: Sparkles,
  },
  {
    id: "quiz",
    title: "Intelligent Diagnostic",
    subtitle: "Getting to know your skin",
    description:
      "Take our intelligent questionnaire. Our algorithms analyze your habits and specific needs for an ultra-precise profile.",
    ctaLabel: "Launch Diagnostic",
    ctaHref: "/user/questionnaire",
    gradient: "from-teal-400 via-cyan-500 to-blue-600",
    icon: ClipboardList,
  },
  {
    id: "analysis",
    title: "AI Skin Analysis",
    subtitle: "Visualize your progress scientifically",
    description:
      "Access key indicators (hydration, sensitivity, radiance). Track your skin's evolution with our high-definition scans.",
    ctaLabel: "View My Analysis",
    ctaHref: "/user/Analyzes",
    gradient: "from-sky-400 via-blue-500 to-cyan-600",
    icon: ScanFace,
  },
  {
    id: "routines",
    title: "Your Action Plan",
    subtitle: "Efficiency, step by step",
    description:
      "Receive a personalized skincare routine. Morning and night, let us guide you to apply the right products in the right order.",
    ctaLabel: "Manage My Routines",
    ctaHref: "/user/routines",
    gradient: "from-blue-400 via-cyan-600 to-teal-500",
    icon: Droplets,
  },
  {
    id: "products",
    title: "Selective Shopping",
    subtitle: "Only the best for you",
    description:
      "Discover a selection of products recommended by our experts based on your unique skin analysis.",
    ctaLabel: "Explore My Selection",
    ctaHref: "/user/products",
    gradient: "from-cyan-400 via-emerald-500 to-teal-600",
    icon: ShoppingBag,
  },
  {
    id: "achievements",
    title: "Rewards & Progress",
    subtitle: "Celebrate every victory",
    description:
      "Unlock exclusive badges by staying consistent. The more you take care of yourself, the more you progress in the DeepSkyn ecosystem.",
    ctaLabel: "View My Achievements",
    ctaHref: "/user/badge",
    gradient: "from-indigo-400 via-blue-500 to-cyan-600",
    icon: ShieldCheck,
  },
  {
    id: "profile",
    title: "Your Personal Space",
    subtitle: "Total control, simplified",
    description:
      "Manage your preferences, update your profile, and access DeepSkyn support in one click.",
    ctaLabel: "My Profile",
    ctaHref: "/user/profile",
    gradient: "from-cyan-600 via-blue-700 to-slate-800",
    icon: Settings,
  },
];

export default function DeepSkynExperienceMap() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  const step = useMemo(() => EXPERIENCE_STEPS[currentStep], [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < EXPERIENCE_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "done");
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      const timer = window.setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const openGuide = () => {
      setDirection(0);
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener(OPEN_EVENT_NAME, openGuide);
    return () => window.removeEventListener(OPEN_EVENT_NAME, openGuide);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const progress = ((currentStep + 1) / EXPERIENCE_STEPS.length) * 100;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 30 : -30,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="deepskyn-experience-map-overlay"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="experience-map-title"
        >
          <motion.div
            className="relative flex h-full max-h-[850px] w-full max-w-7xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-[0_32px_128px_rgba(0,0,0,0.4)] md:flex-row"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
              aria-label="Close guide"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Side: Visual & Content */}
            <div
              className={`relative flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br ${step.gradient} p-8 text-white transition-all duration-700 md:p-16`}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                  className="absolute -top-1/4 -left-1/4 h-full w-full rounded-full bg-white/10 blur-[120px]"
                  animate={{ 
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-1/4 -right-1/4 h-full w-full rounded-full bg-cyan-400/20 blur-[100px]"
                  animate={{ 
                    x: [0, -40, 0],
                    y: [0, -60, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest uppercase backdrop-blur-sm"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  Experience Map
                </motion.div>

                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                        <step.icon className="h-7 w-7" />
                      </div>
                      <span className="text-lg font-medium text-white/70">
                        Step {currentStep + 1} / {EXPERIENCE_STEPS.length}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-medium tracking-wide text-cyan-200">
                        {step.subtitle}
                      </h3>
                      <h2 className="text-4xl font-extrabold leading-[1.1] md:text-6xl">
                        {step.title}
                      </h2>
                      <p className="max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
                        {step.description}
                      </p>
                    </div>

                    <div className="pt-4">
                      <LoadingLink
                        href={step.ctaHref}
                        className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-slate-50 active:scale-95"
                      >
                        {step.ctaLabel}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </LoadingLink>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative z-10 hidden items-center gap-3 md:flex">
                {EXPERIENCE_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentStep ? 1 : -1);
                      setCurrentStep(idx);
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentStep ? "w-12 bg-white" : "w-2.5 bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side: Roadmap & Controls */}
            <div className="relative flex w-full h-full flex-col overflow-hidden bg-slate-50 p-8 md:w-[450px] md:p-12 lg:w-[500px]">
              <div className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Your Journey</span>
                  <span className="text-lg font-black text-slate-800">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <div className="h-full w-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:200%_100%] animate-shimmer" />
                  </motion.div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {EXPERIENCE_STEPS.map((item, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDirection(index > currentStep ? 1 : -1);
                        setCurrentStep(index);
                      }}
                      className={`group relative flex w-full items-start gap-4 rounded-3xl p-5 text-left transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-[0_12px_40_rgba(0,0,0,0.08)] ring-1 ring-cyan-500/10"
                          : "hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="relative mt-1 flex-shrink-0">
                        {isDone ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 ring-4 ring-cyan-50">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                          </div>
                        ) : (
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                            isActive ? "border-cyan-500 bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "border-slate-300 bg-white text-slate-400"
                          }`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                          </div>
                        )}
                        {index < EXPERIENCE_STEPS.length - 1 && (
                          <div className="absolute left-3.5 top-10 h-6 w-0.5 bg-slate-200" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`text-base font-bold transition-colors ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                          {item.title}
                        </h4>
                        <p className={`mt-1 line-clamp-1 text-sm transition-colors ${isActive ? "text-slate-500" : "text-slate-400"}`}>
                          {item.subtitle}
                        </p>
                      </div>

                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  {currentStep === EXPERIENCE_STEPS.length - 1 ? (
                    <button
                      onClick={handleFinish}
                      className="flex-1 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
                    >
                      Start the Adventure
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-4 text-sm font-bold text-white transition-all hover:bg-cyan-500 hover:shadow-[0_8px_24px_rgba(8,145,178,0.3)] active:scale-[0.98]"
                    >
                      Next Step
                      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-6 w-full text-center text-sm font-semibold text-slate-400 transition-colors hover:text-slate-600"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </AnimatePresence>
  );
}

export { OPEN_EVENT_NAME as OPEN_DEEPSKYN_EXPERIENCE_MAP_EVENT };