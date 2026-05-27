/**
 * @file features/sph/hooks/useSphForm.ts
 * @description Custom hook untuk form pembuatan SPH (Surat Penawaran Harga).
 *
 * MENGGANTIKAN: 18 useState flat di AdministrasiSPH.tsx (baris 73-87).
 * Menyimpan semua state form SPH + line items + quick-add part lookup.
 */

import { useState, useCallback } from "react";
import { todayIso, calcSubtotal, calcPpn } from "../../../lib/utils";
import type { SPH, SPHItem, PrinterService, SparepartItem } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// FORM STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface SphFormState {
  nomorSurat: string;
  tanggal: string;
  dinasMana: string;
  statusCharge: SPH["statusCharge"];
  linkedServiceId: string;
}

export interface PartInputState {
  selectedPartId: string;
  customPartName: string;
  customPartNo: string;
  customSatuan: string;   // pcs / unit / set / ea / dll
  customPrice: number;
  customQty: number;
}

const INIT_FORM: SphFormState = {
  nomorSurat: "",
  tanggal: todayIso(),
  dinasMana: "",
  statusCharge: "Bayar",
  linkedServiceId: "",
};

const INIT_PART: PartInputState = {
  selectedPartId: "",
  customPartName: "",
  customPartNo: "",
  customSatuan: "pcs",
  customPrice: 0,
  customQty: 1,
};

// Helper agar setelah reset, harga field benar-benar kosong (bukan 0)
export const EMPTY_PART = INIT_PART;

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useSphForm() {
  const [form, setForm] = useState<SphFormState>(INIT_FORM);
  const [items, setItems] = useState<Omit<SPHItem, "id">[]>([]);
  const [partInput, setPartInput] = useState<PartInputState>(INIT_PART);

  // ── Field setters ───────────────────────────────────────────────────────
  const setField = useCallback(<K extends keyof SphFormState>(k: K, v: SphFormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  const setPartField = useCallback(<K extends keyof PartInputState>(k: K, v: PartInputState[K]) => {
    setPartInput((p) => ({ ...p, [k]: v }));
  }, []);

  // ── Init for new SPH ────────────────────────────────────────────────────
  const initForNew = useCallback((sphCount: number, service?: PrinterService) => {
    const quoteNo = `SPH/PNT/V/2026/${String(sphCount + 1).padStart(3, "0")}`;
    setForm({
      nomorSurat: quoteNo,
      tanggal: todayIso(),
      dinasMana: service ? service.customer : "",
      statusCharge: service?.statusGaransi === "Garansi" ? "Garansi" : "Bayar",
      linkedServiceId: service ? service.id : "",
    });
    setItems([]);
    setPartInput(INIT_PART);
  }, []);

  // ── Lookup part from spareparts ─────────────────────────────────────────
  const lookupPart = useCallback((partId: string, spareparts: SparepartItem[]) => {
    setPartInput((p) => {
      if (partId === "custom") {
        return { ...INIT_PART, selectedPartId: "custom" };
      }
      const part = spareparts.find((sp) => sp.id === partId);
      if (part) {
        return {
          selectedPartId: partId,
          customPartName: part.namaBarang,
          customPartNo: part.partNumber,
          customSatuan: part.satuan || "pcs",
          customPrice: part.harga,
          customQty: 1,
        };
      }
      return { ...INIT_PART, selectedPartId: partId };
    });
  }, []);

  // ── Service selection auto-fills dinas + statusCharge ─────────────────
  const selectService = useCallback((serviceId: string, services: PrinterService[]) => {
    const service = services.find((s) => s.id === serviceId);
    setField("linkedServiceId", serviceId);
    if (service) {
      setField("dinasMana", service.customer);
      setField("statusCharge", service.statusGaransi === "Garansi" ? "Garansi" : "Bayar");
    }
  }, [setField]);

  // ── Add line item ───────────────────────────────────────────────────────
  const addItem = useCallback((): string | null => {
    const { customPartName, customPartNo, customSatuan, customPrice, customQty } = partInput;
    if (!customPartName.trim()) {
      return "Nama part wajib diisi.";
    }
    if (customPrice <= 0) {
      return "Harga satuan harus lebih dari 0.";
    }
    if (customQty <= 0) {
      return "Qty harus lebih dari 0.";
    }
    const newItem: Omit<SPHItem, "id"> = {
      itemNumber: String(items.length + 1),
      partNumber: customPartNo || "NP-CUSTOM",
      namaPart: customPartName,
      qty: Number(customQty),
      satuan: customSatuan || "pcs",
      harga: Number(customPrice),
      jumlah: Number(customQty) * Number(customPrice),
    };
    setItems((prev) => [...prev, newItem]);
    setPartInput(INIT_PART);
    return null; // no error
  }, [partInput, items.length]);

  // ── Remove line item ────────────────────────────────────────────────────
  const removeItem = useCallback((index: number) => {
    setItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((it, i) => ({ ...it, itemNumber: String(i + 1) }))
    );
  }, []);

  // ── Build payload for API ───────────────────────────────────────────────
  const toPayload = useCallback((): Omit<SPH, "id"> | null => {
    if (!form.nomorSurat || !form.dinasMana || items.length === 0) return null;
    const subtotal = calcSubtotal(items.map((i) => ({ jumlah: i.jumlah })));
    const ppn = 0; // PPN dihapus sesuai kebijakan
    const total = subtotal;
    return {
      nomorSurat: form.nomorSurat,
      tanggal: form.tanggal,
      dinasMana: form.dinasMana,
      statusCharge: form.statusCharge,
      items: items.map((it, idx) => ({ ...it, id: `IT-${idx}` })) as SPHItem[],
      subtotal,
      ppn,
      total,
      serviceId: form.linkedServiceId || undefined,
    };
  }, [form, items]);

  return {
    form,
    items,
    partInput,
    setField,
    setPartField,
    initForNew,
    lookupPart,
    selectService,
    addItem,
    removeItem,
    toPayload,
  };
}
