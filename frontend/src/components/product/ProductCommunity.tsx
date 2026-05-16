"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { MessageCircle, Star, ThumbsUp, ShieldCheck } from "lucide-react";

const sampleReviews = [
  { name: "Omar", rating: 5, body: "Price tracking helped me wait two days and save a real amount.", reactions: 42 },
  { name: "Mariam", rating: 4, body: "Store comparison is useful, especially warranty and shipping differences.", reactions: 27 },
  { name: "Youssef", rating: 5, body: "Good value if you catch the price drop alert.", reactions: 19 },
];

export function ProductCommunity() {
  const [rating, setRating] = useState(0);

  return (
    <section className="premium-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <MessageCircle size={14} /> Community reviews
          </p>
          <h2 className="mt-3 text-xl font-black">What Egyptian shoppers think</h2>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-center dark:bg-brand-950/40">
          <p className="text-2xl font-black text-brand-700 dark:text-brand-300">94%</p>
          <p className="text-xs text-gray-500">trust score</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {sampleReviews.map((review, index) => (
          <motion.div key={review.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold">{review.name}</p>
              <span className="flex items-center gap-1 text-xs text-accent-500"><Star size={13} className="fill-accent-500" /> {review.rating}</span>
            </div>
            <p className="text-sm text-gray-500">{review.body}</p>
            <button onClick={() => toast.success("Reaction added")} className="pressable mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
              <ThumbsUp size={13} /> {review.reactions}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/20">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold"><ShieldCheck size={15} className="text-brand-500" /> Rate your confidence</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} onClick={() => { setRating(value); toast.success(`Rated ${value} stars`); }} className="pressable text-accent-500" aria-label={`Rate ${value} stars`}>
              <Star size={22} className={rating >= value ? "fill-accent-500" : ""} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
