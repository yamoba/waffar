"use client";

import { motion } from "framer-motion";
import { Wallet, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function BudgetsPage() {
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">الميزانيات</h1>
          <button className="px-4 py-2 gradient-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition flex items-center gap-1">
            <Plus size={16} /> ميزانية جديدة
          </button>
        </div>

        <div className="py-20 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">خطط ميزانيتك</h2>
          <p className="text-gray-500 max-w-md mx-auto">حدد ميزانية شهرية لمشترياتك وتابع إنفاقك. أنشئ ميزانيتك الأولى وابدأ التوفير.</p>
        </div>
      </div>
    </>
  );
}
