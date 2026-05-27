/**
 * @file features/sph/components/SphFormModal.tsx
 * @description Modal form SPH baru — versi WIZARD STEP (Fase 3).
 *
 * INOVASI UI/UX FASE 3:
 * ──────────────────────────────────────────────────────────────────────────
 * 1. STEP WIZARD (3 LANGKAH)
 *    - Langkah 1: Informasi Surat (nomor, tanggal, link unit servis)
 *    - Langkah 2: Penerima + Suku Cadang (part search + items table)
 *    - Langkah 3: Review & Konfirmasi (ringkasan + total pricing)
 *    KENAPA: Form 12 field sekaligus menimbulkan "form fatigue". Wizard
 *    membagi kognitif beban jadi tiga fokus kecil yang berurutan logis.
 *
 * 2. ANIMASI SLIDE ANTAR LANGKAH
 *    - AnimatePresence + motion.div dengan x-offset slide left/right.
 *    KENAPA: Transisi visual menunjukkan arah navigasi (maju/mundur)
 *    dan memberikan konteks posisi user di alur wizard.
 *
 * 3. PROGRESS BAR + STEP INDICATOR
 *    - Bar progres di atas modal dengan nomor dan label tiap langkah.
 *    - Step yang lewat tercentang (✓), aktif tersorot, belum dikunjungi abu.
 *    KENAPA: User tahu berapa banyak pekerjaan yang tersisa — mengurangi
 *    kecemasan "apakah masih banyak yang harus diisi?"
 *
 * 4. PART SEARCH BY NAME
 *    - Input teks untuk search nama sparepart sebelum pilih dari dropdown.
 *    - Dropdown difilter real-time sesuai query, stok habis dinonaktifkan.
 *    KENAPA: Dropdown panjang (50+ item) tidak bisa dioperasikan tanpa search.
 *    Teknisi biasanya ingat nama part, bukan ID-nya.
 *
 * 5. RUNNING TOTAL LIVE
 *    - Subtotal, PPN, dan Total diperbarui otomatis saat item ditambah/hapus.
 *    - Ditampilkan di sticky footer step 2 dan di review step 3.
 *    KENAPA: Teknisi/admin perlu konfirmasi nilai sebelum submit — salah
 *    input harga bisa menyebabkan penagihan yang salah.
 *
 * 6. VALIDASI PER-STEP
 *    - Tombol "Lanjut" disabled sampai field wajib di step tersebut terisi.
 *    - Error inline muncul dekat field bermasalah, bukan di top banner.
 *    KENAPA: Validasi global di top mengganggu konteks visual.
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileCheck, ShoppingCart, Trash2, Plus, ChevronRight,
  ChevronLeft, CheckCircle, Search, AlertCircle,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { useSphForm } from "../hooks/useSphForm";
import { formatRp } from "../../../lib/utils";
import type { SPH, PrinterService, SparepartItem } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3;

interface SphFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: PrinterService[];
  spareparts: SparepartItem[];
  sphCount: number;
  onSubmit: (payload: Omit<SPH, "id">) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Info Surat" },
  { number: 2, label: "Penerima & Part" },
  { number: 3, label: "Review & Kirim" },
] as const;

function StepIndicator({ current, direction }: { current: WizardStep; direction: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-white">
      {/* Step labels */}
      <div className="relative flex items-center justify-between mb-3">
        {STEPS.map((step) => {
          const done = step.number < current;
          const active = step.number === current;
          return (
            <div key={step.number} className="flex flex-col items-center gap-1 z-10">
              <motion.div
                animate={{
                  backgroundColor: done ? "#4f46e5" : active ? "#6366f1" : "#e2e8f0",
                  scale: active ? 1.1 : 1,
                }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                style={{ color: done || active ? "white" : "#64748b" }}
              >
                {done ? <CheckCircle size={16} /> : step.number}
              </motion.div>
              <span className={`text-[10px] font-semibold tracking-wide whitespace-nowrap ${
                active ? "text-indigo-600" : done ? "text-slate-500" : "text-slate-400"
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Track */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
        <motion.div
          className="absolute top-4 left-4 h-0.5 bg-indigo-600 -z-0 rounded-full origin-left"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SphFormModal({
  isOpen,
  onClose,
  services,
  spareparts,
  sphCount,
  onSubmit,
}: SphFormModalProps) {
  const {
    form, items, partInput,
    setField, setPartField,
    initForNew, lookupPart, selectService,
    addItem, removeItem, toPayload,
  } = useSphForm();

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [partSearch, setPartSearch] = useState("");
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      initForNew(sphCount);
      setStep(1);
      setDirection(1);
      setPartSearch("");
      setStepError("");
    }
  }, [isOpen]);

  // ── Step navigation ────────────────────────────────────────────────────────

  const goNext = () => {
    setStepError("");
    if (step === 1) {
      if (!form.nomorSurat.trim()) { setStepError("Nomor Surat wajib diisi."); return; }
      if (!form.tanggal) { setStepError("Tanggal terbit wajib diisi."); return; }
    }
    if (step === 2) {
      if (!form.dinasMana.trim()) { setStepError("Nama dinas penerima wajib diisi."); return; }
      if (items.length === 0) { setStepError("Tambahkan minimal 1 item sparepart ke dalam surat."); return; }
    }
    setDirection(1);
    setStep((s) => Math.min(3, s + 1) as WizardStep);
  };

  const goBack = () => {
    setStepError("");
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1) as WizardStep);
  };

  // ── Part lookup with search filter ────────────────────────────────────────

  const filteredParts = useMemo(() =>
    spareparts.filter((p) =>
      partSearch === "" ||
      p.namaBarang.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(partSearch.toLowerCase())
    ),
    [spareparts, partSearch]
  );

  const handleAddItem = () => {
    const err = addItem();
    if (err) setStepError(err);
    else setStepError("");
  };

  const handleSubmit = async () => {
    setStepError("");
    const payload = toPayload();
    if (!payload) { setStepError("Data SPH tidak lengkap."); return; }
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch {
      setStepError("Gagal menyimpan SPH. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Running total ──────────────────────────────────────────────────────────

  const subtotal = items.reduce((acc, it) => acc + it.jumlah, 0);
  const ppn = 0; // PPN dihapus sesuai kebijakan
  const total = subtotal;

  const partIsLocked = partInput.selectedPartId !== "" && partInput.selectedPartId !== "custom";

  // ── Slide variants ─────────────────────────────────────────────────────────

  const variants = {
    enter: (d: number) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -40, opacity: 0 }),
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl">
              <FileCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Menerbitkan Surat Penawaran Harga (SPH)
              </h2>
              <p className="text-[10px] text-slate-400">Lengkapi tiga langkah di bawah</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-colors"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} direction={direction} />

        {/* Step Content — animated slide */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="p-6 space-y-5"
            >

              {/* ════════════════════════════════════════════════════════════
                  STEP 1 — Informasi Surat
                  ════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
                    <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-3 font-mono">
                      📋 Identitas Dokumen SPH
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                          Nomor Surat Penawaran *
                        </label>
                        <input
                          type="text"
                          value={form.nomorSurat}
                          onChange={(e) => setField("nomorSurat", e.target.value)}
                          placeholder="SPH/PNT/V/2026/001"
                          className="w-full text-sm font-mono border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                          Tanggal Terbit *
                        </label>
                        <input
                          type="date"
                          value={form.tanggal}
                          onChange={(e) => setField("tanggal", e.target.value)}
                          className="w-full text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 font-mono">
                      🔗 Hubungkan Ke Tiket Penerimaan (Opsional)
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      Pilih tiket servis yang ada agar SPH ini terhubung ke unit printer dan data dinas
                      terisi otomatis.
                    </p>
                    <select
                      value={form.linkedServiceId}
                      onChange={(e) => selectService(e.target.value, services)}
                      className="w-full text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 outline-none bg-white font-mono"
                    >
                      <option value="">-- Tidak Menghubungkan Tiket / Buat Mandiri --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.id}] {s.customer} — {s.device}
                        </option>
                      ))}
                    </select>

                    {form.linkedServiceId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-800 font-medium"
                      >
                        ✅ Data dinas & status beban diisi otomatis dari tiket terhubung.
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  STEP 2 — Penerima + Suku Cadang
                  ════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Penerima + Status Beban */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Dinas / Instansi Penerima *
                      </label>
                      <input
                        type="text"
                        value={form.dinasMana}
                        onChange={(e) => setField("dinasMana", e.target.value)}
                        placeholder="Contoh: Dinas Kesehatan Jatim"
                        className="w-full text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Status Pembebanan Biaya
                      </label>
                      <select
                        value={form.statusCharge}
                        onChange={(e) => setField("statusCharge", e.target.value as SPH["statusCharge"])}
                        className="w-full text-sm border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3 py-2.5 outline-none bg-white"
                      >
                        <option value="Bayar">Bayar (Charged)</option>
                        <option value="Free of Charge">Free of Charge (F.O.C) — Gratis</option>
                        <option value="Garansi">Garansi — Warranty Claim</option>
                      </select>
                    </div>
                  </div>

                  {/* Part Lookup */}
                  <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 space-y-4">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center gap-2 font-mono uppercase tracking-widest">
                      <ShoppingCart size={13} />
                      Tambah Suku Cadang ke Surat Penawaran
                    </h4>

                    {/* Search + Dropdown */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={partSearch}
                          onChange={(e) => setPartSearch(e.target.value)}
                          placeholder="Ketik nama atau P/N untuk filter daftar..."
                          className="w-full text-xs pl-8 pr-3 py-2 border border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-100 rounded-xl outline-none bg-white"
                        />
                      </div>
                      <select
                        value={partInput.selectedPartId}
                        onChange={(e) => { lookupPart(e.target.value, spareparts); setPartSearch(""); }}
                        className="w-full text-xs border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 outline-none bg-white"
                      >
                        <option value="">-- Pilih dari Inventori Gudang --</option>
                        <option value="custom">✏️ Tulis Manual (item kustom)</option>
                        {filteredParts.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.stok === 0}
                          >
                            {p.stok === 0 ? "⛔ " : p.stok <= 2 ? "⚠️ " : ""}
                            {p.namaBarang} — P/N {p.partNumber} (Stok: {p.stok})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Part fields */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-purple-900 mb-1">Nama Part</label>
                        <input
                          type="text"
                          value={partInput.customPartName}
                          onChange={(e) => setPartField("customPartName", e.target.value)}
                          disabled={partIsLocked}
                          placeholder="Nama komponen"
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 outline-none disabled:bg-slate-100 transition-colors focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 mb-1">Part Number</label>
                        <input
                          type="text"
                          value={partInput.customPartNo}
                          onChange={(e) => setPartField("customPartNo", e.target.value)}
                          disabled={partIsLocked}
                          placeholder="512022-105"
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 outline-none font-mono disabled:bg-slate-100 focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 mb-1">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={partInput.customQty}
                          onChange={(e) => setPartField("customQty", Number(e.target.value))}
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 outline-none font-mono focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 mb-1">Satuan</label>
                        <select
                          value={partInput.customSatuan}
                          onChange={(e) => setPartField("customSatuan", e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 outline-none bg-white focus:border-purple-400"
                        >
                          <option value="pcs">pcs</option>
                          <option value="unit">unit</option>
                          <option value="set">set</option>
                          <option value="ea">ea</option>
                          <option value="lot">lot</option>
                          <option value="roll">roll</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-purple-900 mb-1">
                          Harga Satuan (Rp)
                        </label>
                        <input
                          type="number"
                          value={partInput.customPrice}
                          onChange={(e) => setPartField("customPrice", Number(e.target.value))}
                          disabled={partIsLocked}
                          className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 outline-none font-mono disabled:bg-slate-100 focus:border-purple-400"
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="w-full bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white text-[11px] font-bold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus size={12} />
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Item Dalam Surat ({items.length})
                      </span>
                      {items.length > 0 && (
                        <span className="text-[11px] font-bold text-purple-700 font-mono">
                          Subtotal: {formatRp(subtotal)}
                        </span>
                      )}
                    </div>

                    {items.length === 0 ? (
                      <div className="border border-slate-200 border-dashed rounded-xl p-6 text-center text-xs text-slate-400">
                        Belum ada item — tambah sparepart di atas.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b text-slate-500 font-semibold uppercase text-[10px]">
                              <th className="py-2.5 px-3">No</th>
                              <th className="py-2.5 px-3">Part / P/N</th>
                              <th className="py-2.5 px-3">Qty</th>
                              <th className="py-2.5 px-3">Sat.</th>
                              <th className="py-2.5 px-3 text-right">Harga</th>
                              <th className="py-2.5 px-3 text-right">Jumlah</th>
                              <th className="py-2.5 px-3" />
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <AnimatePresence>
                              {items.map((it, idx) => (
                                <motion.tr
                                  key={idx}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 8 }}
                                  transition={{ duration: 0.15 }}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="py-2 px-3 font-mono text-slate-500">{it.itemNumber}</td>
                                  <td className="py-2 px-3">
                                    <span className="font-semibold text-slate-800 block">{it.namaPart}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">P/N: {it.partNumber}</span>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold">{it.qty}</td>
                                  <td className="py-2 px-3 text-slate-500">{it.satuan}</td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-600">{formatRp(it.harga)}</td>
                                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">{formatRp(it.jumlah)}</td>
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(idx)}
                                      className="text-rose-500 hover:bg-rose-50 p-1 rounded transition"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>

                        {/* Running total */}
                        <div className="bg-slate-50 border-t border-slate-200 px-3 py-2.5 space-y-1">
                          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                            <span>Total</span>
                            <span className="font-mono text-indigo-700">
                              {form.statusCharge === "Bayar" ? formatRp(total) : "Rp 0 (Gratis)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════
                  STEP 3 — Review & Konfirmasi
                  ════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Data siap diterbitkan!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Periksa ringkasan di bawah sebelum menekan tombol Simpan & Terbitkan.
                      </p>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Nomor SPH",     value: form.nomorSurat },
                      { label: "Tanggal Terbit", value: form.tanggal },
                      { label: "Penerima",       value: form.dinasMana },
                      { label: "Status Beban",   value: form.statusCharge },
                      { label: "Link Tiket",     value: form.linkedServiceId || "— Tidak dihubungkan" },
                      { label: "Jumlah Item",    value: `${items.length} sparepart` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-slate-800 font-mono truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                        Ringkasan Harga
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      {items.map((it, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-600">
                          <span className="flex-1 truncate pr-4">{it.namaPart} ×{it.qty}</span>
                          <span className="font-mono font-semibold shrink-0">{formatRp(it.jumlah)}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-mono">{formatRp(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                          <span>TOTAL</span>
                          <span className="font-mono text-indigo-700">
                            {form.statusCharge === "Bayar" ? formatRp(total) : "Rp 0"}
                          </span>
                        </div>
                        {form.statusCharge !== "Bayar" && (
                          <p className="text-[10px] text-emerald-600 font-semibold text-right">
                            {form.statusCharge === "Garansi" ? "✅ Ditanggung Garansi JIP" : "✅ Free of Charge (F.O.C)"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline error */}
              {stepError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {stepError}
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer Navigation ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
          <div>
            {step > 1 ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft size={14} />}
                onClick={goBack}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">Langkah {step} / 3</span>
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={goNext}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Lanjut
                <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                loading={isSubmitting}
                loadingText="Menyimpan..."
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
                leftIcon={<FileCheck size={14} />}
              >
                Simpan & Terbitkan SPH
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
