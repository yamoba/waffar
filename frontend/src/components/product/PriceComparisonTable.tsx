"use client";

import { motion } from "framer-motion";
import { ExternalLink, Truck, RotateCcw, CreditCard, Shield, Star } from "lucide-react";
import { formatPrice } from "@/lib/api";
import type { Listing } from "@/types";
import { FreshnessBadge } from "@/components/shared/FreshnessBadge";

export function PriceComparisonTable({ listings }: { listings: Listing[] }) {
  if (!listings.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span className="w-1 h-5 bg-brand-500 rounded-full" />
        مقارنة الأسعار ({listings.length} متجر)
      </h2>

      <div className="space-y-2">
        {listings.map((listing, i) => {
          const price = listing.salePrice || listing.price;
          const isBest = i === 0;

          return (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border transition-all ${
                isBest
                  ? "border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-brand-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 flex items-center justify-center">
                  🏪
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{listing.store.name}</span>
                    {isBest && <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 rounded-full text-xs font-bold">أفضل سعر</span>}
                    {listing.store.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Star size={10} className="fill-accent-500 text-accent-500" /> {listing.store.rating}
                      </span>
                    )}
                    <FreshnessBadge
                      lastVerifiedAt={listing.lastVerifiedAt}
                      verificationStatus={listing.verificationStatus}
                      priceConfidence={listing.priceConfidence}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                    {listing.freeShipping ? (
                      <span className="flex items-center gap-1 text-brand-600"><Truck size={12} /> شحن مجاني</span>
                    ) : listing.shippingCost ? (
                      <span className="flex items-center gap-1"><Truck size={12} /> شحن {formatPrice(listing.shippingCost)}</span>
                    ) : null}
                    {listing.shippingDays && <span>{listing.shippingDays} يوم توصيل</span>}
                    {listing.returnDays && <span className="flex items-center gap-1"><RotateCcw size={12} /> {listing.returnDays} يوم إرجاع</span>}
                    {listing.warranty && <span className="flex items-center gap-1"><Shield size={12} /> {listing.warranty}</span>}
                    {listing.installmentPlan && (
                      <span className="flex items-center gap-1 text-accent-600">
                        <CreditCard size={12} />
                        {formatPrice(listing.installmentPlan.monthlyAmount)}/شهر × {listing.installmentPlan.months}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="text-lg font-bold text-brand-600">{formatPrice(price)}</div>
                  {listing.salePrice && (
                    <div className="text-xs text-gray-400 line-through">{formatPrice(listing.price)}</div>
                  )}
                  <a
                    href={listing.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition"
                  >
                    اذهب للمتجر <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
