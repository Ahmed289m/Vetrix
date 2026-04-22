"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Zap,
  FileText,
  Pill,
  Calendar,
  Mic,
  Bot,
  PawPrint,
  Trash2,
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
  timestamp: Date;
}

/* ── Stable id counter (module-level, never resets) ────────── */
let _nextId = 2;
const nextId = () => String(++_nextId);

/* ── Initial greeting ──────────────────────────────────────── */
const WELCOME: Message = {
  id: "1",
  role: "assistant",
  content:
    "Hello! I'm **Vetrix AI**, your clinical assistant specialised in **differential diagnoses**.\n\nDescribe the patient's symptoms and species, and I'll provide a ranked list of differentials with reasoning.\n\nWhat are you seeing today?",
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  { label: "Show today's appointments", icon: Calendar },
  { label: "Create a prescription", icon: Pill },
  { label: "Find patient history", icon: FileText },
  { label: "Emergency protocol", icon: Zap },
];

/* ── Typewriter speed ──────────────────────────────────────── */
const CHARS_PER_TICK = 3;
const TICK_MS = 18;

/* ── Component ─────────────────────────────────────────────── */
export function ChatAssistant({
  role,
  context,
}: {
  role: "doctor" | "staff" | "admin" | "owner" | "client";
  context?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatMutation = useChatAssistant();

  /* auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  /* cleanup interval on unmount */
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  /* ── Typewriter ──────────────────────────────────────────── */
  const typewriter = useCallback((fullText: string) => {
    const id = nextId();
    setStreamingId(id);
    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", content: "", timestamp: new Date() },
    ]);

    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + CHARS_PER_TICK, fullText.length);
      const partial = fullText.slice(0, idx);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: partial } : m))
      );
      if (idx >= fullText.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setStreamingId(null);
      }
    }, TICK_MS);
  }, []);

  /* ── Send ────────────────────────────────────────────────── */
  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || chatMutation.isPending || streamingId) return;

      const userMsg: Message = {
        id: nextId(),
        role: "user",
        content: msg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Build history from current messages (skip welcome, include new userMsg)
      const history: ChatMessagePayload[] = messages
        .slice(1) // drop welcome
        .concat(userMsg)
        .map(({ role, content }) => ({ role, content }));

      chatMutation.mutate(
        { message: msg, history, context },
        {
          onSuccess: (data) => {
            setIsTyping(false);
            typewriter(data.data.response);
          },
          onError: () => {
            setIsTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                role: "assistant",
                content: "Sorry, I couldn't process your request. Please try again.",
                timestamp: new Date(),
              },
            ]);
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
    setMessages([WELCOME]);
    setInput("");
  }, []);

  const isPending = chatMutation.isPending || !!streamingId;

  /* ── Render ──────────────────────────────────────────────── */
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
            <h3 className="text-lg font-extrabold tracking-tight gradient-text">
              Vetrix AI Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Clinical intelligence · Differential diagnoses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/10 border border-emerald/20">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-[10px] font-bold text-emerald uppercase tracking-wider">
                Online
              </span>
            </div>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                title="Clear chat"
                className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-muted-foreground/40 hover:text-muted-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 min-h-0 glass-card overflow-hidden flex flex-col border-glow">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: i === messages.length - 1 ? 0.1 : 0,
                  duration: 0.3,
                  ease: [0.2, 0, 0, 1],
                }}
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
                    <div
                      className={`prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_code]:text-emerald [&_code]:bg-emerald/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_blockquote]:border-emerald/30 [&_blockquote]:text-muted-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground/85 ${
                        streamingId === msg.id ? "typing-cursor" : ""
                      }`}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  <p
                    className={`text-[10px] mt-2 ${
                      msg.role === "user"
                        ? "text-primary-foreground/50"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Waiting dots */}
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

          {/* Quick prompts — only on fresh chat */}
          <AnimatePresence>
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="px-4 pb-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-2 px-1">
                  Suggested
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <motion.button
                      key={p.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSend(p.label)}
                      disabled={isPending}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-muted/30 text-muted-foreground hover:bg-emerald/10 hover:text-emerald hover:border-emerald/20 border border-border/50 transition-all duration-200 disabled:opacity-40"
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isPending ? "AI is responding…" : "Describe symptoms, species, findings…"}
                disabled={isPending}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 min-w-0 disabled:opacity-50"
              />
              <button className="p-2 rounded-xl hover:bg-muted/40 transition-colors text-muted-foreground/40 hover:text-muted-foreground">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                className={`p-2.5 rounded-xl text-primary-foreground hover:shadow-lg active:scale-95 transition-all disabled:opacity-20 disabled:hover:shadow-none shrink-0 ${
                  isPending ? "gradient-emerald-cyan ai-responding" : "gradient-emerald-cyan glow-emerald"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/30 mt-2 text-center font-medium">
              Powered by Gemini · Differential diagnosis assistant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
