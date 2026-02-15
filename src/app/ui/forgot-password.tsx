"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Import corrigé
import { Mail, ArrowLeft, Send } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function ForgotPassword() {
    const router = useRouter() // Initialisation ajoutée
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error("Email requis", {
                description: "Veuillez entrer votre adresse email pour continuer."
            })
            return
        }

        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            toast.success("Lien envoyé !", {
                description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
            })
            router.push("/verify-code") // Cela fonctionnera maintenant
        }, 1500)
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
                        <span className="text-sm font-medium">Back to Login</span>
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
                            Reset Password
                        </h1>
                        <p className="text-sm text-[#666666] leading-relaxed" style={{ fontFamily: "Figtree" }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                                Email address
                            </label>
                            <div className="relative group">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3.5 pr-10 border-2 border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#156d95] focus:border-transparent transition-all duration-300 bg-[#fafafa] hover:bg-white"
                                    style={{ fontFamily: "Figtree" }}
                                />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999] group-focus-within:text-[#156d95] transition-colors duration-300" />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#156d95] to-[#0d4a6b] text-white py-3.5 rounded-xl font-semibold hover:from-[#0d4a6b] hover:to-[#156d95] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            style={{ fontFamily: "Figtree" }}
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
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