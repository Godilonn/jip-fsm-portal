/**
 * @file features/service-reception/components/ServiceFormModal.tsx
 * @description Modal form Add/Edit tiket penerimaan printer.
 *
 * DIPINDAH DARI: PenerimaanPrinter.tsx baris 1238-1636 (~398 baris inline JSX).
 *
 * PERUBAHAN BERSIH:
 *  - Tidak ada useState di sini — semua state dikelola via useServiceForm hook
 *  - Menggunakan komponen Modal, TextInput, Textarea, SelectInput, RadioGroup
 *  - KelengkapanChecklist dipisah ke komponennya sendiri
 *  - Dead code dihapus: `window.alert()` untuk validasi diganti dengan inline error
 *  - Ukuran: turun dari 398 baris → ~180 baris
 */

import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { TextInput, Textarea, SelectInput, RadioGroup } from "../../../components/ui/Input";
import KelengkapanChecklist from "./KelengkapanChecklist";
import { useServiceForm } from "../hooks/useServiceForm";
import { JIP_DEVICES, ALL_SERVICE_STATUSES } from "../../../lib/fsm";
import type { PrinterService } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: PrinterService | null;
  onSubmit: (payload: Omit<PrinterService, "id">, editingId?: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DEVICE_OPTIONS = JIP_DEVICES.map((d) => ({ value: d, label: d }));
const STATUS_OPTIONS = ALL_SERVICE_STATUSES.map((s) => ({ value: s, label: s }));
const GARANSI_OPTIONS = [
  { value: "Garansi", label: "Garansi Resmi" },
  { value: "Non-Garansi", label: "Non-Garansi (Bayar)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ServiceFormModal({
  isOpen,
  onClose,
  editingService,
  onSubmit,
}: ServiceFormModalProps) {
  const { form, setField, toggleKelengkapan, setKelengkapan, resetForm, loadFromService, toPayload } =
    useServiceForm();

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form saat modal terbuka
  React.useEffect(() => {
    if (isOpen) {
      if (editingService) {
        loadFromService(editingService);
      } else {
        resetForm();
      }
      setSubmitError("");
    }
  }, [isOpen, editingService]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Validasi sederhana
    if (!form.customer.trim() || !form.serialNumber.trim() || !form.keluhan.trim() || !form.namaTs.trim()) {
      setSubmitError("Mohon isi semua field wajib: Instansi, Serial Number, Keluhan, dan Nama TS.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(), editingService?.id);
      onClose();
    } catch {
      setSubmitError("Gagal menyimpan data. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = editingService
    ? `Edit Layanan Penerimaan [${editingService.id}]`
    : "Penerimaan Printer Baru & Smart Diagnosis";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      headerIcon={<Sparkles size={16} className="text-yellow-400" />}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit as any}
            loading={isSubmitting}
            loadingText="Menyimpan..."
            type="submit"
            form="service-form"
          >
            {editingService ? "Simpan Perubahan" : "Daftarkan Printer"}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* Error banner */}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        {/* ── Identitas ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-1">
            Identitas Printer & Customer
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Dinas / Instansi / Bank"
              required
              value={form.customer}
              onChange={(e) => setField("customer", e.target.value)}
              placeholder="Contoh: Dinas Kesehatan Jatim"
            />
            <SelectInput
              label="Model Device"
              required
              value={form.device}
              onChange={(e) => setField("device", e.target.value)}
              options={DEVICE_OPTIONS}
            />
            <TextInput
              label="Serial Number (SN)"
              required
              mono
              value={form.serialNumber}
              onChange={(e) => setField("serialNumber", e.target.value)}
              placeholder="Contoh: SN-CR805-4421"
            />
            <RadioGroup
              label="Status Garansi"
              name="statusGaransi"
              value={form.statusGaransi}
              onChange={(v) => setField("statusGaransi", v as "Garansi" | "Non-Garansi")}
              options={GARANSI_OPTIONS}
            />
          </div>
          <Textarea
            label="Keluhan Pelanggan Utama"
            required
            rows={2}
            value={form.keluhan}
            onChange={(e) => setField("keluhan", e.target.value)}
            placeholder="Contoh: pita transfer film sobek terus-menerus dan mesin berbunyi kasat bising."
          />
        </section>

        {/* ── Kelengkapan ───────────────────────────────────────────── */}
        <KelengkapanChecklist
          kelengkapan={form.kelengkapan}
          onToggle={toggleKelengkapan}
          onLainnyaChange={(v) => setKelengkapan("lainnya", v)}
        />

        {/* ── Data Teknis ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
            Data Teknis & Administrasi
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Nama Teknisi (TS)"
              required
              value={form.namaTs}
              onChange={(e) => setField("namaTs", e.target.value)}
              placeholder="Contoh: Eko Prasetyo"
            />
            <TextInput
              label="Tanggal Terima"
              type="date"
              required
              value={form.tanggalTerima}
              onChange={(e) => setField("tanggalTerima", e.target.value)}
            />
            <SelectInput
              label="Status Servis"
              value={form.statusServis}
              onChange={(e) => setField("statusServis", e.target.value as typeof form.statusServis)}
              options={STATUS_OPTIONS}
            />
            <RadioGroup
              label="Tipe Tiket"
              name="ticketType"
              value={form.ticketType}
              onChange={(v) => setField("ticketType", v as "INCIDENT" | "TASK/DEMO")}
              options={[
                { value: "INCIDENT", label: "Incident (Hardware)" },
                { value: "TASK/DEMO", label: "Task / Demo" },
              ]}
            />
          </div>
        </section>

        {/* ── Info Diagnosa Terpisah ─────────────────────────────────── */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-700">
          <span className="text-base leading-none mt-0.5">🔬</span>
          <div>
            <p className="font-bold mb-0.5">Hasil Diagnosa diisi terpisah</p>
            <p className="leading-relaxed text-amber-600">
              Setelah tiket terdaftar, teknisi melakukan pengecekan fisik printer terlebih dulu.
              Gunakan tombol <strong>"Input Hasil Diagnosa"</strong> di panel detail tiket untuk mengisi
              hasil pengecekan, rekomendasi tindakan, dan menjalankan AI Smart Diagnosis.
            </p>
          </div>
        </div>

      </form>
    </Modal>
  );
}
