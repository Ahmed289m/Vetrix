import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, FileText, Pill, Calendar, Mic, Bot, PawPrint } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm **Vetrix AI**, your intelligent clinic assistant. I can help you with:\n\n- 🔍 Patient records & history\n- 💊 Drug dosages & interactions\n- 📅 Today's schedule\n- 🚨 Emergency protocols\n\nWhat would you like to know?",
    timestamp: new Date(),
  },
];

const sampleResponses: Record<string, string> = {
  dosage: "**Meloxicam Dosage (Dogs)**\n\n| Parameter | Value |\n|-----------|-------|\n| Loading dose | `0.2 mg/kg` PO/SC |\n| Maintenance | `0.1 mg/kg` PO q24h |\n| Duration | As clinically indicated |\n\n⚠️ **Warning:** Contraindicated in cats under 6 months. Monitor renal function regularly.",
  appointment: "📅 **Today's Schedule**\n\n| Time | Patient | Procedure |\n|------|---------|----------|\n| 9:00 | Bella (Golden Ret.) | Vaccination |\n| 9:30 | Max (Persian) | Dental Check |\n| 10:00 | Luna (Labrador) | Post-op F/U |\n| 10:30 | Rocky (G. Shepherd) | Skin Allergy |\n\nYou have **4 appointments** remaining today.",
  protocol: "**🚨 Emergency Stabilization Protocol (Canine)**\n\n1. **Airway** — Intubate if GCS < 8\n2. **Breathing** — O₂ supplementation, SpO₂ target > 95%\n3. **Circulation** — IV catheter, crystalloid bolus `10-20 mL/kg`\n4. **Disability** — Neurological assessment\n5. **Exposure** — Full body examination\n\n> Escalate to surgery if internal hemorrhage suspected.",
  patient: "**🐕 Patient: Bella**\n\n- **Breed:** Golden Retriever\n- **Age:** 4 years\n- **Weight:** 28.5 kg\n- **Owner:** Sarah Mitchell\n\n**Recent History:**\n- `Mar 10` — Cruciate ligament repair (left stifle)\n- `Mar 15` — Post-op check, healing well\n- `Mar 16` — Follow-up scheduled today\n\n**Active Medications:** Meloxicam 0.1mg/kg PO q24h",
};

const quickPrompts = [
  { label: "Show today's appointments", icon: Calendar },
  { label: "Create a prescription", icon: Pill },
  { label: "Find patient history", icon: FileText },
  { label: "Emergency protocol", icon: Zap },
];

export function ChatAssistant({ role }: { role: "doctor" | "staff" | "admin" | "owner" | "client" }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = msg.toLowerCase();
      let response = "I found some relevant information in the clinic database. Based on the protocols and records available, I'd recommend consulting the specific patient file for detailed history. Would you like me to pull up a specific record?";
      if (lower.includes("dos") || lower.includes("drug") || lower.includes("melox") || lower.includes("prescription")) response = sampleResponses.dosage;
      else if (lower.includes("appointment") || lower.includes("schedule") || lower.includes("today")) response = sampleResponses.appointment;
      else if (lower.includes("protocol") || lower.includes("emergency") || lower.includes("stabiliz")) response = sampleResponses.protocol;
      else if (lower.includes("patient") || lower.includes("history") || lower.includes("bella") || lower.includes("find")) response = sampleResponses.patient;

      setMessages((m) => [...m, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1400);
  };

  return (
    <div className="h-full flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-3xl flex-1 flex flex-col min-h-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-5"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl gradient-emerald-cyan flex items-center justify-center glow-pulse">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald border-2 border-background animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold tracking-tight gradient-text">Vetrix AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {role === "doctor"
                ? "Clinical intelligence · Protocols · Patient records"
                : "Scheduling · Billing · Inventory queries"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/10 border border-emerald/20">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-[10px] font-bold text-emerald uppercase tracking-wider">Online</span>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 min-h-0 glass-card overflow-hidden flex flex-col border-glow">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i === messages.length - 1 ? 0.1 : 0, duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center mr-3 mt-1 shrink-0 glow-emerald">
                    <PawPrint className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-emerald-cyan text-primary-foreground rounded-2xl rounded-br-md shadow-lg glow-emerald"
                      : "bg-card/80 text-foreground rounded-2xl rounded-bl-md border border-border/50 backdrop-blur-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_code]:text-emerald [&_code]:bg-emerald/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_blockquote]:border-emerald/30 [&_blockquote]:text-muted-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground/85">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground/50"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center shrink-0 glow-pulse">
                  <PawPrint className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="bg-card/80 px-5 py-4 rounded-2xl rounded-bl-md border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-cyan typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-orange typing-dot" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Quick prompts */}
          <AnimatePresence>
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 pb-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2 px-1">Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSend(p.label)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-muted/30 text-muted-foreground hover:bg-emerald/10 hover:text-emerald hover:border-emerald/20 border border-border/50 transition-all duration-200"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <p.icon className="w-3.5 h-3.5" />
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-4 border-t border-border/30">
            <div className="flex items-center gap-2 bg-muted/20 rounded-2xl px-4 py-3 border border-border/40 focus-within:border-emerald/30 focus-within:shadow-[0_0_20px_hsl(160,84%,39%,0.08)] transition-all duration-300">
              <input
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
                placeholder="Ask about patients, protocols, dosages..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
              <button className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-muted-foreground/40 hover:text-muted-foreground">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={(e: React.MouseEvent) => handleSend()}
                disabled={!input.trim()}
                className="p-2.5 rounded-xl gradient-emerald-cyan text-primary-foreground hover:shadow-lg active:scale-95 transition-all disabled:opacity-20 disabled:hover:shadow-none shrink-0 glow-emerald"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/30 mt-2 text-center font-medium">
              RAG-powered · Searches clinic protocols, patient records, and drug databases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
