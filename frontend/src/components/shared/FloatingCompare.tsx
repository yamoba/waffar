"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, X } from "lucide-react";
import { useCommerce } from "@/stores/commerce";

export function FloatingCompare() {
  const { compare, clearCompare } = useCommerce();
  const href = `/compare?${compare.map((product) => `p=${encodeURIComponent(product.slug)}`).join("&")}`;

  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="glass flex items-center gap-3 rounded-2xl border border-brand-200/70 px-3 py-2 shadow-2xl shadow-brand-500/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-white">
              <GitCompareArrows size={18} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold">Quick compare</p>
              <p className="text-xs text-gray-500">{compare.length} selected</p>
            </div>
            <Link
              href={href}
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 dark:bg-white dark:text-gray-950"
            >
              Open
            </Link>
            <button onClick={clearCompare} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95 dark:hover:bg-gray-800" aria-label="Clear compare">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
