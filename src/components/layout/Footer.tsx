import React from "react";
import { APP_META } from "../../lib/constants";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 px-6 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <p className="text-[11px] text-slate-500">{APP_META.copyright}</p>
        <p className="text-[11px] text-slate-600">{APP_META.fullName} · {APP_META.version}</p>
      </div>
    </footer>
  );
}
