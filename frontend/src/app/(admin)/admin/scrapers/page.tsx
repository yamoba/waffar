"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Play, Pause, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { useState } from "react";

export default function ScrapersAdminPage() {
  const [runsPage, setRunsPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ["admin-scrapers"],
    queryFn: () => api.get("/admin/scrapers").then((r) => r.data),
  });

  const { data: runsData } = useQuery({
    queryKey: ["admin-scraper-runs", runsPage],
    queryFn: () => api.get(`/admin/scrapers/runs?page=${runsPage}`).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/scrapers/${id}`, { isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-scrapers"] }); toast.success("تم التحديث"); },
  });

  const STATUS_ICONS: Record<string, any> = {
    SUCCESS: <CheckCircle size={16} className="text-green-500" />,
    PARTIAL: <Clock size={16} className="text-yellow-500" />,
    FAILED: <XCircle size={16} className="text-red-500" />,
    RUNNING: <RefreshCw size={16} className="text-blue-500 animate-spin" />,
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">إدارة المجمّع (Scrapers)</h1>

        {/* Configs */}
        <h2 className="text-lg font-bold mb-4">إعدادات المجمّع</h2>
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-right p-3 font-medium text-gray-500">المتجر</th>
                <th className="text-right p-3 font-medium text-gray-500">التردد</th>
                <th className="text-right p-3 font-medium text-gray-500">آخر تشغيل</th>
                <th className="text-right p-3 font-medium text-gray-500">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {configs?.map((config: any) => (
                <tr key={config.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                  <td className="p-3 font-medium">{config.store?.name}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.frequency === "HOT" ? "bg-red-100 text-red-600" : config.frequency === "MEDIUM" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>{config.frequency}</span></td>
                  <td className="p-3 text-gray-500">{config.lastRunAt ? new Date(config.lastRunAt).toLocaleString("ar-EG") : "—"}</td>
                  <td className="p-3">{config.isActive ? <span className="text-green-600 text-xs font-medium">نشط</span> : <span className="text-gray-400 text-xs">متوقف</span>}</td>
                  <td className="p-3">
                    <button onClick={() => toggleMutation.mutate({ id: config.id, isActive: !config.isActive })} className={`p-2 rounded-lg transition ${config.isActive ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-500"}`}>
                      {config.isActive ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Runs */}
        <h2 className="text-lg font-bold mb-4">آخر العمليات</h2>
        <div className="space-y-2">
          {runsData?.runs?.map((run: any) => (
            <div key={run.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              {STATUS_ICONS[run.status] || <Activity size={16} />}
              <span className="font-medium w-28">{run.store?.name}</span>
              <span className="text-gray-500 flex-1">{run.productsFound} منتج, {run.pricesUpdated} تحديث, {run.errors} أخطاء</span>
              <span className="text-gray-400 text-xs">{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</span>
              <span className="text-gray-400 text-xs">{new Date(run.startedAt).toLocaleString("ar-EG")}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
