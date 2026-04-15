"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { updateUserProfile } from "@/store/slices/authSlice";
import { UserLayout } from "@/app/ui/UserLayout";
import { useTranslations } from "next-intl";

export default function BillingSuccessPage() {
  const t = useTranslations("billingSuccess");
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const sessionId = searchParams?.get("session_id") ?? null;
  const [countdown, setCountdown] = useState(5);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncMessage, setSyncMessage] = useState(t("messages.confirming"));

  useEffect(() => {
    let cancelled = false;

    const confirmSession = async () => {
      if (!sessionId) {
        if (!cancelled) {
          setSyncMessage(t("messages.missingSession"));
          setIsSyncing(false);
        }
        return;
      }

      const maxRetries = 5;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          const res = await fetch("/api/stripe/confirm-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });

          if (res.ok) {
            if (!cancelled) {
              dispatch(updateUserProfile({ role: "PREMIUM_USER" }));
              setSyncMessage(t("messages.activated"));
              setIsSyncing(false);
            }
            return;
          }

          if (res.status !== 409) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload?.error || t("messages.unableToConfirm"));
          }
        } catch (error: unknown) {
          if (attempt === maxRetries && !cancelled) {
            setSyncMessage(error instanceof Error ? error.message : t("messages.confirmationFailed"));
            setIsSyncing(false);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      if (!cancelled) {
        setIsSyncing(false);
      }
    };

    confirmSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch, sessionId, t]);

  // Countdown timer
  useEffect(() => {
    if (isSyncing) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSyncing]);

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !isSyncing) {
      router.push("/user/billing");
    }
  }, [countdown, isSyncing, router]);

  return (
    <UserLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-500/10 border-4 border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-transparent border-t-green-500/40 rounded-full"
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black text-foreground mb-4 flex items-center justify-center gap-3"
          >
            {t("title")}
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-8 max-w-md mx-auto"
          >
            {syncMessage}
          </motion.p>

          {/* Session Info */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted/50 border border-border rounded-2xl p-6 mb-8 max-w-md mx-auto"
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {t("sessionIdLabel")}
              </p>
              <p className="text-sm font-mono text-foreground break-all">
                {sessionId}
              </p>
            </motion.div>
          )}

          {/* Auto-redirect message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              {isSyncing ? (
                <span className="font-semibold">{t("waitMessage")}</span>
              ) : (
                <>
                  {t("redirectPrefix")}{" "}
                  <span className="font-black text-primary text-xl">
                    {countdown}
                  </span>{" "}{t("redirectSuffix")}
                </>
              )}
            </p>

            {/* Manual redirect button */}
            <button
              onClick={() => router.push("/user/billing")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20"
            >
              <span>{t("backToBilling")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-green-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        </motion.div>
      </div>
    </UserLayout>
  );
}
