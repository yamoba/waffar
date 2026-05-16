"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/stores/auth";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("تم إنشاء الحساب بنجاح!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 to-white dark:from-gray-950 dark:to-gray-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-xl">و</div>
            <span className="text-2xl font-bold">Waffar.eg</span>
          </Link>
          <h1 className="text-2xl font-bold">إنشاء حساب</h1>
          <p className="text-gray-500 mt-1">انضم لآلاف المستخدمين الأذكياء</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">الاسم</label>
            <div className="relative">
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 ring-brand-500 outline-none transition" placeholder="اسمك" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 ring-brand-500 outline-none transition" placeholder="email@example.com" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full pr-10 pl-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 ring-brand-500 outline-none transition" placeholder="8 أحرف على الأقل" dir="ltr" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 gradient-brand text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50">
            {loading ? "جاري التحميل..." : "إنشاء حساب"}
          </button>

          <p className="text-center text-sm text-gray-500">
            لديك حساب؟{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">سجل دخول</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
