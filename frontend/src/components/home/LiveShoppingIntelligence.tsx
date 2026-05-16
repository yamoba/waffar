"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, BadgePercent, Bot, Clock3, Flame, Gauge, MapPin, SearchCheck, ShieldCheck, Star, TrendingDown, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api, formatPrice } from "@/lib/api";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProductCardSkeleton } from "@/components/shared/Skeletons";
import { useCommerce } from "@/stores/commerce";
import type { Product, Store } from "@/types";

const cities = ["Cairo", "Giza", "Alexandria", "Mansoura", "Tanta", "New Cairo"];
const liveSearches = ["iPhone 15", "Samsung TV", "air fryer", "gaming laptop", "Noon coupon", "B.Tech installments"];
const brands = ["Apple", "Samsung", "Xiaomi", "Lenovo", "Sony", "Tornado", "Huawei", "LG"];

export function LiveDealMarquee() {
  const { data: drops } = useQuery<Product[]>({
    queryKey: ["biggest-drops"],
    queryFn: () => api.get("/products/biggest-drops").then((r) => r.data),
  });

  const items = drops?.slice(0, 8) || [];
  if (!items.length) return null;

  return (
    <section className="border-y border-brand-100 bg-brand-50/70 py-3 dark:border-brand-900/40 dark:bg-brand-950/20">
      <div className="scrollbar-hide flex gap-3 overflow-hidden">
        <motion.div className="flex min-w-max gap-3" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 28, ease: "linear" }}>
          {[...items, ...items].map((product, index) => (
            <Link key={`${product.id}-${index}`} href={`/product/${product.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-gray-700 shadow-sm backdrop-blur transition hover:text-brand-700 dark:bg-gray-900/80 dark:text-gray-200">
              <Activity size={14} className="text-brand-500" />
              Lowest now: {product.title.slice(0, 28)} - {formatPrice(product.lowestPrice || 0)}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function StartupShoppingFeatures() {
  const [budget, setBudget] = useState(25000);
  const [city, setCity] = useState("Cairo");
  const { recent } = useCommerce();

  const { data: trending, isLoading: trendingLoading } = useQuery<Product[]>({
    queryKey: ["trending"],
    queryFn: () => api.get("/products/trending").then((r) => r.data),
  });
  const { data: drops, isLoading: dropsLoading } = useQuery<Product[]>({
    queryKey: ["biggest-drops-live"],
    queryFn: () => api.get("/products/biggest-drops").then((r) => r.data),
  });
  const { data: stores } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn: () => api.get("/stores").then((r) => r.data),
  });

  const products = useMemo(() => [...(trending || []), ...(drops || [])].filter((product, index, arr) => arr.findIndex((item) => item.id === product.id) === index), [trending, drops]);
  const budgetPiasters = budget * 100;
  const budgetMatches = products.filter((product) => (product.lowestPrice || 0) <= budgetPiasters).slice(0, 4);
  const recommendations = (recent.length ? products.filter((product) => recent.some((item) => item.category === product.category) && !recent.some((item) => item.id === product.id)) : products).slice(0, 4);
  const flashSales = (drops || []).slice(0, 4);
  const nearYou = products.slice(0, 3);

  return (
    <div className="space-y-16">
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Tracked products", value: "128K+", icon: SearchCheck },
            { label: "Savings found", value: "EGP 9.4M", icon: TrendingDown },
            { label: "Live stores", value: stores?.length ? `${stores.length}+` : "24+", icon: ShieldCheck },
            { label: "Alerts sent", value: "41K", icon: Flame },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="premium-card p-5">
              <item.icon className="mb-3 text-brand-500" size={22} />
              <p className="text-2xl font-black">{item.value}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader icon={Flame} title="Flash sales and urgency" subtitle="Hot deal countdowns, stock indicators, and recently dropped prices" href="/deals" />
        <div className="grid gap-4 md:grid-cols-4">
          {dropsLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : flashSales.map((product, index) => (
                <FlashSaleCard key={product.id} product={product} index={index} />
              ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="premium-card p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><Gauge size={14} /> Smart Budget Shopping</p>
                <h2 className="mt-3 text-2xl font-black">Best value under {budget.toLocaleString()} EGP</h2>
              </div>
              <input value={budget} min={1000} max={100000} step={1000} onChange={(e) => setBudget(Number(e.target.value))} type="range" className="w-36 accent-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {budgetMatches.length
                ? budgetMatches.map((product) => <ValueScoreMini key={product.id} product={product} />)
                : <p className="col-span-full text-sm text-gray-500">No products under this budget yet. Raise the budget to see smarter picks.</p>}
            </div>
          </div>

          <div className="premium-card p-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><MapPin size={14} /> Deals Near You</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((item) => (
                <button key={item} onClick={() => { setCity(item); toast.success(`Showing deals near ${item}`); }} className={`pressable rounded-xl border px-3 py-2 text-sm font-bold transition ${city === item ? "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-950/40" : "border-gray-200 hover:border-brand-300 dark:border-gray-800"}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {nearYou.map((product, index) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/60 p-3 transition hover:border-brand-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-black text-brand-700 dark:bg-brand-950/40">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{product.title}</span>
                  <span className="text-sm font-black text-brand-600">{formatPrice(product.lowestPrice || 0)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <SectionHeader icon={Bot} title="AI Smart Recommendations" subtitle="Personalized from your browsing behavior and category interest" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {trendingLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : recommendations.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <CommunityTrends />
          <FeaturedBrands />
          <StoreTrust stores={stores || []} />
        </div>
      </section>
    </div>
  );
}

function FlashSaleCard({ product, index }: { product: Product; index: number }) {
  const stock = Math.max(3, 18 - index * 3);
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
      <Link href={`/product/${product.slug}`} className="premium-card group block p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-black text-white">-{product.dropPercentage || 12}%</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500"><Clock3 size={13} /> 02:{(24 - index * 3).toString().padStart(2, "0")}:18</span>
        </div>
        <div className="mb-4 flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-white text-5xl transition group-hover:scale-[1.02] dark:from-brand-950/30 dark:to-gray-900">📦</div>
        <h3 className="line-clamp-2 text-sm font-bold">{product.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-black text-brand-600">{formatPrice(product.lowestPrice || 0)}</span>
          <span className="rounded-full bg-accent-50 px-2 py-1 text-[11px] font-bold text-accent-600">Only {stock} left</span>
        </div>
      </Link>
    </motion.div>
  );
}

function ValueScoreMini({ product }: { product: Product }) {
  const valueScore = Math.min(98, Math.max(62, Math.round((product.viewCount || 20) / 15 + (product.dropPercentage || 8) * 2)));
  return (
    <Link href={`/product/${product.slug}`} className="rounded-2xl border border-gray-100 bg-white/70 p-3 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950/40">
      <div className="mb-2 flex h-20 items-center justify-center rounded-xl bg-brand-50 text-3xl dark:bg-brand-950/40">📦</div>
      <p className="line-clamp-2 min-h-10 text-xs font-bold">{product.title}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-black text-brand-600">{formatPrice(product.lowestPrice || 0)}</span>
        <span className="rounded-full bg-gray-950 px-2 py-1 text-[10px] font-black text-white dark:bg-white dark:text-gray-950">{valueScore}</span>
      </div>
      <p className="mt-1 text-[10px] text-gray-400">Value score</p>
    </Link>
  );
}

function CommunityTrends() {
  return (
    <div className="premium-card p-6">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><Users size={14} /> Community Trends</p>
      <div className="space-y-3">
        {liveSearches.map((term, index) => (
          <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-brand-50 dark:hover:bg-brand-950/30">
            <span className="text-sm font-black text-brand-600">#{index + 1}</span>
            <span className="flex-1 text-sm font-bold">{term}</span>
            <span className="text-xs text-gray-400">{(920 - index * 81).toLocaleString()} searches</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FeaturedBrands() {
  return (
    <div className="premium-card p-6">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><Star size={14} /> Featured Brands</p>
      <div className="grid grid-cols-2 gap-2">
        {brands.map((brand) => (
          <Link key={brand} href={`/search?brand=${encodeURIComponent(brand)}`} className="rounded-xl border border-gray-100 bg-white/60 px-3 py-3 text-center text-sm font-black transition hover:border-brand-300 hover:text-brand-700 dark:border-gray-800 dark:bg-gray-950/40">
            {brand}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StoreTrust({ stores }: { stores: Store[] }) {
  return (
    <div className="premium-card p-6">
      <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><ShieldCheck size={14} /> Store Trust Rating</p>
      <div className="space-y-3">
        {stores.slice(0, 5).map((store, index) => {
          const score = Math.min(99, Math.round((store.rating || 4.3) * 18 + index));
          return (
            <Link key={store.id} href={`/search?store=${store.slug}`} className="block rounded-xl p-2 transition hover:bg-brand-50 dark:hover:bg-brand-950/30">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold">{store.name}</span>
                <span className="text-xs font-black text-brand-600">{score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${score}%` }} viewport={{ once: true }} className="h-full rounded-full gradient-brand" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
