"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Eye } from "lucide-react";
import { api } from "@/lib/api";

export default function GuidesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: () => api.get("/guides").then((r) => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-brand-100 bg-white/80 p-8 shadow-xl shadow-brand-500/5 backdrop-blur dark:border-brand-900/40 dark:bg-gray-900/70">
        <h1 className="text-3xl font-black mb-2">Buying guides</h1>
        <p className="text-gray-500">Editorial advice and product explainers to help you buy smarter on Waffar.eg.</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 skeleton rounded-3xl" />)
          : data?.guides?.map((guide: any, i: number) => (
              <motion.div key={guide.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link href={`/guides/${guide.slug}`} className="group premium-card block overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-brand-50 to-white dark:from-brand-950/30 dark:to-gray-900 flex items-center justify-center">
                    <BookOpen size={40} className="text-brand-300 transition group-hover:scale-110 group-hover:text-brand-500" />
                  </div>
                  <div className="p-5">
                    <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">{guide.category}</span>
                    <h3 className="mt-2 text-lg font-bold transition group-hover:text-brand-600">{guide.title}</h3>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      <Eye size={12} /> {guide.viewCount} views
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
