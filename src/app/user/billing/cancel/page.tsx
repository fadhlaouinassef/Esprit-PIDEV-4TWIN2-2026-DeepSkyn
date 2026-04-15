"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { UserLayout } from "@/app/ui/UserLayout";
import { useTranslations } from "next-intl";

export default function BillingCancelPage() {
  const t = useTranslations("billingCancel");
  const router = useRouter();

  // Mock user for layout
  const user = {
    name: "Nassef",
    photo: "/avatar.png",
  };

  return (
    <UserLayout userName={user.name} userPhoto={user.photo}>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Cancel Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            className="w-24 h-24 bg-amber-500/10 border-4 border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <XCircle className="w-12 h-12 text-amber-500" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black text-foreground mb-4"
          >
            {t("title")}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-12 max-w-md mx-auto"
          >
            {t("description")}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => router.push("/user/billing")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t("retryPayment")}</span>
            </button>

            <button
              onClick={() => router.push("/user")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("backToDashboard")}</span>
            </button>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 bg-muted/50 border border-border rounded-2xl max-w-md mx-auto"
          >
            <p className="text-sm text-muted-foreground">
              {t("needHelp")}{" "}
              <a
                href="#"
                className="text-primary font-bold hover:underline"
              >
                {t("contactSupport")}
              </a>
            </p>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        </motion.div>
      </div>
    </UserLayout>
  );
}
