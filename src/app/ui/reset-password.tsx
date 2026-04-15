"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function ResetPassword() {
  const router = useRouter()
  const t = useTranslations()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error(t('auth.resetPassword.errors.passwordTooShortTitle'), {
        description: t('auth.resetPassword.errors.passwordTooShortDescription')
      })
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.resetPassword.errors.confirmationTitle'), {
        description: t('auth.resetPassword.errors.confirmationDescription')
      })
      return
    }

    setIsLoading(true)
    try {
      const userId = sessionStorage.getItem('pendingUserId')
      if (!userId) {
        throw new Error(t('auth.resetPassword.errors.sessionExpired'))
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('auth.resetPassword.errors.resetFailed'))
      }

      toast.success(t('auth.resetPassword.success.title'), {
        description: t('auth.resetPassword.success.description')
      })

      // Nettoyage final
      sessionStorage.clear()

      router.push("/signin")
    } catch (error: any) {
      toast.error(t('auth.resetPassword.error.title'), {
        description: error.message || t('auth.resetPassword.error.description')
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f7] via-[#fafafa] to-[#f0f0f2] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#156d95] via-[#1a7aaa] to-[#0d4a6b] rounded-2xl flex items-center justify-center shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-[#202020] mb-3 bg-gradient-to-r from-[#202020] to-[#156d95] bg-clip-text text-transparent" style={{ fontFamily: "Figtree" }}>
              {t('auth.resetPassword.title')}
            </h1>
            <p className="text-sm text-[#666666] leading-relaxed" style={{ fontFamily: "Figtree" }}>
              {t('auth.resetPassword.description')}
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                {t('auth.resetPassword.newPasswordLabel')}
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-10 border-2 border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#156d95] transition-all duration-300 bg-[#fafafa]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#156d95]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                {t('auth.resetPassword.confirmPasswordLabel')}
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-10 border-2 border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#156d95] transition-all duration-300 bg-[#fafafa]"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-gradient-to-r from-[#156d95] to-[#0d4a6b] text-white py-3.5 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
              style={{ fontFamily: "Figtree" }}
            >
              {isLoading ? t('auth.resetPassword.saving') : t('auth.resetPassword.submit')}
              {!isLoading && <CheckCircle2 className="w-4 h-4" />}
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>
    </div>
  )
}