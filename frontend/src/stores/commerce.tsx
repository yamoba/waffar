"use client";

import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Product } from "@/types";

const WISHLIST_KEY = "waffar_wishlist";
const COMPARE_KEY = "waffar_compare";
const RECENT_KEY = "waffar_recent_products";

type CommerceContextValue = {
  wishlist: Product[];
  compare: Product[];
  recent: Product[];
  isWishlisted: (productId: string) => boolean;
  isComparing: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  trackRecent: (product: Product) => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

function readProducts(key: string) {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as Product[];
  } catch {
    return [];
  }
}

function writeProducts(key: string, products: Product[]) {
  window.localStorage.setItem(key, JSON.stringify(products.slice(0, 12)));
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [compare, setCompare] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWishlist(readProducts(WISHLIST_KEY));
      setCompare(readProducts(COMPARE_KEY));
      setRecent(readProducts(RECENT_KEY));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function isWishlisted(productId: string) {
    return wishlist.some((item) => item.id === productId);
  }

  function isComparing(productId: string) {
    return compare.some((item) => item.id === productId);
  }

  function toggleWishlist(product: Product) {
    const exists = isWishlisted(product.id);
    const next = exists ? wishlist.filter((item) => item.id !== product.id) : [product, ...wishlist].slice(0, 24);
    setWishlist(next);
    writeProducts(WISHLIST_KEY, next);
    toast.success(exists ? "Removed from wishlist" : "Added to wishlist");
  }

  function toggleCompare(product: Product) {
    const exists = isComparing(product.id);
    const next = exists ? compare.filter((item) => item.id !== product.id) : [product, ...compare].slice(0, 4);
    setCompare(next);
    writeProducts(COMPARE_KEY, next);
    toast.success(exists ? "Removed from compare" : "Added to compare");
  }

  function clearCompare() {
    setCompare([]);
    writeProducts(COMPARE_KEY, []);
    toast.success("Compare list cleared");
  }

  function trackRecent(product: Product) {
    const next = [product, ...recent.filter((item) => item.id !== product.id)].slice(0, 8);
    setRecent(next);
    writeProducts(RECENT_KEY, next);
  }

  return (
    <CommerceContext.Provider value={{ wishlist, compare, recent, isWishlisted, isComparing, toggleWishlist, toggleCompare, clearCompare, trackRecent }}>
      {children}
    </CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error("useCommerce must be used inside CommerceProvider");
  return context;
}
