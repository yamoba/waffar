"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { BiggestDrops } from "@/components/home/BiggestDrops";
import { DealOfDay } from "@/components/home/DealOfDay";
import { CategoryExplorer } from "@/components/home/CategoryExplorer";
import { PopularStores } from "@/components/home/PopularStores";
import { CouponSection } from "@/components/home/CouponSection";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { LiveDealMarquee, StartupShoppingFeatures } from "@/components/home/LiveShoppingIntelligence";

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      <HeroSection />
      <LiveDealMarquee />
      <TrendingProducts />
      <BiggestDrops />
      <DealOfDay />
      <CategoryExplorer />
      <StartupShoppingFeatures />
      <RecentlyViewed />
      <PopularStores />
      <CouponSection />
    </div>
  );
}
