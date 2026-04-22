"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  PawPrint,
  Trash2,
  Sparkles,
  Stethoscope,
  Activity,
  HeartPulse,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useChatAssistant } from "@/app/_hooks/queries/use-chat";
import type { ChatMessagePayload } from "@/app/_lib/api/chat.api";

/* ── Types ─────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/* ── Stable id counter ─────────────────────────────────────── */
let _nextId = Date.now();
const nextId = () => String(++_nextId);

/* ── Welcome message ───────────────────────────────────────── */
const makeWelcome = (): Message => ({
  id: "welcome",
  role: "assistant",
  content:
    "Hello, Doctor! I'm **Vetrix AI**, your clinical assistant specialised in **differential diagnoses**.\n\nDescribe the patient's symptoms and species, and I'll provide a ranked list of differentials with reasoning.",
  timestamp: new Date().toISOString(),
});

/* ── SessionStorage ────────────────────────────────────────── */
const storageKey = (ctx?: string) => `vetrix_chat_${ctx || "main"}`;

function loadMessages(ctx?: string): Message[] {
  if (typeof window === "undefined") return [makeWelcome()];
  try {
    const raw = sessionStorage.getItem(storageKey(ctx));
    if (raw) {
      const parsed = JSON.parse(raw) as Message[];
      if (parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [makeWelcome()];
}

function saveMessages(msgs: Message[], ctx?: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(ctx), JSON.stringify(msgs));
  } catch { /* quota exceeded */ }
}

/* ── Typewriter ────────────────────────────────────────────── */
const CHARS_PER_TICK = 3;
const TICK_MS = 16;

/* ── Component ─────────────────────────────────────────────── */
export function ChatAssistant({
  role,
  context,
}: {
  role: "doctor" | "staff" | "admin" | "owner" | "client";
  context?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(context));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMutation = useChatAssistant();

  useEffect(() => { saveMessages(messages, context); }, [messages, context]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const typewriter = useCallback((fullText: string) => {
    const id = nextId();
    setStreamingId(id);
    setMessages((prev) => [...prev, { id, role: "assistant", content: "", timestamp: new Date().toISOString() }]);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + CHARS_PER_TICK, fullText.length);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: fullText.slice(0, idx) } : m)));
      if (idx >= fullText.length) { clearInterval(intervalRef.current!); intervalRef.current = null; setStreamingId(null); }
    }, TICK_MS);
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || chatMutation.isPending || streamingId) return;

      const userMsg: Message = { id: nextId(), role: "user", content: msg, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const history: ChatMessagePayload[] = messages
        .filter((m) => m.id !== "welcome" && m.content.trim())
        .concat(userMsg)
        .map(({ role, content }) => ({ role, content }));

      chatMutation.mutate(
        { message: msg, history, context },
        {
          onSuccess: (data) => { setIsTyping(false); typewriter(data.data.response); },
          onError: () => {
            setIsTyping(false);
            setMessages((prev) => [...prev, { id: nextId(), role: "assistant", content: "Sorry, I couldn't process your request. Please try again.", timestamp: new Date().toISOString() }]);
            toast.error("AI assistant unavailable");
          },
        }
      );
    },
    [input, messages, context, chatMutation, streamingId, typewriter]
  );

  const handleClear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setStreamingId(null);
    const fresh = [makeWelcome()];
    setMessages(fresh);
    saveMessages(fresh, context);
    setInput("");
  }, [context]);

  const isPending = chatMutation.isPending || !!streamingId;
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const showHero = messages.length <= 1;
  const visibleMessages = messages.filter((m) => !(m.id === "welcome" && showHero));

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* ── Animated ambient mesh ───────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-emerald/[0.04] rounded-full blur-[140px] animate-float" />
        <div className="absolute bottom-[-8%] right-[10%] w-[400px] h-[400px] bg-cyan/[0.035] rounded-full blur-[120px]" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[40%] right-[60%] w-[250px] h-[250px] bg-orange/[0.02] rounded-full blur-[90px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* ── Messages ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative z-10 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6 custom-scrollbar">

          {/* Hero empty state */}
          {showHero && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="flex flex-col items-center justify-center pt-8 sm:pt-16 pb-8"
            >
              {/* Animated icon ring */}
              <div className="relative mb-8">
                <div className="absolute -inset-6 rounded-full border border-emerald/10 animate-[spin_20s_linear_infinite]" />
                <div className="absolute -inset-10 rounded-full border border-dashed border-cyan/8 animate-[spin_30s_linear_infinite_reverse]" />
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald/20 via-cyan/10 to-emerald/5 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 rounded-3xl gradient-emerald-cyan flex items-center justify-center glow-pulse shadow-2xl shadow-emerald/20 border border-white/10">
                  <Stethoscope className="w-10 h-10 text-primary-foreground drop-shadow-lg" />
                </div>
                {/* Orbiting dot */}
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan/20 border border-cyan/30 flex items-center justify-center backdrop-blur-sm">
                  <Activity className="w-2.5 h-2.5 text-cyan" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-3">
                <span className="gradient-text">How can I assist</span>{" "}
                <span className="text-foreground">today?</span>
              </h2>
              <p className="text-sm text-muted-foreground/50 text-center max-w-sm leading-relaxed">
                Describe the patient's symptoms, species, and findings. I'll provide ranked differential diagnoses.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
                {[
                  { icon: Sparkles, label: "AI-Powered Analysis" },
                  { icon: HeartPulse, label: "Clinical Reasoning" },
                  { icon: PawPrint, label: "Multi-Species" },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tint/[0.03] border border-tint/[0.06] text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider hover:bg-emerald/8 hover:text-emerald/60 hover:border-emerald/15 transition-all duration-300 cursor-default"
                  >
                    <pill.icon className="w-3 h-3" />
                    {pill.label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          {visibleMessages.map((msg, i, arr) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i === arr.length - 1 ? 0.08 : 0, duration: 0.35, ease: [0.2, 0, 0, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >

              {/* Bubble */}
              <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] group">
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-emerald-cyan text-primary-foreground rounded-2xl rounded-br-sm shadow-lg shadow-emerald/15 border border-white/10"
                      : "bg-card/80 text-foreground rounded-2xl rounded-bl-sm border border-border/30 backdrop-blur-xl shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className={`prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_code]:text-emerald [&_code]:bg-emerald/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_blockquote]:border-l-emerald/30 [&_blockquote]:text-muted-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h3]:text-sm [&_p]:text-foreground/85 [&_li]:text-foreground/80 [&_a]:text-emerald [&_hr]:border-border/30 ${
                        streamingId === msg.id ? "typing-cursor" : ""
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                <p className={`text-[10px] mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  msg.role === "user" ? "text-right text-muted-foreground/30" : "text-muted-foreground/30"
                }`}>
                  {fmtTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
              <div className="bg-card/80 px-5 py-4 rounded-2xl rounded-bl-sm border border-border/30 backdrop-blur-xl">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-cyan typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-emerald/50 typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Input bar ──────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 px-4 sm:px-6 lg:px-10 pb-5 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative group/input">
            {/* Glow ring on focus */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald/0 via-emerald/20 to-cyan/0 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-[1px]" />
            <div className="relative flex items-center gap-2.5 bg-card/70 backdrop-blur-2xl rounded-2xl px-4 py-3.5 border border-border/20 transition-all duration-300 shadow-xl shadow-black/5">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isPending ? "Analyzing…" : "Describe symptoms, species, findings…"}
                disabled={isPending}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30 min-w-0 disabled:opacity-50"
              />
              {messages.length > 1 && (
                <button
                  onClick={handleClear}
                  title="Clear chat"
                  className="p-2 rounded-xl hover:bg-destructive/10 transition-all duration-200 text-muted-foreground/20 hover:text-destructive/60"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                className={`p-2.5 rounded-xl text-primary-foreground transition-all duration-200 disabled:opacity-10 shrink-0 ${
                  isPending
                    ? "gradient-emerald-cyan ai-responding"
                    : "gradient-emerald-cyan hover:shadow-lg hover:shadow-emerald/20 active:scale-[0.93] glow-emerald"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/20 mt-2.5 text-center font-medium tracking-wider uppercase">
            Vetrix AI · Clinical Intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
