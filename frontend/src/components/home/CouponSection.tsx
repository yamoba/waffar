"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Ticket, Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Coupon } from "@/types";

export function CouponSection() {
  const { t } = useLanguage();
  const { data } = useQuery({
    queryKey: ["coupons-home"],
    queryFn: () => api.get("/coupons?page=1").then((r) => r.data),
  });

  return (
    <section className="max-w-7xl mx-auto px-4">
      <SectionHeader icon={Ticket} title={t("couponsTitle")} subtitle={t("couponsSubtitle")} href="/coupons" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.coupons?.slice(0, 6).map((coupon: Coupon, i: number) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <CouponCard coupon={coupon} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  function copyCode() {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(t("couponCopied"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative p-5 rounded-2xl border border-dashed border-brand-300 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-brand-700 dark:text-brand-300 text-lg">
            {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : coupon.discountType === "FREE_SHIPPING" ? t("freeShipping") : `${coupon.discountValue} EGP`}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{coupon.description}</p>
          <p className="text-xs text-gray-400 mt-2">{coupon.store.name}</p>
        </div>
        {coupon.isVerified && (
          <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-medium">{t("verified")}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-center font-mono text-sm border border-gray-200 dark:border-gray-700">{coupon.code}</code>
        <button onClick={copyCode} className="px-4 py-2 gradient-brand text-white rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-1">
          {copied ? <><Check size={14} /> {t("copied")}</> : <><Copy size={14} /> {t("copy")}</>}
        </button>
      </div>
    </div>
  );
}
