"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Check } from "lucide-react";
import { drugsApi } from "@/app/_lib/api/drugs.api";
import type { Drug, DrugInteractionWarning } from "@/app/_lib/types/models";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const getSeverityStyle = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "contraindication":
      return {
        badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
        labelClass: "text-red-500",
        icon: "⛔",
      };
    case "major":
      return {
        badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        labelClass: "text-orange-500",
        icon: "🔴",
      };
    case "moderate":
      return {
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        labelClass: "text-amber-500",
        icon: "🟡",
      };
    default:
      return {
        badgeClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        labelClass: "text-cyan-500",
        icon: "ℹ️",
      };
  }
};

export default function DrugInteractionCalc() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [drug1Id, setDrug1Id] = useState<string>("");
  const [drug2Id, setDrug2Id] = useState<string>("");
  const [warnings, setWarnings] = useState<DrugInteractionWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Load drugs on mount
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const result = await drugsApi.list();
        if (result.data) {
          setDrugs(result.data);
          if (result.data.length >= 2) {
            setDrug1Id(result.data[0].drug_id);
            setDrug2Id(result.data[1].drug_id);
          }
        }
      } catch (error) {
        console.error("Failed to load drugs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDrugs();
  }, []);

  // Check interactions when drugs change
  useEffect(() => {
    if (!drug1Id || !drug2Id) {
      setWarnings([]);
      return;
    }

    const checkInteractions = async () => {
      setChecking(true);
      try {
        const result = await drugsApi.checkInteractions([drug1Id, drug2Id]);
        if (result.data) {
          setWarnings(result.data.warnings || []);
        }
      } catch (error) {
        console.error("Failed to check interactions:", error);
        setWarnings([]);
      } finally {
        setChecking(false);
      }
    };

    checkInteractions();
  }, [drug1Id, drug2Id]);

  const drug1 = drugs.find((d) => d.drug_id === drug1Id);
  const drug2 = drugs.find((d) => d.drug_id === drug2Id);

  if (loading) {
    return (
      <motion.div
        variants={fadeUp}
        className="glass-card p-6 space-y-5 border-glow"
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-coral" /> Drug Interaction
          Check
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (drugs.length === 0) {
    return (
      <motion.div
        variants={fadeUp}
        className="glass-card p-6 space-y-5 border-glow"
      >
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-coral" /> Drug Interaction
          Check
        </h3>
        <p className="text-sm text-muted-foreground">
          No drugs available. Add drugs to the system first.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      className="glass-card p-6 space-y-5 border-glow"
    >
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-coral" /> Drug Interaction Check
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Drug 1
          </label>
          <select
            value={drug1Id}
            onChange={(e) => setDrug1Id(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none"
          >
            {drugs.map((d) => (
              <option key={d.drug_id} value={d.drug_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Drug 2
          </label>
          <select
            value={drug2Id}
            onChange={(e) => setDrug2Id(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none"
          >
            {drugs.map((d) => (
              <option key={d.drug_id} value={d.drug_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {checking ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-xl border border-border/30 bg-muted/10 flex items-center gap-3 justify-center"
        >
          <div className="w-4 h-4 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground">
            Checking interactions...
          </span>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-xl border ${
            warnings.length > 0
              ? "bg-red-500/5 border-red-500/20"
              : "bg-emerald/5 border-emerald/20"
          }`}
        >
          {warnings.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-500">
                    ⚠️ Interactions Detected ({warnings.length})
                  </p>
                  <p className="text-xs text-foreground/80 mt-2">
                    <strong>{drug1?.name}</strong> and{" "}
                    <strong>{drug2?.name}</strong> have documented interactions.
                  </p>
                </div>
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t border-red-500/10">
                {warnings.map((w, idx) => {
                  const style = getSeverityStyle(w.severity);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex items-start gap-2 p-3 rounded-lg border ${style.badgeClass}`}
                    >
                      <span className="text-lg shrink-0">{style.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-bold uppercase ${style.labelClass}`}
                        >
                          {w.severity}
                        </p>
                        <p className="text-xs text-foreground/80 mt-0.5">
                          {w.reason}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald">
                  No Known Interaction
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>{drug1?.name}</strong> and{" "}
                  <strong>{drug2?.name}</strong> have no documented significant
                  interactions.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {drug1 && drug2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[drug1, drug2].map((d) => (
            <div
              key={d.drug_id}
              className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2"
            >
              <div>
                <p className="text-sm font-bold">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.drugClass}</p>
              </div>

              {d.indications && d.indications.length > 0 && (
                <div className="pt-2 border-t border-border/20">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                    Indications
                  </p>
                  <ul className="space-y-0.5">
                    {d.indications.slice(0, 2).map((ind, i) => (
                      <li key={i} className="text-xs text-foreground/70">
                        • {ind}
                      </li>
                    ))}
                    {d.indications.length > 2 && (
                      <li className="text-[10px] text-muted-foreground italic">
                        +{d.indications.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {d.sideEffects && d.sideEffects.length > 0 && (
                <div className="pt-2 border-t border-border/20">
                  <p className="text-[10px] font-bold uppercase text-orange-400 mb-1">
                    Side Effects
                  </p>
                  <ul className="space-y-0.5">
                    {d.sideEffects.slice(0, 2).map((se, i) => (
                      <li key={i} className="text-xs text-foreground/70">
                        • {se}
                      </li>
                    ))}
                    {d.sideEffects.length > 2 && (
                      <li className="text-[10px] text-muted-foreground italic">
                        +{d.sideEffects.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {d.contraindications && d.contraindications.length > 0 && (
                <div className="pt-2 border-t border-border/20">
                  <p className="text-[10px] font-bold uppercase text-red-400 mb-1">
                    Contraindications
                  </p>
                  <ul className="space-y-0.5">
                    {d.contraindications.slice(0, 2).map((ci, i) => (
                      <li key={i} className="text-xs text-foreground/70">
                        • {ci}
                      </li>
                    ))}
                    {d.contraindications.length > 2 && (
                      <li className="text-[10px] text-muted-foreground italic">
                        +{d.contraindications.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
