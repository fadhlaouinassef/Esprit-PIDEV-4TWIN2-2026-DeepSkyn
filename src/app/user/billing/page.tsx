"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/store/hooks";
import {
    CheckCircle2,
    AlertCircle,
    XCircle,
    CreditCard,
    Lock,
    ShieldCheck,
    ChevronRight,
    ArrowRight,
    Plus,
    Shield,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import { UserLayout } from "@/app/ui/UserLayout";

// --- Types ---
type SubscriptionStatus = "active" | "expiring" | "expired";

interface SubscriptionInfo {
    status: SubscriptionStatus;
    planName: string;
    billingCycle: "monthly" | "yearly";
    price: number;
    startDate: string;
    expiryDate: string;
    remainingDays?: number;
}

// --- Helpers ---
const getSubscriptionStatus = (expiryDate: string): { status: SubscriptionStatus, days: number } => {
    if (!expiryDate || expiryDate === "N/A") return { status: "expired", days: 0 };

    // On compare les dates pures (année-mois-jour) en ignorant l'heure
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) return { status: "expired", days: 0 };

    const expiryNormalized = new Date(expiry);
    expiryNormalized.setHours(0, 0, 0, 0);

    const diffTime = expiryNormalized.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "expired", days: 0 };
    if (diffDays <= 7) return { status: "expiring", days: diffDays };
    return { status: "active", days: diffDays };
};

// --- Mock Data ---
const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
    status: "expired",
    planName: "Free Plan",
    billingCycle: "monthly",
    price: 0,
    startDate: "N/A",
    expiryDate: "N/A",
};

// --- Components ---

const StatusBadge = ({ status, remainingDays }: { status: SubscriptionStatus, remainingDays?: number }) => {
    const configs = {
        active: {
            color: "bg-green-500/10 text-green-500 border-green-500/20",
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: "Active"
        },
        expiring: {
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            icon: <AlertCircle className="w-4 h-4" />,
            label: remainingDays ? `${remainingDays} ${remainingDays > 1 ? 'jours' : 'jour'} restants` : "Expiring Soon"
        },
        expired: {
            color: "bg-red-500/10 text-red-500 border-red-500/20",
            icon: <XCircle className="w-4 h-4" />,
            label: "Expiré"
        }
    };

    const config = configs[status];

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.1em] ${config.color}`}>
            {config.icon}
            {config.label}
        </div>
    );
};

const InputField = ({ label, placeholder, type = "text", icon: Icon }: { label: string, placeholder: string, type?: string, icon?: any }) => {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState("");

    return (
        <div className="relative group">
            <label
                className={`absolute left-4 transition-all duration-300 pointer-events-none z-10 ${focused || value ? "-top-2.5 text-[10px] bg-card px-2 text-primary font-black uppercase tracking-widest" : "top-3.5 text-sm text-muted-foreground font-medium"
                    }`}
            >
                {label}
            </label>
            <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all duration-300 ${focused ? "border-primary ring-4 ring-primary/5 bg-card shadow-sm" : "border-border hover:border-muted-foreground/30 bg-background/50"
                }`}>
                {Icon && <Icon className="w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={focused ? placeholder : ""}
                    className="bg-transparent border-none outline-none w-full text-foreground text-sm font-bold placeholder:text-muted-foreground/30"
                />
            </div>
        </div>
    );
};

export default function BillingPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user?.id) {
                setIsLoadingData(false);
                return;
            }

            try {
                const response = await fetch(`/api/user/subscription?userId=${user.id}`);
                const data = await response.json();

                if (data.status === 'success' && data.subscription) {
                    const expiryDate = new Date(data.subscription.date_fin);
                    const startDate = new Date(data.subscription.date_debut);

                    const formatDate = (date: Date) => {
                        // Utiliser UTC pour éviter les décalages de timezone sur l'affichage
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                            timeZone: 'UTC' // On force l'affichage selon l'heure stockée
                        });
                    };

                    setSubscription({
                        status: "active",
                        planName: data.subscription.plan,
                        billingCycle: "yearly",
                        price: data.subscription.plan === "Pro Plan" ? 199.00 : 0,
                        startDate: formatDate(startDate),
                        expiryDate: formatDate(expiryDate),
                    });
                } else if (data.status === 'none') {
                    setSubscription({
                        ...DEFAULT_SUBSCRIPTION,
                        planName: "Free Plan",
                        status: "expired"
                    });
                }
            } catch (error) {
                console.error("Failed to fetch subscription:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchSubscription();
    }, [user?.id]);

    // Calculate status dynamically based on expiryDate
    const { status: currentStatus, days: remainingDays } = getSubscriptionStatus(subscription.expiryDate);

    const isRenewalRequired = currentStatus === "expiring" || currentStatus === "expired";

    const handleAction = () => {
        if (currentStatus === "active") {
            toast.info("Redirection vers la gestion de l'abonnement...");
        } else {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                toast.success("Abonnement mis à jour !");
            }, 2000);
        }
    };

    if (isLoadingData) {
        return (
            <UserLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="min-h-full py-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-[1100px] mx-auto relative z-10 px-4">
                    <header className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3 bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent">
                                Subscription & Billing
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                                Seamlessly manage your premium access and payment preferences from one elegant dashboard.
                            </p>
                        </motion.div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Status Section */}
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/20"
                            >
                                <div className={`h-2 w-full transition-colors duration-500 ${currentStatus === "active" ? "bg-green-500" :
                                    currentStatus === "expiring" ? "bg-amber-500" : "bg-red-500"
                                    }`} />

                                <div className="p-8 md:p-10">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
                                        <div className="space-y-4">
                                            <StatusBadge status={currentStatus} remainingDays={remainingDays} />
                                            <h2 className="text-3xl md:text-4xl font-black text-foreground">{subscription.planName}</h2>
                                            <div className="flex items-center gap-3 text-muted-foreground font-bold">
                                                <span className="bg-muted px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest">{subscription.billingCycle}</span>
                                                <span className="text-primary text-lg">${subscription.price}/yr</span>
                                            </div>
                                        </div>
                                        <div className="text-left md:text-right space-y-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Next Renewal Date</span>
                                            <p className="text-xl md:text-2xl font-black text-foreground">{subscription.expiryDate}</p>
                                            <button className="group/btn inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-bold transition-all pt-2">
                                                <span>Change Plan</span>
                                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-[24px] flex items-center gap-5 border transition-all duration-500 ${currentStatus === "active" ? "bg-green-500/5 border-green-500/10 text-green-700 dark:text-green-400 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" :
                                        currentStatus === "expiring" ? "bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]" :
                                            "bg-red-500/5 border-red-500/10 text-red-700 dark:text-red-400 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]"
                                        }`}>
                                        <div className={`p-3 rounded-2xl flex-shrink-0 ${currentStatus === "active" ? "bg-green-500/10" :
                                            currentStatus === "expiring" ? "bg-amber-500/10" : "bg-red-500/10"
                                            }`}>
                                            {currentStatus === "active" ? <CheckCircle2 className="w-6 h-6" /> :
                                                currentStatus === "expiring" ? <AlertCircle className="w-6 h-6" /> :
                                                    <XCircle className="w-6 h-6" />}
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed">
                                            {currentStatus === "active" ? `Votre abonnement est actif jusqu'au ${subscription.expiryDate}.` :
                                                currentStatus === "expiring" ? `Action Requise : Votre abonnement expire dans ${remainingDays} jours.` :
                                                    "Votre abonnement est expiré. Renouvelez-le pour retrouver l'accès."}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Payment Section */}
                            <AnimatePresence mode="wait">
                                {isRenewalRequired ? (
                                    <motion.div
                                        key="renewal-form"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -30 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                        className="relative bg-card/40 backdrop-blur-md border border-border/50 rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl"
                                    >
                                        <div className="p-8 md:p-10 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                                                    <CreditCard className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-black text-foreground">Secure Checkout</h3>
                                                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-0.5">Automated Payment</p>
                                                </div>
                                            </div>
                                            <div className="hidden sm:flex gap-4 opacity-50 grayscale">
                                                <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6" alt="Visa" />
                                                <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6" alt="MC" />
                                            </div>
                                        </div>

                                        <div className="p-8 md:p-10 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <InputField label="Cardholder Name" placeholder="Johnathan Doe" icon={ShieldCheck} />
                                                <InputField label="Email Address" placeholder="john@example.com" type="email" />
                                            </div>

                                            <div className="relative group">
                                                <label className="absolute -top-2.5 left-4 text-[10px] bg-card px-2 text-primary font-black uppercase tracking-wider z-10">Card Number</label>
                                                <div className="relative flex items-center gap-4 px-5 py-3.5 md:py-4.5 rounded-2xl border border-border/80 bg-background/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
                                                    <CreditCard className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        className="bg-transparent border-none outline-none w-full text-foreground text-sm md:text-base font-bold tracking-widest"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <InputField label="Expiry" placeholder="MM / YY" />
                                                <InputField label="CVV" placeholder="123" icon={Lock} />
                                            </div>

                                            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border/50">
                                                <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                                    <Lock className="w-4 h-4 text-green-500" />
                                                    256-bit SSL HEAVY Encryption
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <ShieldCheck className="w-5 h-5 text-primary opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-state"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative group bg-muted/20 border-2 border-dashed border-border/50 rounded-[32px] md:rounded-[40px] p-12 md:p-20 text-center"
                                    >
                                        <div className="w-20 h-20 bg-card border border-border rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                                            <Shield className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">Vault-Secured Payment</h3>
                                        <p className="text-muted-foreground text-base md:text-lg font-medium max-w-md mx-auto">
                                            Your payment methods are encrypted and securely stored.
                                        </p>
                                        <button className="mt-8 flex items-center gap-2 mx-auto px-8 py-3 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all">
                                            <Plus className="w-4 h-4" /> Add Method
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>

                        {/* Sidebar / Order Summary */}
                        <div className="lg:col-span-4 space-y-6">

                            <div className="bg-slate-950 dark:bg-card border border-border rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl text-white dark:text-foreground">
                                <div className="p-8 md:p-10">
                                    <h3 className="text-xl md:text-2xl font-black mb-1">Order Summary</h3>
                                    <p className="text-slate-400 dark:text-muted-foreground text-xs font-bold uppercase tracking-widest mb-10">Verification</p>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="text-slate-400 dark:text-muted-foreground">{subscription.planName}</span>
                                            <span>${subscription.price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold opacity-50">
                                            <span>Sales Tax</span>
                                            <span>$0.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-black text-green-400">
                                            <span className="flex items-center gap-2 uppercase tracking-tighter italic">
                                                <Zap className="w-4 h-4" /> Yearly Member Discount
                                            </span>
                                            <span>-$20.00</span>
                                        </div>
                                    </div>

                                    <div className="mt-10 border-t border-dashed border-slate-800 dark:border-border pt-10">
                                        <div className="flex justify-between items-end mb-10">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-muted-foreground/60">Grand Total</span>
                                                <p className="text-[10px] text-slate-600 dark:text-muted-foreground/40 font-bold uppercase">Billed annually</p>
                                            </div>
                                            <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">${(subscription.price - 20).toFixed(2)}</span>
                                        </div>

                                        <button
                                            disabled={isProcessing}
                                            onClick={handleAction}
                                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${subscription.status === "active"
                                                ? "bg-slate-800 dark:bg-muted text-white hover:bg-slate-700 dark:hover:bg-muted/80 shadow-inner"
                                                : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(var(--primary),0.3)]"
                                                } ${isProcessing ? "opacity-90 cursor-wait" : ""}`}
                                        >
                                            {isProcessing ? (
                                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>
                                                        {subscription.status === "expired" ? "Renew Access" :
                                                            subscription.status === "expiring" ? "Extend Now" : "Manage Settings"}
                                                    </span>
                                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <p className="text-[10px] text-center mt-8 text-slate-500 dark:text-muted-foreground/40 leading-relaxed font-bold">
                                            PCI-DSS COMPLIANT • ENCRYPTED GATEWAY
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Price Lock Guarantee */}
                            <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex gap-5 backdrop-blur-sm">
                                <div className="p-3 bg-primary text-white rounded-2xl h-fit shadow-lg shadow-primary/20">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-foreground text-sm uppercase tracking-wider mb-1">Price Lock Guarantee</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                        Your current rate is locked until 2026. No price hikes.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
