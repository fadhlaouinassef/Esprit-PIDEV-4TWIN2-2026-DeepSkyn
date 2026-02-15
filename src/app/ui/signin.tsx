"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { toast } from "sonner"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shakeField, setShakeField] = useState<string | null>(null)

  // Mouse tracking for parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 150 }
  const bounceX = useSpring(mouseX, springConfig)
  const bounceY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2)
      mouseY.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(email)) {
        newErrors.email = "Invalid email format"
      }
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Invalid password (min. 8 characters)"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0]
      setShakeField(firstError)
      setTimeout(() => setShakeField(null), 500)
    }
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success("Login successful!", {
        description: "You are being redirected..."
      })
      router.push("/admin")
      setIsSubmitting(false)
    } else {
      toast.error("Login Failed", {
        description: "Please check the fields in red"
      })
    }
  }

  const handleGoogleSignIn = () => {
    toast.info("Google Sign-In", {
      description: "This feature will be available soon"
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f7] via-[#fafafa] to-[#f8fafc] px-4 py-12 relative overflow-hidden selection:bg-[#156d95]/10">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 z-0">
        <motion.div
          style={{ x: bounceX, y: bounceY, scale: 1.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#156d95]/10 via-[#0d4a6b]/5 to-transparent rounded-full blur-[120px] opacity-70"
        />
        <motion.div
          style={{ x: bounceX, y: bounceY, scale: 1.1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#1a7aaa]/5 rounded-full blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <motion.div
          whileHover={{ y: -5, borderColor: "rgba(21, 109, 149, 0.8)" }}
          className="bg-white/10 dark:bg-black/40 backdrop-blur-[40px] rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6),0_0_20px_rgba(21,109,149,0.15)] p-8 md:p-12 border-2 border-[#156d95]/30 relative transition-colors duration-500">
          {/* Top subtle glow */}
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#156d95] to-transparent opacity-50" />

          {/* Back Button */}
          <motion.div variants={itemVariants}>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-[#666666] hover:text-[#156d95] transition-all duration-300 mb-8 group no-underline"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-[#156d95]/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>Back to Home</span>
            </Link>
          </motion.div>

          {/* Logo Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center mb-10"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-[#156d95] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#156d95] to-[#0d4a6b] rounded-[1.75rem] flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-white/10 group-hover:translate-y-full transition-transform duration-700" />
                <div className="grid grid-cols-2 gap-1.5 p-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                      transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                      className="w-3.5 h-3.5 bg-white rounded-[4px] shadow-sm"
                    />
                  ))}
                </div>
              </div>
            </div>

            <h1 className="mt-6 text-4xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "Figtree" }}>
              Deep<span className="text-[#156d95]">SkyN</span>
            </h1>
            <p className="text-[#666666] dark:text-gray-400 mt-2 font-medium" style={{ fontFamily: "Figtree" }}>
              Sign in to your account
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email */}
            <motion.div variants={itemVariants}>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ fontFamily: "Figtree" }}>
                  Email Address
                </label>
              </div>
              <motion.div
                className="relative group"
                animate={shakeField === 'email' ? { x: [-10, 10, -10, 10, 0] } : {}}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail className={`w-5 h-5 transition-colors duration-300 ${errors.email ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: "" })
                  }}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl focus:outline-none transition-all duration-300 ${errors.email
                    ? "border-red-500 bg-red-50/30 ring-4 ring-red-500/10"
                    : "border-transparent focus:border-[#156d95] focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-[#156d95]/10"
                    }`}
                  placeholder="Name@deepskyn.com"
                  style={{ fontFamily: "Figtree" }}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ fontFamily: "Figtree" }}>
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-black text-[#156d95] uppercase tracking-widest hover:underline">
                  Forgot?
                </Link>
              </div>
              <motion.div
                className="relative group"
                animate={shakeField === 'password' ? { x: [-10, 10, -10, 10, 0] } : {}}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock className={`w-5 h-5 transition-colors duration-300 ${errors.password ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: "" })
                  }}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl focus:outline-none transition-all duration-300 ${errors.password
                    ? "border-red-500 bg-red-50/30 ring-4 ring-red-500/10"
                    : "border-transparent focus:border-[#156d95] focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-[#156d95]/10"
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#156d95] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Remember Me */}
            <motion.div variants={itemVariants} className="flex items-center">
              <label className="flex items-center cursor-pointer group select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors duration-300 ${rememberMe ? 'bg-[#156d95]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  <motion.div
                    animate={{ x: rememberMe ? 18 : 3 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </div>
                <span className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-900 transition-colors" style={{ fontFamily: "Figtree" }}>
                  Remember me
                </span>
              </label>
            </motion.div>

            {/* Sign In Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                type="submit"
                className="w-full relative group h-14 bg-gradient-to-r from-[#156d95] to-[#0d4a6b] rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 active:shadow-none"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-xs" style={{ fontFamily: "Figtree" }}>
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 text-center"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>
              New user?{" "}
              <Link href="/signup" className="text-[#156d95] hover:underline decoration-2 underline-offset-4">
                Create Account
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Outer subtle info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]"
        >
          © 2026 DEEPSKYN LTD • PRIVACY PROTECTED
        </motion.p>
      </motion.div>
    </div>
  )
}
