import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const drugDatabase = [
  {
    name: "Meloxicam",
    interactions: ["Other NSAIDs", "Corticosteroids", "ACE Inhibitors"],
    notes: "NSAID. Contraindicated in cats <6mo. Monitor renal function.",
  },
  {
    name: "Amoxicillin",
    interactions: ["Methotrexate", "Warfarin"],
    notes: "Broad-spectrum antibiotic.",
  },
  {
    name: "Metronidazole",
    interactions: ["Phenobarbital", "Warfarin", "Cyclosporine"],
    notes: "Antiprotozoal/anaerobic antibiotic.",
  },
  {
    name: "Cephalexin",
    interactions: ["Aminoglycosides", "Probenecid"],
    notes: "First-gen cephalosporin.",
  },
  {
    name: "Tramadol",
    interactions: ["SSRIs", "MAOIs", "Sedatives"],
    notes: "Opioid analgesic.",
  },
  {
    name: "Apoquel (oclacitinib)",
    interactions: ["Immunosuppressants", "Live vaccines"],
    notes: "JAK inhibitor for atopic dermatitis.",
  },
  {
    name: "Prazosin",
    interactions: ["Other antihypertensives", "PDE5 inhibitors"],
    notes: "Alpha-1 blocker.",
  },
  {
    name: "Propofol",
    interactions: ["Other CNS depressants", "Opioids (synergistic)"],
    notes: "Induction agent.",
  },
  {
    name: "Phenobarbital",
    interactions: [
      "Metronidazole",
      "Corticosteroids",
      "Cyclosporine",
      "Doxycycline",
    ],
    notes: "Anticonvulsant. Hepatic enzyme inducer.",
  },
  {
    name: "Prednisolone",
    interactions: ["NSAIDs", "Insulin", "Diuretics", "Live vaccines"],
    notes: "Corticosteroid.",
  },
  {
    name: "Furosemide",
    interactions: ["ACE Inhibitors", "Aminoglycosides", "NSAIDs", "Digoxin"],
    notes: "Loop diuretic.",
  },
  {
    name: "Gabapentin",
    interactions: ["Antacids", "Opioids (additive sedation)"],
    notes: "Neuropathic pain / anxiolytic.",
  },
];

export default function DrugInteractionCalc() {
  const [drug1, setDrug1] = useState(drugDatabase[0].name);
  const [drug2, setDrug2] = useState(drugDatabase[1].name);

  const d1 = drugDatabase.find((d) => d.name === drug1);
  const d2 = drugDatabase.find((d) => d.name === drug2);
  const hasInteraction =
    d1 &&
    d2 &&
    d1.interactions.some(
      (i) =>
        d2.name.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(d2.name.toLowerCase()),
    );

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
            value={drug1}
            onChange={(e) => setDrug1(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none"
          >
            {drugDatabase.map((d) => (
              <option key={d.name} value={d.name}>
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
            value={drug2}
            onChange={(e) => setDrug2(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none"
          >
            {drugDatabase.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-xl border ${hasInteraction ? "bg-coral/5 border-coral/20" : "bg-emerald/5 border-emerald/20"}`}
      >
        {hasInteraction ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-coral shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-coral">
                ⚠️ Potential Interaction Detected
              </p>
              <p className="text-xs text-foreground/80 mt-2">
                <strong>{drug1}</strong> may interact with{" "}
                <strong>{drug2}</strong>.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Exercise caution. Adjust doses or consider alternatives.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-emerald text-sm">✓</span>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald">
                No Known Interaction
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>{drug1}</strong> and <strong>{drug2}</strong> have no
                documented significant interactions.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[d1, d2].filter(Boolean).map((d) => (
          <div
            key={d!.name}
            className="p-4 rounded-xl bg-muted/20 border border-border/30"
          >
            <p className="text-sm font-bold">{d!.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{d!.notes}</p>
            <div className="mt-2 pt-2 border-t border-border/20">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                Known Interactions
              </p>
              <div className="flex flex-wrap gap-1">
                {d!.interactions.map((i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-orange/10 text-orange font-mono"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
