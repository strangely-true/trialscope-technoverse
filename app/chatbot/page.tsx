"use client";

import { useEffect, useRef, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your TrialGo AI assistant. I can help you understand your clinical trial, answer questions about your medication, explain procedures, or provide general health information. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("trialgo_token");
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await res.json();
      const reply = data.reply || data.response || data.message || "I'm sorry, I couldn't process that request. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having trouble connecting to the server. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the side effects I should watch for?",
    "How do I log my daily symptoms?",
    "When is my next check-in?",
    "What does my match score mean?",
  ];

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-4rem-3rem)] flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-100)]">
            <Sparkles className="h-5 w-5 text-[var(--secondary-600)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Health Assistant</h1>
            <p className="text-sm text-[var(--text-muted)]">Ask anything about your trial or health</p>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-semibold text-[var(--success)] dark:bg-[var(--success)]/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Online
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 dark:bg-slate-800/50">
          {messages.length === 1 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Suggested Questions
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--secondary-600)] hover:bg-[var(--secondary-50)] hover:text-[var(--secondary-600)] dark:hover:bg-slate-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-[var(--secondary-600)] text-white"
                      : "bg-[var(--secondary-100)] text-[var(--secondary-600)]"
                  }`}
                >
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-[var(--secondary-600)] text-white"
                      : "rounded-tl-sm bg-[var(--secondary-50)] text-[var(--text-primary)] dark:bg-slate-700 dark:text-[var(--text-primary)]"
                  }`}
                >
                  {msg.content}
                  <div className={`mt-1 text-xs opacity-60 ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-100)] text-[var(--secondary-600)]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-[var(--secondary-50)] px-4 py-3 dark:bg-slate-700">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-2 w-2 rounded-full bg-[var(--secondary-400)]"
                        style={{ animation: `bounce 1s ${i * 0.15}s ease-in-out infinite` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="mt-3 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your trial..."
            className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--secondary-600)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-800"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--secondary-600)] text-white transition-all hover:bg-[var(--secondary-700)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
