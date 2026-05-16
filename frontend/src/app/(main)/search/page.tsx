"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductCardSkeleton } from "@/components/shared/Skeletons";
import { cn } from "@/lib/cn";
import type { Product } from "@/types";

const SORT_OPTIONS = [
  { value: "relevant", label: "Most relevant" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const [sort, setSort] = useState("relevant");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, category, sort, page, selectedBrand],
    queryFn: () => api.get("/search", {
      params: {
        q: q || undefined,
        category: category || undefined,
        brand: selectedBrand || undefined,
        sort: ["discount", "rating"].includes(sort) ? "popular" : sort,
        page,
        limit: 20,
      },
    }).then((r) => r.data),
  });

  const products = useMemo(() => {
    const items = [...(data?.products || [])] as Product[];
    if (sort === "discount") {
      return items.sort((a, b) => (b.dropPercentage || 0) - (a.dropPercentage || 0));
    }
    if (sort === "rating") {
      return items.sort((a, b) => (b.listings?.[0]?.rating || 0) - (a.listings?.[0]?.rating || 0));
    }
    return items;
  }, [data?.products, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 rounded-3xl border border-brand-100 bg-white/80 p-5 shadow-xl shadow-brand-500/5 backdrop-blur dark:border-brand-900/40 dark:bg-gray-900/70 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black">
            {q ? `Search results for "${q}"` : category ? `Browse ${category}` : "Browse products"}
          </h1>
          {data?.pagination && (
            <p className="mt-1 text-sm text-gray-500">{data.pagination.total.toLocaleString()} products found</p>
          )}
          {data?.meta?.transliterated && (
            <p className="mt-1 text-xs text-gray-400">Also searched for: {data.meta.transliterated}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="pressable focus-glow flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 lg:hidden">
            {filtersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />} Filters
          </button>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="focus-glow appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pe-9 text-sm outline-none transition hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
            >
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </motion.div>

      <div className="flex gap-8">
        <AnimatePresence>
          {(filtersOpen || true) && (
            <motion.aside
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("w-64 shrink-0", filtersOpen ? "block" : "hidden lg:block")}
            >
              <div className="sticky top-20 space-y-6 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-lg shadow-gray-900/5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
                {data?.filters?.categories?.length > 0 && (
                  <FilterSection title="Categories">
                    {data.filters.categories.map((item: any) => (
                      <label key={item.name} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-brand-50 dark:hover:bg-brand-950/30">
                        <input type="checkbox" checked={category === item.name} readOnly className="rounded text-brand-600" />
                        <span className="flex-1 text-sm">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.count}</span>
                      </label>
                    ))}
                  </FilterSection>
                )}
                {data?.filters?.brands?.length > 0 && (
                  <FilterSection title="Brands">
                    <button onClick={() => setSelectedBrand("")} className={cn("w-full rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-brand-50 dark:hover:bg-brand-950/30", !selectedBrand && "bg-brand-50 text-brand-700 dark:bg-brand-950/40")}>All brands</button>
                    {data.filters.brands.slice(0, 10).map((item: any) => (
                      <button key={item.name} onClick={() => setSelectedBrand(item.name)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition hover:bg-brand-50 dark:hover:bg-brand-950/30", selectedBrand === item.name && "bg-brand-50 text-brand-700 dark:bg-brand-950/40")}>
                        <span className="flex-1 text-sm">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.count}</span>
                      </button>
                    ))}
                  </FilterSection>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((product, i) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.025 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </div>

          {products.length === 0 && !isLoading && (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="mb-2 text-xl font-bold">No results found</h2>
              <p className="text-gray-500">Try another search term or browse categories.</p>
            </div>
          )}

          {data?.pagination && data.pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: Math.min(data.pagination.pages, 10) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "pressable focus-glow h-10 w-10 rounded-xl text-sm font-medium transition",
                    page === i + 1 ? "gradient-brand text-white shadow-lg shadow-brand-500/20" : "border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 h-24 skeleton rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
