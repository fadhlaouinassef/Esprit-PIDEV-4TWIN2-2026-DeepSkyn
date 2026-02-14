"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Calendar, UserCircle, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Camera, FileText, X, Sparkles } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { toast } from "sonner"

export default function SignUp() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [age, setAge] = useState<number | null>(null)
  const [gender, setGender] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shakeField, setShakeField] = useState<string | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  const calculateAge = (date: string) => {
    if (!date) return null
    const today = new Date()
    const birthDate = new Date(date)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setBirthDate(date)
    setAge(calculateAge(date))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else {
      const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/
      if (!nameRegex.test(fullName.trim())) {
        newErrors.fullName = "Name should only contain letters (2-50 characters)"
      }
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required"
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address"
      }
    }

    if (!birthDate) {
      newErrors.birthDate = "Birth date is required"
    } else {
      const selectedDate = new Date(birthDate)
      const today = new Date()
      if (selectedDate > today) {
        newErrors.birthDate = "Birth date cannot be in the future"
      } else if (age !== null && age < 13) {
        newErrors.birthDate = "You must be at least 13 years old"
      }
    }

    if (!gender) {
      newErrors.gender = "Please select your sex"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else {
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/
      if (!passwordRegex.test(password)) {
        newErrors.password = "Must be 8+ chars with a number and special char"
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0]
      setShakeField(firstError)
      setTimeout(() => setShakeField(null), 500)
    }
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      setShowConsentModal(true)
    } else {
      toast.error("Validation Error", {
        description: "Please check the fields in red"
      })
    }
  }

  const confirmSignup = async () => {
    setShowConsentModal(false)
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    toast.success("Account created successfully!", {
      description: "Welcome to DeepSkyN"
    })

    console.log("Sign up with:", { fullName, email, password, confirmPassword, birthDate, age, gender })
    router.push("/admin")
    setIsSubmitting(false)
  }

  const handleGoogleSignUp = () => {
    // Handle Google sign up
    toast.info("Google Sign-In", {
      description: "This feature will be available soon"
    })
    console.log("Sign up with Google")
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
          className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#1a7aaa]/5 rounded-full blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg z-10"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-10 border border-white/60 relative"
        >
          {/* Top subtle glow */}
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#156d95] to-transparent opacity-50" />

          {/* Back Button */}
          <motion.div variants={itemVariants}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#666666] hover:text-[#156d95] transition-all duration-300 mb-8 group no-underline"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-[#156d95]/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>Return to entry</span>
            </Link>
          </motion.div>

          {/* Logo Section */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-10 text-center">
            <div className="relative group mb-4">
              <div className="absolute inset-0 bg-[#156d95] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#156d95] to-[#0d4a6b] rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-2.5 h-2.5 bg-white rounded-[3px]" />
                  ))}
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "Figtree" }}>
              Deep<span className="text-[#156d95]">SkyN</span> Registration
            </h1>
            <p className="text-[#666666] dark:text-gray-400 mt-1 font-medium text-sm">Join the next generation of workspace logic.</p>
          </motion.div>

          {/* Google Sign Up */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignUp}
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
            <span className="text-[#202020] font-semibold">Sign up with Google</span>
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
                Or continue with
              </span>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <motion.div variants={itemVariants}>
              <label htmlFor="fullName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                Full Name
              </label>
              <motion.div
                className="relative group"
                animate={shakeField === 'fullName' ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  id="fullName"
                  type="text"
                  required
                  maxLength={50}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (errors.fullName) setErrors({ ...errors, fullName: "" })
                  }}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-[#fafafa] hover:bg-white ${errors.fullName
                    ? "border-red-500 bg-red-50/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-200"
                    : "border-[#e0e0e0] focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    }`}
                  style={{ fontFamily: "Figtree" }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <AnimatePresence>
                    {errors.fullName && (
                      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                        <AlertCircle className="w-5 h-5 text-red-500 filter drop-shadow-[0_0_3px_rgba(239,68,68,0.4)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <User className={`w-5 h-5 transition-colors duration-300 ${errors.fullName ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
              </motion.div>
              <AnimatePresence>
                {errors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.fullName}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                Email Address
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

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                  Date of Birth
                </label>
                <motion.div
                  className="relative group"
                  animate={shakeField === 'birthDate' ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <input
                    id="birthDate"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => {
                      handleBirthDateChange(e)
                      if (errors.birthDate) setErrors({ ...errors, birthDate: "" })
                    }}
                    className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-[#fafafa] hover:bg-white appearance-none ${errors.birthDate
                      ? "border-red-500 bg-red-50/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-200"
                      : "border-[#e0e0e0] focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                      }`}
                    style={{ fontFamily: "Figtree" }}
                  />
                  <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${errors.birthDate ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </motion.div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                  Age
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={age !== null ? `${age} years` : "--"}
                    readOnly
                    className="w-full px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl bg-[#f0f0f0] text-[#666666] cursor-not-allowed"
                    style={{ fontFamily: "Figtree" }}
                  />
                </div>
              </div>
              <AnimatePresence mode="wait">
                {errors.birthDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    className="col-span-2 flex items-center gap-1.5 mt-2 ml-1"
                  >
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <p
                      className="text-xs text-red-500 font-bold tracking-wide uppercase"
                      style={{ fontFamily: "Figtree" }}
                    >
                      {errors.birthDate}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Gender/Sexe */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                Sex
              </label>
              <motion.div
                className="grid grid-cols-3 gap-3"
                animate={shakeField === 'gender' ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {['Male', 'Female', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setGender(option)
                      if (errors.gender) setErrors({ ...errors, gender: "" })
                    }}
                    className={`py-2 px-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${gender === option
                      ? "border-[#156d95] bg-[#156d95]/5 text-[#156d95] shadow-sm"
                      : errors.gender
                        ? "border-red-500 text-red-500 bg-red-50/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                        : "border-[#e0e0e0] text-[#666666] hover:border-[#156d95]/30 hover:bg-[#fafafa]"
                      }`}
                    style={{ fontFamily: "Figtree" }}
                  >
                    {option === 'Male' ? 'Male' : option === 'Female' ? 'Female' : 'Other'}
                  </button>
                ))}
              </motion.div>
              <AnimatePresence>
                {errors.gender && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.gender}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
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
              <AnimatePresence>
                {errors.password ? (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.password}
                  </motion.p>
                ) : (
                  <p className="mt-2 text-[10px] text-[#999999] font-bold uppercase tracking-widest ml-1" style={{ fontFamily: "Figtree" }}>
                    Min. 8 chars (1 Num, 1 Spec)
                  </p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm Password */}
            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" style={{ fontFamily: "Figtree" }}>
                Confirm Password
              </label>
              <motion.div
                className="relative group"
                animate={shakeField === 'confirmPassword' ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" })
                  }}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 pr-10 border-2 rounded-xl focus:outline-none transition-all duration-300 bg-[#fafafa] hover:bg-white ${errors.confirmPassword
                    ? "border-red-500 bg-red-50/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] focus:ring-2 focus:ring-red-200"
                    : "border-[#e0e0e0] focus:ring-2 focus:ring-[#156d95] focus:border-transparent"
                    }`}
                  style={{ fontFamily: "Figtree" }}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${errors.confirmPassword ? "text-red-500" : "text-[#999999] hover:text-[#156d95]"}`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </motion.div>
              <AnimatePresence>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="text-[10px] text-red-500 font-black uppercase tracking-widest mt-2 ml-1"
                  >
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Create Account Button */}
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
                      Create account
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
            className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center"
          >
            <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.2em] mb-4" style={{ fontFamily: "Figtree" }}>
              By creating an account, you accept our <br />
              <Link href="/terms" className="text-[#156d95] hover:underline">Terms</Link> & <Link href="/privacy" className="text-[#156d95] hover:underline">Privacy</Link>
            </p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>
              Already registered?{" "}
              <Link href="/signin" className="text-[#156d95] hover:underline decoration-2 underline-offset-4">
                Log Into Portal
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
          © 2026 DEEPSKYN LTD • ENCRYPTED SESSION
        </motion.p>
      </motion.div>

      {/* Consent Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConsentModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                {/* Close Button */}
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors duration-300"
                >
                  <X className="w-5 h-5 text-[#666666]" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#156d95]/10 rounded-2xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-[#156d95]" />
                  </div>

                  <h3 className="text-2xl font-bold text-[#202020] mb-4" style={{ fontFamily: "Figtree" }}>
                    Confidentiality & Security
                  </h3>

                  <p className="text-[#666666] leading-relaxed mb-8" style={{ fontFamily: "Figtree" }}>
                    Before finalizing your account, please review and accept our data privacy policy and application usage contracts.
                  </p>

                  <div className="w-full space-y-4 mb-8">
                    {/* Face Data Consent */}
                    <div className="flex items-start gap-4 p-4 bg-[#fafafa] rounded-2xl border border-[#e0e0e0]/50 text-left">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Camera className="w-5 h-5 text-[#156d95]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#202020]" style={{ fontFamily: "Figtree" }}>Face Recognition Consent</h4>
                        <p className="text-xs text-[#666666] mt-1">I agree to allow DeepSkyN to securely store my biometric/photo data for authentication purposes.</p>
                      </div>
                    </div>

                    {/* App Logic Consent */}
                    <div className="flex items-start gap-4 p-4 bg-[#fafafa] rounded-2xl border border-[#e0e0e0]/50 text-left">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <FileText className="w-5 h-5 text-[#156d95]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#202020]" style={{ fontFamily: "Figtree" }}>Application Logic Contract</h4>
                        <p className="text-xs text-[#666666] mt-1">I accept the terms regarding automated workflows and internal logic management of my workspace.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowConsentModal(false)}
                      className="py-3.5 px-6 rounded-xl font-semibold border-2 border-[#e0e0e0] text-[#666666] hover:bg-gray-50 transition-all duration-300"
                      style={{ fontFamily: "Figtree" }}
                    >
                      Decline
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmSignup}
                      className="py-3.5 px-6 rounded-xl font-semibold bg-[#156d95] text-white shadow-lg shadow-blue-900/20 hover:bg-[#0d4a6b] transition-all duration-300"
                      style={{ fontFamily: "Figtree" }}
                    >
                      Accept & Join
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
