"use client";

import { ProductCard } from "@/components/shared/ProductCard";

export function RelatedProducts({ relations }: { relations: any[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span className="w-1 h-5 bg-brand-500 rounded-full" />
        منتجات مشابهة
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {relations.map((rel) => (
          <ProductCard key={rel.toProduct.id} product={rel.toProduct} />
        ))}
      </div>
    </div>
  );
}
