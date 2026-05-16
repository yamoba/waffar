"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Merge, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { api, formatPrice } from "@/lib/api";
import { Header } from "@/components/layout/Header";

export default function ProductsAdminPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [mergeKeep, setMergeKeep] = useState("");
  const [mergeDup, setMergeDup] = useState("");
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-products", search, page],
    queryFn: () => api.get(`/admin/products?page=${page}&q=${search}`).then((r) => r.data),
  });

  const mergeMutation = useMutation({
    mutationFn: () => api.post("/admin/products/merge", { keepId: mergeKeep, mergeId: mergeDup }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("تم الدمج بنجاح");
      setMergeKeep("");
      setMergeDup("");
    },
    onError: () => toast.error("فشل الدمج"),
  });

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">إدارة المنتجات</h1>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث عن منتج..." className="w-full pr-10 pl-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 ring-brand-500 outline-none" />
          </div>
        </div>

        {/* Merge Tool */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Merge size={16} /> دمج المنتجات المكررة</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500">المنتج الأصلي (Keep)</label>
              <input value={mergeKeep} onChange={(e) => setMergeKeep(e.target.value)} placeholder="Product ID" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" dir="ltr" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">المنتج المكرر (Merge)</label>
              <input value={mergeDup} onChange={(e) => setMergeDup(e.target.value)} placeholder="Product ID" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" dir="ltr" />
            </div>
            <button onClick={() => mergeMutation.mutate()} disabled={!mergeKeep || !mergeDup} className="px-4 py-2 gradient-brand text-white rounded-lg text-sm font-medium disabled:opacity-50">دمج</button>
          </div>
        </div>

        {/* Product List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-right p-3 font-medium text-gray-500">المنتج</th>
                <th className="text-right p-3 font-medium text-gray-500">الماركة</th>
                <th className="text-right p-3 font-medium text-gray-500">القسم</th>
                <th className="text-right p-3 font-medium text-gray-500">المتاجر</th>
                <th className="text-right p-3 font-medium text-gray-500">أقل سعر</th>
                <th className="p-3 font-medium text-gray-500">ID</th>
              </tr>
            </thead>
            <tbody>
              {data?.products?.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                  <td className="p-3 font-medium max-w-xs truncate">{p.title}</td>
                  <td className="p-3 text-gray-500">{p.brand || "—"}</td>
                  <td className="p-3 text-gray-500">{p.category}</td>
                  <td className="p-3">{p._count?.listings || 0}</td>
                  <td className="p-3 font-bold text-brand-600">{p.lowestPrice ? formatPrice(p.lowestPrice) : "—"}</td>
                  <td className="p-3 text-xs text-gray-400 font-mono" dir="ltr">{p.id.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.min(data.pagination.pages, 10) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-medium transition ${page === i + 1 ? "gradient-brand text-white" : "border border-gray-200 dark:border-gray-700 hover:bg-gray-50"}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
