import React from "react";
import { User, LogOut, Shield } from "lucide-react";
import { useApp } from "../../store/AppContext";

const ROLE_COLORS: Record<string, string> = {
  MANAGER:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  DISPATCHER: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  TECHNICIAN: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CUSTOMER:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

const ROLE_LABELS: Record<string, string> = {
  MANAGER:    "Manager",
  DISPATCHER: "Dispatcher",
  TECHNICIAN: "Teknisi",
  CUSTOMER:   "Customer",
};

export default function RbacDock() {
  const { currentUser, logout } = useApp();

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={13} className="text-slate-300" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.fullName}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{currentUser.email ?? currentUser.username}</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2">
          <Shield size={12} className="text-slate-500" />
          <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 tracking-wide ${ROLE_COLORS[currentUser.role] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
            {ROLE_LABELS[currentUser.role] ?? currentUser.role}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          title="Logout"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </div>
  );
}
