"use client";

import * as React from "react";
import { Calculator, Pill, Droplet, Hash, ChevronRight, Activity, Zap, Beaker } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { cn } from "@/lib/utils";

const calculatorTools = [
  { 
    name: "Drug Dosage", 
    description: "Calculate precise medication doses based on weight and concentration.", 
    icon: Pill, 
    color: "from-emerald/20 to-emerald/5",
    iconColor: "text-emerald"
  },
  { 
    name: "Fluid Therapy", 
    description: "Determine hydration deficit, maintenance, and ongoing loss requirements.", 
    icon: Droplet, 
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400"
  },
  { 
    name: "CRI Calculator", 
    description: "Constant Rate Infusion for analgesia and anesthesia management.", 
    icon: Activity, 
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400"
  },
  { 
    name: "Energy (RER/DER)", 
    description: "Calculate Resting Energy Requirements and Daily Energy Needs.", 
    icon: Zap, 
    color: "from-orange-500/20 to-orange-500/5",
    iconColor: "text-orange-400"
  },
  { 
    name: "Transfusion", 
    description: "Blood volume and component requirements for emergency therapy.", 
    icon: Droplet, 
    color: "from-red-500/20 to-red-500/5",
    iconColor: "text-red-400"
  },
  { 
    name: "Conversion Tools", 
    description: "Quick units conversion for temperature, weight, and clinical values.", 
    icon: Beaker, 
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400"
  },
];

export default function CalculatorsPage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-emerald" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald">Clinical Decision Support</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Medical <span className="text-emerald">Calculators</span>
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          Access specialized veterinary tools for precise clinical calculations and treatment planning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculatorTools.map((tool, index) => (
          <div 
            key={index}
            className="group relative bg-muted/40 backdrop-blur-md rounded-[2.5rem] border border-border/10 p-8 transition-all duration-500 hover:scale-[1.02] hover:bg-muted/50"
          >
            <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
               <ChevronRight className="w-6 h-6 text-emerald" />
            </div>

            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] bg-gradient-to-br flex items-center justify-center mb-6 shadow-inner",
              tool.color
            )}>
              <tool.icon className={cn("w-8 h-8", tool.iconColor)} />
            </div>

            <h3 className="text-xl font-black text-foreground mb-3 group-hover:text-emerald transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed mb-8">
              {tool.description}
            </p>

            <Button 
                variant="ghost" 
                className="w-full h-14 rounded-2xl bg-muted/40 hover:bg-emerald/10 hover:text-emerald font-black text-xs uppercase tracking-widest transition-all"
            >
              Open Calculator
            </Button>
          </div>
        ))}
      </div>

      {/* Featured Tool (Quick Access) */}
      <div className="relative overflow-hidden bg-emerald/10 backdrop-blur-xl border border-emerald/20 rounded-[3rem] p-10 mt-12 group">
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald/20 rounded-full blur-[100px] group-hover:bg-emerald/30 transition-all duration-1000" />
         <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald bg-emerald/10 px-3 py-1 rounded-full">Coming Soon</span>
               <h2 className="text-3xl font-black text-foreground">AI Clinical Advisor</h2>
               <p className="text-muted-foreground font-medium max-w-md">
                 Predictive diagnostics and personalized treatment suggestions powered by Vetrix AI.
               </p>
            </div>
            <Button className="h-14 px-10 bg-emerald text-white font-black rounded-2xl shadow-2xl shadow-emerald/20 hover:scale-105 transition-transform">
               Get Early Access
            </Button>
         </div>
      </div>
    </div>
  );
}
