import React from "react";
import type { ServiceStatus, GaransiStatus, StokStatus, SphChargeStatus } from "../../types";

// ── StatusBadge (tiket servis) ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  OPEN:       { label: "OPEN",       cls: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS:{ label: "IN PROGRESS",cls: "bg-amber-100 text-amber-700 border-amber-200" },
  PENDING:    { label: "PENDING",    cls: "bg-purple-100 text-purple-700 border-purple-200" },
  RESOLVED:   { label: "RESOLVED",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CLOSED:     { label: "CLOSED",    cls: "bg-slate-100 text-slate-500 border-slate-200" },
  CANCELLED:  { label: "CANCELLED", cls: "bg-rose-100 text-rose-600 border-rose-200" },
};

export function StatusBadge({ status }: { status: ServiceStatus | string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── GaransiBadge ─────────────────────────────────────────────────────────────
export function GaransiBadge({ status }: { status: GaransiStatus | string }) {
  const isGaransi = status === "Garansi";
  return (
    <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2 py-0.5 ${
      isGaransi
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : "bg-slate-100 text-slate-500 border-slate-200"
    }`}>
      {isGaransi ? "✓ Garansi" : "Non-Garansi"}
    </span>
  );
}

// ── StokBadge ─────────────────────────────────────────────────────────────────
export function StokBadge({ stok }: { stok: number }) {
  if (stok === 0) return (
    <span className="inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 bg-rose-100 text-rose-700 border-rose-200">
      Habis
    </span>
  );
  if (stok < 3) return (
    <span className="inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-700 border-amber-200">
      Menipis
    </span>
  );
  return (
    <span className="inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-200">
      Tersedia
    </span>
  );
}

// ── TicketTypeBadge ───────────────────────────────────────────────────────────
export function TicketTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    "Hardware": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Software": "bg-sky-100 text-sky-700 border-sky-200",
    "Kalibrasi": "bg-violet-100 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 ${map[type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {type}
    </span>
  );
}

// ── SphChargeBadge ────────────────────────────────────────────────────────────
export function SphChargeBadge({ status }: { status: SphChargeStatus | string }) {
  const map: Record<string, { label: string; cls: string }> = {
    "Bayar":           { label: "Berbayar", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    "Free of Charge":  { label: "Gratis",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    "Pending":         { label: "Pending",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2.5 py-0.5 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
