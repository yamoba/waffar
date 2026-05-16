"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Link from "next/link";
import { api, formatPrice } from "@/lib/api";
import { Header } from "@/components/layout/Header";

export default function HistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.get("/dashboard/history").then((r) => r.data),
  });

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">سجل المشاهدات</h1>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
        ) : data?.views?.length === 0 ? (
          <div className="py-20 text-center">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">لا يوجد سجل</h2>
            <p className="text-gray-500">ابدأ بتصفح المنتجات وسيظهر سجلك هنا</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.views?.map((view: any, i: number) => (
              <motion.div key={view.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link href={`/product/${view.product.slug}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0 flex items-center justify-center text-lg">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{view.product.title}</p>
                    <p className="text-xs text-gray-400">{view.product.category} • {new Date(view.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>
                  {view.product.lowestPrice && <span className="text-sm font-bold text-brand-600">{formatPrice(view.product.lowestPrice)}</span>}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
