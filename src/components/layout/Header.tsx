import React from "react";
import {
  Menu, Moon, Sun, Globe,
  LayoutDashboard, ClipboardList, FileText, Package,
  Download, Bot, Settings,
} from "lucide-react";
import { useApp } from "../../store/AppContext";
import { APP_META, getVisibleNavItems } from "../../lib/constants";
import NotificationPanel from "./NotificationPanel";
import type { TabKey } from "../../types";

const TAB_ICONS: Record<TabKey, React.ReactNode> = {
  dashboard:  <LayoutDashboard size={14} />,
  penerimaan: <ClipboardList size={14} />,
  sph:        <FileText size={14} />,
  logistics:  <Package size={14} />,
  downloads:  <Download size={14} />,
  ai:         <Bot size={14} />,
  settings:   <Settings size={14} />,
};

export default function Header() {
  const {
    activeTab, setActiveTab,
    isDarkMode, toggleDarkMode,
    language, toggleLanguage,
    mobileMenuOpen, setMobileMenuOpen,
    currentUser,
  } = useApp();

  const navItems = getVisibleNavItems(currentUser.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 py-0 flex items-center gap-3 h-14">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={18} />
        </button>

        {/* Logo / Brand */}
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">JIP</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{APP_META.fullName}</p>
            <p className="text-[9px] text-slate-400 leading-tight uppercase tracking-wider">{APP_META.company}</p>
          </div>
        </div>

        {/* Desktop nav tabs */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                  ${isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                    : "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600"
                  }
                  ${item.highlight && !isActive
                    ? "bg-gradient-to-r from-violet-50 to-blue-50 text-violet-700 border border-violet-200"
                    : ""
                  }
                `}
              >
                {TAB_ICONS[item.key]}
                {language === "EN" ? item.labelEN : item.labelID}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors text-[11px] font-bold"
            title="Toggle Language"
          >
            <Globe size={16} />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <NotificationPanel />
        </div>
      </div>
    </header>
  );
}
