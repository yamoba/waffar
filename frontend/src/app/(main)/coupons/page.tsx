"use client";

import { motion } from "framer-motion";
import { CouponSection } from "@/components/home/CouponSection";

export default function CouponsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/50 to-white p-8 shadow-xl shadow-brand-500/5 dark:border-brand-900/40 dark:from-gray-900 dark:via-brand-950/20 dark:to-gray-900">
        <h1 className="text-3xl font-black mb-2">Coupons and promo codes</h1>
        <p className="text-gray-500">Verified, copy-ready coupons from top stores in Egypt.</p>
      </motion.div>
      <CouponSection />
    </div>
  );
}
