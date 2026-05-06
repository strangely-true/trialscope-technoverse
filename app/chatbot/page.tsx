"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "What are the side effects?",
  "Can I withdraw anytime?",
  "How long is the trial?",
  "What happens after the trial?",
];

const INITIAL_MESSAGE: Message = {
  id: "1",
  role: "assistant",
  content:
    "Hi! I'm your TrialGo Assistant. I can help you understand your trial enrollment, answer questions about procedures, side effects, and more. What would you like to know?",
  timestamp: new Date(),
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getBotResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      setShowQuickReplies(true);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 dark:bg-slate-900">
        <Link
          href="/dashboard"
          className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-slate-50 hover:text-[var(--text-primary)] dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary-100)]">
          <Bot className="h-5 w-5 text-[var(--secondary-600)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            TrialGo Assistant
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-600">Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-100)]">
                  <Bot className="h-3.5 w-3.5 text-[var(--secondary-600)]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  msg.role === "user"
                    ? "rounded-br-sm bg-[var(--secondary-600)] text-white"
                    : "rounded-bl-sm bg-[var(--secondary-100)] text-[var(--text-primary)] dark:bg-slate-800"
                )}
                style={{
                  animation: "pageTransitionIn 200ms ease-out forwards",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--secondary-100)]">
                <Bot className="h-3.5 w-3.5 text-[var(--secondary-600)]" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-[var(--secondary-100)] px-4 py-3 dark:bg-slate-800">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-[var(--text-muted)]"
                      style={{
                        animation: `bounce 1.2s ease-in-out ${i * 150}ms infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick replies + Input */}
      <div className="border-t border-[var(--border-default)] bg-[var(--surface-primary)] px-4 pb-4 pt-3 dark:bg-slate-900">
        {/* Quick replies */}
        {showQuickReplies && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:border-[var(--secondary-300)] hover:text-[var(--secondary-600)] dark:bg-slate-800"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your trial..."
            className="h-12 flex-1 rounded-full border border-[var(--border-default)] bg-[var(--background)] px-5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--secondary-300)] focus:outline-none focus:ring-2 focus:ring-[var(--secondary-100)] dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all",
              input.trim()
                ? "bg-[var(--secondary-600)] text-white hover:bg-[var(--secondary-700)]"
                : "bg-slate-100 text-[var(--text-disabled)] dark:bg-slate-800"
            )}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function getBotResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("side effect") || q.includes("risk"))
    return "Based on the trial protocol, common side effects may include mild fatigue, nausea, and headaches. Serious adverse events are rare but monitored closely. Your coordinator will track any symptoms through your weekly logs.";
  if (q.includes("withdraw") || q.includes("leave") || q.includes("quit"))
    return "Yes, you can withdraw from the trial at any time without penalty. Your decision will not affect your standard medical care. Simply inform your coordinator or use the consent management page.";
  if (q.includes("how long") || q.includes("duration"))
    return "This trial is expected to last 12 months, with weekly check-ins and monthly in-person visits. The active treatment phase is 6 months, followed by a 6-month monitoring period.";
  if (q.includes("after"))
    return "After the trial concludes, you'll receive a summary of findings relevant to your participation. If the treatment proves effective, your physician can discuss continuation options with you.";
  return "That's a great question! Let me look into that for you. Based on your trial enrollment, I'd recommend discussing this with your coordinator for the most accurate information. Is there anything else I can help with?";
}
