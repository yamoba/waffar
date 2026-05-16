"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Grid3X3 } from "lucide-react";
import { api } from "@/lib/api";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useLanguage } from "@/lib/i18n";

const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: "📱",
  Laptops: "💻",
  TVs: "📺",
  Audio: "🎧",
  Gaming: "🎮",
  "Home Appliances": "🏠",
  Tablets: "📲",
  Cameras: "📷",
  Wearables: "⌚",
  Accessories: "🔌",
};

export function CategoryExplorer() {
  const { t } = useLanguage();
  const { data: categories } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["categories"],
    queryFn: () => api.get("/products/categories").then((r) => r.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4">
      <SectionHeader icon={Grid3X3} title={t("browseCategoriesTitle")} subtitle={t("browseCategoriesSubtitle")} href="/categories" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {categories?.map((cat, i) => (
          <motion.div key={cat.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
            <Link href={`/search?category=${encodeURIComponent(cat.name)}`} className="group premium-card block p-4 text-center">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{CATEGORY_ICONS[cat.name] || "📦"}</span>
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-1">{cat.count.toLocaleString()} {t("productCount")}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
