"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Bot, Eye, GitCompareArrows, Heart, Moon, PackageCheck, Settings, TrendingDown, UserRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { api, formatPrice } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { ProductCard } from "@/components/shared/ProductCard";
import { useAuth } from "@/stores/auth";
import { useCommerce } from "@/stores/commerce";

export default function DashboardPage() {
  const { user } = useAuth();
  const { wishlist, compare, recent } = useCommerce();
  const { theme, setTheme } = useTheme();

  const { data: overview } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => api.get("/dashboard/overview").then((r) => r.data),
  });

  const simulatedTracking = [
    { label: "Noon flash deal", status: "Watching price", eta: "refreshes in 4 min" },
    { label: "Amazon.eg coupon stack", status: "Coupon checked", eta: "valid today" },
    { label: "B.Tech installment offer", status: "Bank promo tracked", eta: "ends Friday" },
  ];

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-8 shadow-xl shadow-brand-500/5 dark:border-brand-900/40 dark:from-brand-950/30 dark:via-gray-950 dark:to-gray-900">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-brand-700 shadow-sm dark:bg-gray-900/80 dark:text-brand-300"><UserRound size={14} /> Smart shopper dashboard</p>
          <h1 className="text-3xl font-black">Welcome back{user?.name ? `, ${user.name}` : ""}</h1>
          <p className="mt-1 text-gray-500">Your saved products, comparisons, alerts, and Waffar.eg recommendations in one place.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Bell, label: "Active alerts", value: overview?.stats?.alertCount || 0 },
            { icon: Heart, label: "Saved products", value: wishlist.length || overview?.stats?.watchlistItemCount || 0 },
            { icon: Eye, label: "Recently viewed", value: recent.length || overview?.stats?.recentViewCount || 0 },
            { icon: GitCompareArrows, label: "Saved comparisons", value: compare.length },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="premium-card p-5">
              <stat.icon size={22} className="mb-3 text-brand-500" />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="premium-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Personalized recommendations</h2>
                <p className="text-sm text-gray-500">Based on your recent browsing and saved items.</p>
              </div>
              <Bot className="text-brand-500" />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {(recent.length ? recent : wishlist).slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}
              {!recent.length && !wishlist.length && (
                <div className="col-span-full rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-6 text-center dark:border-brand-900 dark:bg-brand-950/20">
                  <p className="font-bold">Start browsing products to unlock recommendations.</p>
                  <Link href="/search" className="mt-3 inline-flex rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-white">Explore products</Link>
                </div>
              )}
            </div>
          </section>

          <section className="premium-card p-6">
            <h2 className="mb-4 text-xl font-black">Deal tracking simulation</h2>
            <div className="space-y-3">
              {simulatedTracking.map((item, index) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
                  <div className="flex items-center gap-3">
                    <PackageCheck size={18} className="text-brand-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.status} - {item.eta}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="premium-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Settings size={20} className="text-brand-500" /> Profile settings</h2>
            <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); toast.success("Theme preference updated"); }} className="pressable flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white/70 p-4 text-sm font-bold transition hover:border-brand-300 dark:border-gray-800 dark:bg-gray-950/40">
              <span className="flex items-center gap-2"><Moon size={16} /> Dark mode preference</span>
              <span className="text-brand-600">{theme === "dark" ? "On" : "Off"}</span>
            </button>
          </section>

          <section className="premium-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><TrendingDown size={20} className="text-brand-500" /> Saved comparisons</h2>
            {compare.length ? (
              <Link href={`/compare?${compare.map((product) => `p=${product.slug}`).join("&")}`} className="block rounded-2xl border border-brand-100 bg-brand-50/60 p-4 font-bold text-brand-700 transition hover:border-brand-300 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-300">
                Compare {compare.length} selected products
              </Link>
            ) : <p className="text-sm text-gray-500">Add products to compare from any product card.</p>}
          </section>

          <section className="premium-card p-6">
            <h2 className="mb-4 text-xl font-black">Latest backend notifications</h2>
            {overview?.notifications?.length ? overview.notifications.slice(0, 3).map((notif: any) => (
              <div key={notif.id} className="mb-2 rounded-xl bg-brand-50/50 p-3 text-sm dark:bg-brand-950/20">
                <p className="font-bold">{notif.title}</p>
                <p className="truncate text-xs text-gray-500">{notif.body}</p>
              </div>
            )) : <p className="text-sm text-gray-500">No new notifications yet.</p>}
          </section>
        </div>

        {overview?.recentViews?.length > 0 && (
          <section className="premium-card p-6">
            <h2 className="mb-4 text-xl font-black">Recently viewed from your account</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {overview.recentViews.slice(0, 5).map((view: any) => (
                <Link key={view.id} href={`/product/${view.product.slug}`} className="rounded-2xl border border-gray-100 p-3 transition hover:border-brand-300 hover:shadow-lg dark:border-gray-800">
                  <div className="mb-2 flex aspect-square items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-950/40">📦</div>
                  <p className="line-clamp-2 text-sm font-bold">{view.product.title}</p>
                  {view.product.lowestPrice && <p className="mt-1 text-sm font-black text-brand-600">{formatPrice(view.product.lowestPrice)}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
