"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  PawPrint,
  Trash2,
  Sparkles,
  Stethoscope,
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
  timestamp: string; // ISO string for serialisation
}

/* ── Stable id counter ─────────────────────────────────────── */
let _nextId = Date.now();
const nextId = () => String(++_nextId);

/* ── Welcome message factory ───────────────────────────────── */
const makeWelcome = (): Message => ({
  id: "welcome",
  role: "assistant",
  content:
    "Hello, Doctor! I'm **Vetrix AI**, your clinical assistant specialised in **differential diagnoses**.\n\nDescribe the patient's symptoms and species, and I'll provide a ranked list of differentials with reasoning.",
  timestamp: new Date().toISOString(),
});

/* ── SessionStorage helpers ────────────────────────────────── */
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
  } catch { /* quota exceeded — ignore */ }
}

/* ── Typewriter speed ──────────────────────────────────────── */
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

  /* persist to sessionStorage on every message change */
  useEffect(() => {
    saveMessages(messages, context);
  }, [messages, context]);

  /* auto-scroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  /* cleanup interval on unmount */
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  /* auto-focus input */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* ── Typewriter ──────────────────────────────────────────── */
  const typewriter = useCallback((fullText: string) => {
    const id = nextId();
    setStreamingId(id);
    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", content: "", timestamp: new Date().toISOString() },
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
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const history: ChatMessagePayload[] = messages
        .filter((m) => m.id !== "welcome")
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
                timestamp: new Date().toISOString(),
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
    const fresh = [makeWelcome()];
    setMessages(fresh);
    saveMessages(fresh, context);
    setInput("");
  }, [context]);

  const isPending = chatMutation.isPending || !!streamingId;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan/[0.03] rounded-full blur-[100px]" />
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 relative z-10 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6 custom-scrollbar"
        >
          {/* Empty state hero — only when just welcome message */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              className="flex flex-col items-center justify-center pt-8 sm:pt-16 pb-8"
            >
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald/20 to-cyan/10 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 rounded-3xl gradient-emerald-cyan flex items-center justify-center glow-pulse shadow-2xl shadow-emerald/20">
                  <Stethoscope className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text text-center mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-muted-foreground/60 text-center max-w-md leading-relaxed">
                Describe patient symptoms, species, and clinical findings — I'll provide ranked differential diagnoses with reasoning.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald/8 border border-emerald/15 text-[10px] font-bold text-emerald/70 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Powered by Gemini
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan/8 border border-cyan/15 text-[10px] font-bold text-cyan/70 uppercase tracking-wider">
                  <Bot className="w-3 h-3" />
                  Differential Dx
                </span>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages
            .filter((m) => m.id !== "welcome" || messages.length <= 1)
            .filter((m) => !(m.id === "welcome" && messages.length <= 1)) // hide welcome when showing hero
            .length === 0
            ? null
            : messages
                .filter((m) => !(m.id === "welcome" && messages.length <= 1))
                .map((msg, i, arr) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i === arr.length - 1 ? 0.08 : 0,
                      duration: 0.3,
                      ease: [0.2, 0, 0, 1],
                    }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* AI avatar */}
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center mr-3 mt-1 shrink-0 shadow-lg shadow-emerald/10">
                        <PawPrint className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] group">
                      <div
                        className={`px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "gradient-emerald-cyan text-primary-foreground rounded-2xl rounded-br-sm shadow-lg shadow-emerald/15"
                            : "bg-card/90 text-foreground rounded-2xl rounded-bl-sm border border-border/40 backdrop-blur-md shadow-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className={`prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_code]:text-emerald [&_code]:bg-emerald/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_blockquote]:border-emerald/30 [&_blockquote]:text-muted-foreground [&_strong]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-foreground/85 [&_li]:text-foreground/80 [&_a]:text-emerald ${
                              streamingId === msg.id ? "typing-cursor" : ""
                            }`}
                          >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                      {/* Timestamp */}
                      <p
                        className={`text-[10px] mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                          msg.role === "user" ? "text-right text-muted-foreground/40" : "text-muted-foreground/40"
                        }`}
                      >
                        {fmtTime(msg.timestamp)}
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
              <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center shrink-0 glow-pulse shadow-lg shadow-emerald/10">
                <PawPrint className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card/90 px-5 py-4 rounded-2xl rounded-bl-sm border border-border/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-cyan typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-orange typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="relative z-10 shrink-0 px-4 sm:px-6 lg:px-10 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2.5 bg-card/60 backdrop-blur-xl rounded-2xl px-4 py-3 border border-border/30 focus-within:border-emerald/30 focus-within:shadow-[0_0_30px_hsl(160,84%,39%,0.07)] transition-all duration-300 shadow-lg shadow-black/5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isPending ? "AI is responding…" : "Describe symptoms, species, findings…"}
              disabled={isPending}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/35 min-w-0 disabled:opacity-50"
            />
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                title="Clear chat"
                className="p-2 rounded-xl hover:bg-muted/30 transition-all duration-200 text-muted-foreground/25 hover:text-muted-foreground/60"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isPending}
              className={`p-2.5 rounded-xl text-primary-foreground transition-all duration-200 disabled:opacity-15 disabled:hover:shadow-none shrink-0 ${
                isPending
                  ? "gradient-emerald-cyan ai-responding"
                  : "gradient-emerald-cyan hover:shadow-lg hover:shadow-emerald/20 active:scale-95 glow-emerald"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/25 mt-2 text-center font-medium tracking-wide">
            Powered by Gemini · Differential diagnosis assistant
          </p>
        </div>
      </div>
    </div>
  );
}
