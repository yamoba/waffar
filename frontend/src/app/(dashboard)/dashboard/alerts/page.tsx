"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { api, formatPrice } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import type { Alert } from "@/types";

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_DROP: "تنبيه انخفاض السعر",
  PRICE_TARGET: "تنبيه سعر محدد",
  BACK_IN_STOCK: "تنبيه توفر المنتج",
  NEW_COUPON: "تنبيه كوبون جديد",
};

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => api.get("/alerts").then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/alerts/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alerts"] }); toast.success("تم حذف التنبيه"); },
  });

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">التنبيهات</h1>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
        ) : alerts?.length === 0 ? (
          <div className="py-20 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">لا توجد تنبيهات</h2>
            <p className="text-gray-500">ابحث عن منتج وفعّل تنبيه السعر</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts?.map((alert, i) => (
              <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition ${alert.isActive ? "border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/10" : "border-gray-200 dark:border-gray-800 opacity-60"}`}
              >
                <Link href={`/product/${alert.product.slug}`} className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 flex items-center justify-center">📦</Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${alert.product.slug}`} className="font-medium text-sm truncate block hover:text-brand-600 transition">{alert.product.title}</Link>
                  <p className="text-xs text-gray-500 mt-0.5">{ALERT_TYPE_LABELS[alert.type]}{alert.threshold ? ` — ${formatPrice(alert.threshold)}` : ""}</p>
                </div>
                {alert.product.lowestPrice && <span className="text-sm font-bold text-brand-600 shrink-0">{formatPrice(alert.product.lowestPrice)}</span>}
                <button onClick={() => toggleMutation.mutate({ id: alert.id, isActive: !alert.isActive })} className="text-gray-400 hover:text-brand-600 transition">
                  {alert.isActive ? <ToggleRight size={24} className="text-brand-600" /> : <ToggleLeft size={24} />}
                </button>
                <button onClick={() => deleteMutation.mutate(alert.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
