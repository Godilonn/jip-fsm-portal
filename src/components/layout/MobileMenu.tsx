import React from "react";
import {
  LayoutDashboard, ClipboardList, FileText, Package,
  Download, Bot, Settings, X,
} from "lucide-react";
import { useApp } from "../../store/AppContext";
import { getVisibleNavItems } from "../../lib/constants";
import type { TabKey } from "../../types";

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  dashboard:  <LayoutDashboard size={16} />,
  penerimaan: <ClipboardList size={16} />,
  sph:        <FileText size={16} />,
  logistics:  <Package size={16} />,
  downloads:  <Download size={16} />,
  ai:         <Bot size={16} />,
  settings:   <Settings size={16} />,
};

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { activeTab, setActiveTab, currentUser, language } = useApp();

  const navItems = getVisibleNavItems(currentUser.role);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-bold text-slate-800 text-sm">Menu Navigasi</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                  ${isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }
                  ${item.highlight && !isActive ? "bg-gradient-to-r from-violet-50 to-blue-50 text-violet-700 border border-violet-200" : ""}
                `}
              >
                {TAB_ICONS[item.key]}
                {language === "EN" ? item.labelEN : item.labelID}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
