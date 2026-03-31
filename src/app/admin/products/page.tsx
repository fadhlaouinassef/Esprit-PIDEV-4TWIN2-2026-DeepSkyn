
"use client";

import { useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import {
    Package,
    Search,
    Plus,
    Eye,
    Pencil,
    Trash2,
    ChevronRight,
    Upload,
    X,
    Bold,
    Italic,
    List,
    Link2,
    Tag,
    CalendarDays,
    Layers,
    Droplets,
    DollarSign,
    ShieldCheck,
    FlaskConical,
    Globe,
    Loader2,
    ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    skinTypes: string[];
    ingredients: string[];
    benefits: string;
    price: number;
    status: "active" | "inactive";
    createdAt: string;
    image: string;
}

interface ScrapedProduct {
    name: string;
    url: string;
    image?: string;
    description?: string;
    price?: string;
    matchedIngredients: string[];
    sourceUrl: string;
}

interface ScrapeApiResponse {
    products?: ScrapedProduct[];
    warnings?: string[];
    meta?: {
        totalMatches: number;
        returned: number;
        sourceCount: number;
        ingredients: string[];
    };
    error?: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const STATIC_PRODUCTS: Product[] = [
    {
        id: "1",
        name: "Glow Hydrating Cream",
        sku: "DS-001",
        category: "Moisturizer",
        skinTypes: ["DRY", "SENSITIVE"],
        ingredients: ["Hyaluronic Acid", "Ceramides"],
        benefits: "Intense 24h...",
        price: 34.99,
        status: "active",
        createdAt: "Oct 12, 2023",
        image: "/products/cream.jpg",
    },
    {
        id: "2",
        name: "Purifying Foam Gel",
        sku: "DS-002",
        category: "Cleanser",
        skinTypes: ["OILY", "ACNE-PRONE"],
        ingredients: ["Salicylic Acid", "Zinc PCA"],
        benefits: "Deep pore...",
        price: 22.5,
        status: "active",
        createdAt: "Sep 28, 2023",
        image: "/products/foam.jpg",
    },
    {
        id: "3",
        name: "C-Booster Serum",
        sku: "DS-042",
        category: "Serum",
        skinTypes: ["ALL TYPES"],
        ingredients: ["Vitamin C", "Ferulic Acid"],
        benefits: "Brightening, anti-...",
        price: 54.0,
        status: "inactive",
        createdAt: "Aug 05, 2023",
        image: "/products/serum.jpg",
    },
    {
        id: "4",
        name: "Niacinamide Toner",
        sku: "DS-007",
        category: "Toner",
        skinTypes: ["OILY", "COMBINATION"],
        ingredients: ["Niacinamide", "Zinc"],
        benefits: "Pore-minimizing...",
        price: 19.99,
        status: "active",
        createdAt: "Nov 03, 2023",
        image: "/products/toner.jpg",
    },
    {
        id: "5",
        name: "SPF 50 Sunscreen",
        sku: "DS-015",
        category: "Sun Care",
        skinTypes: ["ALL TYPES"],
        ingredients: ["Zinc Oxide", "Titanium Dioxide"],
        benefits: "Broad spectrum UV...",
        price: 29.99,
        status: "active",
        createdAt: "Jul 18, 2023",
        image: "/products/spf.jpg",
    },
    {
        id: "6",
        name: "Retinol Night Cream",
        sku: "DS-023",
        category: "Moisturizer",
        skinTypes: ["NORMAL", "DRY"],
        ingredients: ["Retinol", "Peptides"],
        benefits: "Anti-aging, firming...",
        price: 48.5,
        status: "active",
        createdAt: "Dec 01, 2023",
        image: "/products/retinol.jpg",
    },
    {
        id: "7",
        name: "Exfoliating Scrub",
        sku: "DS-031",
        category: "Exfoliator",
        skinTypes: ["NORMAL", "COMBINATION"],
        ingredients: ["AHA", "BHA"],
        benefits: "Gentle exfoliation...",
        price: 27.0,
        status: "inactive",
        createdAt: "Jan 15, 2024",
        image: "/products/scrub.jpg",
    },
    {
        id: "8",
        name: "Eye Contour Serum",
        sku: "DS-039",
        category: "Serum",
        skinTypes: ["ALL TYPES"],
        ingredients: ["Caffeine", "Collagen"],
        benefits: "Reduces puffiness...",
        price: 39.99,
        status: "active",
        createdAt: "Feb 22, 2024",
        image: "/products/eyeserum.jpg",
    },
    {
        id: "9",
        name: "Micellar Water",
        sku: "DS-048",
        category: "Cleanser",
        skinTypes: ["SENSITIVE"],
        ingredients: ["Micellar Solution", "Aloe Vera"],
        benefits: "Gentle cleansing...",
        price: 14.99,
        status: "active",
        createdAt: "Mar 05, 2024",
        image: "/products/micellar.jpg",
    },
    {
        id: "10",
        name: "Lip Repair Balm",
        sku: "DS-055",
        category: "Lip Care",
        skinTypes: ["DRY"],
        ingredients: ["Shea Butter", "Vitamin E"],
        benefits: "Intense lip repair...",
        price: 12.5,
        status: "active",
        createdAt: "Apr 10, 2024",
        image: "/products/lip.jpg",
    },
];

const SKIN_TYPE_COLORS: Record<string, string> = {
    DRY: "bg-blue-100 text-blue-700",
    SENSITIVE: "bg-purple-100 text-purple-700",
    OILY: "bg-teal-100 text-teal-700",
    "ACNE-PRONE": "bg-orange-100 text-orange-700",
    "ALL TYPES": "bg-gray-100 text-gray-600",
    NORMAL: "bg-sky-100 text-sky-700",
    COMBINATION: "bg-yellow-100 text-yellow-700",
};

const PAGE_SIZE = 10;

const CATEGORIES = ["All", "Moisturizer", "Cleanser", "Serum", "Toner", "Sun Care", "Exfoliator", "Lip Care"];
const SKIN_TYPES_F = ["All", "DRY", "OILY", "SENSITIVE", "COMBINATION", "NORMAL", "ACNE-PRONE", "ALL TYPES"];

// ── Helper: Status Toggle ─────────────────────────────────────────────────────

function Toggle({ active }: { active: boolean }) {
    return (
        <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${active ? "bg-[#156d95]" : "bg-gray-300 dark:bg-gray-600"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${active ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

// ── Helper: Stat Card ─────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    badge,
    iconBg,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    badge?: string;
    iconBg: string;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className={`size-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
                {badge && (
                    <span className="text-xs font-bold text-[#156d95] bg-[#156d95]/10 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

// ── Product Detail Modal ──────────────────────────────────────────────────────

function ProductDetailModal({
    product,
    onClose,
    onEdit,
}: {
    product: Product;
    onClose: () => void;
    onEdit: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-[#156d95]/10 flex items-center justify-center">
                            <Package className="size-5 text-[#156d95]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                {product.name}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* ── Modal Body ── */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

                    {/* Image + Quick Info row */}
                    <div className="flex flex-col sm:flex-row gap-5">

                        {/* Image placeholder */}
                        <div className="w-full sm:w-48 h-48 shrink-0 rounded-2xl bg-gradient-to-br from-[#156d95]/10 via-[#156d95]/5 to-[#1a87b8]/10 dark:from-[#156d95]/20 dark:to-[#1a87b8]/20 flex flex-col items-center justify-center gap-2 border border-[#156d95]/20">
                            <Package className="size-16 text-[#156d95]/40" />
                            <span className="text-xs text-[#156d95]/60 font-medium">No image uploaded</span>
                        </div>

                        {/* Quick info grid */}
                        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
                            {/* Status */}
                            <div className="col-span-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${product.status === "active"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                        }`}
                                >
                                    <span className={`size-1.5 rounded-full ${product.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                                    {product.status === "active" ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {/* Category */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Layers className="size-3.5 text-[#156d95]" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Category</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{product.category}</p>
                            </div>

                            {/* Price */}
                            <div className="bg-[#156d95]/10 dark:bg-[#156d95]/20 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <DollarSign className="size-3.5 text-[#156d95]" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#156d95]/70">Price</span>
                                </div>
                                <p className="text-lg font-black text-[#156d95]">${product.price.toFixed(2)}</p>
                            </div>

                            {/* Created */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <CalendarDays className="size-3.5 text-[#156d95]" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Created</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{product.createdAt}</p>
                            </div>

                            {/* SKU */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Tag className="size-3.5 text-[#156d95]" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">SKU</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{product.sku}</p>
                            </div>
                        </div>
                    </div>

                    {/* Skin Types */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Droplets className="size-4 text-[#156d95]" />
                            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Skin Types</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {product.skinTypes.map((st) => (
                                <span
                                    key={st}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-xl ${SKIN_TYPE_COLORS[st] ?? "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {st}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Key Ingredients */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <FlaskConical className="size-4 text-[#156d95]" />
                            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Key Ingredients</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {product.ingredients.map((ing) => (
                                <span
                                    key={ing}
                                    className="text-xs font-medium bg-[#156d95]/10 text-[#156d95] dark:bg-[#156d95]/20 dark:text-[#5ab8e0] border border-[#156d95]/20 px-3 py-1.5 rounded-xl"
                                >
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Benefits / Description */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="size-4 text-[#156d95]" />
                            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">Benefits &amp; Description</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {product.benefits && product.benefits !== "Intense 24h..."
                                    && product.benefits !== "Deep pore..."
                                    && product.benefits !== "Brightening, anti-..."
                                    && product.benefits !== "Pore-minimizing..."
                                    && product.benefits !== "Broad spectrum UV..."
                                    && product.benefits !== "Anti-aging, firming..."
                                    && product.benefits !== "Gentle exfoliation..."
                                    && product.benefits !== "Reduces puffiness..."
                                    && product.benefits !== "Gentle cleansing..."
                                    && product.benefits !== "Intense lip repair..."
                                    ? product.benefits
                                    : BENEFITS_FULL[product.id] ?? product.benefits
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Modal Footer ── */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-5 py-2.5 rounded-xl bg-[#156d95] hover:bg-[#1a87b8] text-white text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Pencil className="size-4" />
                        Edit Product
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Full benefits descriptions (for the modal) ────────────────────────────────

const BENEFITS_FULL: Record<string, string> = {
    "1": "Provides intense 24-hour hydration with a lightweight, non-greasy texture. Hyaluronic Acid draws moisture into the skin while Ceramides lock it in and reinforce the skin's natural barrier, leaving skin plump and smooth.",
    "2": "Deep pore-cleansing formula that removes excess sebum and impurities without stripping the skin. Salicylic Acid exfoliates inside pores to prevent breakouts, while Zinc PCA regulates oil production for a matte, clear complexion.",
    "3": "Brightening and anti-aging powerhouse that visibly fades dark spots and uneven skin tone. Vitamin C neutralises free radicals while Ferulic Acid boosts its stability and efficacy, delivering a radiant, photo-protected glow.",
    "4": "Minimises the appearance of enlarged pores and controls excess shine. Niacinamide strengthens the skin barrier and evens skin tone while Zinc works synergistically to reduce sebum secretion for a refined, balanced complexion.",
    "5": "Broad-spectrum UVA/UVB SPF 50 protection using mineral filters that sit on the skin without causing irritation. Zinc Oxide and Titanium Dioxide scatter and reflect UV rays, making it ideal for daily wear on all skin types including sensitive skin.",
    "6": "Advanced anti-aging night treatment that stimulates cell renewal while you sleep. Retinol boosts collagen production to reduce fine lines and wrinkles, while Peptides firm and improve skin elasticity for a visibly smoother, more youthful complexion.",
    "7": "Gentle dual-acid exfoliator that smooths texture and brightens skin without over-stripping. AHA dissolves dead surface cells while BHA penetrates pores to clear congestion, resulting in a visibly refined, luminous complexion suitable for weekly use.",
    "8": "Targeted eye area treatment that visibly reduces puffiness, dark circles, and fine lines. Caffeine constricts blood vessels to deflate under-eye bags, while Collagen peptides support skin firmness for a brighter, more rested appearance.",
    "9": "Ultra-gentle micellar cleansing water that effectively removes makeup, sunscreen, and daily impurities with zero rinsing required. Micellar Solution captures and lifts away dirt like a magnet, while Aloe Vera soothes and calms reactive or sensitive skin.",
    "10": "Intensive repair balm that melts into dry, chapped lips to restore softness and suppleness. Shea Butter delivers rich, long-lasting nourishment while Vitamin E acts as an antioxidant to protect lip tissue and support natural healing overnight.",
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
    const [view, setView] = useState<"list" | "add">("list");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // List state
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterSkin, setFilterSkin] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    // Web scraping state
    const [scrapeIngredientInput, setScrapeIngredientInput] = useState("");
    const [scrapeIngredients, setScrapeIngredients] = useState<string[]>(["SPF 50", "Retinol"]);
    const [scrapedProducts, setScrapedProducts] = useState<ScrapedProduct[]>([]);
    const [scrapeWarnings, setScrapeWarnings] = useState<string[]>([]);
    const [scrapeMeta, setScrapeMeta] = useState<ScrapeApiResponse["meta"] | null>(null);
    const [scrapeLoading, setScrapeLoading] = useState(false);
    const [scrapeError, setScrapeError] = useState("");

    // Add Product form state
    const [formData, setFormData] = useState({
        name: "",
        category: "Serums",
        description: "",
        status: true,
        price: "",
        ingredients: ["Hyaluronic Acid", "Niacinamide"],
        ingredientInput: "",
        benefits: {
            Hydration: false,
            "Anti-Aging": true,
            Brightening: false,
            Soothing: false,
            "Pore Control": false,
            "UV Protection": false,
        } as Record<string, boolean>,
        skinTypes: {
            "Oily Skin": true,
            "Dry Skin": false,
            "Combination Skin": true,
            "Sensitive Skin": false,
            "Normal Skin": false,
        } as Record<string, boolean>,
        images: [] as string[],
    });

    // Stats
    const total = 1240;
    const active = 1180;
    const inactive = 60;
    const categories = 12;

    // Filtering
    const filtered = STATIC_PRODUCTS.filter((p) => {
        const matchSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.ingredients.some((i) => i.toLowerCase().includes(search.toLowerCase()));
        const matchCat = filterCategory === "All" || p.category === filterCategory;
        const matchSkin = filterSkin === "All" || p.skinTypes.some((s) => s === filterSkin);
        const matchStatus =
            filterStatus === "All" ||
            (filterStatus === "Active" && p.status === "active") ||
            (filterStatus === "Inactive" && p.status === "inactive");
        return matchSearch && matchCat && matchSkin && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleRemoveIngredient = (ing: string) => {
        setFormData((f) => ({ ...f, ingredients: f.ingredients.filter((x) => x !== ing) }));
    };

    const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && formData.ingredientInput.trim()) {
            e.preventDefault();
            const val = formData.ingredientInput.trim();
            if (!formData.ingredients.includes(val)) {
                setFormData((f) => ({ ...f, ingredients: [...f.ingredients, val], ingredientInput: "" }));
            } else {
                setFormData((f) => ({ ...f, ingredientInput: "" }));
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files).map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
            }));
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleAddScrapeIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && scrapeIngredientInput.trim()) {
            e.preventDefault();
            const value = scrapeIngredientInput.trim();
            if (!scrapeIngredients.includes(value)) {
                setScrapeIngredients((prev) => [...prev, value]);
            }
            setScrapeIngredientInput("");
        }
    };

    const handleRemoveScrapeIngredient = (ingredient: string) => {
        setScrapeIngredients((prev) => prev.filter((item) => item !== ingredient));
    };

    const handleRunScraping = async () => {
        const pendingKeyword = scrapeIngredientInput.trim();
        const finalIngredients = pendingKeyword
            ? scrapeIngredients.includes(pendingKeyword)
                ? scrapeIngredients
                : [...scrapeIngredients, pendingKeyword]
            : scrapeIngredients;

        if (pendingKeyword) {
            setScrapeIngredientInput("");
            if (!scrapeIngredients.includes(pendingKeyword)) {
                setScrapeIngredients(finalIngredients);
            }
        }

        if (finalIngredients.length === 0) {
            setScrapeError("Please add at least one ingredient keyword.");
            return;
        }

        setScrapeLoading(true);
        setScrapeError("");
        setScrapeWarnings([]);

        try {
            const response = await fetch("/api/admin/products/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ingredients: finalIngredients,
                    maxResults: 20,
                }),
            });

            const payload: ScrapeApiResponse = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Scraping failed.");
            }

            setScrapedProducts(payload.products || []);
            setScrapeWarnings(payload.warnings || []);
            setScrapeMeta(payload.meta || null);
        } catch (error: any) {
            setScrapeError(error?.message || "Unable to run scraping.");
            setScrapedProducts([]);
            setScrapeMeta(null);
        } finally {
            setScrapeLoading(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <AdminLayout>
            <AnimatePresence mode="wait">
                {view === "list" ? (

                    /* ═══════════════════════════════════════════
                       LIST VIEW
                    ═══════════════════════════════════════════ */
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="space-y-6 max-w-7xl mx-auto pb-12"
                    >
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <Package className="size-8 text-[#156d95]" />
                                    Products
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1 ml-11 text-sm">
                                    Manage all skincare products in your catalogue.
                                </p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={<Package className="size-5 text-[#156d95]" />}
                                iconBg="bg-[#156d95]/10"
                                label="Total Products"
                                value={total.toLocaleString()}
                                badge="+4%"
                            />
                            <StatCard
                                icon={
                                    <svg viewBox="0 0 20 20" fill="none" className="size-5 text-green-600">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                }
                                iconBg="bg-green-50"
                                label="Active Products"
                                value={active.toLocaleString()}
                            />
                            <StatCard
                                icon={
                                    <svg viewBox="0 0 20 20" fill="none" className="size-5 text-orange-500">
                                        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                                        <rect x="9" y="5" width="2" height="6" rx="1" fill="currentColor" />
                                        <rect x="9" y="13" width="2" height="2" rx="1" fill="currentColor" />
                                    </svg>
                                }
                                iconBg="bg-orange-50"
                                label="Inactive Items"
                                value={inactive}
                            />
                            <StatCard
                                icon={
                                    <svg viewBox="0 0 20 20" fill="none" className="size-5 text-purple-600">
                                        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                }
                                iconBg="bg-purple-50"
                                label="Total Categories"
                                value={categories}
                            />
                        </div>

                        {/* Search + Filters + Add Button */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#156d95]/20 focus-within:border-[#156d95] transition-all">
                                <Search className="size-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search product or ingredient..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 w-full"
                                />
                            </div>

                            {/* Category filter */}
                            <select
                                value={filterCategory}
                                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#156d95]/20 focus:border-[#156d95] transition-all"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c}>{c === "All" ? "Category: All" : c}</option>
                                ))}
                            </select>

                            {/* Skin type filter */}
                            <select
                                value={filterSkin}
                                onChange={(e) => { setFilterSkin(e.target.value); setCurrentPage(1); }}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#156d95]/20 focus:border-[#156d95] transition-all"
                            >
                                {SKIN_TYPES_F.map((s) => (
                                    <option key={s}>{s === "All" ? "Skin Type: All" : s}</option>
                                ))}
                            </select>

                            {/* Status filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-[#156d95]/20 focus:border-[#156d95] transition-all"
                            >
                                {["All", "Active", "Inactive"].map((s) => (
                                    <option key={s}>{s === "All" ? "Status: All" : s}</option>
                                ))}
                            </select>

                            {/* Add New Product button */}
                            <button
                                onClick={() => setView("add")}
                                className="flex items-center gap-2 bg-[#156d95] hover:bg-[#1a87b8] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ml-auto"
                            >
                                <Plus className="size-4" />
                                Add New Product
                            </button>
                        </div>

                        {/* Admin Web Scraping */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Globe className="size-5 text-[#156d95]" />
                                        Product Web Scraping
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Write only ingredient keywords, then click the button to display matching products.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScrapeIngredients(formData.ingredients)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Use Form Ingredients
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScrapedProducts([]);
                                            setScrapeWarnings([]);
                                            setScrapeMeta(null);
                                            setScrapeError("");
                                        }}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Clear Results
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Ingredient Keywords
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 min-h-[46px] focus-within:border-[#156d95] focus-within:ring-2 focus-within:ring-[#156d95]/20 transition-all bg-white dark:bg-gray-900">
                                        {scrapeIngredients.map((ingredient) => (
                                            <span
                                                key={ingredient}
                                                className="flex items-center gap-1 bg-[#156d95]/10 text-[#156d95] dark:text-[#5ab8e0] text-xs font-medium px-2.5 py-1 rounded-lg"
                                            >
                                                {ingredient}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveScrapeIngredient(ingredient)}
                                                    className="text-[#156d95]/60 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={scrapeIngredientInput}
                                            onChange={(e) => setScrapeIngredientInput(e.target.value)}
                                            onKeyDown={handleAddScrapeIngredient}
                                            placeholder="Type ingredient..."
                                            className="flex-1 min-w-[140px] text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleRunScraping}
                                    disabled={scrapeLoading}
                                    className="inline-flex items-center gap-2 bg-[#156d95] hover:bg-[#1a87b8] disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                                >
                                    {scrapeLoading ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                                    {scrapeLoading ? "Scraping..." : "Run Scraping"}
                                </button>
                                {scrapeMeta && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Found {scrapeMeta.totalMatches} matches, showing {scrapeMeta.returned} results.
                                    </p>
                                )}
                            </div>

                            {scrapeError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {scrapeError}
                                </div>
                            )}

                            {scrapeWarnings.length > 0 && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <p className="font-bold mb-1">Warnings</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {scrapeWarnings.map((warning) => (
                                            <li key={warning}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="border border-gray-100 dark:border-gray-700/50 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700/50">
                                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Image
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Product Name
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Description
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Matched Ingredients
                                                </th>
                                                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Price
                                                </th>
                                                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Link
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scrapedProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                                                        No scraped products yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                scrapedProducts.map((product, index) => (
                                                    <tr key={`${product.url}-${index}`} className="border-b border-gray-50 dark:border-gray-700/30">
                                                        <td className="px-4 py-3">
                                                            {product.image ? (
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="size-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                                                />
                                                            ) : (
                                                                <div className="size-14 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-[10px] text-gray-400">
                                                                    No image
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-[320px] line-clamp-3">
                                                                {product.description || "-"}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {product.matchedIngredients.map((ingredient) => (
                                                                    <span
                                                                        key={ingredient}
                                                                        className="text-[10px] font-medium bg-[#156d95]/10 text-[#156d95] border border-[#156d95]/20 px-2 py-0.5 rounded-md"
                                                                    >
                                                                        {ingredient}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                                            {product.price || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <a
                                                                href={product.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-sm font-medium text-[#156d95] hover:underline"
                                                            >
                                                                Open
                                                                <ExternalLink className="size-3.5" />
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/60 dark:bg-gray-900/30">
                                            <th className="text-left px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Product Info
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Category
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Skin Type
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 max-w-[180px]">
                                                Ingredients &amp; Benefits
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Price
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Status
                                            </th>
                                            <th className="text-left px-4 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Created
                                            </th>
                                            <th className="text-right px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-16 text-gray-400">
                                                    No products found.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginated.map((product, idx) => (
                                                <motion.tr
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.04 }}
                                                    className="border-b border-gray-50 dark:border-gray-700/30 hover:bg-[#156d95]/5 dark:hover:bg-[#156d95]/10 transition-colors"
                                                >
                                                    {/* Product Info */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-12 rounded-xl bg-[#156d95]/10 dark:bg-[#156d95]/20 flex items-center justify-center shrink-0">
                                                                <Package className="size-6 text-[#156d95]" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                                                                    {product.name}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">{product.category}</span>
                                                    </td>

                                                    {/* Skin Type */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.skinTypes.map((st) => (
                                                                <span
                                                                    key={st}
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SKIN_TYPE_COLORS[st] ?? "bg-gray-100 text-gray-600"}`}
                                                                >
                                                                    {st}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* Ingredients & Benefits */}
                                                    <td className="px-4 py-4 max-w-[180px]">
                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                            {product.ingredients.map((ing) => (
                                                                <span
                                                                    key={ing}
                                                                    className="text-[10px] font-medium bg-[#156d95]/10 text-[#156d95] dark:bg-[#156d95]/20 dark:text-[#5ab8e0] border border-[#156d95]/20 px-2 py-0.5 rounded-md"
                                                                >
                                                                    {ing}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-gray-400 italic truncate">{product.benefits}</p>
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            ${product.price.toFixed(2)}
                                                        </span>
                                                    </td>

                                                    {/* Status Toggle */}
                                                    <td className="px-4 py-4">
                                                        <Toggle active={product.status === "active"} />
                                                    </td>

                                                    {/* Created */}
                                                    <td className="px-4 py-4">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{product.createdAt}</span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => setSelectedProduct(product)}
                                                                className="p-2 rounded-xl text-gray-400 hover:text-[#156d95] hover:bg-[#156d95]/10 transition-all"
                                                                title="View details"
                                                            >
                                                                <Eye className="size-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setView("add")}
                                                                className="p-2 rounded-xl text-gray-400 hover:text-[#156d95] hover:bg-[#156d95]/10 transition-all"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </button>
                                                            <button
                                                                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700/50">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing{" "}
                                    <span className="font-bold text-gray-700 dark:text-gray-200">
                                        {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-bold text-gray-700 dark:text-gray-200">
                                        {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{total.toLocaleString()}</span>{" "}
                                    products
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {[1, 2, 3].map((pg) => (
                                        <button
                                            key={pg}
                                            onClick={() => setCurrentPage(pg)}
                                            className={`size-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pg
                                                ? "bg-[#156d95] text-white shadow-sm"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            {pg}
                                        </button>
                                    ))}

                                    <span className="px-1 text-gray-400 text-sm">...</span>

                                    <button
                                        onClick={() => setCurrentPage(124)}
                                        className={`size-8 rounded-lg text-sm font-bold transition-colors ${currentPage === 124
                                            ? "bg-[#156d95] text-white shadow-sm"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        124
                                    </button>

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                ) : (

                    /* ═══════════════════════════════════════════
                       ADD / EDIT PRODUCT VIEW
                    ═══════════════════════════════════════════ */
                    <motion.div
                        key="add"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        className="max-w-6xl mx-auto pb-12 space-y-6"
                    >
                        {/* Breadcrumb + Header */}
                        <div>
                            <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
                                <button
                                    onClick={() => setView("list")}
                                    className="hover:text-[#156d95] transition-colors"
                                >
                                    Products
                                </button>
                                <ChevronRight className="size-3.5" />
                                <span className="text-[#156d95] font-medium">Add New</span>
                            </nav>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Add New Product</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Configure your product's details and skin-specific properties.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setView("list")}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button className="px-5 py-2.5 rounded-xl bg-[#156d95] hover:bg-[#1a87b8] text-white text-sm font-bold transition-colors shadow-sm">
                                        Save Product
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Two-column layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                            {/* ── Left Column ── */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Basic Information */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#156d95]/10 flex items-center justify-center">
                                            <Package className="size-4 text-[#156d95]" />
                                        </div>
                                        <h2 className="font-bold text-gray-900 dark:text-white">Basic Information</h2>
                                    </div>

                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Product Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                                            placeholder="e.g. Vitamin C Radiance Serum"
                                            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-[#156d95] focus:ring-2 focus:ring-[#156d95]/20 transition-all"
                                        />
                                    </div>

                                    {/* Category + Status */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Category
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-[#156d95] focus:ring-2 focus:ring-[#156d95]/20 appearance-none transition-all"
                                                >
                                                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                                                        <option key={c}>{c}</option>
                                                    ))}
                                                    <option>Serums</option>
                                                </select>
                                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-3 pb-0.5">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                Availability Status
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData((f) => ({ ...f, status: !f.status }))}
                                                className={`relative inline-flex h-7 items-center rounded-full transition-colors duration-200 focus:outline-none ${formData.status ? "bg-[#156d95]" : "bg-gray-300"
                                                    }`}
                                                style={{ width: "52px" }}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${formData.status ? "translate-x-7" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Price (USD)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData((f) => ({ ...f, price: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-[#156d95] focus:ring-2 focus:ring-[#156d95]/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Description
                                        </label>
                                        <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden focus-within:border-[#156d95] focus-within:ring-2 focus-within:ring-[#156d95]/20 transition-all">
                                            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                                {[Bold, Italic, List, Link2].map((Icon, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#156d95] hover:bg-[#156d95]/10 transition-all"
                                                    >
                                                        <Icon className="size-3.5" />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={formData.description}
                                                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                                                placeholder="Describe the product features, texture, and application..."
                                                className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Formula & Ingredients */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#156d95]/10 flex items-center justify-center">
                                            <svg viewBox="0 0 20 20" fill="none" className="size-4 text-[#156d95]">
                                                <path d="M8 2v5L4 17h12L12 7V2H8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <h2 className="font-bold text-gray-900 dark:text-white">Formula &amp; Ingredients</h2>
                                    </div>

                                    {/* Key Ingredients tag-input */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Key Ingredients
                                        </label>
                                        <div className="flex flex-wrap items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 min-h-[46px] focus-within:border-[#156d95] focus-within:ring-2 focus-within:ring-[#156d95]/20 transition-all bg-white dark:bg-gray-900">
                                            {formData.ingredients.map((ing) => (
                                                <span
                                                    key={ing}
                                                    className="flex items-center gap-1 bg-[#156d95]/10 text-[#156d95] dark:text-[#5ab8e0] text-xs font-medium px-2.5 py-1 rounded-lg"
                                                >
                                                    {ing}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveIngredient(ing)}
                                                        className="text-[#156d95]/60 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                value={formData.ingredientInput}
                                                onChange={(e) => setFormData((f) => ({ ...f, ingredientInput: e.target.value }))}
                                                onKeyDown={handleAddIngredient}
                                                placeholder="Add ingredient..."
                                                className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1.5 ml-1">Press Enter or comma to add an ingredient</p>
                                    </div>

                                    {/* Key Benefits */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Key Benefits
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {Object.entries(formData.benefits).map(([benefit, checked]) => (
                                                <button
                                                    key={benefit}
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData((f) => ({
                                                            ...f,
                                                            benefits: { ...f.benefits, [benefit]: !checked },
                                                        }))
                                                    }
                                                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-[#156d95] transition-colors"
                                                >
                                                    {checked ? (
                                                        <div className="size-5 rounded bg-[#156d95] border-2 border-[#156d95] flex items-center justify-center shrink-0">
                                                            <svg viewBox="0 0 12 12" fill="none" className="size-3">
                                                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="size-5 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                                                    )}
                                                    {benefit}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right Column ── */}
                            <div className="space-y-6">

                                {/* Product Image */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#156d95]/10 flex items-center justify-center">
                                            <Package className="size-4 text-[#156d95]" />
                                        </div>
                                        <h2 className="font-bold text-gray-900 dark:text-white">Product Image</h2>
                                    </div>

                                    {/* Upload Area */}
                                    <div
                                        onClick={() => document.getElementById("product-image-upload")?.click()}
                                        className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#156d95] hover:bg-[#156d95]/5 dark:hover:bg-[#156d95]/10 transition-all cursor-pointer group"
                                    >
                                        <input
                                            id="product-image-upload"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <div className="size-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-[#156d95]/10 transition-colors">
                                            <Upload className="size-6 text-gray-400 group-hover:text-[#156d95] transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                Click to upload or drag &amp; drop
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>

                                    {/* Thumbnail Strip */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative group size-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(idx);
                                                    }}
                                                    className="absolute top-1 right-1 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.images.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById("product-image-upload")?.click()}
                                                className="size-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center hover:border-[#156d95] hover:bg-[#156d95]/5 transition-all text-gray-400 hover:text-[#156d95]"
                                            >
                                                <Plus className="size-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Skin Compatibility */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-7 rounded-lg bg-[#156d95]/10 flex items-center justify-center">
                                            <svg viewBox="0 0 20 20" fill="none" className="size-4 text-[#156d95]">
                                                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
                                                <path d="M7 10.5c.5 1.5 2 2.5 3 2.5s2.5-1 3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <circle cx="7.5" cy="8" r="1" fill="currentColor" />
                                                <circle cx="12.5" cy="8" r="1" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <h2 className="font-bold text-gray-900 dark:text-white">Skin Compatibility</h2>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select all that apply</p>
                                    <div className="space-y-2.5">
                                        {Object.entries(formData.skinTypes).map(([type, checked]) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() =>
                                                    setFormData((f) => ({
                                                        ...f,
                                                        skinTypes: { ...f.skinTypes, [type]: !checked },
                                                    }))
                                                }
                                                className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#156d95] transition-colors w-full"
                                            >
                                                {checked ? (
                                                    <div className="size-5 rounded border-2 border-[#156d95] bg-[#156d95] flex items-center justify-center shrink-0">
                                                        <svg viewBox="0 0 12 12" fill="none" className="size-3">
                                                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <div className="size-5 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                                                )}
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pro Tip */}
                                <div className="bg-[#156d95]/10 dark:bg-[#156d95]/20 border border-[#156d95]/20 dark:border-[#156d95]/30 rounded-2xl p-4 flex gap-3">
                                    <div className="size-7 rounded-full bg-[#156d95] flex items-center justify-center shrink-0 mt-0.5">
                                        <svg viewBox="0 0 16 16" fill="white" className="size-4">
                                            <circle cx="8" cy="5" r="1.5" />
                                            <path d="M8 8v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#156d95] dark:text-[#5ab8e0]">Pro Tip</p>
                                        <p className="text-xs text-[#156d95]/80 dark:text-[#5ab8e0]/80 mt-0.5 leading-relaxed">
                                            Adding specific skin types helps our recommendation engine suggest this product to the right customers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Product Detail Modal ── */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailModal
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        onEdit={() => {
                            setSelectedProduct(null);
                            setView("add");
                        }}
                    />
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
