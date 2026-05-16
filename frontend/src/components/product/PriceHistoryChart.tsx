"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

const PERIODS = [
  { key: "7d", label: "أسبوع" },
  { key: "30d", label: "شهر" },
  { key: "90d", label: "3 أشهر" },
  { key: "1y", label: "سنة" },
];

export function PriceHistoryChart({ productSlug }: { productSlug: string }) {
  const [period, setPeriod] = useState("30d");

  const { data: history } = useQuery({
    queryKey: ["price-history", productSlug, period],
    queryFn: () => api.get(`/products/${productSlug}/price-history?period=${period}`).then((r) => r.data),
    enabled: !!productSlug,
  });

  const chartData = history?.map((point: any) => ({
    date: new Date(point.timestamp).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
    price: (point.salePrice || point.price) / 100,
    store: point.listing?.store?.name,
  })) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="w-1 h-5 bg-brand-500 rounded-full" />
          <TrendingUp size={18} />
          تاريخ السعر
        </h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                period === p.key ? "bg-white dark:bg-gray-700 shadow text-brand-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-64 p-4 rounded-2xl border border-gray-200 dark:border-gray-800"
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
                tickFormatter={(v) => `${v.toLocaleString()}`}
                domain={["dataMin - 100", "dataMax + 100"]}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                formatter={(value: number) => [`${value.toLocaleString()} ج.م`, "السعر"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: "#16a34a", strokeWidth: 2, fill: "white" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">لا توجد بيانات كافية</div>
        )}
      </motion.div>
    </div>
  );
}
