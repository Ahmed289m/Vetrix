"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useFormik } from "formik";
import { useAuth } from "@/app/_hooks/useAuth";
import Image from "next/image";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validate: (values: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => {
      const errors: { email?: string; password?: string } = {};
      if (!values.email.trim()) {
        errors.email = "Email is required";
      } else if (
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)
      ) {
        errors.email = "Invalid email address";
      }
      if (!values.password.trim()) {
        errors.password = "Password is required";
      }
      return errors;
    },
    onSubmit: (values) => {
      login({ email: values.email, password: values.password });
    },
  });

  return (
    <div className="flex-1 flex flex-col relative z-10">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-between p-4 sm:p-5 border-b border-border/30 bg-card/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-tint/5 border border-tint/10 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald/10">
            <div className="absolute -inset-6 bg-radial from-emerald/25 to-transparent opacity-80" />
            <Image
              src="/logo.png"
              alt="Vetrix logo"
              width={42}
              height={42}
              className="relative w-9 h-9 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-base font-black tracking-[0.08em]">VETRIX</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 font-bold">
              Smart Vet Platform
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to your clinic account
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {loginError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4 px-3.5 py-3 rounded-xl bg-coral/10 border border-coral/20">
                  <AlertCircle className="w-4 h-4 text-coral shrink-0" />
                  <span className="text-xs text-coral font-medium">
                    {loginError}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="john.doe@example.com"
                className={`w-full px-4 py-3.5 rounded-xl bg-card/50 border text-sm outline-none focus:ring-2 transition-all backdrop-blur-sm ${
                  formik.touched.email && formik.errors.email
                    ? "border-coral/50 focus:ring-coral/20 focus:border-coral"
                    : "border-border/50 focus:ring-emerald/20 focus:border-emerald/30 placeholder:text-muted-foreground/30"
                }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs text-coral mt-1.5 ml-1">
                  {formik.errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 rounded-xl bg-card/50 border text-sm outline-none focus:ring-2 transition-all pr-12 backdrop-blur-sm ${
                    formik.touched.password && formik.errors.password
                      ? "border-coral/50 focus:ring-coral/20 focus:border-coral"
                      : "border-border/50 focus:ring-emerald/20 focus:border-emerald/30 placeholder:text-muted-foreground/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs text-coral mt-1.5 ml-1">
                  {formik.errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formik.values.rememberMe}
                  onChange={formik.handleChange}
                  className="w-4 h-4 rounded border-border accent-emerald"
                />
                <span className="text-muted-foreground text-xs">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-emerald hover:underline text-xs font-medium"
              >
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={isLoggingIn ? {} : { y: -1 }}
              whileTap={isLoggingIn ? {} : { scale: 0.98 }}
              className={`w-full py-3.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold transition-all glow-emerald flex items-center justify-center gap-2 ${
                isLoggingIn
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
