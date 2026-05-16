"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Star, Eye, Store, Bell, Heart, Share2, ExternalLink, GitCompareArrows, Sparkles } from "lucide-react";
import Link from "next/link";
import { api, formatPrice } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useCommerce } from "@/stores/commerce";
import { PriceComparisonTable } from "@/components/product/PriceComparisonTable";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { AiAdvice } from "@/components/product/AiAdvice";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductCommunity } from "@/components/product/ProductCommunity";
import { ListingSkeleton } from "@/components/shared/Skeletons";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isWishlisted, isComparing, toggleWishlist, toggleCompare, trackRecent } = useCommerce();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1"><div className="aspect-square skeleton rounded-3xl" /></div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 skeleton w-3/4" />
            <div className="h-6 skeleton w-1/4" />
            {Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold">Product not found</h1></div>;
  }

  const bestListing = product.listings?.[0];
  const bestPrice = bestListing?.salePrice || bestListing?.price;
  const saved = isWishlisted(product.id);
  const comparing = isComparing(product.id);

  async function shareProduct() {
    const url = `${window.location.origin}/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied");
      }
    } catch {
      toast.error("Could not share product");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-2 overflow-x-auto text-sm text-gray-500 scrollbar-hide">
        <Link href="/" className="transition hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link href={`/search?category=${product.category}`} className="transition hover:text-brand-600">{product.category}</Link>
        {product.subcategory && <><span>/</span><span>{product.subcategory}</span></>}
        <span>/</span>
        <span className="truncate font-medium text-gray-900 dark:text-white">{product.title}</span>
      </motion.nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-accent-50 shadow-2xl shadow-brand-500/10 dark:border-brand-900/40 dark:from-brand-950/30 dark:via-gray-950 dark:to-gray-900">
              <div className="absolute inset-0 animate-hero-pan opacity-60" style={{ background: "radial-gradient(circle at 35% 25%, rgba(6,182,212,.22), transparent 18rem)" }} />
              <div className="relative flex h-full items-center justify-center text-7xl">📦</div>
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-brand-700 shadow-lg backdrop-blur dark:bg-gray-950/80 dark:text-brand-300">
                <Sparkles size={13} /> Best tracked price
              </span>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-16 shrink-0 cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition hover:ring-2 ring-brand-500 dark:border-gray-800 dark:bg-gray-900" />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onAnimationComplete={() => trackRecent(product)} className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6">
            {product.brand && (
              <Link href={`/search?brand=${product.brand}`} className="text-sm font-bold text-brand-600 transition hover:text-brand-700">
                {product.brand}
              </Link>
            )}
            <h1 className="mt-1 text-2xl font-black md:text-4xl">{product.title}</h1>
            {product.titleAr && product.titleAr !== product.title && (
              <p className="mt-1 text-lg text-gray-500">{product.titleAr}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Metric icon={Eye} label={`${product.viewCount?.toLocaleString()} views`} />
              <Metric icon={Store} label={`${product.listingCount} stores`} />
              {bestListing?.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="fill-accent-500 text-accent-500" />
                  {bestListing.rating} ({bestListing.reviewCount})
                </div>
              )}
            </div>
          </div>

          {bestPrice && (
            <div className="rounded-3xl border border-brand-200 bg-brand-50/80 p-6 shadow-xl shadow-brand-500/10 backdrop-blur dark:border-brand-800 dark:bg-brand-950/30">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-300">Best price now</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-4xl font-black text-brand-700 dark:text-brand-300">{formatPrice(bestPrice)}</span>
                    {bestListing?.salePrice && (
                      <span className="text-lg text-gray-400 line-through">{formatPrice(bestListing.price)}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    From {bestListing?.store?.name} {bestListing?.freeShipping ? "• free shipping" : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <a href={bestListing?.externalUrl} target="_blank" rel="noopener noreferrer" className="pressable ripple flex items-center justify-center gap-2 rounded-xl gradient-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5">
                    Buy now <ExternalLink size={16} />
                  </a>
                  <div className="grid grid-cols-4 gap-2">
                    <ActionButton onClick={() => toast.success("Price alert ready when backend alerts are connected")} icon={Bell} label="Alert" />
                    <ActionButton onClick={() => toggleWishlist(product)} icon={Heart} label={saved ? "Saved" : "Save"} active={saved} />
                    <ActionButton onClick={() => toggleCompare(product)} icon={GitCompareArrows} label={comparing ? "Added" : "Compare"} active={comparing} />
                    <ActionButton onClick={shareProduct} icon={Share2} label="Share" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <PriceComparisonTable listings={product.listings || []} />
          <PriceHistoryChart productSlug={slug} />
          <AiAdvice productSlug={slug} />
          <ProductCommunity />
          {product.specs && <ProductSpecs specs={product.specs} />}
          {product.relatedTo?.length > 0 && <RelatedProducts relations={product.relatedTo} />}
        </motion.div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <Icon size={14} /> {label}
    </div>
  );
}

function ActionButton({ icon: Icon, label, active, onClick }: { icon: typeof Heart; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("pressable focus-glow flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold transition hover:border-brand-300 hover:text-brand-700 dark:border-gray-800 dark:bg-gray-900", active && "border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-950/40")}>
      <Icon size={15} /> {label}
    </button>
  );
}
