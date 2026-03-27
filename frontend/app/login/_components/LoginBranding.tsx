"use client";

import { motion } from "framer-motion";
import { PawPrint, Sparkles, Stethoscope } from "lucide-react";

export function LoginBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-center p-12 gap-0">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-background to-navy-900" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-[10%] right-[20%] w-72 h-72 rounded-full bg-emerald/10 blur-[80px]" />
        <div className="absolute bottom-[20%] left-[10%] w-64 h-64 rounded-full bg-cyan/8 blur-[80px]" />
      </div>

      <div className="relative z-10 ">
        <img
          src="/logo.svg"
          alt="Vetrix logo"
          className="w-44 h-44 object-contain"
        />
      </div>

      <div className="relative z-10 max-w-lg">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight"
        >
          Next-gen clinic
          <br />
          management, <span className="gradient-text">powered by AI.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 text-lg text-muted-foreground leading-relaxed"
        >
          The futuristic veterinary platform built for speed, precision, and
          intelligent clinical workflows.
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
                <p className="text-2xl font-bold tabular-nums gradient-text">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
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
            <div
              key={f.text}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/30 border border-border/30 backdrop-blur-sm"
            >
              <f.icon className="w-3.5 h-3.5 text-emerald" />
              <span className="text-xs font-medium text-muted-foreground">
                {f.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-muted-foreground/30">
          © 2026 Vetrix Health Technologies
        </p>
      </div>
    </div>
  );
}
