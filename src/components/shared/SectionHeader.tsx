import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function SectionHeader({ title, subtitle, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
