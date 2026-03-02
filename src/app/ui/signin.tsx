"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Sparkles, ShieldOff, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { useAppDispatch } from "@/store/hooks"
import { setUser } from "@/store/slices/authSlice"

export default function SignIn() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shakeField, setShakeField] = useState<string | null>(null)
  const [showBlockedModal, setShowBlockedModal] = useState(false)

  // Test toast on mount to verify it works
  useEffect(() => {
    console.log('SignIn component mounted, toast available:', typeof toast);
    toast.info('DeepSkyn System', {
      description: 'Notifications are now configured for Top-Center.',
      duration: 5000,
    });
  }, []);

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

      try {
        console.log('Attempting signin with:', { email });
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();
        console.log('Signin response:', data, 'Status:', response.status);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to sign in');
        }

        if (data.unverified) {
          console.log('⚠️ [SignIn] Compte non vérifié, redirection vers /verify-code');
          // Store info for verification page
          sessionStorage.setItem('pendingUserId', data.userId.toString());
          sessionStorage.setItem('pendingUserEmail', data.email);

          toast.info('Vérification requise', {
            description: data.message,
            duration: 5000,
          });

          setTimeout(() => {
            router.push('/verify-code');
          }, 2000);
          return;
        }

        if (data.deactivated) {
          console.log('🚫 [SignIn] Compte désactivé');
          setShowBlockedModal(true);
          return;
        }

        // Store user data in Redux store
        const userData = {
          id: data.user.id,
          nom: data.user.nom || '',
          prenom: data.user.prenom || '',
          email: data.user.email,
          photo: data.user.image || data.user.photo || '/avatar.png',
          role: data.user.role || 'user',
          age: data.user.age,
          sexe: data.user.sexe,
          skin_type: data.user.skin_type,
          verified: data.user.verified,
        };

        dispatch(setUser(userData));

        toast.success('Connexion réussie !', {
          description: 'Vous allez être redirigé...',
          duration: 2000,
        });

        // Redirection basée sur le rôle
        const isAdmin = data.user.role?.toUpperCase() === 'ADMIN';
        const redirectPath = isAdmin ? '/admin' : '/user';

        console.log(`🚀 [SignIn] Redirection vers ${redirectPath} (Role: ${data.user.role})`);

        setTimeout(() => {
          router.push(redirectPath);
        }, 2000);
      } catch (error) {
        console.error('❌ Signin error caught:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        console.log('📢 Attempting to show toast with message:', errorMessage);

        if (errorMessage.includes('verify your account')) {
          const result = toast.error('Account Not Verified', {
            description: errorMessage,
            duration: 5000,
          });
          console.log('Toast result (verify):', result);
        } else {
          const result = toast.error('Login Failed', {
            description: errorMessage || 'Invalid email or password',
            duration: 5000,
          });
          console.log('Toast result (error):', result);
        }
      } finally {
        setIsSubmitting(false)
      }
    } else {
      console.log('❌ Form validation failed');
      const result = toast.error("Login Failed", {
        description: "Please check the fields in red",
        duration: 5000,
      });
      console.log('Toast result (validation):', result);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn('google', {
        callbackUrl: '/user',
        redirect: false,
      });

      if (result?.error) {
        toast.error('Google Sign-In Failed', {
          description: result.error,
        });
      } else if (result?.ok) {
        // Fetch user data and store in Redux
        try {
          const response = await fetch('/api/auth/session');
          const session = await response.json();

          if (session?.user) {
            dispatch(setUser({
              id: parseInt(session.user.id),
              nom: session.user.name || '',
              prenom: '',
              email: session.user.email,
              photo: session.user.image || '/avatar.png',
              role: session.user.role || 'user'
            }));
          }
        } catch (error) {
          console.error('Error fetching session:', error);
        }

        toast.success('Login successful!', {
          description: 'Redirecting...',
          duration: 2000,
        });
        setTimeout(() => {
          router.push('/user');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      toast.error('Google Sign-In Failed', {
        description: errorMessage,
      });
    }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f5f7] via-[#fafafa] to-[#f8fafc] px-4 py-8 relative overflow-hidden selection:bg-[#156d95]/10">
      {/* ── Popup compte désactivé ── */}
      <AnimatePresence>
        {showBlockedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-8 relative overflow-hidden"
            >
              {/* background glow */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
              <button
                onClick={() => setShowBlockedModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                  <ShieldOff className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "Figtree" }}>
                    Compte désactivé
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Figtree" }}>
                    Votre compte a été désactivé par l&#39;administration.
                    <br />
                    <strong className="text-gray-700">Veuillez contacter l&apos;administration de l&apos;application</strong> pour plus d&#39;informations.
                  </p>
                </div>
                <a
                  href="mailto:support@deepskyn.com"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#156d95] to-[#0d4a6b] px-4 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "Figtree" }}
                >
                  Contacter l&apos;administration
                </a>
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: "Figtree" }}
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Simplified Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#156d95]/10 via-[#0d4a6b]/5 to-transparent rounded-full blur-[120px] opacity-70" />
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-[#1a7aaa]/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6),0_0_20px_rgba(21,109,149,0.15)] p-6 md:p-10 border-2 border-[#156d95]/30 relative transition-all duration-300 hover:border-[#156d95]/60">
          {/* Top subtle glow */}
          <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#156d95] to-transparent opacity-50" />

          {/* Back Button */}
          <motion.div variants={itemVariants}>
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-[#666666] hover:text-[#156d95] transition-all duration-300 mb-4 group no-underline"
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
            className="flex flex-col items-center mb-6"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-[#156d95] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#156d95] to-[#0d4a6b] rounded-[1.25rem] flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-white/10 group-hover:translate-y-full transition-transform duration-700" />
                <div className="grid grid-cols-2 gap-1 p-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-3 h-3 bg-white rounded-[3px] shadow-sm"
                    />
                  ))}
                </div>
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "Figtree" }}>
              Deep<span className="text-[#156d95]">SkyN</span>
            </h1>
            <p className="text-[#666666] dark:text-gray-400 mt-1 font-medium text-sm" style={{ fontFamily: "Figtree" }}>
              Sign in to your account
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <motion.div variants={itemVariants}>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>
                  Email Address
                </label>
              </div>
              <motion.div
                className="relative group"
                animate={shakeField === 'email' ? { x: [-10, 10, -10, 10, 0] } : {}}
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${errors.email ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: "" })
                  }}
                  className={`w-full pl-11 pr-11 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl focus:outline-none transition-all duration-300 text-sm ${errors.email
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
                      <AlertCircle className="w-4 h-4 text-red-500" />
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>
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
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${errors.password ? "text-red-500" : "text-[#999999] group-focus-within:text-[#156d95]"}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: "" })
                  }}
                  className={`w-full pl-11 pr-11 py-3.5 bg-gray-50/50 dark:bg-gray-900/50 border-2 rounded-2xl focus:outline-none transition-all duration-300 text-sm ${errors.password
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  <div className={`w-8 h-5 rounded-full transition-colors duration-300 ${rememberMe ? 'bg-[#156d95]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  <motion.div
                    animate={{ x: rememberMe ? 14 : 2 }}
                    className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </div>
                <span className="ml-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors" style={{ fontFamily: "Figtree" }}>
                  Remember me
                </span>
              </label>
            </motion.div>

            {/* Sign In Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full relative group h-12 bg-gradient-to-r from-[#156d95] to-[#0d4a6b] rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10 active:shadow-none transition-all hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[10px]" style={{ fontFamily: "Figtree" }}>
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="px-3 bg-white dark:bg-black/40 text-gray-400">Or continue with</span>
              </div>
            </motion.div>

            {/* Google Sign In Button */}
            <motion.div variants={itemVariants}>
              <button
                onClick={handleGoogleSignIn}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:border-[#156d95]/30 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98]"
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
                <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">Sign in with Google</span>
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={{ fontFamily: "Figtree" }}>
              New user?{" "}
              <Link href="/signup" className="text-[#156d95] hover:underline decoration-2 underline-offset-4">
                Create Account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Outer subtle info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]"
        >
          © 2026 DEEPSKYN LTD • PRIVACY PROTECTED
        </motion.p>
      </motion.div>
    </div>
  )
}
