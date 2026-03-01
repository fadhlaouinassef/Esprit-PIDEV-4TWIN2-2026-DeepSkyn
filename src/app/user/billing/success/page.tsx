"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateUserProfile } from "@/store/slices/authSlice";
import { UserLayout } from "@/app/ui/UserLayout";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);
  const hasUpdatedRole = useRef(false);

  // Mettre à jour le rôle de l'utilisateur dans Redux après paiement réussi (une seule fois)
  useEffect(() => {
    if (user && sessionId && !hasUpdatedRole.current) {
      // Mettre à jour le rôle en PREMIUM_USER
      dispatch(updateUserProfile({ role: "PREMIUM_USER" }));
      console.log("✅ Rôle mis à jour dans Redux : PREMIUM_USER");
      hasUpdatedRole.current = true;
    }
  }, [dispatch, user, sessionId]);

  // Countdown timer
  useEffect(() => {
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
  }, []);

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/user/billing");
    }
  }, [countdown, router]);

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
            Paiement Réussi!
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-8 max-w-md mx-auto"
          >
            Merci pour ton paiement! Ton abonnement premium est maintenant actif.
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
                Session ID
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
              Redirection automatique dans{" "}
              <span className="font-black text-primary text-xl">
                {countdown}
              </span>{" "}
              secondes...
            </p>

            {/* Manual redirect button */}
            <button
              onClick={() => router.push("/user/billing")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20"
            >
              <span>Retour à Billing</span>
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
