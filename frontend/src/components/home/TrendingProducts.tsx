"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCardSkeleton } from "@/components/shared/Skeletons";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/types";

export function TrendingProducts() {
  const { t } = useLanguage();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["trending"],
    queryFn: () => api.get("/products/trending").then((r) => r.data),
  });

  useEffect(() => {
    if (paused || !products?.length) return;
    const timer = window.setInterval(() => {
      const node = scrollerRef.current;
      if (!node) return;
      const next = node.scrollLeft + 230;
      node.scrollTo({ left: next >= node.scrollWidth - node.clientWidth ? 0 : next, behavior: "smooth" });
    }, 3200);
    return () => window.clearInterval(timer);
  }, [paused, products?.length]);

  return (
    <section className="max-w-7xl mx-auto px-4">
      <SectionHeader
        icon={TrendingUp}
        title={t("trendingTitle")}
        subtitle={t("trendingSubtitle")}
        href="/search?sort=popular"
      />
      <div ref={scrollerRef} className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products?.map((product, i) => (
              <motion.div
                key={product.id}
                className="min-w-[180px] snap-start sm:min-w-[210px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
      </div>
    </section>
  );
}
