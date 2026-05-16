"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, TrendingDown, TrendingUp, Clock, ShoppingCart, AlertTriangle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const RECOMMENDATION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  BUY_NOW: { icon: ShoppingCart, color: "text-brand-600 bg-brand-50", label: "اشتري دلوقتي!" },
  WAIT: { icon: Clock, color: "text-amber-600 bg-amber-50", label: "استنى شوية" },
  GREAT_DEAL: { icon: Sparkles, color: "text-purple-600 bg-purple-50", label: "صفقة ممتازة!" },
  AVOID: { icon: AlertTriangle, color: "text-red-600 bg-red-50", label: "مش الوقت المناسب" },
};

export function AiAdvice({ productSlug }: { productSlug: string }) {
  const { data: advice, isLoading } = useQuery({
    queryKey: ["ai-advice", productSlug],
    queryFn: () => api.get(`/ai/advice/${productSlug}`).then((r) => r.data),
    enabled: !!productSlug,
  });

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="h-5 skeleton w-40" />
        </div>
        <div className="space-y-2">
          <div className="h-4 skeleton w-full" />
          <div className="h-4 skeleton w-3/4" />
        </div>
      </div>
    );
  }

  if (!advice) return null;

  const config = RECOMMENDATION_CONFIG[advice.recommendation] || RECOMMENDATION_CONFIG.BUY_NOW;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-bl from-gray-50 dark:from-gray-900 to-transparent"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-xl">
          <Bot size={20} className="text-brand-600" />
        </div>
        <h2 className="text-lg font-bold">نصيحة الذكاء الاصطناعي</h2>
      </div>

      <div className={`inline-flex items-center gap-2 px-4 py-2 ${config.color} rounded-xl text-sm font-bold mb-3`}>
        <Icon size={16} />
        {config.label}
      </div>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{advice.reasoning}</p>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          <p className="text-xs text-gray-400">توقع السعر</p>
          <div className="flex items-center gap-1 mt-1">
            {advice.priceOutlook === "down" ? (
              <TrendingDown size={16} className="text-brand-500" />
            ) : (
              <TrendingUp size={16} className="text-red-500" />
            )}
            <span className="text-sm font-medium">
              {advice.priceOutlook === "down" ? "هينزل" : advice.priceOutlook === "up" ? "هيزيد" : "مستقر"}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          <p className="text-xs text-gray-400">مستوى الثقة</p>
          <div className="mt-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(advice.confidence || 0.5) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500 mt-0.5">{Math.round((advice.confidence || 0.5) * 100)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
