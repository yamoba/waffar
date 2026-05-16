"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { api, formatPrice } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import type { Watchlist } from "@/types";

export default function WatchlistsPage() {
  const [newListName, setNewListName] = useState("");
  const queryClient = useQueryClient();

  const { data: watchlists, isLoading } = useQuery<Watchlist[]>({
    queryKey: ["watchlists"],
    queryFn: () => api.get("/watchlists").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post("/watchlists", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      setNewListName("");
      toast.success("تم إنشاء القائمة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/watchlists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      toast.success("تم حذف القائمة");
    },
  });

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">قوائم المتابعة</h1>
          <form onSubmit={(e) => { e.preventDefault(); if (newListName.trim()) createMutation.mutate(newListName.trim()); }} className="flex gap-2">
            <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="اسم القائمة الجديدة..." className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 ring-brand-500 outline-none" />
            <button type="submit" className="px-4 py-2 gradient-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition flex items-center gap-1">
              <Plus size={16} /> إنشاء
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}</div>
        ) : watchlists?.length === 0 ? (
          <div className="py-20 text-center">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">لا توجد قوائم</h2>
            <p className="text-gray-500">أنشئ قائمة جديدة وابدأ بإضافة المنتجات</p>
          </div>
        ) : (
          <div className="space-y-6">
            {watchlists?.map((list, i) => (
              <motion.div key={list.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50">
                  <div>
                    <h3 className="font-bold">{list.name}</h3>
                    <p className="text-sm text-gray-500">{list._count.items} منتج</p>
                  </div>
                  <button onClick={() => deleteMutation.mutate(list.id)} className="p-2 text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
                {list.items.length > 0 && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {list.items.map((item) => (
                      <Link key={item.id} href={`/product/${item.product.slug}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 flex items-center justify-center">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.title}</p>
                        </div>
                        {item.product.lowestPrice && (
                          <span className="text-sm font-bold text-brand-600">{formatPrice(item.product.lowestPrice)}</span>
                        )}
                        <ExternalLink size={14} className="text-gray-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
