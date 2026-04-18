"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Droplets, Calculator } from "lucide-react";
import { useLang } from "@/app/_hooks/useLanguage";
import { FluidTherapyModal } from "@/app/dashboard/_components/FluidTherapyModal";
import { fadeUp } from "@/app/_lib/utils/shared-animations";

export default function CalculatorsPage() {
  const { t } = useLang();
  const [isFluidOpen, setIsFluidOpen] = React.useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8 overflow-x-hidden"
      >
        {/* Page Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-emerald" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">
              {t("clinical_decision_support")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            {t("medical_calculators_title")}
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            {t("calculators_description")}
          </p>
        </div>

        {/* Fluid Therapy Card */}
        <motion.button
          variants={fadeUp}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setIsFluidOpen(true)}
          className="group w-full text-left relative bg-linear-to-br from-blue-500/10 to-transparent backdrop-blur-md rounded-3xl border border-blue-500/20 p-7 sm:p-10 transition-all duration-500 hover:border-blue-400/40 hover:shadow-[0_0_50px_-15px_rgba(59,130,246,0.3)]"
        >
          {/* Glow blob */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/15 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-blue-500/30 to-blue-500/10 flex items-center justify-center shadow-inner shrink-0">
              <Droplets className="w-10 h-10 text-blue-400" />
            </div>

            {/* Text */}
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-black text-foreground group-hover:text-blue-400 transition-colors">
                Fluid Therapy Calculator
              </h2>
              <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed max-w-md">
                Calculate maintenance volume (allometric formula), fluid
                deficit, ongoing losses from vomiting and diarrhea, infusion
                rates, and smart 2-phase correction plans for clinical fluid
                management.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  "Allometric Maintenance",
                  "Fluid Deficit",
                  "Ongoing Losses",
                  "Infusion Rates",
                  "2-Phase Plan",
                  "Dilution (C₁V₁=C₂V₂)",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              <div className="h-12 px-6 rounded-2xl bg-blue-500/15 border border-blue-500/25 group-hover:bg-blue-500/25 flex items-center gap-2 font-black text-sm text-blue-400 transition-all">
                <Droplets className="w-4 h-4" />
                Open Calculator
              </div>
            </div>
          </div>
        </motion.button>

        {/* AI Clinical Advisor — Coming Soon */}
        <div className="relative overflow-hidden bg-emerald/10 backdrop-blur-xl border border-emerald/20 rounded-3xl p-6 sm:p-8 group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald/20 rounded-full blur-[100px] group-hover:bg-emerald/30 transition-all duration-1000 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald bg-emerald/10 px-3 py-1 rounded-full">
                Coming Soon
              </span>
              <h2 className="text-2xl font-black text-foreground">
                AI Clinical Advisor
              </h2>
              <p className="text-muted-foreground font-medium max-w-md text-sm">
                Predictive diagnostics and personalized treatment suggestions
                powered by Vetrix AI.
              </p>
            </div>
            <div className="h-12 px-8 rounded-2xl bg-emerald/20 border border-emerald/30 flex items-center font-black text-sm text-emerald cursor-not-allowed opacity-70">
              Get Early Access
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal (rendered at root level) */}
      <FluidTherapyModal
        open={isFluidOpen}
        onClose={() => setIsFluidOpen(false)}
      />
    </>
  );
}
