"use client";

import { motion } from "framer-motion";
import { CategoryExplorer } from "@/components/home/CategoryExplorer";

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-brand-100 bg-white/80 p-8 shadow-xl shadow-brand-500/5 backdrop-blur dark:border-brand-900/40 dark:bg-gray-900/70">
        <h1 className="text-3xl font-black mb-2">Browse categories</h1>
        <p className="text-gray-500">Explore Waffar.eg by category with fast, animated navigation.</p>
      </motion.div>
      <CategoryExplorer />
    </div>
  );
}
