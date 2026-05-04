"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { useFormik } from "formik";
import { useAuth } from "@/app/_hooks/useAuth";
import Image from "next/image";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login, isLoggingIn, loginError } = useAuth();

  const formik = useFormik({
    initialValues: { email: "", password: "", rememberMe: false },
    validate: (values) => {
      const errors: { email?: string; password?: string } = {};
      if (!values.email.trim()) {
        errors.email = "Email is required";
      } else if (
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
      ) {
        errors.email = "Invalid email address";
      }
      if (!values.password.trim()) errors.password = "Password is required";
      return errors;
    },
    onSubmit: (values) =>
      login({ email: values.email, password: values.password }),
  });

  const fieldHasError = (name: "email" | "password") =>
    !!(formik.touched[name] && formik.errors[name]);

  return (
    <div className="flex-1 min-h-0 flex flex-col relative z-10 overflow-hidden">
      {/* Mobile header bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:hidden flex items-center justify-between px-4 py-3 sm:p-5 border-b border-border/20 bg-background/60 backdrop-blur-xl shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-tint/5 border border-tint/10 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald/10">
            <div className="absolute -inset-4 bg-radial from-emerald/20 to-transparent" />
            <Image
              src="/logo.svg"
              alt="Vetrix"
              width={32}
              height={32}
              sizes="32px"
              unoptimized
              draggable={false}
              className="relative w-7 h-7 sm:w-8 sm:h-8 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black tracking-widest">
              VETRIX
            </p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] text-muted-foreground/60 font-bold">
              Smart Vet Platform
            </p>
          </div>
        </div>
      </motion.div>

      {/* Centered form area */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
          className="w-full max-w-[24rem]"
        >
          {/* Card */}
          <div className="bg-card/60 backdrop-blur-xl border border-border/40 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/10 space-y-4 sm:space-y-6 max-h-[calc(100dvh-6rem)] overflow-hidden">
            {/* Header */}
            <div className="space-y-1 text-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.4,
                  type: "spring",
                  damping: 20,
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-linear-to-br from-emerald/20 to-cyan/10 border border-emerald/20 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-emerald/10"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full gradient-emerald-cyan opacity-90" />
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sign in to your clinic account
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {loginError && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/8 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-red-400 font-medium leading-relaxed">
                      {loginError}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form
              onSubmit={formik.handleSubmit}
              className="space-y-3 sm:space-y-4"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                  Email
                </label>
                <div className="relative group">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                      fieldHasError("email")
                        ? "text-red-400"
                        : focusedField === "email"
                          ? "text-emerald"
                          : "text-muted-foreground/40"
                    }`}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("email")}
                    placeholder="doctor@clinic.com"
                    className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-tint/5 border text-sm outline-none transition-all duration-200 ${
                      fieldHasError("email")
                        ? "border-red-500/40 bg-red-500/5 focus:ring-2 focus:ring-red-500/15"
                        : focusedField === "email"
                          ? "border-emerald/40 ring-2 ring-emerald/10"
                          : "border-tint/10 hover:border-tint/20"
                    } placeholder:text-muted-foreground/30`}
                  />
                </div>
                <AnimatePresence>
                  {fieldHasError("email") && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] text-red-400 ml-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {formik.errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider ml-0.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                      fieldHasError("password")
                        ? "text-red-400"
                        : focusedField === "password"
                          ? "text-emerald"
                          : "text-muted-foreground/40"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={(e) => {
                      formik.handleBlur(e);
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("password")}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-2.5 sm:py-3 rounded-xl bg-tint/5 border text-sm outline-none transition-all duration-200 ${
                      fieldHasError("password")
                        ? "border-red-500/40 bg-red-500/5 focus:ring-2 focus:ring-red-500/15"
                        : focusedField === "password"
                          ? "border-emerald/40 ring-2 ring-emerald/10"
                          : "border-tint/10 hover:border-tint/20"
                    } placeholder:text-muted-foreground/30`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors rounded-lg"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {fieldHasError("password") && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] text-red-400 ml-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {formik.errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoggingIn}
                whileHover={isLoggingIn ? {} : { scale: 1.01, y: -1 }}
                whileTap={isLoggingIn ? {} : { scale: 0.98 }}
                className={`w-full py-3 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 glow-emerald transition-all duration-300 mt-1 sm:mt-2 ${
                  isLoggingIn
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:shadow-xl hover:shadow-emerald/20"
                }`}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer note */}
            <p className="hidden sm:block text-center text-[11px] text-muted-foreground/40 leading-relaxed">
              Protected access · Vetrix Health Technologies
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
