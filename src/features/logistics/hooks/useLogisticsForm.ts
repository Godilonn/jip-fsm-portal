/**
 * @file features/logistics/hooks/useLogisticsForm.ts
 * @description Custom hooks untuk semua form state di LogistikInventori.
 *
 * MENGGANTIKAN: 29 useState flat di LogistikInventori.tsx (baris 51-89).
 * 4 form berbeda (logistik, sparepart, ATK, aset) dikelola terpisah.
 */

import { useState, useCallback } from "react";
import { todayIso } from "../../../lib/utils";
import type {
  BarangAktif,
  SparepartItem,
  ATKItem,
  AsetDemoItem,
} from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// LOGISTIK FORM
// ─────────────────────────────────────────────────────────────────────────────

export interface LogistikFormState {
  noResi: string;
  barang: string;
  berat: number;
  ukuran: string;
  pemilik: string;
  tujuan: string;
  status: BarangAktif["status"];
}

const INIT_LOGISTIK: LogistikFormState = {
  noResi: "", barang: "", berat: 0, ukuran: "",
  pemilik: "", tujuan: "", status: "Menunggu",
};

export function useLogistikForm() {
  const [form, setForm] = useState<LogistikFormState>(INIT_LOGISTIK);
  const setField = useCallback(<K extends keyof LogistikFormState>(k: K, v: LogistikFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);
  const reset = useCallback(() => setForm(INIT_LOGISTIK), []);
  const load = useCallback((item: BarangAktif) => {
    setForm({ noResi: item.noResi, barang: item.barang, berat: item.berat, ukuran: item.ukuran, pemilik: item.pemilik, tujuan: item.tujuan, status: item.status });
  }, []);
  const toPayload = useCallback((): Omit<BarangAktif, "id"> => ({ ...form }), [form]);
  return { form, setField, reset, load, toPayload };
}

// ─────────────────────────────────────────────────────────────────────────────
// SPAREPART FORM
// ─────────────────────────────────────────────────────────────────────────────

export interface SparepartFormState {
  kodeItem: string;
  partNumber: string;
  namaBarang: string;
  kategori: string;
  stok: number;
  harga: number;
  untukMesinApa: string;
}

const INIT_SPAREPART: SparepartFormState = {
  kodeItem: "", partNumber: "", namaBarang: "",
  kategori: "", stok: 0, harga: 0, untukMesinApa: "",
};

export function useSparepartForm() {
  const [form, setForm] = useState<SparepartFormState>(INIT_SPAREPART);
  const setField = useCallback(<K extends keyof SparepartFormState>(k: K, v: SparepartFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);
  const reset = useCallback(() => setForm(INIT_SPAREPART), []);
  const load = useCallback((item: SparepartItem) => {
    setForm({ kodeItem: item.kodeItem, partNumber: item.partNumber, namaBarang: item.namaBarang, kategori: item.kategori, stok: item.stok, harga: item.harga, untukMesinApa: item.untukMesinApa });
  }, []);
  const toPayload = useCallback((): Omit<SparepartItem, "id" | "status"> => ({ ...form }), [form]);
  return { form, setField, reset, load, toPayload };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATK FORM
// ─────────────────────────────────────────────────────────────────────────────

export interface AtkFormState {
  kode: string;
  namaBarang: string;
  kategori: string;
  stok: number;
}

const INIT_ATK: AtkFormState = { kode: "", namaBarang: "", kategori: "", stok: 0 };

export function useAtkForm() {
  const [form, setForm] = useState<AtkFormState>(INIT_ATK);
  const setField = useCallback(<K extends keyof AtkFormState>(k: K, v: AtkFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);
  const reset = useCallback(() => setForm(INIT_ATK), []);
  const load = useCallback((item: ATKItem) => {
    setForm({ kode: item.kode, namaBarang: item.namaBarang, kategori: item.kategori, stok: item.stok });
  }, []);
  const toPayload = useCallback((): Omit<ATKItem, "id" | "status"> => ({ ...form }), [form]);
  return { form, setField, reset, load, toPayload };
}

// ─────────────────────────────────────────────────────────────────────────────
// ASET FORM
// ─────────────────────────────────────────────────────────────────────────────

export interface AsetFormState {
  kode: string;
  namaBarang: string;
  jenis: string;
  kondisi: AsetDemoItem["kondisi"];
  status: AsetDemoItem["status"];
  lokasi: string;
  keterangan: string;
}

const INIT_ASET: AsetFormState = {
  kode: "", namaBarang: "", jenis: "", kondisi: "Bagus",
  status: "Tersedia", lokasi: "", keterangan: "",
};

export function useAsetForm() {
  const [form, setForm] = useState<AsetFormState>(INIT_ASET);
  const setField = useCallback(<K extends keyof AsetFormState>(k: K, v: AsetFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);
  const reset = useCallback(() => setForm(INIT_ASET), []);
  const load = useCallback((item: AsetDemoItem) => {
    setForm({ kode: item.kode, namaBarang: item.namaBarang, jenis: item.jenis, kondisi: item.kondisi, status: item.status, lokasi: item.lokasi, keterangan: item.keterangan });
  }, []);
  const toPayload = useCallback((): Omit<AsetDemoItem, "id"> => ({ ...form }), [form]);
  return { form, setField, reset, load, toPayload };
}
