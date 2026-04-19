"use client";

import { motion } from "framer-motion";
import {
  PawPrint,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  Activity,
  Zap,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Stethoscope,
    title: "Smart Clinical Workflows",
    desc: "AI-assisted diagnostics and treatment planning",
    color: "text-emerald",
    bg: "bg-emerald/10",
    border: "border-emerald/20",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Role Security",
    desc: "Granular permissions for every staff member",
    color: "text-cyan",
    bg: "bg-cyan/10",
    border: "border-cyan/20",
  },
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    desc: "Live case queues and WebSocket-powered updates",
    color: "text-orange",
    bg: "bg-orange/10",
    border: "border-orange/20",
  },
  {
    icon: Zap,
    title: "Fluid Therapy Calc",
    desc: "Allometric formulas for precise fluid management",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
];

const stats = [
  { value: "2,400+", label: "Active clinics" },
  { value: "98.7%", label: "Uptime SLA" },
  { value: "4.9★", label: "User rating" },
];

export function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-emerald/5" />
      <div className="absolute inset-0">
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-cyan/6 blur-[100px]" />
        <div className="absolute top-[45%] right-[15%] w-[300px] h-[300px] rounded-full bg-orange/4 blur-[80px]" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(160,84%,39%) 1px, transparent 1px), linear-gradient(90deg, hsl(160,84%,39%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-3"
      >
        <Image
          src="/logo.svg"
          alt="Vetrix logo"
          width={56}
          height={56}
          sizes="(min-width: 1280px) 56px, 48px"
          unoptimized
          draggable={false}
          className="w-12 h-12 xl:w-14 xl:h-14 object-contain"
          priority
        />
        <div>
          <p className="text-lg font-black tracking-[0.1em]">VETRIX</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-bold">
            Veterinary Platform
          </p>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 max-w-md space-y-8 xl:space-y-10">
        {/* Headline */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald bg-emerald/10 border border-emerald/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Next-generation clinic OS
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.6, ease: [0.2, 0, 0, 1] }}
            className="text-3xl xl:text-[2.75rem] font-extrabold leading-[1.15] tracking-tight"
          >
            Clinic management,{" "}
            <span className="gradient-text">reimagined for the future.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            The futuristic veterinary platform built for speed, precision, and
            intelligent clinical workflows.
          </motion.p>
        </div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="grid grid-cols-1 gap-2.5"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.45 }}
              className={`flex items-center gap-3.5 p-3 rounded-xl border ${f.bg} ${f.border} backdrop-blur-sm`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${f.bg} ${f.border} border flex items-center justify-center shrink-0`}
              >
                <f.icon className={`w-4 h-4 ${f.color}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${f.color}`}>{f.title}</p>
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          className="flex items-center gap-6 pt-2"
        >
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              <div>
                <p className="text-xl font-black tabular-nums gradient-text">
                  {s.value}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
                  {s.label}
                </p>
              </div>
              {i < stats.length - 1 && (
                <div className="w-px h-8 bg-border/30" />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="relative z-10 flex items-center gap-2"
      >
        <PawPrint className="w-3.5 h-3.5 text-muted-foreground/25" />
        <p className="text-xs text-muted-foreground/30">
          © 2026 Vetrix Health Technologies
        </p>
      </motion.div>
    </div>
  );
}
