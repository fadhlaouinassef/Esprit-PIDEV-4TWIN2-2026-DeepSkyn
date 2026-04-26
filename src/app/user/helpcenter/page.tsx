"use client";

import { useState, useEffect, useMemo } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  MessageSquare,
  Microscope,
  Sparkles,
  Package,
  User,
  CreditCard,
  Wrench,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FaqItem } from "@/app/api/user/helpcenter/route";

const CATEGORIES = [
  { label: "All", icon: CircleHelp, color: "text-slate-500" },
  { label: "Skin Analysis", icon: Microscope, color: "text-cyan-600" },
  { label: "Routines", icon: Sparkles, color: "text-emerald-600" },
  { label: "Products", icon: Package, color: "text-violet-600" },
  { label: "Account", icon: User, color: "text-blue-600" },
  { label: "Billing", icon: CreditCard, color: "text-amber-600" },
  { label: "Technical", icon: Wrench, color: "text-rose-600" },
];

export default function HelpCenterPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/user/helpcenter")
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []))
      .catch(() => toast.error("Failed to load FAQs"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faqs.filter((f) => {
      const matchCat = activeCategory === "All" || f.category === activeCategory;
      const matchSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [faqs, search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const f of filtered) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return map;
  }, [filtered]);

  const handleSubmitQuestion = async () => {
    if (question.trim().length < 10) {
      toast.error("Please describe your question (min 10 characters).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/helpcenter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      setQuestion("");
      toast.success("Your question has been submitted to our support team.");
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="min-h-screen bg-slate-50 pb-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-emerald-500 px-6 py-12 text-white">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <CircleHelp className="size-7" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold">Help Center</h1>
            <p className="mb-6 text-sm text-white/80">
              Find answers to your questions about DeepSkyn
            </p>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveCategory("All");
                }}
                placeholder="Search a question…"
                className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-lg outline-none ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-6">
          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => {
                    setActiveCategory(cat.label);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50"
                  )}
                >
                  <Icon className={cn("size-3.5", active ? "text-cyan-600" : cat.color)} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* FAQ list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-cyan-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <CircleHelp className="mx-auto mb-3 size-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No results found</p>
              <p className="mt-1 text-xs text-slate-400">
                Try a different keyword or browse by category
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category}>
                  {activeCategory === "All" && (
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                      {category}
                    </h2>
                  )}
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {items.map((faq, idx) => {
                      const isOpen = openId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className={cn(idx !== 0 && "border-t border-slate-100")}
                        >
                          <button
                            onClick={() => setOpenId(isOpen ? null : faq.id)}
                            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                          >
                            <span className="text-sm font-medium text-slate-800">
                              {faq.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="size-4 flex-shrink-0 text-cyan-500" />
                            ) : (
                              <ChevronDown className="size-4 flex-shrink-0 text-slate-400" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                              <p className="text-sm leading-relaxed text-slate-600">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Still need help */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Still need help?
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Can't find what you're looking for? Send us your question directly.
              </p>
            </div>

            <div className="p-5">
              {submitted ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="size-5 flex-shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      Question submitted!
                    </p>
                    <p className="text-xs text-emerald-600">
                      Our team will reply via Complaints & Feedback.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Describe your question or issue in detail…"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-400 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmitQuestion}
                      disabled={submitting || question.trim().length < 10}
                      className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Send Question
                    </button>
                    <button
                      onClick={() => router.push("/user/complaints")}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                    >
                      <MessageSquare className="size-4" />
                      Complaints & Feedback
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
