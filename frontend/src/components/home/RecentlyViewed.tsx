"use client";

import { Clock3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/shared/ProductCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useCommerce } from "@/stores/commerce";

export function RecentlyViewed() {
  const { recent } = useCommerce();

  return (
    <AnimatePresence>
      {recent.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="max-w-7xl mx-auto px-4"
        >
          <SectionHeader icon={Clock3} title="Recently viewed" subtitle="Jump back into products you checked before" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recent.slice(0, 6).map((product, index) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
