"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

export default function VerifyCode() {
    const router = useRouter()
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [isLoading, setIsLoading] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // Gérer le changement dans les cases
    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return // Autoriser seulement les chiffres

        const newOtp = [...otp]
        newOtp[index] = value.substring(value.length - 1)
        setOtp(newOtp)

        // Déplacer le focus vers la case suivante
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    // Gérer la touche "Retour arrière"
    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const code = otp.join("")

        if (code.length < 6) {
            toast.error("Code incomplet", {
                description: "Veuillez saisir les 6 chiffres du code."
            })
            return
        }

        setIsLoading(true)
        // Simulation de vérification
        setTimeout(() => {
            setIsLoading(false)
            toast.success("Code vérifié !", {
                description: "Vous pouvez maintenant changer votre mot de passe."
            })
            router.push("/reset-password")
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
                        href="/forgot-password"
                        className="inline-flex items-center gap-2 text-[#666666] hover:text-[#202020] transition-all duration-300 mb-6 group"
                        style={{ fontFamily: "Figtree" }}
                    >
                        <motion.div whileHover={{ x: -4 }} transition={{ type: "spring", stiffness: 400 }}>
                            <ArrowLeft className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm font-medium">Change email</span>
                    </Link>

                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-[#156d95] via-[#1a7aaa] to-[#0d4a6b] rounded-2xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
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
                            Verify Code
                        </h1>
                        <p className="text-sm text-[#666666] leading-relaxed" style={{ fontFamily: "Figtree" }}>
                            We've sent a 6-digit code to your email. Enter it below to continue.
                        </p>
                    </motion.div>

                    {/* OTP Input Form */}
                    <motion.form
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        onSubmit={handleSubmit}
                        className="space-y-8"
                    >
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 text-center text-xl font-bold border-2 border-[#e0e0e0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#156d95] focus:border-transparent transition-all duration-300 bg-[#fafafa] hover:bg-white"
                                />
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#156d95] to-[#0d4a6b] text-white py-3.5 rounded-xl font-semibold hover:from-[#0d4a6b] hover:to-[#156d95] transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            style={{ fontFamily: "Figtree" }}
                        >
                            {isLoading ? "Verifying..." : "Verify Code"}
                            {!isLoading && <CheckCircle2 className="w-4 h-4" />}
                        </motion.button>

                        <div className="text-center">
                            <button
                                type="button"
                                className="text-sm text-[#156d95] font-semibold hover:underline"
                            >
                                Resend code
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            </motion.div>
        </div>
    )
}