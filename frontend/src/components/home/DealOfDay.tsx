"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api, formatPrice } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

export function DealOfDay() {
  const { t, direction } = useLanguage();
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;
  const { data } = useQuery({
    queryKey: ["deal-of-day"],
    queryFn: () => api.get("/products/deal-of-day").then((r) => r.data),
  });

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!data?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(data.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(t("dealExpired"));
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.expiresAt, t]);

  if (!data?.product) return null;
  const { product } = data;
  const listing = product.listings?.[0];
  if (!listing) return null;

  const discount = listing.salePrice
    ? Math.round(((listing.price - listing.salePrice) / listing.price) * 100)
    : 0;

  return (
    <section className="max-w-7xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-500 to-brand-700 text-white p-8 md:p-12"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
              <Clock size={14} />
              {t("dealOfDay")} - {t("endsIn")} {timeLeft}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{product.title}</h2>
            <p className="text-white/70 mb-6">{product.category}</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold">{formatPrice(listing.salePrice || listing.price)}</span>
              {listing.salePrice && (
                <>
                  <span className="text-xl text-white/50 line-through">{formatPrice(listing.price)}</span>
                  <span className="px-3 py-1 bg-accent-500 text-white rounded-full text-sm font-bold">-{discount}%</span>
                </>
              )}
            </div>

            <Link href={`/product/${product.slug}`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-700 rounded-xl font-bold hover:bg-gray-100 transition">
              {t("viewDeal")} <Arrow size={18} />
            </Link>
          </div>

          <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-3xl shrink-0" />
        </div>
      </motion.div>
    </section>
  );
}
