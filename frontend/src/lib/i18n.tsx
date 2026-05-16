"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";

const STORAGE_KEY = "waffar_language";

const translations = {
  en: {
    logoLetter: "W",
    deals: "Deals",
    categories: "Categories",
    coupons: "Coupons",
    guides: "Buying guides",
    dashboard: "Dashboard",
    account: "My account",
    login: "Log in",
    searchShort: "Search products...",
    searchPlaceholder: "Search for any product...",
    searchAction: "Search",
    viewAll: "View all",
    language: "العربية",
    heroBadge: "Egypt's smartest price comparison platform",
    heroTitleStart: "Save money with",
    heroTitleHighlight: "Waffar.eg",
    heroBody: "Compare thousands of products across Egypt's biggest stores. Track prices, discover real deals, and get instant alerts.",
    catSmartphones: "Mobiles",
    catLaptops: "Laptops",
    catTvs: "TVs",
    catAudio: "Audio",
    catGaming: "Gaming",
    catHome: "Home appliances",
    trackPrices: "Track prices",
    trackPricesDesc: "Interactive price charts",
    fakeDeals: "Spot fake deals",
    fakeDealsDesc: "Protection from misleading discounts",
    instantAlerts: "Instant alerts",
    instantAlertsDesc: "Know when prices drop",
    trendingTitle: "Trending products",
    trendingSubtitle: "Most searched and viewed this week",
    dropsTitle: "Recently price dropped",
    dropsSubtitle: "Fresh drops with animated urgency badges",
    browseCategoriesTitle: "Top categories today",
    browseCategoriesSubtitle: "Live category leaderboard based on current demand",
    storesTitle: "Trusted stores",
    storesSubtitle: "Store trust ratings from price accuracy, returns, and reviews",
    productCount: "products",
    commandPlaceholder: "Search products, brands, or categories...",
    recentSearches: "Recent searches",
    suggestions: "Suggestions",
    products: "Products",
    pressEnter: "Press Enter to search for",
    commandFooterSearch: "to search",
    commandFooterMove: "to move",
    smartSearch: "Smart Arabic and English search",
    couponsTitle: "Coupon and deals center",
    couponsSubtitle: "Promo codes, cashback-style offers, and verified discounts",
    couponCopied: "Coupon copied!",
    freeShipping: "Free shipping",
    verified: "Verified",
    copied: "Copied",
    copy: "Copy",
    storesCount: "stores",
    dealExpired: "Expired",
    dealOfDay: "Hot deal countdown",
    endsIn: "ends in",
    viewDeal: "View deal",
    footerTagline: "Egypt's smartest price comparison platform",
    footerProducts: "Products",
    footerCompany: "Company",
    footerSupport: "Support",
    footerAbout: "About Waffar.eg",
    footerContact: "Contact us",
    footerCareers: "Careers",
    footerPress: "Press",
    footerPrivacy: "Privacy policy",
    footerTerms: "Terms and conditions",
    footerFaq: "FAQ",
    footerRights: "All rights reserved.",
  },
  ar: {
    logoLetter: "و",
    deals: "العروض",
    categories: "الأقسام",
    coupons: "كوبونات",
    guides: "أدلة الشراء",
    dashboard: "لوحة التحكم",
    account: "حسابي",
    login: "دخول",
    searchShort: "ابحث عن منتج...",
    searchPlaceholder: "ابحث عن أي منتج...",
    searchAction: "ابحث",
    viewAll: "عرض الكل",
    language: "English",
    heroBadge: "أذكى منصة لمقارنة الأسعار في مصر",
    heroTitleStart: "وفّر فلوسك مع",
    heroTitleHighlight: "Waffar.eg",
    heroBody: "قارن أسعار آلاف المنتجات من أكبر المتاجر في مصر. تتبع الأسعار، اكتشف العروض الحقيقية، واحصل على تنبيهات فورية.",
    catSmartphones: "موبايلات",
    catLaptops: "لابتوب",
    catTvs: "تلفزيونات",
    catAudio: "سماعات",
    catGaming: "ألعاب",
    catHome: "أجهزة منزلية",
    trackPrices: "تتبع الأسعار",
    trackPricesDesc: "رسوم بيانية تفاعلية",
    fakeDeals: "كشف العروض الوهمية",
    fakeDealsDesc: "حماية من التضليل",
    instantAlerts: "تنبيهات فورية",
    instantAlertsDesc: "أول ما السعر ينزل",
    trendingTitle: "منتجات رائجة",
    trendingSubtitle: "الأكثر بحثا ومقارنة هذا الأسبوع",
    dropsTitle: "انخفض سعرها مؤخرا",
    dropsSubtitle: "خصومات جديدة مع مؤشرات حركة وتنبيهات",
    browseCategoriesTitle: "أهم الأقسام اليوم",
    browseCategoriesSubtitle: "ترتيب حي للأقسام حسب اهتمام المستخدمين",
    storesTitle: "متاجر موثوقة",
    storesSubtitle: "تقييم ثقة المتجر حسب دقة السعر والمرتجعات والمراجعات",
    productCount: "منتج",
    commandPlaceholder: "ابحث عن منتجات، ماركات، أو أقسام...",
    recentSearches: "عمليات بحث سابقة",
    suggestions: "اقتراحات",
    products: "منتجات",
    pressEnter: "اضغط Enter للبحث عن",
    commandFooterSearch: "للبحث",
    commandFooterMove: "للتنقل",
    smartSearch: "بحث ذكي بالعربي والإنجليزي",
    couponsTitle: "مركز الكوبونات والعروض",
    couponsSubtitle: "أكواد خصم، عروض كاش باك، وتخفيضات موثقة",
    couponCopied: "تم نسخ الكوبون!",
    freeShipping: "شحن مجاني",
    verified: "موثّق",
    copied: "تم",
    copy: "نسخ",
    storesCount: "متاجر",
    dealExpired: "انتهى",
    dealOfDay: "عد تنازلي لأقوى عرض",
    endsIn: "ينتهي خلال",
    viewDeal: "شاهد العرض",
    footerTagline: "أذكى منصة لمقارنة الأسعار في مصر",
    footerProducts: "المنتجات",
    footerCompany: "الشركة",
    footerSupport: "الدعم",
    footerAbout: "عن Waffar.eg",
    footerContact: "تواصل معنا",
    footerCareers: "وظائف",
    footerPress: "الصحافة",
    footerPrivacy: "سياسة الخصوصية",
    footerTerms: "الشروط والأحكام",
    footerFaq: "الأسئلة الشائعة",
    footerRights: "جميع الحقوق محفوظة.",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "ar" || stored === "en") setLanguageState(stored);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const value: LanguageContextValue = {
    language,
    direction,
    setLanguage,
    toggleLanguage: () => setLanguage(language === "en" ? "ar" : "en"),
    t: (key) => translations[language][key],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
