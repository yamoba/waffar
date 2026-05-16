"use client";

import { motion } from "framer-motion";
import { Search, TrendingUp, Zap, Shield, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export function HeroSection() {
  const { t, direction } = useLanguage();
  const [focused, setFocused] = useState(false);
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  const quickCategories = [
    { label: t("catSmartphones"), href: "/search?category=Smartphones", emoji: "📱" },
    { label: t("catLaptops"), href: "/search?category=Laptops", emoji: "💻" },
    { label: t("catTvs"), href: "/search?category=TVs", emoji: "📺" },
    { label: t("catAudio"), href: "/search?category=Audio", emoji: "🎧" },
    { label: t("catGaming"), href: "/search?category=Gaming", emoji: "🎮" },
    { label: t("catHome"), href: "/search?category=Home+Appliances", emoji: "🏠" },
  ];

  const features = [
    { icon: TrendingUp, label: t("trackPrices"), desc: t("trackPricesDesc") },
    { icon: Shield, label: t("fakeDeals"), desc: t("fakeDealsDesc") },
    { icon: Zap, label: t("instantAlerts"), desc: t("instantAlertsDesc") },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-brand-950/30 dark:via-gray-950 dark:to-accent-950/20" />
      <div className="absolute -inset-20 animate-hero-pan opacity-70 blur-3xl" style={{ background: "radial-gradient(circle at 20% 20%, rgba(6,182,212,.26), transparent 28rem), radial-gradient(circle at 78% 26%, rgba(245,158,11,.16), transparent 24rem)" }} />
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <motion.div className="absolute left-[8%] top-24 hidden h-16 w-16 rounded-3xl border border-brand-200/80 bg-white/60 shadow-xl shadow-brand-500/10 backdrop-blur md:block" animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute right-[12%] top-36 hidden h-12 w-12 rounded-full border border-accent-200/80 bg-white/50 shadow-xl shadow-accent-500/10 backdrop-blur md:block" animate={{ y: [0, 10, 0], x: [0, 8, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 dark:bg-brand-900/50 rounded-full text-sm font-medium text-brand-700 dark:text-brand-300 mb-6"
          >
            <Zap size={14} className="animate-bounce-subtle" />
            {t("heroBadge")}
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6 text-balance leading-tight tracking-tight">
            {t("heroTitleStart")}{" "}
            <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
              {t("heroTitleHighlight")}
            </span>
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            {t("heroBody")}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <Link
              href="/search"
              onMouseEnter={() => setFocused(true)}
              onMouseLeave={() => setFocused(false)}
              className="group ripple flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-6 py-4 shadow-2xl shadow-brand-500/10 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-brand-500/20 dark:border-gray-700 dark:bg-gray-900/90"
            >
              <Search size={22} className="text-gray-400 group-hover:text-brand-500 transition" />
              <span className="flex-1 text-start text-gray-400 text-lg">{t("searchPlaceholder")}</span>
              <div className="flex items-center gap-1 text-brand-600 font-medium text-sm">
                {t("searchAction")} <Arrow size={16} />
              </div>
            </Link>
            <motion.div
              initial={false}
              animate={{ opacity: focused ? 1 : 0, y: focused ? 8 : -2, scale: focused ? 1 : 0.98 }}
              className="pointer-events-none mx-auto mt-2 max-w-lg rounded-2xl border border-brand-100 bg-white/90 p-3 text-start shadow-xl shadow-brand-500/10 backdrop-blur dark:border-brand-900 dark:bg-gray-900/90"
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles size={16} className="text-brand-500" />
                Try &quot;iPhone&quot;, &quot;Samsung TV&quot;, &quot;gaming laptop&quot;, or &quot;Noon coupons&quot;
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {quickCategories.map((cat, i) => (
              <motion.div
                key={cat.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <Link href={cat.href} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full text-sm hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-700 transition-all border border-gray-200/50 dark:border-gray-700/50">
                  <span>{cat.emoji}</span> {cat.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-16"
        >
          {features.map((item) => (
            <motion.div key={item.label} whileHover={{ y: -6, scale: 1.02 }} className="premium-card text-center p-4">
              <item.icon size={28} className="mx-auto mb-2 text-brand-600" />
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
