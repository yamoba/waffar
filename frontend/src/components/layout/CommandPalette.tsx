"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, ArrowLeft, Clock, TrendingUp, Mic, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = ["iPhone 15", "Samsung TV", "air fryer", "gaming laptop", "Noon coupon"];
const TYPO_FIXES: Record<string, string> = {
  iphne: "iphone",
  samsng: "samsung",
  labtop: "laptop",
  headfone: "headphone",
  ayfon: "iphone",
};

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any>({ products: [], queries: [] });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t, direction, language } = useLanguage();
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      inputRef.current?.focus();
      timer = setTimeout(() => {
        const stored = localStorage.getItem("waffar_recent_searches");
        if (stored) setRecentSearches(JSON.parse(stored));
      }, 0);
    } else {
      timer = setTimeout(() => {
        setQuery("");
        setSuggestions({ products: [], queries: [] });
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.length < 2) {
        setSuggestions({ products: [], queries: [] });
        return;
      }
      try {
        const { data } = await api.get(`/search/suggest?q=${encodeURIComponent(query)}`);
        setSuggestions(data);
      } catch {
        // Suggestions are best-effort while the backend is warming up.
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSearch(q: string) {
    if (!q.trim()) return;
    const searches = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 10);
    localStorage.setItem("waffar_recent_searches", JSON.stringify(searches));
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onClose();
  }

  const correctedQuery = query
    ? query.split(/\s+/).map((part) => TYPO_FIXES[part.toLowerCase()] || part).join(" ")
    : "";

  function startVoiceSearch() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice search is not supported in this browser");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "ar" ? "ar-EG" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="max-w-2xl mx-auto mt-[15vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
            <Search size={20} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder={t("commandPlaceholder")}
              className="flex-1 bg-transparent outline-none text-lg placeholder:text-gray-400"
              dir="auto"
            />
            <div className="flex items-center gap-1">
              <button onClick={startVoiceSearch} className={`p-2 rounded-lg transition ${isListening ? "bg-cyan-100 text-cyan-600 animate-pulse" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"}`} aria-label="Voice search">
                <Mic size={18} />
              </button>
              <button onClick={() => toast("Image search is coming soon")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-400" aria-label="Image search">
                <Camera size={18} />
              </button>
            </div>
            <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">ESC</kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!query && recentSearches.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-gray-400 mb-2 px-2">{t("recentSearches")}</p>
                {recentSearches.slice(0, 5).map((s) => (
                  <button key={s} onClick={() => handleSearch(s)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-start">
                    <Clock size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1">{s}</span>
                    <Arrow size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="p-2">
                <p className="text-xs font-medium text-gray-400 mb-2 px-2">Trending in Egypt</p>
                <div className="flex flex-wrap gap-2 px-2">
                  {TRENDING_SEARCHES.map((term) => (
                    <button key={term} onClick={() => handleSearch(term)} className="pressable rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300">
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query && correctedQuery !== query && (
              <button onClick={() => handleSearch(correctedQuery)} className="mx-4 my-2 flex w-[calc(100%-2rem)] items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-start text-sm font-bold text-brand-700 transition hover:border-brand-300 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-300">
                Did you mean <span className="underline">{correctedQuery}</span>?
              </button>
            )}

            {suggestions.queries?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-gray-400 mb-2 px-2">{t("suggestions")}</p>
                {suggestions.queries.map((s: any) => (
                  <button key={s.text} onClick={() => handleSearch(s.text)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-start">
                    <TrendingUp size={16} className="text-brand-500 shrink-0" />
                    <span className="flex-1">{s.text}</span>
                    <span className="text-xs text-gray-400">{s.count}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.products?.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-gray-400 mb-2 px-2">{t("products")}</p>
                {suggestions.products.map((p: any) => (
                  <button key={p.slug} onClick={() => { router.push(`/product/${p.slug}`); onClose(); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-start">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    {p.lowestPrice && (
                      <span className="text-sm font-bold text-brand-600">{(p.lowestPrice / 100).toLocaleString()} EGP</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {query && !suggestions.products?.length && !suggestions.queries?.length && (
              <div className="p-8 text-center text-gray-400">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>{t("pressEnter")} &quot;{query}&quot;</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> {t("commandFooterSearch")}</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd> {t("commandFooterMove")}</span>
            </div>
            <span>{t("smartSearch")}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
