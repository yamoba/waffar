"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href?: string;
}

export function SectionHeader({ icon: Icon, title, subtitle, href }: Props) {
  const { t, direction } = useLanguage();
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-xl">
          <Icon size={20} className="text-brand-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition">
          {t("viewAll")} <Arrow size={16} />
        </Link>
      )}
    </div>
  );
}
