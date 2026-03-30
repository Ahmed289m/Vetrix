import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Dog, Cat, Shield, Search } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

type Species = "dog" | "cat";

interface DrugSuggestion {
  name: string;
  category: string;
  dose: Record<Species, { value: number; unit: string }>;
  route: string;
  frequency: string;
  notes: string;
  safetyAlerts: Partial<Record<Species, string[]>>;
}

const symptomCategories = [
  { key: "vomiting", label: "Vomiting", icon: "🤮", color: "text-orange" },
  { key: "pain", label: "Pain", icon: "🩹", color: "text-coral" },
  { key: "infection", label: "Infection", icon: "🦠", color: "text-cyan" },
  { key: "diarrhea", label: "Diarrhea", icon: "💧", color: "text-orange" },
  { key: "allergy", label: "Allergy/Itch", icon: "🔴", color: "text-coral" },
  { key: "seizure", label: "Seizure", icon: "⚡", color: "text-orange" },
  { key: "anxiety", label: "Anxiety/Sedation", icon: "😰", color: "text-cyan" },
  { key: "cardiac", label: "Cardiac", icon: "❤️", color: "text-coral" },
];

const drugsBySymptom: Record<string, DrugSuggestion[]> = {
  vomiting: [
    {
      name: "Maropitant (Cerenia)",
      category: "Antiemetic",
      dose: {
        dog: { value: 1, unit: "mg/kg" },
        cat: { value: 1, unit: "mg/kg" },
      },
      route: "SC/PO",
      frequency: "q24h",
      notes:
        "First-line antiemetic. Can give SC for actively vomiting patients.",
      safetyAlerts: {
        cat: ["Stings on SC injection — dilute or give slowly"],
        dog: [],
      },
    },
    {
      name: "Ondansetron",
      category: "Antiemetic (5-HT3)",
      dose: {
        dog: { value: 0.5, unit: "mg/kg" },
        cat: { value: 0.5, unit: "mg/kg" },
      },
      route: "IV/PO",
      frequency: "q8-12h",
      notes: "5-HT3 antagonist. Good for chemotherapy-induced nausea.",
      safetyAlerts: {},
    },
    {
      name: "Metoclopramide",
      category: "Prokinetic/Antiemetic",
      dose: {
        dog: { value: 0.5, unit: "mg/kg" },
        cat: { value: 0.3, unit: "mg/kg" },
      },
      route: "PO/SC/IV",
      frequency: "q8h",
      notes: "Promotes gastric emptying. Also available as CRI.",
      safetyAlerts: {
        dog: ["Avoid in GI obstruction"],
        cat: ["Lower dose in cats"],
      },
    },
  ],
  pain: [
    {
      name: "Meloxicam",
      category: "NSAID",
      dose: {
        dog: { value: 0.1, unit: "mg/kg" },
        cat: { value: 0.05, unit: "mg/kg" },
      },
      route: "PO/SC",
      frequency: "q24h",
      notes:
        "Loading dose: 0.2 mg/kg (dogs). Long-term use in cats controversial.",
      safetyAlerts: {
        dog: [
          "Avoid in dehydration, renal/hepatic disease",
          "Do not combine with corticosteroids",
        ],
        cat: [
          "Single injection only in many countries",
          "High risk of renal toxicity in dehydrated cats",
        ],
      },
    },
    {
      name: "Buprenorphine",
      category: "Opioid",
      dose: {
        dog: { value: 0.02, unit: "mg/kg" },
        cat: { value: 0.02, unit: "mg/kg" },
      },
      route: "IV/IM/OTM",
      frequency: "q6-8h",
      notes:
        "Partial mu-agonist. Excellent for moderate pain in cats (OTM route).",
      safetyAlerts: {},
    },
    {
      name: "Gabapentin",
      category: "Neuropathic",
      dose: {
        dog: { value: 5, unit: "mg/kg" },
        cat: { value: 5, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q8-12h",
      notes:
        "Good for chronic/neuropathic pain. Also useful as pre-visit anxiolytic in cats.",
      safetyAlerts: { cat: ["Check for xylitol in liquid formulations!"] },
    },
    {
      name: "Tramadol",
      category: "Opioid-like",
      dose: {
        dog: { value: 3, unit: "mg/kg" },
        cat: { value: 2, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q8-12h",
      notes: "Weak opioid. Efficacy debated in dogs. Better evidence in cats.",
      safetyAlerts: {
        dog: [
          "Variable efficacy — consider alternatives",
          "Avoid with SSRIs/MAOIs",
        ],
      },
    },
  ],
  infection: [
    {
      name: "Amoxicillin-Clavulanate",
      category: "Antibiotic",
      dose: {
        dog: { value: 12.5, unit: "mg/kg" },
        cat: { value: 12.5, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h",
      notes:
        "Broad-spectrum. First-line for skin, UTI, respiratory infections.",
      safetyAlerts: {},
    },
    {
      name: "Cephalexin",
      category: "Antibiotic (1st gen ceph)",
      dose: {
        dog: { value: 22, unit: "mg/kg" },
        cat: { value: 22, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h",
      notes:
        "First-gen cephalosporin. Excellent for skin infections (pyoderma).",
      safetyAlerts: {},
    },
    {
      name: "Metronidazole",
      category: "Antibiotic/Antiprotozoal",
      dose: {
        dog: { value: 15, unit: "mg/kg" },
        cat: { value: 10, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h",
      notes: "Anaerobic bacteria + Giardia. Reduce dose in hepatic disease.",
      safetyAlerts: {
        dog: ["Neurotoxicity at high doses — watch for ataxia"],
        cat: ["Lower dose recommended in cats"],
      },
    },
    {
      name: "Enrofloxacin",
      category: "Fluoroquinolone",
      dose: {
        dog: { value: 5, unit: "mg/kg" },
        cat: { value: 5, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q24h",
      notes:
        "Reserve for resistant infections. Culture & sensitivity recommended.",
      safetyAlerts: {
        cat: ["Retinal degeneration risk — do NOT exceed 5 mg/kg/day"],
        dog: ["Avoid in growing dogs — cartilage damage"],
      },
    },
  ],
  diarrhea: [
    {
      name: "Metronidazole",
      category: "Antimicrobial",
      dose: {
        dog: { value: 15, unit: "mg/kg" },
        cat: { value: 10, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h",
      notes: "Anti-inflammatory effects on GI tract. Also antiprotozoal.",
      safetyAlerts: { cat: ["Lower dose in cats"] },
    },
    {
      name: "Probiotics (Fortiflora)",
      category: "Supportive",
      dose: {
        dog: { value: 1, unit: "sachet" },
        cat: { value: 1, unit: "sachet" },
      },
      route: "PO",
      frequency: "q24h",
      notes: "Sprinkle on food. Supports GI microbiome restoration.",
      safetyAlerts: {},
    },
    {
      name: "Maropitant (Cerenia)",
      category: "Antiemetic/Visceral analgesic",
      dose: {
        dog: { value: 1, unit: "mg/kg" },
        cat: { value: 1, unit: "mg/kg" },
      },
      route: "SC/PO",
      frequency: "q24h",
      notes: "Also provides visceral pain relief — useful for GI cramping.",
      safetyAlerts: {},
    },
  ],
  allergy: [
    {
      name: "Apoquel (Oclacitinib)",
      category: "JAK Inhibitor",
      dose: {
        dog: { value: 0.4, unit: "mg/kg" },
        cat: { value: 0.4, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h → q24h",
      notes:
        "Fast onset (4h). Reduce to q24h after 14 days. Dogs only (off-label cats).",
      safetyAlerts: {
        dog: ["Not for dogs <12 months", "Avoid with immunosuppressants"],
      },
    },
    {
      name: "Prednisolone",
      category: "Corticosteroid",
      dose: {
        dog: { value: 0.5, unit: "mg/kg" },
        cat: { value: 1, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12-24h",
      notes: "Anti-inflammatory. Taper dose — do not stop abruptly.",
      safetyAlerts: {
        dog: ["PU/PD, polyphagia expected", "Never combine with NSAIDs"],
      },
    },
    {
      name: "Diphenhydramine",
      category: "Antihistamine",
      dose: {
        dog: { value: 2, unit: "mg/kg" },
        cat: { value: 1, unit: "mg/kg" },
      },
      route: "PO/IM",
      frequency: "q8-12h",
      notes:
        "First-gen antihistamine. Mild efficacy — often used adjunctively.",
      safetyAlerts: {},
    },
  ],
  seizure: [
    {
      name: "Phenobarbital",
      category: "Anticonvulsant",
      dose: {
        dog: { value: 2.5, unit: "mg/kg" },
        cat: { value: 2.5, unit: "mg/kg" },
      },
      route: "PO/IV",
      frequency: "q12h",
      notes: "First-line anticonvulsant. Monitor serum levels after 2 weeks.",
      safetyAlerts: {
        dog: [
          "Hepatotoxicity — monitor liver values",
          "Drug interactions with many medications",
        ],
      },
    },
    {
      name: "Levetiracetam (Keppra)",
      category: "Anticonvulsant",
      dose: {
        dog: { value: 20, unit: "mg/kg" },
        cat: { value: 20, unit: "mg/kg" },
      },
      route: "PO/IV",
      frequency: "q8h",
      notes: "Fewer side effects than phenobarbital. Good add-on therapy.",
      safetyAlerts: {},
    },
    {
      name: "Diazepam",
      category: "Benzodiazepine",
      dose: {
        dog: { value: 0.5, unit: "mg/kg" },
        cat: { value: 0.5, unit: "mg/kg" },
      },
      route: "IV/PR",
      frequency: "PRN (status)",
      notes: "Emergency use for active seizures. Per rectum if no IV access.",
      safetyAlerts: {
        cat: [
          "Risk of fatal hepatic necrosis with ORAL use in cats — IV/PR only",
        ],
      },
    },
  ],
  anxiety: [
    {
      name: "Trazodone",
      category: "Anxiolytic",
      dose: {
        dog: { value: 3, unit: "mg/kg" },
        cat: { value: 3, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q8-12h",
      notes:
        "Serotonin modulator. Good for situational anxiety and post-op confinement.",
      safetyAlerts: { dog: ["Avoid with MAOIs/SSRIs"] },
    },
    {
      name: "Gabapentin",
      category: "Anxiolytic/Analgesic",
      dose: {
        dog: { value: 5, unit: "mg/kg" },
        cat: { value: 10, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "Single dose pre-visit",
      notes:
        "Excellent pre-visit anxiolytic for cats. Give 2-3h before appointment.",
      safetyAlerts: { cat: ["Check for xylitol-free formulation"] },
    },
    {
      name: "Dexmedetomidine (Sileo)",
      category: "Alpha-2 Agonist",
      dose: {
        dog: { value: 0.125, unit: "mL/m²" },
        cat: { value: 0.04, unit: "mg/kg" },
      },
      route: "OTM/IM",
      frequency: "PRN",
      notes: "Oromucosal gel for noise phobias (dogs). Do not swallow.",
      safetyAlerts: {
        dog: ["Bradycardia, hypotension possible", "Avoid in cardiac disease"],
      },
    },
  ],
  cardiac: [
    {
      name: "Pimobendan",
      category: "Inodilator",
      dose: {
        dog: { value: 0.25, unit: "mg/kg" },
        cat: { value: 0.25, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12h",
      notes:
        "Give on empty stomach (1h before food). First-line for DCM and MVD (stage B2+).",
      safetyAlerts: { dog: ["Avoid in aortic stenosis / HOCM"] },
    },
    {
      name: "Furosemide",
      category: "Loop Diuretic",
      dose: {
        dog: { value: 2, unit: "mg/kg" },
        cat: { value: 1, unit: "mg/kg" },
      },
      route: "PO/IV/IM",
      frequency: "q8-12h",
      notes:
        "Adjust dose to lowest effective. Monitor electrolytes and renal values.",
      safetyAlerts: {
        dog: ["Monitor for dehydration, hypokalemia"],
        cat: ["More sensitive — start at lower dose"],
      },
    },
    {
      name: "Enalapril",
      category: "ACE Inhibitor",
      dose: {
        dog: { value: 0.5, unit: "mg/kg" },
        cat: { value: 0.25, unit: "mg/kg" },
      },
      route: "PO",
      frequency: "q12-24h",
      notes: "Afterload reducer. Recheck renal values 5-7 days after starting.",
      safetyAlerts: {
        dog: [
          "Avoid in bilateral renal artery stenosis",
          "Monitor creatinine and potassium",
        ],
      },
    },
  ],
};

export default function DrugDoseCalc() {
  const [species, setSpecies] = useState<Species>("dog");
  const [weight, setWeight] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const w = parseFloat(weight) || 0;

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const allSuggestions = selectedSymptoms.flatMap(
    (s) => drugsBySymptom[s] || [],
  );
  // Deduplicate by name
  const seen = new Set<string>();
  const uniqueSuggestions = allSuggestions.filter((d) => {
    if (seen.has(d.name)) return false;
    seen.add(d.name);
    return true;
  });

  return (
    <motion.div
      variants={fadeUp}
      className="glass-card p-6 space-y-5 border-glow"
    >
      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <Pill className="w-4 h-4 text-emerald" /> Symptom-Based Drug Calculator
      </h3>

      {/* Species toggle */}
      <div className="flex gap-2">
        {(["dog", "cat"] as Species[]).map((s) => (
          <motion.button
            key={s}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSpecies(s)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              species === s
                ? "gradient-emerald-cyan text-primary-foreground glow-emerald"
                : "glass-card border border-border/50 text-muted-foreground hover:border-emerald/30"
            }`}
          >
            {s === "dog" ? (
              <Dog className="w-4 h-4" />
            ) : (
              <Cat className="w-4 h-4" />
            )}
            {s}
          </motion.button>
        ))}
      </div>

      {/* Weight input */}
      <div className="max-w-xs">
        <label className="text-xs font-semibold text-muted-foreground mb-1 block">
          Body Weight (kg)
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 25"
          className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50 text-sm outline-none focus:border-emerald/30 transition-colors"
        />
      </div>

      {/* Symptom selection */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Select Symptoms
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {symptomCategories.map((s) => (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSymptom(s.key)}
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all ${
                selectedSymptoms.includes(s.key)
                  ? "bg-emerald/10 border-2 border-emerald/40 text-emerald"
                  : "bg-muted/20 border border-border/50 text-muted-foreground hover:border-emerald/20"
              }`}
            >
              <span className="text-base">{s.icon}</span>
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Drug suggestions */}
      <AnimatePresence mode="wait">
        {selectedSymptoms.length > 0 && w > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-emerald" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {uniqueSuggestions.length} Medications Suggested
              </span>
            </div>

            {uniqueSuggestions.map((drug, i) => {
              const speciesDose = drug.dose[species];
              const totalDose =
                speciesDose.unit === "sachet"
                  ? speciesDose.value
                  : speciesDose.value * w;
              const alerts = drug.safetyAlerts[species] || [];

              return (
                <motion.div
                  key={drug.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-emerald/20 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{drug.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-semibold">
                        {drug.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-emerald tabular-nums">
                        {totalDose.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {speciesDose.unit === "sachet" ? "sachet" : "mg total"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-muted-foreground">
                      📋{" "}
                      <strong>
                        {speciesDose.value} {speciesDose.unit}
                      </strong>{" "}
                      × {w} kg
                    </span>
                    <span className="text-muted-foreground">
                      💉 <strong>{drug.route}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      🕐 <strong>{drug.frequency}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">{drug.notes}</p>

                  {alerts.length > 0 && (
                    <div className="space-y-1.5">
                      {alerts.map((alert, ai) => (
                        <motion.div
                          key={ai}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 + ai * 0.05 }}
                          className="flex items-start gap-2 p-2 rounded-lg bg-coral/5 border border-coral/20"
                        >
                          <Shield className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
                          <p className="text-[10px] text-coral font-medium">
                            {alert}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedSymptoms.length > 0 && !w && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-orange/5 border border-orange/20 text-center"
        >
          <p className="text-xs text-orange font-semibold">
            Enter patient weight to see dose calculations
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
