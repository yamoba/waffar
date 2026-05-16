"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white font-bold">{t("logoLetter")}</div>
              <span className="text-lg font-bold">Waffar.eg</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("footerTagline")}</p>
          </div>
          <FooterColumn title={t("footerProducts")} links={[
            ["/categories", t("categories")],
            ["/deals", t("deals")],
            ["/coupons", t("coupons")],
            ["/guides", t("guides")],
          ]} />
          <FooterColumn title={t("footerCompany")} links={[
            ["/about", t("footerAbout")],
            ["/contact", t("footerContact")],
            ["/careers", t("footerCareers")],
            ["/press", t("footerPress")],
          ]} />
          <FooterColumn title={t("footerSupport")} links={[
            ["/privacy", t("footerPrivacy")],
            ["/terms", t("footerTerms")],
            ["/faq", t("footerFaq")],
          ]} />
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Waffar.eg Technologies Ltd. {t("footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-gray-500">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="hover:text-brand-600 transition">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
