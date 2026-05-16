"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCardSkeleton } from "@/components/shared/Skeletons";
import { DealOfDay } from "@/components/home/DealOfDay";

export default function DealsPage() {
  const { data: drops, isLoading } = useQuery({
    queryKey: ["biggest-drops"],
    queryFn: () => api.get("/products/biggest-drops").then((r) => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-8 shadow-xl shadow-brand-500/5 dark:border-brand-900/40 dark:from-brand-950/30 dark:via-gray-950 dark:to-gray-900">
        <p className="mb-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-brand-700 shadow-sm dark:bg-gray-900/80 dark:text-brand-300">Top Deals Today</p>
        <h1 className="text-3xl font-black mb-2">Deals and price drops</h1>
        <p className="text-gray-500">Verified price drops, highlighted best deals, and fresh discounts across Waffar.eg.</p>
      </motion.div>

      <DealOfDay />

      <div>
        <SectionHeader icon={Zap} title="Top deals today" subtitle="Animated deal cards ranked by recent drops and popularity" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : drops?.map((product: any, i: number) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  );
}
