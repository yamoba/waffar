"use client";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-full" />
        <div className="h-4 skeleton w-2/3" />
        <div className="h-5 skeleton w-1/3 mt-2" />
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 skeleton rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton w-1/3" />
          <div className="h-3 skeleton w-1/4" />
        </div>
        <div className="h-6 skeleton w-24" />
      </div>
    </div>
  );
}
