/**
 * @file types/index.ts
 * @description Sumber kebenaran tunggal semua tipe data JIP FSM Portal.
 * Re-export dari sini agar import path konsisten di seluruh codebase.
 *
 * Perubahan dari types.ts lama:
 *  - Ditambah TabKey union type (untuk navigasi)
 *  - Ditambah SystemNotification (dipindah dari App.tsx)
 *  - Ditambah ToastItem
 *  - Semua tipe lama dipertahankan 1:1
 */

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGASI
// ─────────────────────────────────────────────────────────────────────────────

export type TabKey =
  | "dashboard"
  | "penerimaan"
  | "sph"
  | "logistics"
  | "ai"
  | "downloads"
  | "settings";

// ─────────────────────────────────────────────────────────────────────────────
// USER & AUTH
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "CUSTOMER" | "TECHNICIAN" | "DISPATCHER" | "MANAGER";
export type TechPresence = "AVAILABLE" | "ON_FIELD" | "OUT_OF_TOWN";
export type Language = "ID" | "EN";

export interface UserSession {
  id?: string;           // DB user id (dari Better Auth)
  username: string;
  email?: string;        // Email untuk login Better Auth
  password?: string;     // Hanya dipakai mode in-memory
  fullName: string;
  role: UserRole;
  avatar?: string;
  customerCompany?: string;
  presence?: TechPresence;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFIKASI & TOAST (dipindah dari App.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export type NotifType = "info" | "warning" | "critical" | "success";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  timestamp: string;
  read: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: NotifType;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN — Printer Service
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceStatus =
  | "Diterima"
  | "Diagnosa AI"
  | "SPH Dibuat"
  | "Perbaikan"
  | "Selesai"
  | "Diambil"
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING"
  | "IN_TRANSIT"
  | "RESOLVED"
  | "CLOSED"
  | "EN_ROUTE"
  | "ON_SITE";

export type SlaStatus = "START" | "RUNNING" | "PAUSED" | "STOPPED";
export type TicketType = "INCIDENT" | "TASK/DEMO";
export type GaransiStatus = "Garansi" | "Non-Garansi";

export interface PrinterService {
  id: string;
  device: string;
  customer: string;
  serialNumber: string;
  keluhan: string;
  kelengkapan: {
    ribbon: boolean;
    film: boolean;
    catrigeFilm: boolean;
    catrigeRibbon: boolean;
    adaptor: boolean;
    kabelUsb: boolean;
    lainnya: string;
  };
  tanggalTerima: string;
  statusGaransi: GaransiStatus;
  hasilPengecekan?: string;
  catatanRekomendasi?: string;
  namaTs: string;
  statusServis: ServiceStatus;
  finalKerusakan?: string;
  sphId?: string;
  actionLogs?: string[];
  slaStatus?: SlaStatus;
  slaTimeStart?: string;
  isLocked?: boolean;
  assignee?: string;
  csatRating?: number;
  csatComment?: string;
  ticketType?: TicketType;
  travelSlaMinutes?: number;
  repairSlaMinutes?: number;
  travelSlaStatus?: SlaStatus;
  repairSlaStatus?: SlaStatus;
  gpsCheckInTime?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN — SPH (Surat Penawaran Harga)
// ─────────────────────────────────────────────────────────────────────────────

export type SphChargeStatus = "Garansi" | "Free of Charge" | "Bayar";

export interface SPHItem {
  id: string;
  itemNumber: string;
  partNumber: string;
  namaPart: string;
  qty: number;
  satuan: string;   // pcs / unit / set / ea / dll
  harga: number;
  jumlah: number;
}

export interface SPH {
  id: string;
  nomorSurat: string;
  tanggal: string;
  dinasMana: string;
  statusCharge: SphChargeStatus;
  items: SPHItem[];
  subtotal: number;
  ppn: number;
  total: number;
  serviceId?: string;
  catatan?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN — Logistik
// ─────────────────────────────────────────────────────────────────────────────

export type LogistikStatus = "Menunggu" | "Dalam Perjalanan" | "Sampai" | "Diterima";
export type PackingStatus = "PENDING" | "READY_TO_PACK" | "PACKED" | "SHIPPED";

export interface BarangAktif {
  id: string;
  noResi: string;
  barang: string;
  berat: number;
  ukuran: string;
  pemilik: string;
  tujuan: string;
  status: LogistikStatus;
  packingStatus?: PackingStatus;
  scheduleShipping?: string;
  serviceId?: string;
  tanggalKirim?: string;
  estimasiTiba?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN — Inventori
// ─────────────────────────────────────────────────────────────────────────────

export type StokStatus = "Tersedia" | "Habis" | "Stok Rendah" | "Hampir Habis";
export type KondisiAset = "Bagus" | "Rusak" | "Perlu Servis";
export type StatusAset = "Tersedia" | "Dipinjam" | "Maintenance";

export interface SparepartItem {
  id: string;
  kodeItem: string;
  partNumber: string;
  namaBarang: string;
  kategori: string;
  stok: number;
  harga: number;
  status: StokStatus;
  untukMesinApa: string;
  satuan?: string;
}

export interface ATKItem {
  id: string;
  kode: string;
  namaBarang: string;
  kategori: string;
  stok: number;
  status: StokStatus;
  satuan?: string;
}

export interface AsetDemoItem {
  id: string;
  kode: string;
  namaBarang: string;
  jenis: string;
  kondisi: KondisiAset;
  status: StatusAset;
  lokasi: string;
  keterangan: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN — AI Agent Chat
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export type MandatKeputusan = "Pandu" | "Remote" | "Kirim Service Center";

export interface DiagnosaResult {
  analisis: string;
  rekomendasiTindakan: string;
  sparepartsDibutuhkan: {
    namaPart: string;
    partNumber: string;
    estimasiQty: number;
    estimasiHarga: number;
  }[];
  keputusanMandat: MandatKeputusan;
}
