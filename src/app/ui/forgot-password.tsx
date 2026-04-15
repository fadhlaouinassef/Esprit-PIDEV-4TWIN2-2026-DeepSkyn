"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Import corrigé
import { Mail, ArrowLeft, Send } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export default function ForgotPassword() {
    const router = useRouter() // Initialisation ajoutée
    const t = useTranslations()
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const validateEmail = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return t('auth.forgotPassword.errors.emailRequired')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmed)) {
            return t('auth.forgotPassword.errors.emailInvalid')
        }

        return ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const validationError = validateEmail(email)
        setEmailError(validationError)
        if (validationError) {
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || t('auth.forgotPassword.errors.sendFailed'))
            }

            // Stocker les infos pour l'écran de vérification
            sessionStorage.setItem('pendingUserEmail', email)
            sessionStorage.setItem('pendingUserId', data.userId.toString())
            sessionStorage.setItem('verificationType', 'reset-password')

            toast.success(t('auth.forgotPassword.success.title'), {
                description: t('auth.forgotPassword.success.description')
            })

            router.push("/verify-code")
        } catch (error: any) {
            toast.error(t('auth.forgotPassword.error.title'), {
                description: error.message || t('auth.forgotPassword.error.description')
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
                    {/* Back Button */}
                    <Link
                        href="/signin"
                        className="inline-flex items-center gap-2 text-[#666666] hover:text-[#202020] transition-all duration-300 mb-6 group"
                        style={{ fontFamily: "Figtree" }}
                    >
                        <motion.div whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400 }}>
                            <ArrowLeft className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm font-medium">{t('auth.forgotPassword.backToLogin')}</span>
                    </Link>

                    {/* Icon et reste de l'UI... */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-[#156d95] via-[#1a7aaa] to-[#0d4a6b] rounded-2xl flex items-center justify-center shadow-lg">
                            <LockResetIcon />
                        </div>
                    </motion.div>

                    {/* Header et Formulaire... (identiques à ton code) */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl font-bold text-[#202020] mb-3 bg-gradient-to-r from-[#202020] to-[#156d95] bg-clip-text text-transparent" style={{ fontFamily: "Figtree" }}>
                            {t('auth.forgotPassword.title')}
                        </h1>
                        <p className="text-sm text-[#666666] leading-relaxed" style={{ fontFamily: "Figtree" }}>
                            {t('auth.forgotPassword.description')}
                        </p>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                        noValidate
                    >
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                                {t('auth.forgotPassword.emailLabel')}
                            </label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (emailError) {
                                            setEmailError(validateEmail(e.target.value))
                                        }
                                    }}
                                    onBlur={() => setEmailError(validateEmail(email))}
                                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                                    className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 bg-[#fafafa] hover:bg-white ${emailError ? 'border-red-400 focus:ring-red-300' : 'border-[#e0e0e0] focus:ring-[#156d95]'}`}
                                    style={{ fontFamily: "Figtree" }}
                                    aria-invalid={!!emailError}
                                    aria-describedby={emailError ? "email-error" : undefined}
                                />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999] group-focus-within:text-[#156d95] transition-colors duration-300" />
                            </div>
                            {emailError && (
                                <p id="email-error" className="mt-2 text-sm font-medium text-red-500" style={{ fontFamily: "Figtree" }}>
                                    {emailError}
                                </p>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#156d95] to-[#0d4a6b] text-white py-3.5 rounded-xl font-semibold hover:from-[#0d4a6b] hover:to-[#156d95] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            style={{ fontFamily: "Figtree" }}
                        >
                            {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit')}
                            {!isLoading && <Send className="w-4 h-4" />}
                        </motion.button>
                    </motion.form>
                </motion.div>
            </motion.div>
        </div>
    )
}

function LockResetIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6v6h6" />
            <path d="M21 12a9 9 0 1 0-9 9" />
            <path d="M21 12a9 9 0 0 0-9-9c-4.5 0-8.2 3.3-8.9 7.6" />
        </svg>
    )
}