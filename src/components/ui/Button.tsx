import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning" | "dark";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:   "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-100",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
  ghost:     "bg-transparent hover:bg-slate-100 text-slate-600",
  danger:    "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  warning:   "bg-amber-500 hover:bg-amber-600 text-white shadow-sm",
  dark:      "bg-slate-800 hover:bg-slate-900 text-white shadow-sm",
};

const sizeClass: Record<Size, string> = {
  xs: "px-2 py-1 text-[11px]",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400/40
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClass[variant]} ${sizeClass[size]} ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
