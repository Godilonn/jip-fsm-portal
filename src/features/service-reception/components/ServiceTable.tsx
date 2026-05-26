/**
 * @file features/service-reception/components/ServiceTable.tsx
 * @description Tabel tiket layanan printer — versi UPGRADED (Fase 3).
 *
 * INOVASI:
 * 1. DUAL-MODE RESPONSIVE — Desktop tabel / Mobile card stack
 * 2. STATUS FILTER CHIPS  — Horizontal scrollable chip bar + badge count
 * 3. PRIORITY LEFT BORDER — Merah >7h / Kuning 3-7h / Hijau <3h atau selesai
 * 4. SKELETON LOADING     — Prop isLoading → shimmer cards/rows
 * 5. MOTION STAGGER       — Tiap baris/card masuk dengan delay 0.03-0.04s
 * 6. MOBILE ACTION MENU   — ··· dropdown untuk Edit & Hapus di layar kecil
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit3, Trash2, ClipboardCheck, MoreVertical } from "lucide-react";
import { StatusBadge, GaransiBadge } from "../../../components/shared/StatusBadge";
import { SkeletonServiceCard, SkeletonTableRow } from "../../../components/ui/Skeleton";
import type { PrinterService, ServiceStatus, UserRole } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { label: string; value: ServiceStatus | "Semua" }[] = [
  { label: "Semua",       value: "Semua" },
  { label: "Diterima",    value: "Diterima" },
  { label: "Diagnosa AI", value: "Diagnosa AI" },
  { label: "Perbaikan",   value: "Perbaikan" },
  { label: "SPH Dibuat",  value: "SPH Dibuat" },
  { label: "Selesai",     value: "Selesai" },
  { label: "Diambil",     value: "Diambil" },
  { label: "Open",        value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved",    value: "RESOLVED" },
];

function getTicketAgeDays(tanggalTerima: string): number {
  const received = new Date(tanggalTerima).getTime();
  return Math.floor((Date.now() - received) / (1000 * 60 * 60 * 24));
}

function getPriorityBorder(service: PrinterService): string {
  const done: ServiceStatus[] = ["Selesai", "Diambil", "RESOLVED", "CLOSED"];
  if (done.includes(service.statusServis)) return "border-l-4 border-l-emerald-400";
  const age = getTicketAgeDays(service.tanggalTerima);
  if (age > 7) return "border-l-4 border-l-rose-500";
  if (age > 3) return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-sky-400";
}

function getPriorityDot(service: PrinterService): string {
  const done: ServiceStatus[] = ["Selesai", "Diambil", "RESOLVED", "CLOSED"];
  if (done.includes(service.statusServis)) return "bg-emerald-400";
  const age = getTicketAgeDays(service.tanggalTerima);
  if (age > 7) return "bg-rose-500";
  if (age > 3) return "bg-amber-400";
  return "bg-sky-400";
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceTableProps {
  services: PrinterService[];
  selectedId: string | null;
  onSelect: (service: PrinterService) => void;
  onEdit: (service: PrinterService) => void;
  onDelete: (id: string) => void;
  currentUserRole?: UserRole;
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE ACTION MENU
// ─────────────────────────────────────────────────────────────────────────────

function MobileActionMenu({
  service,
  onEdit,
  onDelete,
}: {
  service: PrinterService;
  onEdit: (s: PrinterService) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Aksi"
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 min-w-[140px]"
            >
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit(service); setOpen(false); }}
              >
                <Edit3 size={13} className="text-indigo-500" /> Edit Tiket
              </button>
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(service.id); setOpen(false); }}
              >
                <Trash2 size={13} /> Hapus Tiket
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE CARD
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({
  service, isSelected, canEdit, onSelect, onEdit, onDelete, index,
}: {
  service: PrinterService;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: (s: PrinterService) => void;
  onEdit: (s: PrinterService) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const age = getTicketAgeDays(service.tanggalTerima);
  const dot = getPriorityDot(service);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      onClick={() => onSelect(service)}
      className={`
        relative rounded-2xl border cursor-pointer transition-all duration-150
        ${getPriorityBorder(service)}
        ${isSelected
          ? "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100/60"
          : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm active:scale-[0.99]"}
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
              {service.id}
            </span>
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
              {service.device}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={service.statusServis} />
            {canEdit && <MobileActionMenu service={service} onEdit={onEdit} onDelete={onDelete} />}
          </div>
        </div>

        <p className="font-semibold text-sm text-slate-900 leading-tight mb-0.5">{service.customer}</p>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-2">
          <span>SN: {service.serialNumber}</span>
          <span>·</span>
          <span className={`flex items-center gap-1 font-semibold ${age > 7 ? "text-rose-500" : age > 3 ? "text-amber-500" : "text-emerald-500"}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
            {age} hr lalu
          </span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{service.keluhan}</p>

        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
          <GaransiBadge status={service.statusGaransi} />
          {service.assignee && service.assignee !== "Unassigned" && (
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
              {service.assignee}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ServiceTable({
  services, selectedId, onSelect, onEdit, onDelete, currentUserRole, isLoading = false,
}: ServiceTableProps) {
  const canEdit = currentUserRole !== "CUSTOMER";
  const [activeFilter, setActiveFilter] = useState<ServiceStatus | "Semua">("Semua");

  const statusCounts = useMemo(() => {
    const c: Partial<Record<ServiceStatus | "Semua", number>> = { Semua: services.length };
    for (const s of services) c[s.statusServis] = (c[s.statusServis] ?? 0) + 1;
    return c;
  }, [services]);

  const filtered = useMemo(() =>
    activeFilter === "Semua" ? services : services.filter((s) => s.statusServis === activeFilter),
    [services, activeFilter]
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <ClipboardCheck size={17} className="text-indigo-600 shrink-0" />
          Daftar Pelaporan Masuk &amp; Hasil Uji
        </h3>
        <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold shrink-0">
          {services.length} Total
        </span>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-2.5 border-b border-slate-100 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 w-max">
          {STATUS_FILTERS.map(({ label, value }) => {
            const count = statusCounts[value as keyof typeof statusCounts] ?? 0;
            if (value !== "Semua" && count === 0) return null;
            const active = activeFilter === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold
                  transition-all duration-150 whitespace-nowrap border
                  ${active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE: Card stack */}
      <div className="lg:hidden p-4 space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonServiceCard key={i} />)
          : filtered.length === 0
            ? (
              <div className="text-center py-12 text-sm text-slate-400">
                <ClipboardCheck size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Tidak ada tiket ditemukan</p>
                <p className="text-xs mt-1">Coba ubah filter status di atas</p>
              </div>
            )
            : (
              <AnimatePresence>
                {filtered.map((s, i) => (
                  <ServiceCard
                    key={s.id} service={s} isSelected={selectedId === s.id}
                    canEdit={canEdit} onSelect={onSelect} onEdit={onEdit}
                    onDelete={onDelete} index={i}
                  />
                ))}
              </AnimatePresence>
            )
        }
      </div>

      {/* DESKTOP: Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
              <th className="py-3 px-4 w-2">·</th>
              <th className="py-3 px-4">ID / Unit</th>
              <th className="py-3 px-4">Dinas / Instansi</th>
              <th className="py-3 px-3">Garansi</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Usia Tiket</th>
              {canEdit && <th className="py-3 px-4 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={canEdit ? 7 : 6} />
                ))
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="text-center py-12 text-sm text-slate-400">
                      <ClipboardCheck size={28} className="mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada tiket dengan status ini.</p>
                    </td>
                  </tr>
                )
                : filtered.map((service, i) => {
                    const isSelected = selectedId === service.id;
                    const age = getTicketAgeDays(service.tanggalTerima);
                    const dot = getPriorityDot(service);
                    return (
                      <motion.tr
                        key={service.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.18, delay: i * 0.03 }}
                        onClick={() => onSelect(service)}
                        className={`cursor-pointer transition-colors duration-100 group
                          ${getPriorityBorder(service)}
                          ${isSelected ? "bg-indigo-50/80 hover:bg-indigo-50" : "hover:bg-slate-50/70"}`}
                      >
                        <td className="pl-4 pr-1 py-3.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-semibold text-indigo-700">{service.id}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                              {service.device}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">SN: {service.serialNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-800 text-sm">{service.customer}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[220px] mt-0.5">{service.keluhan}</div>
                        </td>
                        <td className="px-3 py-3.5"><GaransiBadge status={service.statusGaransi} /></td>
                        <td className="px-3 py-3.5"><StatusBadge status={service.statusServis} /></td>
                        <td className="px-3 py-3.5">
                          <span
                            title={`${age} hari sejak tiket diterima`}
                            className={`text-[11px] font-bold font-mono flex items-center gap-1
                            ${age > 7 ? "text-rose-600" : age > 3 ? "text-amber-600" : "text-emerald-600"}`}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
                            {age} hr
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                                title="Edit tiket"
                                className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
                                title="Hapus tiket"
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Menampilkan {filtered.length} dari {services.length} tiket
          </span>
          {activeFilter !== "Semua" && (
            <button
              type="button"
              onClick={() => setActiveFilter("Semua")}
              className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
            >
              Hapus filter x
            </button>
          )}
        </div>
      )}
    </div>
  );
}
