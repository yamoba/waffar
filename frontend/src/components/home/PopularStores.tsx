"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Store, Star } from "lucide-react";
import { api } from "@/lib/api";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useLanguage } from "@/lib/i18n";

export function PopularStores() {
  const { t } = useLanguage();
  const { data: stores } = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.get("/stores").then((r) => r.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4">
      <SectionHeader icon={Store} title={t("storesTitle")} subtitle={t("storesSubtitle")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stores?.map((store: any, i: number) => (
          <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
            <Link href={`/search?store=${store.slug}`} className="group block p-4 text-center rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:scale-105 transition-transform" />
              <p className="text-sm font-semibold">{store.name}</p>
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-400">
                <Star size={12} className="text-accent-500 fill-accent-500" />
                {store.rating}
              </div>
              <p className="text-xs text-gray-400 mt-1">{store._count?.listings?.toLocaleString()} {t("productCount")}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
