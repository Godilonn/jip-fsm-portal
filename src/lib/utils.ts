/**
 * @file lib/utils.ts
 * @description Utility functions — sumber kebenaran tunggal untuk formatting,
 * class merging, dan helper umum yang dipakai di seluruh codebase.
 *
 * Aturan:
 *  - Semua fungsi harus pure (no side effects)
 *  - Tidak boleh import dari komponen React
 *  - Tidak boleh import dari store/context
 */

// ─────────────────────────────────────────────────────────────────────────────
// CLASS MERGING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gabungkan class string dengan aman — membuang nilai falsy.
 * Pengganti sederhana untuk `clsx` / `tailwind-merge` tanpa dependency tambahan.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-600", undefined) // "px-4 py-2 bg-blue-600"
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT CURRENCY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format angka ke format Rupiah Indonesia.
 * @example formatRp(5500000) → "Rp 5.500.000"
 */
export function formatRp(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka ke string dengan titik ribuan (tanpa prefix Rp).
 * @example formatNumber(5500000) → "5.500.000"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format ISO date string ke tanggal Indonesia.
 * @example formatDate("2026-01-15") → "15 Januari 2026"
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return "-";
  try {
    return new Date(isoDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Format ISO date ke format pendek (dd/mm/yyyy).
 * @example formatDateShort("2026-01-15") → "15/01/2026"
 */
export function formatDateShort(isoDate: string): string {
  if (!isoDate) return "-";
  try {
    return new Date(isoDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Ambil timestamp sekarang dalam format ISO (hanya tanggal).
 * @example todayIso() → "2026-05-23"
 */
export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// STRING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Potong string panjang dengan ellipsis.
 * @example truncate("Panjang sekali teks ini", 15) → "Panjang sekali..."
 */
export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

/**
 * Generate ID random dengan prefix.
 * @example genId("PRN") → "PRN-8a2f"
 */
export function genId(prefix: string = "ID"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Cek apakah string adalah ID tiket valid (format PRN-XXXX).
 */
export function isTicketId(str: string): boolean {
  return /^PRN-/i.test(str);
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hitung subtotal dari array items SPH.
 */
export function calcSubtotal(items: { jumlah: number }[]): number {
  return items.reduce((sum, item) => sum + item.jumlah, 0);
}

/**
 * Hitung PPN 11%.
 */
export function calcPpn(subtotal: number, rate = 0.11): number {
  return Math.round(subtotal * rate);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARRAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter array berdasarkan search term (case-insensitive, multi-field).
 */
export function filterBySearch<T>(
  items: T[],
  term: string,
  getFields: (item: T) => string[]
): T[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    getFields(item).some((field) => field?.toLowerCase().includes(lower))
  );
}
