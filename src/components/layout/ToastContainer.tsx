import React from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useApp } from "../../store/AppContext";

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info:    <Info size={16} className="text-blue-500" />,
  error:   <XCircle size={16} className="text-rose-500" />,
  critical:<XCircle size={16} className="text-rose-600" />,
};

const BG = {
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  info:    "bg-blue-50 border-blue-200",
  error:   "bg-rose-50 border-rose-200",
  critical:"bg-rose-50 border-rose-300",
};

export default function ToastContainer() {
  const { toastQueue } = useApp();

  if (!toastQueue.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toastQueue.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-start gap-3 border rounded-xl px-4 py-3
            shadow-lg shadow-slate-200/60 backdrop-blur-sm w-80
            animate-in slide-in-from-right duration-300
            ${BG[toast.type ?? "info"]}
          `}
        >
          <div className="mt-0.5 flex-shrink-0">{ICONS[toast.type ?? "info"]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{toast.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
