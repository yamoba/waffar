"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";

export function ProductSpecs({ specs }: { specs: Record<string, any> }) {
  const entries = Object.entries(specs);
  if (!entries.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span className="w-1 h-5 bg-brand-500 rounded-full" />
        <Info size={18} />
        المواصفات
      </h2>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {entries.map(([key, value], i) => (
          <div key={key} className={`flex items-center px-5 py-3 text-sm ${i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""}`}>
            <span className="w-1/3 text-gray-500 font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
            <span className="w-2/3 font-medium">{typeof value === "boolean" ? (value ? "✓" : "✗") : String(value)}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
