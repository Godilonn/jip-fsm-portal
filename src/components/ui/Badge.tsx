import React from "react";

type BadgeVariant = "blue" | "green" | "red" | "yellow" | "gray" | "purple" | "indigo" | "orange" | "dark";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

const variantClass: Record<BadgeVariant, string> = {
  blue:   "bg-blue-100 text-blue-700 border-blue-200",
  green:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  red:    "bg-rose-100 text-rose-700 border-rose-200",
  yellow: "bg-amber-100 text-amber-700 border-amber-200",
  gray:   "bg-slate-100 text-slate-600 border-slate-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  dark:   "bg-slate-800 text-slate-100 border-slate-700",
};

export default function Badge({ variant = "gray", children, className = "", size = "sm" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center border rounded-full font-semibold
        ${size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"}
        ${variantClass[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}
