import React, { useRef, useEffect } from "react";
import { Bell, CheckCheck, AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";
import { useApp } from "../../store/AppContext";

const TYPE_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle size={14} className="text-rose-500" />,
  warning:  <AlertTriangle size={14} className="text-amber-500" />,
  info:     <Info size={14} className="text-blue-500" />,
  success:  <CheckCircle size={14} className="text-emerald-500" />,
};

const TYPE_BG: Record<string, string> = {
  critical: "bg-rose-50 border-rose-200",
  warning:  "bg-amber-50 border-amber-200",
  info:     "bg-blue-50 border-blue-200",
  success:  "bg-emerald-50 border-emerald-200",
};

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    showNotificationDropdown,
    setShowNotificationDropdown,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    if (showNotificationDropdown) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotificationDropdown, setShowNotificationDropdown]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showNotificationDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors"
              >
                <CheckCheck size={12} /> Tandai semua
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                Tidak ada notifikasi
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`
                    flex gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer
                    transition-colors hover:bg-slate-50
                    ${!n.read ? "bg-blue-50/40" : ""}
                  `}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg border flex-shrink-0 ${TYPE_BG[n.type ?? "info"]}`}>
                    {TYPE_ICON[n.type ?? "info"]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${n.read ? "text-slate-600" : "text-slate-800"}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.timestamp}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
