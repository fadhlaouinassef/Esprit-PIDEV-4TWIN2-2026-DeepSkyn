"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success("Login successful!", {
        description: "You are being redirected..."
      })
      console.log("Sign in with:", { email, password, rememberMe })
      router.push("/admin")
      setIsSubmitting(false)
    } else {
      toast.error("Login Failed", {
        description: "Please check the fields in red"
      })
    }
  }

  const handleGoogleSignIn = () => {
    // Handle Google sign in
    toast.info("Google Sign-In", {
      description: "This feature will be available soon"
    })
    console.log("Sign in with Google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f7] via-[#fafafa] to-[#f0f0f2] px-4 py-12 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#156d95]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0d4a6b]/5 rounded-full blur-[120px]" />

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
            href="/home"
            className="inline-flex items-center gap-2 text-[#666666] hover:text-[#202020] transition-all duration-300 mb-6 group"
            style={{ fontFamily: "Figtree" }}
          >
            <motion.div
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#156d95] via-[#1a7aaa] to-[#0d4a6b] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="grid grid-cols-2 gap-1">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-2.5 h-2.5 bg-white rounded-sm"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-2.5 h-2.5 bg-white rounded-sm"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="w-2.5 h-2.5 bg-white rounded-sm"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-2.5 h-2.5 bg-white rounded-sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-[#202020] mb-3 bg-gradient-to-r from-[#202020] to-[#156d95] bg-clip-text text-transparent" style={{ fontFamily: "Figtree" }}>
              Welcome back
            </h1>
            <p className="text-sm text-[#666666]" style={{ fontFamily: "Figtree" }}>
              Please enter your credentials to log in.
            </p>
          </motion.div>

          {/* Google Sign In */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl hover:bg-[#f9f9f9] hover:border-[#156d95]/30 transition-all duration-300 mb-6 shadow-sm hover:shadow-md"
            style={{ fontFamily: "Figtree" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.8789 15.7789 19.9895 13.221 19.9895 10.1871Z"
                fill="#4285F4"
              />
              <path
                d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9466L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z"
                fill="#34A853"
              />
              <path
                d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z"
                fill="#FBBC05"
              />
              <path
                d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33718L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z"
                fill="#EB4335"
              />
            </svg>
            <span className="text-[#202020] font-semibold">Continue with Google</span>
          </motion.button>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e0e0e0]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#999999]" style={{ fontFamily: "Figtree" }}>
                OR
              </span>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                Email address
              </label>
              <motion.div
                className="relative group"
                animate={shakeField === 'email' ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: "" })
                  }}
                  placeholder="name@company.com"
                  className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-[#fafafa] hover:bg-white ${errors.email
                      ? "border-red-500 bg-red-50/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-200"
                      : "border-[#e0e0e0] focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    }`}
                  style={{ fontFamily: "Figtree" }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <AnimatePresence>
                    {errors.email && (
                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                        <AlertCircle className="w-5 h-5 text-red-500 filter drop-shadow-[0_0_3px_rgba(239,68,68,0.4)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Mail className={`w-5 h-5 transition-colors duration-300 ${errors.email ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
              </motion.div>
              <AnimatePresence mode="wait">
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    className="flex items-center gap-1.5 mt-2 ml-1"
                  >
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <p
                      className="text-xs text-red-500 font-bold tracking-wide uppercase"
                      style={{ fontFamily: "Figtree" }}
                    >
                      {errors.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#202020] mb-2" style={{ fontFamily: "Figtree" }}>
                Password
              </label>
              <motion.div
                className="relative group"
                animate={shakeField === 'password' ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: "" })
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-[#fafafa] hover:bg-white ${errors.password
                      ? "border-red-500 bg-red-50/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-200"
                      : "border-[#e0e0e0] focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    }`}
                  style={{ fontFamily: "Figtree" }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.password ? "text-red-500" : "text-[#999999] hover:text-[#156d95]"}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </motion.div>
              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    className="flex items-center gap-1.5 mt-2 ml-1"
                  >
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <p
                      className="text-xs text-red-500 font-bold tracking-wide uppercase"
                      style={{ fontFamily: "Figtree" }}
                    >
                      {errors.password}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-[#e0e0e0] text-[#156d95] focus:ring-[#156d95] focus:ring-offset-0 cursor-pointer transition-all duration-300"
                />
                <span className="ml-2 text-sm text-[#666666] group-hover:text-[#202020] transition-colors duration-300" style={{ fontFamily: "Figtree" }}>
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-[#156d95] hover:text-[#0d4a6b] font-medium transition-all duration-300 hover:underline underline-offset-2"
                style={{ fontFamily: "Figtree" }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${isSubmitting
                ? "bg-[#666666] cursor-not-allowed"
                : "bg-gradient-to-r from-[#156d95] to-[#0d4a6b] text-white hover:from-[#0d4a6b] hover:to-[#156d95]"
                }`}
              style={{ fontFamily: "Figtree" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </motion.form>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-[#666666]" style={{ fontFamily: "Figtree" }}>
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#156d95] font-semibold hover:text-[#0d4a6b] transition-colors duration-300 hover:underline underline-offset-2">
                Sign up
              </Link>
            </p>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  )
}
