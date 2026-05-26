/**
 * @file lib/fsm.ts
 * @description Konfigurasi State Machine untuk tiket layanan printer JIP.
 *
 * DIPINDAH DARI: src/components/PenerimaanPrinter.tsx (baris 22-298)
 *
 * Alasan ekstraksi:
 *  - Konfigurasi ini adalah BUSINESS LOGIC murni, bukan UI
 *  - Harus bisa diimpor dari mana saja tanpa menyentuh komponen React
 *  - Berpotensi dibagi ke server-side di Phase 3
 *
 * Juga berisi: getStatusBadgeStyle, getStatusLabelStr
 * (sebelumnya duplikat di PenerimaanPrinter + StatsDashboard)
 */

import type { ServiceStatus } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketEvent {
  next_state: ServiceStatus;
  actions: string[];
  label: string;
  description: string;
  colorClass: string;
}

export interface TicketStateConfig {
  description: string;
  sla_timer: "START" | "RUNNING" | "PAUSED" | "STOPPED";
  is_locked: boolean;
  trigger_events: Record<string, TicketEvent>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE MACHINE CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const TICKET_STATE_MACHINE: Record<string, TicketStateConfig> = {
  OPEN: {
    description: "Tiket baru di keranjang antrean (Pool).",
    sla_timer: "START",
    is_locked: false,
    trigger_events: {
      technician_clicks_take: {
        next_state: "ASSIGNED",
        actions: ["set_assignee_to_self", "stop_response_timer"],
        label: "Tarik Tiket (Take Tool)",
        description: "Tarik tiket mandiri dari Pool oleh Pekerja Lapangan (Technician).",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      admin_clicks_assign: {
        next_state: "ASSIGNED",
        actions: ["set_assignee_to_selected_tech", "stop_response_timer", "notify_tech"],
        label: "Tugaskan Teknisi (Assign Admin)",
        description: "Dispatcher merouting tiket ke staf khusus.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  ASSIGNED: {
    description: "Tiket sudah dipegang seseorang.",
    sla_timer: "RUNNING",
    is_locked: false,
    trigger_events: {
      depart_to_site: {
        next_state: "EN_ROUTE",
        actions: ["start_travel_sla", "pause_repair_sla"],
        label: "Mulai Jalan Kunjungan (Depart)",
        description: "Teknisi berangkat menuju lokasi pelanggan. Travel SLA Aktif.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      start_work_inhouse: {
        next_state: "IN_PROGRESS",
        actions: ["start_repair_sla_direct"],
        label: "Mulai Perbaikan In-House (Start Work)",
        description: "Pengerjaan workshop in-house. Repair SLA Aktif.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      admin_clicks_reassign: {
        next_state: "ASSIGNED",
        actions: ["change_assignee", "notify_old_tech", "notify_new_tech"],
        label: "Ubah Penugasan (Re-Assign Admin)",
        description: "Override memindahkan tanggung jawab penanganan.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      technician_returns_ticket: {
        next_state: "OPEN",
        actions: ["clear_assignee", "resume_response_timer"],
        label: "Kembalikan Ke Pool (Return)",
        description: "Lepaskan pengerjaan unit kembali ke antrean umum.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  EN_ROUTE: {
    description: "Teknisi dalam perjalanan (Mobile Visit). Travel SLA Aktif, Repair SLA Jeda.",
    sla_timer: "RUNNING",
    is_locked: false,
    trigger_events: {
      checkin_gps: {
        next_state: "ON_SITE",
        actions: ["stop_travel_sla", "start_repair_sla", "save_gps_timestamp"],
        label: "Check-in GPS Lokasi (Arrive)",
        description: "Teknisi tiba di lokasi fisik untuk pengerjaan aktif.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      technician_returns_ticket: {
        next_state: "OPEN",
        actions: ["clear_assignee", "resume_response_timer"],
        label: "Batalkan & Balik Pool (Return)",
        description: "Batal kunjungan, kembalikan pekerjaan ke pool.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  ON_SITE: {
    description: "Teknisi tiba & bekerja di lokasi pelanggan. Repair SLA Berjalan.",
    sla_timer: "RUNNING",
    is_locked: false,
    trigger_events: {
      repair_done_onsite: {
        next_state: "RESOLVED",
        actions: ["stop_repair_sla", "notify_customer", "start_grace_period_72h"],
        label: "Kunjungan Selesai (Resolve On-Site)",
        description: "Uji coba sukses. Masa jeda 3 hari berlaku jika INCIDENT.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      task_completed_direct: {
        next_state: "CLOSED",
        actions: ["bypass_grace_period", "lock_ticket"],
        label: "Selesaikan Tugas Direktif (Bypass & Close)",
        description: "Khusus tipe TASK/DEMO. Langsung tutup tanpa masa garansi.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      need_approval_or_part: {
        next_state: "PENDING",
        actions: ["pause_repair_sla"],
        label: "Tunda Sementara (Pending Part / PIC)",
        description: "Tertunda karena sparepart kurang atau PIC tidak di tempat.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  IN_PROGRESS: {
    description: "Teknisi sedang mengerjakan alat secara remote atau fisik.",
    sla_timer: "RUNNING",
    is_locked: false,
    trigger_events: {
      need_approval_or_part: {
        next_state: "PENDING",
        actions: ["pause_resolution_timer", "notify_customer"],
        label: "Butuh Persetujuan / SPH Part (Pending)",
        description: "Menunggu bendahara dinas menyetujui SPH / diskon atasan.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      repair_done_need_shipping: {
        next_state: "IN_TRANSIT",
        actions: ["pause_resolution_timer", "generate_waybill"],
        label: "Selesai & Kirim Logistik (In Transit)",
        description: "Perbaikan tuntas, teruskan unit ke kurir pengiriman.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      repair_done_onsite: {
        next_state: "RESOLVED",
        actions: ["stop_resolution_timer", "notify_customer", "start_grace_period_72h"],
        label: "Selesai di Tempat (Resolved On-Site)",
        description: "Serah terima di workshop JIP kepada delegasi dinas.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      task_completed_direct: {
        next_state: "CLOSED",
        actions: ["bypass_grace_period", "lock_ticket"],
        label: "Selesaikan Tugas Demo (Bypass & Close)",
        description: "Khusus tipe TASK/DEMO. Langsung tutup otomatis.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  PENDING: {
    description: "Pengerjaan tertunda (On-Hold) menunggu konfirmasi atau part.",
    sla_timer: "PAUSED",
    is_locked: false,
    trigger_events: {
      customer_approved_or_part_ready: {
        next_state: "IN_PROGRESS",
        actions: ["resume_resolution_timer"],
        label: "Atasan Setuju / Part Siap (Resume)",
        description: "Suku cadang siap atau BA SPH sudah ditandatangani.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      onsite_resume: {
        next_state: "ON_SITE",
        actions: ["resume_repair_sla"],
        label: "Lanjutkan Kerja On-Site (Resume)",
        description: "Hambatan teratasi, lanjutkan di lokasi fisik.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  IN_TRANSIT: {
    description: "Mesin sedang dikirim balik ke pelanggan via kurir.",
    sla_timer: "PAUSED",
    is_locked: false,
    trigger_events: {
      courier_delivered: {
        next_state: "RESOLVED",
        actions: ["stop_resolution_timer", "notify_customer", "start_grace_period_72h"],
        label: "Kurir Sukses Mengantar (Delivered)",
        description: "Unit printer beroperasi baik di lokasi dinas.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  RESOLVED: {
    description: "Perbaikan selesai, masa tunggu 3×24 jam dimulai.",
    sla_timer: "STOPPED",
    is_locked: false,
    trigger_events: {
      customer_complains: {
        next_state: "OPEN",
        actions: ["resume_resolution_timer", "flag_as_rework"],
        label: "Pelanggan Komplain (Rework)",
        description: "Uji coba gagal. Tiket digulirkan ulang ke awal.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
      grace_period_72h_timeout: {
        next_state: "CLOSED",
        actions: ["send_csat_survey", "lock_ticket"],
        label: "Tutup Tiket Permanen (Timeout)",
        description: "Masa tunggu 72 jam terlampaui aman. Tiket diarsipkan.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
  CLOSED: {
    description: "Tiket ditutup permanen. Masa garansi servis sudah lewat.",
    sla_timer: "STOPPED",
    is_locked: true,
    trigger_events: {
      customer_reply: {
        next_state: "OPEN",
        actions: ["create_new_ticket", "link_to_closed_ticket"],
        label: "Pelanggan Membalas (New Linked Ticket)",
        description: "Pelaporan susulan baru yang terkoneksi dengan tiket tertutup.",
        colorClass: "bg-indigo-700 hover:bg-indigo-800 text-white",
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS HELPERS — sebelumnya copy-paste di PenerimaanPrinter + StatsDashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kembalikan Tailwind class string untuk badge status tiket.
 * Dipakai di StatusBadge component dan seluruh tabel.
 */
export function getStatusBadgeStyle(status: ServiceStatus): string {
  switch (status) {
    case "OPEN":        return "bg-rose-50 text-rose-700 border border-rose-200 font-extrabold";
    case "ASSIGNED":    return "bg-sky-50 text-sky-700 border border-sky-200 font-bold";
    case "IN_PROGRESS": return "bg-amber-50 text-amber-700 border border-amber-200 font-bold animate-pulse";
    case "PENDING":     return "bg-orange-50 text-orange-700 border border-orange-200 font-bold";
    case "IN_TRANSIT":  return "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold";
    case "RESOLVED":    return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black";
    case "CLOSED":      return "bg-slate-100 text-slate-800 border border-slate-300 font-bold";
    case "EN_ROUTE":    return "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold animate-pulse";
    case "ON_SITE":     return "bg-teal-50 text-teal-700 border border-teal-200 font-bold";
    case "Selesai":
    case "Diambil":     return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium";
    case "Perbaikan":   return "bg-blue-50 text-blue-700 border border-blue-200 font-medium animate-pulse";
    case "SPH Dibuat":  return "bg-purple-50 text-purple-700 border border-purple-200 font-medium";
    default:            return "bg-slate-50 text-slate-600 border border-slate-200 font-medium";
  }
}

/**
 * Kembalikan label teks human-readable untuk status tiket.
 */
export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case "OPEN":        return "🔴 OPEN (New Ticket)";
    case "ASSIGNED":    return "🔵 ASSIGNED (Technician)";
    case "IN_PROGRESS": return "⚙️ IN PROGRESS (Active)";
    case "PENDING":     return "⏳ PENDING (On Hold)";
    case "IN_TRANSIT":  return "🚚 IN TRANSIT (Courier)";
    case "RESOLVED":    return "🟢 RESOLVED (Done)";
    case "CLOSED":      return "🔒 CLOSED (Archived)";
    case "EN_ROUTE":    return "✈️ EN ROUTE (Perjalanan)";
    case "ON_SITE":     return "📍 ON SITE (Tiba di Lokasi)";
    case "Perbaikan":   return "🛠️ Sedang Diperbaiki";
    case "Diterima":    return "📥 Diterima";
    case "SPH Dibuat":  return "📄 SPH Dibuat";
    case "Selesai":     return "✅ Selesai";
    case "Diambil":     return "📦 Diambil";
    default:            return String(status);
  }
}

/**
 * Semua value status yang valid untuk dropdown form.
 */
export const ALL_SERVICE_STATUSES: ServiceStatus[] = [
  "OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING",
  "EN_ROUTE", "ON_SITE", "IN_TRANSIT", "RESOLVED", "CLOSED",
  "Diterima", "Diagnosa AI", "SPH Dibuat", "Perbaikan", "Selesai", "Diambil",
];

/**
 * Daftar device yang dikenali sistem JIP.
 */
export const JIP_DEVICES = [
  "Em2s", "CR707", "SR200", "SD307", "CR805",
  "mini PC", "Alat rekam", "Lainnya",
] as const;
