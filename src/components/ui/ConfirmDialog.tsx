import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

interface ConfirmDialogProps {
  open?: boolean;
  isOpen?: boolean;       // alias for open (legacy callers)
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  destructive?: boolean;  // shorthand for variant="danger"
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;  // alias for onCancel
}

export default function ConfirmDialog({
  open,
  isOpen,
  title = "Konfirmasi",
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant,
  destructive,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) {
  const handleCancel = onCancel ?? onClose ?? (() => {});
  const visible = open ?? isOpen ?? false;
  const resolvedVariant = variant ?? (destructive ? "danger" : "primary");

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl ${
            resolvedVariant === "danger" ? "bg-rose-100"
            : resolvedVariant === "warning" ? "bg-amber-100"
            : "bg-blue-100"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              resolvedVariant === "danger" ? "text-rose-600"
              : resolvedVariant === "warning" ? "text-amber-600"
              : "text-blue-600"
            }`} />
          </div>
          <div>
            <p className="font-bold text-slate-800">{title}</p>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={resolvedVariant} size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
