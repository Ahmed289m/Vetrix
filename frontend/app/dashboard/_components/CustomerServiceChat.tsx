"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  MessageSquareText,
  Send,
  Sparkles,
  Trash2,
  User,
  ArrowDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { cn } from "@/app/_lib/utils";
import { useAuth } from "@/app/_hooks/useAuth";
import { useCustomerServiceCrew } from "@/app/_hooks/queries/use-crew";

type MessageRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
};

const nextId = (() => {
  let counter = Date.now();
  return () => String(++counter);
})();

const makeWelcomeMessage = (): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your **Vetrix AI Assistant**. I can help you with:\n\n- Viewing & booking **appointments**\n- Managing your **pets**\n- Checking **prescriptions** & medications\n- Updating your **profile**\n\nHow can I help you today?",
  timestamp: new Date().toISOString(),
});

const storageKey = (clientId?: string) =>
  `vetrix_customer_service_${clientId || "guest"}`;

function loadMessages(clientId?: string): ChatMessage[] {
  if (typeof window === "undefined") return [makeWelcomeMessage()];

  try {
    const raw = sessionStorage.getItem(storageKey(clientId));
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage errors
  }

  return [makeWelcomeMessage()];
}

function saveMessages(clientId: string | undefined, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(clientId), JSON.stringify(messages));
  } catch {
    // ignore storage errors
  }
}

const QUICK_ACTIONS = [
  { label: "My Pets", prompt: "Show me my pets" },
  { label: "Appointments", prompt: "Show my appointments" },
  { label: "Prescriptions", prompt: "Show my prescriptions" },
  { label: "My Profile", prompt: "Show my profile" },
];

export function CustomerServiceChat() {
  const { user } = useAuth();
  const clientId = user?.userId;
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadMessages(clientId),
  );
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = useCustomerServiceCrew();

  const isOnlyWelcome =
    messages.length === 1 && messages[0].id === "welcome";

  useEffect(() => {
    setMessages(loadMessages(clientId));
  }, [clientId]);

  useEffect(() => {
    saveMessages(clientId, messages);
  }, [clientId, messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(gap > 120);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const value = (text ?? input).trim();
      if (!value || pending || chatMutation.isPending) return;

      const history = messages
        .filter((message) => message.id !== "welcome" && message.content.trim())
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "user",
          content: value,
          timestamp: new Date().toISOString(),
        },
      ]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setPending(true);

      chatMutation.mutate(
        { userPrompt: value, history },
        {
          onSuccess: (response) => {
            setPending(false);
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                role: "assistant",
                content: response.data.response,
                timestamp: new Date().toISOString(),
              },
            ]);
          },
          onError: () => {
            setPending(false);
            toast.error("Customer service assistant unavailable");
            setMessages((prev) => [
              ...prev,
              {
                id: nextId(),
                role: "assistant",
                content:
                  "Sorry, I could not process your request right now. Please try again.",
                timestamp: new Date().toISOString(),
              },
            ]);
          },
        },
      );
    },
    [chatMutation, input, messages, pending],
  );

  const handleClear = useCallback(() => {
    const fresh = [makeWelcomeMessage()];
    setMessages(fresh);
    saveMessages(clientId, fresh);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [clientId]);

  return (
    <div className="h-svh flex flex-col bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 chat-gradient pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 shrink-0 border-b border-border/30 bg-card/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gradient-emerald-cyan flex items-center justify-center shadow-lg shadow-emerald/20 shrink-0">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                Vetrix Assistant
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear chat</span>
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="relative z-10 flex-1 min-h-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {/* Avatar — assistant only */}
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg gradient-emerald-cyan flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] sm:max-w-[72%]",
                    message.role === "user" && "order-first",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-emerald text-primary-foreground rounded-br-sm shadow-md shadow-emerald/15"
                        : "bg-card/80 border border-border/40 rounded-bl-sm backdrop-blur-sm",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-invert [&_p]:text-foreground/90 [&_strong]:text-foreground [&_li]:text-foreground/90 [&_code]:text-emerald [&_code]:bg-emerald/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_ul]:space-y-1 [&_p:last-child]:mb-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[10px] text-muted-foreground/40 px-1",
                      message.role === "user" && "text-right",
                    )}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Avatar — user only */}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-emerald/15 border border-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-emerald" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {pending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg gradient-emerald-cyan flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-border/40 bg-card/80 backdrop-blur-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-emerald/70 animate-bounce"
                      style={{ animationDelay: "0ms", animationDuration: "1s" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-emerald/70 animate-bounce"
                      style={{
                        animationDelay: "150ms",
                        animationDuration: "1s",
                      }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-emerald/70 animate-bounce"
                      style={{
                        animationDelay: "300ms",
                        animationDuration: "1s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions — only shown on welcome screen */}
            {isOnlyWelcome && !pending && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground/50 mb-3 px-11">
                  Quick actions
                </p>
                <div className="flex flex-wrap gap-2 px-11">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleSend(action.prompt)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-emerald/30 hover:bg-emerald/5 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-emerald/60" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollDown && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-card/90 border border-border/40 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="relative z-10 shrink-0 border-t border-border/30 bg-card/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 rounded-xl border border-border/40 bg-background/80 px-3.5 py-2.5 focus-within:border-emerald/30 focus-within:ring-2 focus-within:ring-emerald/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  autoResize();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  pending
                    ? "Waiting for response…"
                    : "Type your message…"
                }
                disabled={pending}
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 max-h-40"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || pending || chatMutation.isPending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-emerald-cyan text-primary-foreground shadow-md shadow-emerald/15 hover:shadow-lg hover:shadow-emerald/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/40 px-1">
            <MessageSquareText className="w-3 h-3" />
            <span>
              Powered by Vetrix AI &middot; Uses your account context
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
