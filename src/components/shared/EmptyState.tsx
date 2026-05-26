import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title = "Tidak ada data",
  message = "Belum ada data untuk ditampilkan.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="p-4 bg-slate-100 rounded-2xl mb-4 text-slate-400">
        {icon ?? <Inbox size={32} />}
      </div>
      <p className="font-semibold text-slate-700 text-sm">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
