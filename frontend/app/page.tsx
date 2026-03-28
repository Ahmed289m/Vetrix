"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PawPrint, Sparkles, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-svh bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-cyan/5 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full gradient-mesh opacity-20" />
      </div>

      {/* Nav  */}
      <nav className="relative z-10 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-emerald-cyan flex items-center justify-center shadow-lg glow-emerald">
            <PawPrint className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tighter">VETRIX</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/10 border border-emerald/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald">
              Now in Private Beta
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Intelligent Care <br />
            <span className="gradient-text">For Every Patient.</span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Vetrix is the next-generation clinic management platform powered by
            AI. Streamline your workflow, automate records, and focus on what
            matters most—saving lives.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl gradient-emerald-cyan text-primary-foreground font-bold shadow-xl glow-emerald flex items-center justify-center gap-2 group transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-colors">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full"
        >
          {[
            {
              icon: Zap,
              title: "Lighting Fast",
              desc: "Built for speed and zero latency operations.",
            },
            {
              icon: Shield,
              title: "Clinic Secure",
              desc: "Enterprise-grade encryption for patient data.",
            },
            {
              icon: Sparkles,
              title: "AI Powered",
              desc: "Automated diagnostics and clinical insights.",
            },
          ].map((f, i) => (
            <div key={i} className="glass-card p-6 text-left border-border/10">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center mb-4 text-emerald">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6 border-t border-border/5 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground/40 font-medium">
            © 2024 Vetrix Health Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-muted-foreground/40 hover:text-emerald transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-muted-foreground/40 hover:text-emerald transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-xs text-muted-foreground/40 hover:text-emerald transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
