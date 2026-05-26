/**
 * @file constants.ts
 * @description Konstanta global aplikasi JIP FSM Portal.
 * Sumber kebenaran tunggal untuk nav items, mock users, design tokens,
 * dan konfigurasi RBAC. Diimpor oleh komponen layout dan store.
 */

import type { UserSession, UserRole, TabKey } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITAS APLIKASI
// ─────────────────────────────────────────────────────────────────────────────

export const APP_META = {
  name: "JIP Service Portal",
  fullName: "Sistem Servis Center JIP",
  company: "PT. JASUINDO INFORMATIKA PRATAMA",
  version: "v2.5",
  build: "FSM Portal",
  copyright: `© ${new Date().getFullYear()} PT. Jasuindo Informatika Pratama`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGASI — sumber kebenaran untuk Header tabs & MobileMenu
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  key: TabKey;
  labelID: string;   // Bahasa Indonesia
  labelEN: string;   // English
  icon?: string;     // Lucide icon name (string) — komponen pilih icon sendiri
  /** Role yang DIIZINKAN melihat tab ini. Kosong = semua role. */
  allowedRoles?: UserRole[];
  /** Tampil sebagai highlight khusus (misal AI Agent) */
  highlight?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    labelID: "Dashboard",
    labelEN: "Dashboard",
    allowedRoles: ["MANAGER", "DISPATCHER", "TECHNICIAN"],
  },
  {
    key: "penerimaan",
    labelID: "Penerimaan",
    labelEN: "Receipts",
    // Semua role boleh akses
  },
  {
    key: "sph",
    labelID: "Administrasi SPH",
    labelEN: "Quotations",
    allowedRoles: ["MANAGER", "DISPATCHER", "TECHNICIAN"],
  },
  {
    key: "logistics",
    labelID: "Logistik",
    labelEN: "Logistics",
    allowedRoles: ["MANAGER", "DISPATCHER", "TECHNICIAN"],
  },
  {
    key: "downloads",
    labelID: "Unduh",
    labelEN: "Download",
  },
  {
    key: "ai",
    labelID: "AI Agent",
    labelEN: "AI Agent",
    highlight: true,
  },
  {
    key: "settings",
    labelID: "Pengaturan",
    labelEN: "Settings",
    allowedRoles: ["MANAGER"],
  },
];

/**
 * Filter nav items berdasarkan role user saat ini.
 * Item tanpa `allowedRoles` berarti tersedia untuk semua.
 */
export function getVisibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK USERS — hanya untuk demo/development; ganti dengan auth Prisma di Phase 2
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_USERS: UserSession[] = [
  {
    username: "bambang_manager",
    password: "manager123",
    fullName: "Bambang Utomo",
    role: "MANAGER",
  },
  {
    username: "rendra_dispatcher",
    password: "dispatcher123",
    fullName: "Rendra Hartono",
    role: "DISPATCHER",
  },
  {
    username: "eko_technician",
    password: "technician123",
    fullName: "Eko Prasetyo",
    role: "TECHNICIAN",
  },
  {
    username: "andi_customer",
    password: "customer123",
    fullName: "Andi Wijaya",
    role: "CUSTOMER",
    customerCompany: "Dinas Kependudukan",
  },
];

/** Default tab berdasarkan role setelah login */
export function getDefaultTab(role: UserRole): TabKey {
  return role === "CUSTOMER" ? "penerimaan" : "dashboard";
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — referensi class Tailwind yang dipakai konsisten di seluruh app
// Gunakan sebagai dokumentasi; komponen tetap pakai Tailwind class langsung.
// ─────────────────────────────────────────────────────────────────────────────

export const DESIGN = {
  /** Warna latar halaman utama */
  pageBg: "bg-[#F8FAFC]",

  /** Header putih */
  headerBg: "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm",

  /** RBAC Dock gelap */
  dockBg: "bg-slate-900 border-b border-slate-800",

  /** Card standar */
  card: "bg-white border border-slate-200 rounded-xl shadow-sm",
  cardLg: "bg-white border border-slate-200 rounded-2xl shadow-sm",

  /** Nav item aktif (header tab) */
  navActive: "bg-blue-600 text-white shadow-sm shadow-blue-100",
  /** Nav item tidak aktif */
  navInactive: "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600",

  /** Badge role di RBAC dock */
  roleBadgeActive: "bg-blue-600 text-white border-blue-500 shadow-md",
  roleBadgeInactive: "bg-slate-800 text-slate-300 border-slate-700 hover:bg-blue-600/10 hover:text-blue-500 hover:border-blue-500/40",

  /** Input standar */
  input: "bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 outline-none transition-all",

  /** CTA button utama */
  btnPrimary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold tracking-wider transition-all shadow-md",

  /** Notifikasi colors */
  notifCritical: "bg-rose-50 border-rose-200",
  notifWarning: "bg-amber-50 border-amber-200",
  notifInfo: "bg-indigo-50 border-indigo-200",
  notifSuccess: "bg-emerald-50 border-emerald-200",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// RBAC — aksi yang diizinkan per role (diperluas di Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export const RBAC_PERMISSIONS: Record<UserRole, string[]> = {
  MANAGER: ["view:all", "edit:all", "delete:all", "approve:sph", "switch:role"],
  DISPATCHER: ["view:all", "edit:service", "edit:logistics", "create:sph"],
  TECHNICIAN: ["view:assigned", "edit:service:own", "update:status"],
  CUSTOMER: ["view:own", "submit:report"],
};

export function hasPermission(role: UserRole, action: string): boolean {
  const perms = RBAC_PERMISSIONS[role] ?? [];
  return perms.includes(action) || perms.includes("edit:all") || perms.includes("view:all");
}

// ─────────────────────────────────────────────────────────────────────────────
// API ENDPOINTS — sinkron dengan server/src/api/routes/
// ─────────────────────────────────────────────────────────────────────────────

export const API = {
  printers: "/api/printers",
  sph: "/api/sph",
  logistics: "/api/logistics",
  spareparts: "/api/inventory/spareparts",
  atk: "/api/inventory/atk",
  demoAssets: "/api/inventory/demo-assets",
} as const;
