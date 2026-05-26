import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;       // alias for open (legacy callers)
  onClose: () => void;
  title?: string;
  headerIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const sizeClass = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-5xl",
};

export default function Modal({
  open,
  isOpen,
  onClose,
  title,
  headerIcon,
  children,
  footer,
  size = "md",
  className = "",
}: ModalProps) {
  const visible = open ?? isOpen ?? false;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (visible) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass[size]} max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || headerIcon) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              {headerIcon}
              {title && <h2 className="text-base font-bold text-slate-800">{title}</h2>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
