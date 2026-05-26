/**
 * @file features/service-reception/hooks/useServiceForm.ts
 * @description Custom hook untuk state management form Penerimaan Printer.
 *
 * MENGGANTIKAN: 25 useState flat di PenerimaanPrinter.tsx (baris 349-372).
 *
 * SEBELUM (di komponen lama):
 *   const [customer, setCustomer] = useState("");
 *   const [device, setDevice] = useState("SR200");
 *   const [serialNumber, setSerialNumber] = useState("");
 *   ... (22 lagi)
 *
 * SESUDAH:
 *   const { form, setField, setKelengkapan, resetForm, toPayload } = useServiceForm();
 *   form.customer, form.device, dll...
 *
 * KEUNTUNGAN:
 *  - State form bisa di-reset dalam satu panggilan: resetForm()
 *  - Mudah di-test (pure TypeScript, tidak ada JSX)
 *  - Bisa dipakai kembali untuk Edit modal tanpa duplikasi
 */

import { useState, useCallback } from "react";
import type { PrinterService, GaransiStatus, ServiceStatus } from "../../../types";
import { todayIso } from "../../../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// FORM STATE TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceFormState {
  customer: string;
  device: string;
  serialNumber: string;
  keluhan: string;
  tanggalTerima: string;
  statusGaransi: GaransiStatus;
  namaTs: string;
  hasilPengecekan: string;
  catatanRekomendasi: string;
  statusServis: ServiceStatus;
  finalKerusakan: string;
  ticketType: "INCIDENT" | "TASK/DEMO";
  // Kelengkapan (dipisah agar mudah reset secara grup)
  kelengkapan: {
    ribbon: boolean;
    film: boolean;
    catrigeFilm: boolean;
    catrigeRibbon: boolean;
    adaptor: boolean;
    kabelUsb: boolean;
    lainnya: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_FORM: ServiceFormState = {
  customer: "",
  device: "SR200",
  serialNumber: "",
  keluhan: "",
  tanggalTerima: todayIso(),
  statusGaransi: "Garansi",
  namaTs: "",
  hasilPengecekan: "",
  catatanRekomendasi: "",
  statusServis: "Diterima",
  finalKerusakan: "",
  ticketType: "INCIDENT",
  kelengkapan: {
    ribbon: false,
    film: false,
    catrigeFilm: false,
    catrigeRibbon: false,
    adaptor: false,
    kabelUsb: false,
    lainnya: "",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useServiceForm() {
  const [form, setForm] = useState<ServiceFormState>(INITIAL_FORM);

  /** Set satu field form */
  const setField = useCallback(<K extends keyof Omit<ServiceFormState, "kelengkapan">>(
    key: K,
    value: ServiceFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Set satu field kelengkapan */
  const setKelengkapan = useCallback(<K extends keyof ServiceFormState["kelengkapan"]>(
    key: K,
    value: ServiceFormState["kelengkapan"][K]
  ) => {
    setForm((prev) => ({
      ...prev,
      kelengkapan: { ...prev.kelengkapan, [key]: value },
    }));
  }, []);

  /** Toggle boolean field kelengkapan */
  const toggleKelengkapan = useCallback((key: keyof Omit<ServiceFormState["kelengkapan"], "lainnya">) => {
    setForm((prev) => ({
      ...prev,
      kelengkapan: {
        ...prev.kelengkapan,
        [key]: !prev.kelengkapan[key],
      },
    }));
  }, []);

  /** Reset ke state awal */
  const resetForm = useCallback(() => {
    setForm({ ...INITIAL_FORM, tanggalTerima: todayIso() });
  }, []);

  /**
   * Populate form dari data service yang sudah ada (untuk mode Edit).
   */
  const loadFromService = useCallback((service: PrinterService) => {
    setForm({
      customer: service.customer,
      device: service.device,
      serialNumber: service.serialNumber,
      keluhan: service.keluhan,
      tanggalTerima: service.tanggalTerima,
      statusGaransi: service.statusGaransi,
      namaTs: service.namaTs,
      hasilPengecekan: service.hasilPengecekan ?? "",
      catatanRekomendasi: service.catatanRekomendasi ?? "",
      statusServis: service.statusServis,
      finalKerusakan: service.finalKerusakan ?? "",
      ticketType: service.ticketType ?? "INCIDENT",
      kelengkapan: {
        ribbon: service.kelengkapan.ribbon,
        film: service.kelengkapan.film,
        catrigeFilm: service.kelengkapan.catrigeFilm,
        catrigeRibbon: service.kelengkapan.catrigeRibbon,
        adaptor: service.kelengkapan.adaptor,
        kabelUsb: service.kelengkapan.kabelUsb,
        lainnya: service.kelengkapan.lainnya,
      },
    });
  }, []);

  /**
   * Konversi form state ke payload siap kirim ke API.
   * Mengembalikan Omit<PrinterService, "id"> — cocok untuk onAddService / onUpdateService.
   */
  const toPayload = useCallback((): Omit<PrinterService, "id"> => {
    return {
      customer: form.customer.trim(),
      device: form.device,
      serialNumber: form.serialNumber.trim(),
      keluhan: form.keluhan.trim(),
      tanggalTerima: form.tanggalTerima,
      statusGaransi: form.statusGaransi,
      namaTs: form.namaTs.trim(),
      hasilPengecekan: form.hasilPengecekan.trim() || undefined,
      catatanRekomendasi: form.catatanRekomendasi.trim() || undefined,
      statusServis: form.statusServis,
      finalKerusakan: form.finalKerusakan.trim() || undefined,
      ticketType: form.ticketType,
      kelengkapan: { ...form.kelengkapan },
    };
  }, [form]);

  return {
    form,
    setField,
    setKelengkapan,
    toggleKelengkapan,
    resetForm,
    loadFromService,
    toPayload,
  };
}
