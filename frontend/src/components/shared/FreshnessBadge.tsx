"use client";

import { ShieldCheck, AlertTriangle, Clock } from "lucide-react";

type Status = "UNVERIFIED" | "VERIFIED" | "STALE" | "SUSPICIOUS" | "DEAD" | undefined;

function relativeArabic(date: Date): string {
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.round(hours / 24);
  return `منذ ${days} يوم`;
}

export function FreshnessBadge({
  lastVerifiedAt,
  verificationStatus,
  priceConfidence,
  staleAfterHours = 12,
}: {
  lastVerifiedAt?: string;
  verificationStatus?: Status;
  priceConfidence?: number;
  staleAfterHours?: number;
}) {
  const verifiedDate = lastVerifiedAt ? new Date(lastVerifiedAt) : null;
  const ageHours = verifiedDate ? (Date.now() - verifiedDate.getTime()) / 3_600_000 : Infinity;
  const isStale = ageHours > staleAfterHours;
  const isSuspicious = verificationStatus === "SUSPICIOUS" || (priceConfidence !== undefined && priceConfidence < 0.5);
  const isVerified = verificationStatus === "VERIFIED" && !isStale && !isSuspicious;

  if (isSuspicious) {
    return (
      <span
        title="السعر يحتاج إعادة تأكيد"
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
      >
        <AlertTriangle size={10} /> سعر غير مؤكد
      </span>
    );
  }

  if (isStale) {
    return (
      <span
        title={verifiedDate ? `آخر تحديث ${relativeArabic(verifiedDate)}` : "لم يُتحقق منه مؤخراً"}
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500"
      >
        <Clock size={10} /> {verifiedDate ? relativeArabic(verifiedDate) : "غير مُحدّث"}
      </span>
    );
  }

  if (isVerified) {
    return (
      <span
        title={verifiedDate ? `تم التحقق ${relativeArabic(verifiedDate)}` : "تم التحقق"}
        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400"
      >
        <ShieldCheck size={10} /> سعر مؤكد {verifiedDate && `· ${relativeArabic(verifiedDate)}`}
      </span>
    );
  }

  if (verifiedDate) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
        <Clock size={10} /> {relativeArabic(verifiedDate)}
      </span>
    );
  }

  return null;
}
