"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, Store, Users, Bell, Search, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/Header";

export default function AdminDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get("/admin/analytics").then((r) => r.data),
  });

  const stats = [
    { icon: Package, label: "منتجات نشطة", value: analytics?.totalProducts || 0, color: "bg-blue-50 text-blue-600" },
    { icon: Store, label: "عروض أسعار", value: analytics?.totalListings || 0, color: "bg-green-50 text-green-600" },
    { icon: Users, label: "مستخدمين", value: analytics?.totalUsers || 0, color: "bg-purple-50 text-purple-600" },
    { icon: Bell, label: "تنبيهات نشطة", value: analytics?.totalAlerts || 0, color: "bg-orange-50 text-orange-600" },
    { icon: Search, label: "بحث (24 ساعة)", value: analytics?.recentSearches || 0, color: "bg-pink-50 text-pink-600" },
  ];

  const scraperHealth = analytics?.scraperHealth || {};

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">لوحة التحكم</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}><stat.icon size={20} /></div>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scraper Health */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity size={18} /> حالة المجمّع</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(scraperHealth).map(([status, count]) => (
              <div key={status} className={`p-4 rounded-xl border ${status === "SUCCESS" ? "border-green-200 bg-green-50" : status === "FAILED" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
                <div className="flex items-center gap-2">
                  {status === "SUCCESS" ? <CheckCircle size={16} className="text-green-600" /> : status === "FAILED" ? <AlertTriangle size={16} className="text-red-600" /> : <Activity size={16} className="text-yellow-600" />}
                  <span className="font-medium text-sm">{status}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{String(count)}</p>
                <p className="text-xs text-gray-500">عمليات (24 ساعة)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/admin/scrapers", label: "إدارة المجمّع", desc: "تحكم في عمليات جمع الأسعار" },
            { href: "/admin/products", label: "إدارة المنتجات", desc: "دمج، تعديل، ومراجعة المنتجات" },
            { href: "/admin/stores", label: "إدارة المتاجر", desc: "تفعيل وإدارة المتاجر" },
            { href: "/admin/content", label: "إدارة المحتوى", desc: "أدلة، حملات، وكوبونات" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="group p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-brand-300 hover:shadow-lg transition-all">
              <h3 className="font-bold group-hover:text-brand-600 transition">{link.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
