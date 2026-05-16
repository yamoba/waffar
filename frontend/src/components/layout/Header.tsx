"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, Bell, Heart, BarChart2, Zap, Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n";
import { CommandPalette } from "./CommandPalette";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, toggleLanguage } = useLanguage();

  const navItems = [
    { href: "/deals", label: t("deals"), icon: Zap },
    { href: "/categories", label: t("categories"), icon: BarChart2 },
    { href: "/coupons", label: t("coupons"), icon: Heart },
    { href: "/guides", label: t("guides"), icon: Search },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass shadow-lg" : "bg-white dark:bg-gray-950"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition" aria-label="Menu">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
                  {t("logoLetter")}
                </div>
                <span className="text-xl font-bold hidden sm:block">Waffar.eg</span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-300 dark:hover:bg-brand-950 transition-all">
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm text-gray-500"
              >
                <Search size={16} />
                <span className="hidden sm:inline">{t("searchShort")}</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  Ctrl K
                </kbd>
              </button>

              <button onClick={toggleLanguage} className="inline-flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition text-sm font-medium" aria-label="Change language">
                <Languages size={18} />
                <span className="hidden sm:inline">{t("language")}</span>
              </button>

              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition" aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user ? (
                <>
                  <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </Link>
                  <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                      {user.name[0]}
                    </div>
                  </Link>
                </>
              ) : (
                <Link href="/login" className="px-4 py-2 gradient-brand text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                  {t("login")}
                </Link>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <nav className="p-4 space-y-1">
                {[...navItems, { href: "/dashboard", label: t("account") }].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
