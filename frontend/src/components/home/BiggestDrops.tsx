"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { api, formatPrice } from "@/lib/api";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/types";

export function BiggestDrops() {
  const { t, direction } = useLanguage();
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["biggest-drops"],
    queryFn: () => api.get("/products/biggest-drops").then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-7xl mx-auto px-4"><div className="h-64 skeleton rounded-2xl" /></div>;
  if (!products?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4">
      <SectionHeader
        icon={ArrowDownRight}
        title={t("dropsTitle")}
        subtitle={t("dropsSubtitle")}
        href="/deals"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/product/${product.slug}`} className="group block p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 group-hover:scale-105 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-brand-600">{formatPrice(product.lowestPrice || 0)}</span>
                    {product.previousPrice && (
                      <span className="text-sm text-gray-400 line-through">{formatPrice(product.previousPrice)}</span>
                    )}
                  </div>
                  {product.dropPercentage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-bold mt-1">
                      <ArrowDownRight size={12} />
                      {product.dropPercentage}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
