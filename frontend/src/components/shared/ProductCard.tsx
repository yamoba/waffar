"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, GitCompareArrows, Heart, Sparkles, Store, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n";
import { useCommerce } from "@/stores/commerce";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const { isWishlisted, isComparing, toggleWishlist, toggleCompare, trackRecent } = useCommerce();
  const listing = product.listings?.[0];
  const price = listing?.salePrice || listing?.price || product.lowestPrice || 0;
  const originalPrice = listing?.salePrice ? listing.price : product.previousPrice;
  const discount = originalPrice ? Math.max(0, Math.round(((originalPrice - price) / originalPrice) * 100)) : product.dropPercentage || 0;
  const bestDeal = Boolean(product.lowestPrice && price <= product.lowestPrice);

  return (
    <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.985 }} className="h-full">
      <Link
        href={`/product/${product.slug}`}
        onClick={() => trackRecent(product)}
        className="group premium-card block h-full overflow-hidden"
      >
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 via-brand-50/60 to-white dark:from-gray-900 dark:via-brand-950/20 dark:to-gray-900">
          <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" style={{ backgroundImage: "radial-gradient(circle at 50% 30%, rgba(6,182,212,.22), transparent 16rem)" }} />
          <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300 transition duration-500 group-hover:scale-110 group-hover:rotate-2">
            📦
          </div>

          <div className="absolute left-2 top-2 flex flex-col gap-2">
            {bestDeal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-700 shadow-lg shadow-brand-500/10 backdrop-blur dark:bg-gray-950/80 dark:text-brand-300">
                <Sparkles size={12} /> Best deal
              </span>
            )}
            {discount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-brand-500/20">
                <TrendingDown size={12} /> -{discount}%
              </span>
            )}
          </div>

          <div className="absolute right-2 top-2 flex translate-x-2 flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            <ActionButton
              active={isWishlisted(product.id)}
              label="Save product"
              onClick={(event) => {
                event.preventDefault();
                toggleWishlist(product);
              }}
            >
              <Heart size={16} className={cn(isWishlisted(product.id) && "fill-brand-500 text-brand-500")} />
            </ActionButton>
            <ActionButton
              active={isComparing(product.id)}
              label="Compare product"
              onClick={(event) => {
                event.preventDefault();
                toggleCompare(product);
              }}
            >
              <GitCompareArrows size={16} />
            </ActionButton>
          </div>

          {product.listingCount > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 text-xs text-white backdrop-blur">
              <Store size={12} />
              {product.listingCount} {t("storesCount")}
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            {listing?.store ? <p className="truncate text-xs text-gray-400">{listing.store.name}</p> : <span />}
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Eye size={12} /> {product.viewCount?.toLocaleString?.() || 0}
            </span>
          </div>
          <p className="min-h-[2.5rem] text-sm font-semibold line-clamp-2 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">{product.title}</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <span className="block text-lg font-black text-brand-600">{formatPrice(price)}</span>
              {originalPrice && originalPrice > price && <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
            </div>
            <span className="translate-y-2 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 dark:bg-brand-950/40 dark:text-brand-300">
              Quick view
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ActionButton({ active, label, onClick, children }: { active?: boolean; label: string; onClick: React.MouseEventHandler<HTMLButtonElement>; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "pressable focus-glow flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-gray-500 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:bg-white hover:text-brand-600 dark:bg-gray-950/80 dark:hover:bg-gray-900",
        active && "bg-brand-50 text-brand-600 dark:bg-brand-950"
      )}
    >
      {children}
    </button>
  );
}
