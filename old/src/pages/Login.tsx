import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, Stethoscope, Users, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const parseRole = (email: string): "doctor" | "staff" | null => {
    const parts = email.split("@");
    if (parts.length !== 2) return null;
    const [localPart, domain] = parts;
    if (!localPart.includes(".")) return null;
    const domainParts = domain.split(".");
    if (domainParts.length < 2) return null;
    const role = domainParts[0].toLowerCase();
    if (role === "doctor") return "doctor";
    if (role === "staff") return "staff";
    return null;
  };

  const detectedRole = parseRole(email);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    const role = parseRole(email);
    if (!role) {
      setError("Invalid format. Use: fname.lname@doctor.clinic or fname.lname@staff.clinic");
      return;
    }
    navigate(role === "doctor" ? "/doctor" : "/staff");
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan/4 blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-orange/3 blur-[100px]" />
      </div>

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-background to-navy-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[10%] right-[20%] w-72 h-72 rounded-full bg-emerald/10 blur-[80px]" />
          <div className="absolute bottom-[20%] left-[10%] w-64 h-64 rounded-full bg-cyan/8 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-emerald-cyan flex items-center justify-center glow-emerald">
              <PawPrint className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight">VETRA</span>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">Vet Management</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
            className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight"
          >
            Next-gen clinic<br />
            management, <span className="gradient-text">powered by AI.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-6 text-lg text-muted-foreground leading-relaxed"
          >
            The futuristic veterinary platform built for speed, precision, and intelligent clinical workflows.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 flex items-center gap-6"
          >
            {[
              { value: "2,400+", label: "Active clinics" },
              { value: "98.7%", label: "Uptime SLA" },
              { value: "4.9★", label: "User rating" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold tabular-nums gradient-text">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
                {i < 2 && <div className="w-px h-10 bg-border/30" />}
              </div>
            ))}
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-10 flex gap-3"
          >
            {[
              { icon: Sparkles, text: "AI Assistant" },
              { icon: Stethoscope, text: "Smart Diagnostics" },
              { icon: PawPrint, text: "Patient Records" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/30 border border-border/30 backdrop-blur-sm">
                <f.icon className="w-3.5 h-3.5 text-emerald" />
                <span className="text-xs font-medium text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-muted-foreground/30">© 2026 Vetra Health Technologies</p>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-emerald-cyan flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">VETRA</span>
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
              <h2 className="text-2xl font-extrabold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-2">Sign in to your clinic account</p>
            </div>

            {/* Role detect */}
            <AnimatePresence>
              {detectedRole && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 mb-4 px-3.5 py-3 rounded-xl bg-emerald/10 border border-emerald/20">
                    {detectedRole === "doctor" ? (
                      <Stethoscope className="w-4 h-4 text-emerald shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-emerald shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-emerald">
                      Signing in as {detectedRole === "doctor" ? "Doctor" : "Staff"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-4 px-3.5 py-3 rounded-xl bg-coral/10 border border-coral/20">
                    <AlertCircle className="w-4 h-4 text-coral shrink-0" />
                    <span className="text-xs text-coral font-medium">{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="john.doe@doctor.pawclinic"
                  className="w-full px-4 py-3.5 rounded-xl bg-card/50 border border-border/50 text-sm outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald/30 transition-all placeholder:text-muted-foreground/30 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 rounded-xl bg-card/50 border border-border/50 text-sm outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald/30 transition-all placeholder:text-muted-foreground/30 pr-12 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border accent-emerald" />
                  <span className="text-muted-foreground text-xs">Remember me</span>
                </label>
                <button type="button" className="text-emerald hover:underline text-xs font-medium">
                  Forgot password?
                </button>
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl gradient-emerald-cyan text-primary-foreground text-sm font-bold hover:shadow-lg transition-all glow-emerald flex items-center justify-center gap-2"
              >
                {detectedRole ? `Sign in as ${detectedRole === "doctor" ? "Doctor" : "Staff"}` : "Sign in"}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
              Format: <span className="font-mono text-muted-foreground/60">fname.lname@role.clinic</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
