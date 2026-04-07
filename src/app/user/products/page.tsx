"use client";

import React, { useState, useEffect } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  Link2,
  Loader2,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Clock,
  RefreshCw,
  Filter,
  FlaskConical,
  Package,
  Tag,
  Building2,
  BookOpen,
  ShieldCheck,
  Leaf,
  Sun,
  Droplets,
  Pill,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────── Types ── */
interface OrganicResult {
  title?: string;
  url?: string;
  description?: string;
  position?: number;
  displayedUrl?: string;
  price?: string;
  imageUrl?: string;
  merchantName?: string;
}

interface SearchResponse {
  query: string;
  enrichedQuery: string;
  category: string;
  totalResults: number;
  results: OrganicResult[];
  runId?: string;
  error?: string;
}

/* ─────────────────────── Constants ── */
type Category = {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  examples: string[];
};

const CATEGORIES: Category[] = [
  {
    value: "skincare",
    label: "Skincare",
    icon: <Droplets className="size-4" />,
    color: "from-sky-500 to-blue-600",
    examples: ["CeraVe Hydrating Cleanser", "La Roche-Posay Toleriane", "COSRX Snail Mucin"],
  },
  {
    value: "sunscreen",
    label: "Sunscreen / SPF",
    icon: <Sun className="size-4" />,
    color: "from-amber-600 to-orange-700",
    examples: ["Altruist SPF 50", "EltaMD UV Clear", "Biore UV Aqua Rich"],
  },
  {
    value: "serum",
    label: "Serums",
    icon: <FlaskConical className="size-4" />,
    color: "from-violet-500 to-purple-600",
    examples: ["The Ordinary Niacinamide", "Skinceuticals C E Ferulic", "Paula's Choice BHA"],
  },
  {
    value: "moisturizer",
    label: "Moisturizers",
    icon: <Leaf className="size-4" />,
    color: "from-emerald-400 to-teal-500",
    examples: ["Cetaphil Moisturizing Cream", "First Aid Beauty Ultra Repair", "Neutrogena Hydro Boost"],
  },
  {
    value: "cleanser",
    label: "Cleansers",
    icon: <Sparkles className="size-4" />,
    color: "from-cyan-400 to-sky-500",
    examples: ["Vanicream Gentle Cleanser", "Simple Kind to Skin", "Bioderma Sensibio"],
  },

  {
    value: "pharmaceutical",
    label: "Pharmaceutical",
    icon: <Pill className="size-4" />,
    color: "from-red-500 to-pink-600",
    examples: ["Tretinoin cream", "Clindamycin topical", "Azelaic acid"],
  },
  {
    value: "derma",
    label: "Derma / Medical",
    icon: <ShieldCheck className="size-4" />,
    color: "from-indigo-500 to-blue-700",
    examples: ["Differin Adapalene", "Finacea Azelaic Acid", "Epiduo Forte"],
  },
];

const COUNTRY_OPTIONS = [
  { value: "us", label: "🇺🇸 United States" },
  { value: "fr", label: "🇫🇷 France" },
  { value: "gb", label: "🇬🇧 United Kingdom" },
  { value: "de", label: "🇩🇪 Germany" },
  { value: "ma", label: "🇲🇦 Morocco" },
  { value: "dz", label: "🇩🇿 Algeria" },
  { value: "tn", label: "🇹🇳 Tunisia" },
];

const MAX_RESULTS_OPTIONS = [5, 10, 20, 30];

const TRUSTED_SITES = [
  { value: "", label: "All Sites" },
  { value: "sephora.com", label: "Sephora" },
  { value: "ulta.com", label: "Ulta Beauty" },
  { value: "lookfantastic.com", label: "LookFantastic" },
  { value: "incidecoder.com", label: "INCIDecoder" },
  { value: "cosdna.com", label: "CosDNA" },
  { value: "paulaschoice.com", label: "Paula's Choice" },
  { value: "amazon.com", label: "Amazon" },
];

/* ─────────────────────── Components ── */
function OgImageFallback({ url, alt }: { url?: string; alt: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (!url) {
      setLoaded(true);
      return;
    }
    fetch(`/api/scraping/og-image?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(data => {
        if (data.imageUrl) setImgUrl(data.imageUrl);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [url]);

  if (imgUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img 
        src={imgUrl} 
        alt={alt} 
        className="absolute inset-0 w-full h-full object-contain p-8 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" 
      />
    );
  }

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      {loaded ? (
        <>
          <Package className="size-12 mb-2 opacity-40" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">No Image</span>
        </>
      ) : (
        <Loader2 className="size-6 animate-spin opacity-40" />
      )}
    </div>
  );
}

/* ─────────────────────── Page ── */
export default function ProductsPage() {
  const [query, setQuery]               = useState("");
  const [category, setCategory]         = useState("skincare");
  const [brand, setBrand]               = useState("");
  const [site, setSite]                 = useState("");
  const [countryCode, setCountryCode]   = useState("us");
  const [languageCode, setLanguageCode] = useState("en");
  const [maxResults, setMaxResults]     = useState(10);
  const [showFilters, setShowFilters]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [searchData, setSearchData]     = useState<SearchResponse | null>(null);

  const selectedCategory = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error("Please enter a product name or ingredient.");
      return;
    }

    setLoading(true);
    setSearchData(null);
    try {
      const res = await fetch("/api/scraping/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, category, brand, site, countryCode, languageCode, maxResults }),
      });
      const data: SearchResponse = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Scraping failed.");
        return;
      }
      setSearchData(data);
      toast.success(`Found ${data.totalResults} results for "${trimmed}"`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <UserLayout>
      <div className="user-products-page mx-auto w-full max-w-[920px] flex flex-col gap-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
          <span>User</span>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">Products</span>
        </nav>

        {/* ── Hero Banner ── */}
        <div className={`products-hero relative overflow-hidden rounded-3xl bg-gradient-to-br ${selectedCategory.color} p-6 shadow-2xl transition-all duration-500`}>
          <div className="pointer-events-none absolute -top-10 -right-10 size-52 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-5">
            <div className="flex-shrink-0 flex items-center justify-center size-16 rounded-2xl bg-white/20 backdrop-blur shadow-inner text-white">
              <Package className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-yellow-200" />
                <span className="hero-kicker text-xs font-bold text-white/60 uppercase tracking-widest">
                  Powered by Apify
                </span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight">
                Cosmetic &amp; Medical Product Scraper
              </h1>
              <p className="hero-subtitle mt-1 text-sm text-white/70">
                Scrape Google for cosmetic and pharmaceutical products, ingredients, and formulations.
              </p>
            </div>
          </div>
        </div>

        {/* ── Category Selector ── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Product Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  category === cat.value
                    ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                    : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Example queries for selected category */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Examples:</span>
            {selectedCategory.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleExampleClick(ex)}
                className="text-xs px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-solid hover:text-gray-700 dark:hover:text-gray-200 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search Form ── */}
        <form
          onSubmit={handleSearch}
          className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-4"
        >
          {/* Search row */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 pointer-events-none" />
              <input
                id="admin-scraping-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Niacinamide serum, Tretinoin 0.025%, CeraVe Hydrating…"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                showFilters
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              <Filter className="size-4" />
              Filters
            </button>

            <button
              id="admin-scraping-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="size-4 animate-spin" /> Searching…</>
              ) : (
                <><Search className="size-4" /> Scrape</>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Brand filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Building2 className="size-3" /> Brand
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. CeraVe, L'Oreal"
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  {/* Site filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Globe className="size-3" /> Restrict to Site
                    </label>
                    <select
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {TRUSTED_SITES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Tag className="size-3" /> Country
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Max Results */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <BookOpen className="size-3" /> Max Results
                    </label>
                    <select
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value))}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      {MAX_RESULTS_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} results</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language row */}
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Language:
                  </label>
                  {["en", "fr", "ar", "de"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguageCode(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        languageCode === lang
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* ── Loading State ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-14 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm gap-5"
            >
              <div className="relative">
                <Loader2 className="size-14 text-blue-500 animate-spin" />
                <FlaskConical className="absolute inset-0 m-auto size-6 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">Scraping Google for products…</p>
                <p className="text-sm text-gray-400 mt-1">
                  Category: <strong>{selectedCategory.label}</strong> · This may take up to 40 seconds.
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="size-2 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {searchData && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Results header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-500" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {searchData.totalResults} result{searchData.totalResults !== 1 ? "s" : ""} ·{" "}
                    <span className="text-blue-600 dark:text-blue-400">&ldquo;{searchData.query}&rdquo;</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 font-semibold">
                      {selectedCategory.label}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {searchData.runId && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="size-3" /> Run: {searchData.runId.slice(0, 8)}…
                    </span>
                  )}
                  <button
                    onClick={() => setSearchData(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <RefreshCw className="size-3.5" /> New Search
                  </button>
                </div>
              </div>

              {/* Enriched query info */}
              {searchData.enrichedQuery !== searchData.query && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <FlaskConical className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Enriched search query</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 font-mono break-all">
                      {searchData.enrichedQuery}
                    </p>
                  </div>
                </div>
              )}

              {/* No results */}
              {searchData.results.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <AlertTriangle className="size-10 text-yellow-400" />
                  <p className="font-semibold text-gray-700 dark:text-gray-200">No results found</p>
                  <p className="text-sm text-gray-400">Try a different product name or adjust the filters.</p>
                </div>
              )}

              {/* ── Helper to render a single product card ── */}
              {(() => {
                const withImage    = searchData.results.filter((r) => !!r.imageUrl);
                const withoutImage = searchData.results.filter((r) => !r.imageUrl);

                const renderCard = (result: OrganicResult, globalIndex: number) => {
                  let domain = "—";
                  try {
                    if (result.url) domain = new URL(result.url).hostname.replace("www.", "");
                  } catch (_) {}
                  return (
                    <motion.div
                      key={`${result.url}-${globalIndex}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: globalIndex * 0.04 }}
                      className="group flex flex-col bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300"
                    >
                      {/* Position badge & Image Header */}
                      <div className="relative">
                        <div className={`absolute top-4 left-4 flex items-center justify-center size-8 rounded-xl bg-gradient-to-br ${selectedCategory.color} text-white text-xs font-black shadow-lg z-10`}>
                          {result.position ?? globalIndex + 1}
                        </div>
                        <div className="w-full pt-[75%] relative bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-700">
                          {result.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={result.imageUrl}
                              alt={result.title || "Product"}
                              className="absolute inset-0 w-full h-full object-contain p-8 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <OgImageFallback url={result.url} alt={result.title || "Product fallback"} />
                          )}
                          {result.price && result.price !== "N/A" && (
                            <div className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-green-700 dark:text-green-400 text-sm font-black shadow-md border border-gray-100 dark:border-gray-700">
                              {result.price}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5 gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          <Globe className="size-3.5 shrink-0" />
                          <span className="truncate">{result.merchantName || result.displayedUrl || domain}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {result.title || "Title Unavailable"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                          {result.description || "No description provided."}
                        </p>
                        <div className="flex-1" />
                        {result.url && (
                          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 dark:bg-gray-700/50 dark:hover:bg-blue-900/30 text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 text-sm font-bold transition-all group/btn"
                            >
                              Visit Page
                              <ExternalLink className="size-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                };

                return (
                  <div className="space-y-8">
                    {/* ── Group 1 : Products WITH image ── */}
                    {withImage.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            <span className="inline-block size-2 rounded-full bg-emerald-500" />
                            {withImage.length} produit{withImage.length > 1 ? "s" : ""} avec image
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {withImage.map((result, i) => renderCard(result, i))}
                        </div>
                      </div>
                    )}

                    {/* ── Separator ── */}
                    {withImage.length > 0 && withoutImage.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          <Package className="size-3.5" />
                          Produits sans image
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      </div>
                    )}

                    {/* ── Group 2 : Products WITHOUT image ── */}
                    {withoutImage.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                        {withoutImage.map((result, i) => renderCard(result, withImage.length + i))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty State ── */}
        {!searchData && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className={`flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br ${selectedCategory.color} opacity-90 shadow-lg`}>
              <Package className="size-10 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800 dark:text-white">
                Ready to scrape {selectedCategory.label} products
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                Enter a product name, ingredient, or brand above and click{" "}
                <strong>Scrape</strong> to fetch Google results via Apify.
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </UserLayout>
  );
}
