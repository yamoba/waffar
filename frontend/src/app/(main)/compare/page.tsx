"use client";

import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Check, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { api, formatPrice } from "@/lib/api";
import { useCommerce } from "@/stores/commerce";
import type { Product } from "@/types";

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareSkeleton />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const slugs = searchParams.getAll("p");
  const { compare } = useCommerce();

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["product", slug],
      queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
      enabled: !!slug,
    })),
  });

  const urlProducts = queries.map((q) => q.data).filter(Boolean) as Product[];
  const products = urlProducts.length > 0 ? urlProducts : compare;
  const isLoading = queries.some((q) => q.isLoading);

  if (products.length < 2 && !isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40">
            <Search size={24} />
          </div>
          <h1 className="mb-3 text-3xl font-black">Compare products</h1>
          <p className="mx-auto mb-6 max-w-md text-gray-500">Choose at least two products from search or trending cards to compare prices, stores, discounts, and specs side by side.</p>
          <Link href="/search" className="pressable inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/20">
            Find products <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading) return <CompareSkeleton />;

  const bestPrice = Math.min(...products.map((product) => product.lowestPrice || Number.MAX_SAFE_INTEGER));
  const allSpecKeys = [...new Set(products.flatMap((product) => Object.keys(product.specs || {})))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <Sparkles size={14} /> Best deal highlighted automatically
          </p>
          <h1 className="text-3xl font-black">Product comparison</h1>
          <p className="text-gray-500">{products.length} products selected</p>
        </div>
        <Link href="/search" className="pressable rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold transition hover:border-brand-300 hover:text-brand-700 dark:border-gray-800">
          Add more products
        </Link>
      </motion.div>

      <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white/80 shadow-xl shadow-gray-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr>
              <th className="w-44 p-4 text-start font-bold text-gray-500">Product</th>
              {products.map((product, index) => (
                <th key={product.id} className="p-4 text-center">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="mx-auto max-w-56">
                    <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-white text-4xl shadow-inner dark:from-brand-950/30 dark:to-gray-900">📦</div>
                    <Link href={`/product/${product.slug}`} className="line-clamp-2 font-bold transition hover:text-brand-600">{product.title}</Link>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Best price">
              {products.map((product) => (
                <td key={product.id} className={product.lowestPrice === bestPrice ? "bg-brand-50/70 p-4 text-center dark:bg-brand-950/20" : "p-4 text-center"}>
                  <span className="text-xl font-black text-brand-600">{formatPrice(product.lowestPrice || 0)}</span>
                  {product.lowestPrice === bestPrice && <p className="mt-1 text-xs font-bold text-brand-700">Best deal</p>}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Stores">
              {products.map((product) => <td key={product.id} className="p-4 text-center">{product.listingCount}</td>)}
            </CompareRow>
            <CompareRow label="Brand">
              {products.map((product) => <td key={product.id} className="p-4 text-center">{product.brand || "-"}</td>)}
            </CompareRow>
            <CompareRow label="Rating">
              {products.map((product) => {
                const listing = product.listings?.[0];
                return <td key={product.id} className="p-4 text-center">{listing?.rating ? `${listing.rating} ★` : "-"}</td>;
              })}
            </CompareRow>
            {allSpecKeys.map((key) => (
              <CompareRow key={key} label={key.replace(/([A-Z])/g, " $1")}>
                {products.map((product) => (
                  <td key={product.id} className="p-4 text-center">
                    {product.specs?.[key] !== undefined ? (
                      typeof product.specs[key] === "boolean" ? (product.specs[key] ? <Check size={16} className="mx-auto text-brand-500" /> : <X size={16} className="mx-auto text-gray-300" />) : String(product.specs[key])
                    ) : "-"}
                  </td>
                ))}
              </CompareRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-gray-100 transition hover:bg-gray-50/60 dark:border-gray-800/70 dark:hover:bg-gray-800/30">
      <td className="p-4 text-start font-bold text-gray-600 dark:text-gray-300">{label}</td>
      {children}
    </tr>
  );
}

function CompareSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 h-20 skeleton rounded-3xl" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-96 skeleton rounded-3xl" />)}
      </div>
    </div>
  );
}
