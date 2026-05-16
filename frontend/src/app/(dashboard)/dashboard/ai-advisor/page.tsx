"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/Header";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "أهلاً بك في مستشار وفر الذكي! أقدر أساعدك في مقارنة المنتجات، نصائح الشراء، ومعرفة أفضل وقت للشراء. إيه اللي تحب أساعدك فيه؟" },
  ]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: (message: string) => api.post("/ai/chat", { message, chatId }).then((r) => r.data),
    onSuccess: (data) => {
      setChatId(data.chatId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || mutation.isPending) return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    mutation.mutate(msg);
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">
        <h1 className="text-2xl font-bold mb-4 shrink-0">مستشار الشراء الذكي</h1>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-brand-100 dark:bg-brand-900/50" : "bg-gray-200 dark:bg-gray-700"}`}>
                {msg.role === "assistant" ? <Bot size={16} className="text-brand-600" /> : <User size={16} />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-brand-600 text-white rounded-br-md" : "bg-gray-100 dark:bg-gray-800 rounded-bl-md"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {mutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center"><Bot size={16} className="text-brand-600" /></div>
              <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-md">
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" /></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 shrink-0">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="اسأل عن أي منتج..." className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 ring-brand-500 outline-none" dir="auto" />
          <button type="submit" disabled={mutation.isPending || !input.trim()} className="px-4 py-3 gradient-brand text-white rounded-xl hover:opacity-90 transition disabled:opacity-50">
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
