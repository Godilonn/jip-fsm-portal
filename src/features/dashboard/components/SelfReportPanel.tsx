/**
 * @file features/dashboard/components/SelfReportPanel.tsx
 * @description Tab "Lapor Mandiri" — form pelaporan kerusakan mandiri dengan
 *              AI Prognosis sederhana berbasis keyword matching.
 *
 * DIPINDAH DARI: StatsDashboard.tsx baris 1180-1360 (~180 baris inline JSX).
 *
 * PERUBAHAN BERSIH:
 *  - window.alert() DIHAPUS → diganti dengan inline error state
 *  - Semua form state dipindah ke sini (tidak lagi di parent)
 *  - Logic prognosis murni JS (tidak memanggil API) tetap dipertahankan
 */

import React, { useState } from "react";
import { Wrench, Sparkles, AlertCircle, Check, FileCheck } from "lucide-react";
import type { PrinterService } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROGNOSIS LOGIC (extracted from inline function)
// ─────────────────────────────────────────────────────────────────────────────

interface PrognosisResult {
  analisis: string;
  tindakan: string;
  tipe: "Pandu" | "Remote" | "Workshop";
}

function calcPrognosis(keluhan: string): PrognosisResult {
  const text = keluhan.toLowerCase();
  if (text.includes("ribbon") || text.includes("pita") || text.includes("tidak deteksi")) {
    return {
      analisis: "Sistem optik sensor warna mendeteksi adanya lipatan lecek atau sisa debu yang menutupi transceiver reflektif ribbon spooler.",
      tindakan: "Buka penutup printer, keluarkan cartridge pita ribbon, lap kaca prisma sensor di sisi dalam dengan air-duster atau cotton bud halus.",
      tipe: "Pandu",
    };
  }
  if (text.includes("garis") || text.includes("putih") || text.includes("pudar") || text.includes("printhead")) {
    return {
      analisis: "Terdapat komponen resistor micro-thermal pada unit Printhead yang putus jalur atau tergores tajam oleh gesekan kotoran keras.",
      tindakan: "Lakukan wipe searah menggunakan alcohol pen cleaning kit resmi. Apabila uji cetak tetap bergaris lurus, unit wajib dikirim ke Service Center JIP untuk penggantian Printhead fisik.",
      tipe: "Workshop",
    };
  }
  if (text.includes("driver") || text.includes("koneksi") || text.includes("software") || text.includes("komputer") || text.includes("firmware")) {
    return {
      analisis: "Crash spooler Windows atau ketidakcocokan versi driver USB port COM. Memerlukan penyesuaian baudrate serta patch firmware ROM terbaru.",
      tindakan: "Unduh driver terbaru v5.1.0-JIP di Download Center, instal ulang driver, sambungkan ke port USB 2.0 orisinil. Gunakan software utilitas untuk firmware update.",
      tipe: "Remote",
    };
  }
  return {
    analisis: "Adanya indikasi slip mekanis pada karet feeder roller penarik kartu atau kendornya tension tensioner main-belt internal.",
    tindakan: "Gunakan adhesive cleaning tool card untuk membersihkan abu statis pada roller silikon. Hubungi technical support jika gir penggerak mengeluarkan bunyi retak mekanis.",
    tipe: "Workshop",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface SelfReportPanelProps {
  onAddService?: (item: Omit<PrinterService, "id">) => Promise<void>;
  onNavigateToTab: (tab: "penerimaan" | "sph" | "logistics" | "ai") => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SelfReportPanel({ onAddService, onNavigateToTab }: SelfReportPanelProps) {
  const [customer, setCustomer] = useState("");
  const [device, setDevice] = useState("SR200");
  const [keluhan, setKeluhan] = useState("");
  const [garansi, setGaransi] = useState<"Garansi" | "Non-Garansi">("Garansi");
  const [ribbon, setRibbon] = useState(false);
  const [film, setFilm] = useState(false);
  const [usb, setUsb] = useState(true);
  const [adaptor, setAdaptor] = useState(true);
  const [prognosis, setPrognosis] = useState<PrognosisResult | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAnalysis = () => {
    if (!keluhan.trim()) {
      setError("Mohon jelaskan gejala atau keluhan fisik printer.");
      return;
    }
    setError("");
    setPrognosis(calcPrognosis(keluhan));
  };

  const handleSubmit = async () => {
    setError("");
    if (!customer.trim() || !keluhan.trim() || !prognosis) {
      setError("Lengkapi isian form dan lakukan penganalisaan terlebih dahulu.");
      return;
    }
    if (!onAddService) {
      setError("Fungsi database online tidak terpasang.");
      return;
    }
    setSubmitting(true);
    try {
      await onAddService({
        device,
        customer,
        serialNumber: `SN-${device}-${Math.floor(1000 + Math.random() * 9000)}`,
        keluhan,
        kelengkapan: { ribbon, film, catrigeFilm: film, catrigeRibbon: ribbon, adaptor, kabelUsb: usb, lainnya: "Dilaporkan via Mandiri Hub" },
        tanggalTerima: new Date().toISOString().split("T")[0],
        statusGaransi: garansi,
        hasilPengecekan: `[Diagnosa Prognosis AI]: ${prognosis.analisis}`,
        catatanRekomendasi: `[Rekomendasi Awal]: ${prognosis.tindakan}. Jalur disarankan: ${prognosis.tipe}.`,
        namaTs: "Eko Prasetyo",
        statusServis: "Diterima",
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCustomer(""); setKeluhan(""); setPrognosis(null); setError("");
        onNavigateToTab("penerimaan");
      }, 1800);
    } catch {
      setError("Gagal mengirimkan data laporan. Silakan coba kembali.");
    } finally {
      setSubmitting(false);
    }
  };

  const tipeColor = {
    Pandu: "bg-emerald-900/40 text-emerald-300 border-emerald-800/40",
    Remote: "bg-blue-900/40 text-blue-300 border-blue-800/40",
    Workshop: "bg-purple-900/45 text-purple-300 border-purple-800/40",
  };

  return (
    <div className="bg-[#0e0a24]/90 border border-purple-500/20 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
      <div className="space-y-1.5 border-b border-purple-950/60 pb-3">
        <h4 className="text-base font-black text-[#a855f7] uppercase tracking-wide flex items-center gap-2">
          <Wrench size={18} />
          LAPOR KERUSAKAN MANDIRI (AI PROGNOSIS DIAGNOSIS)
        </h4>
        <p className="text-xs text-slate-400 leading-normal">
          Isi data gejala instansi Anda di bawah untuk mendapatkan panduan diagnosa swadaya instan dari JIP, serta submit ke operator teknis.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300 font-medium">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="bg-[#064e3b] text-[#10b981] p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Check size={26} />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">Laporan Kerusakan Sukses Terdaftar!</h3>
          <p className="text-xs text-emerald-300 max-w-md mx-auto leading-relaxed font-sans">
            Sistem JIP Hub telah mendaftarkan dinas <strong className="text-white">{customer}</strong> ke pool operator perbaikan. Anda dapat melacak progress di menu Penerimaan Printer utama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">

          {/* ── Form ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest font-mono">Isisian Formulir Pelapor</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Nama Dinas / Instansi *</label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Contoh: Bappenda Pasuruan"
                  className="w-full text-xs border border-purple-950 rounded-xl px-3 py-2.5 bg-[#0b0621]/90 text-white outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Model Printer Card *</label>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  className="w-full text-xs border border-purple-950 rounded-xl px-3 py-2.5 bg-[#0b0621]/90 text-white outline-none focus:border-sky-500"
                >
                  <option value="SR200">Datacard SR200</option>
                  <option value="CR805">Datacard CR805</option>
                  <option value="SD307">Datacard SD307</option>
                  <option value="Em2s">Entrust EM2s</option>
                  <option value="CR707">Datacard CR707</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Peralatan Yang Disertakan</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#080417] p-2.5 rounded-xl border border-purple-950/80">
                {[
                  { label: "Ribbon", val: ribbon, set: setRibbon },
                  { label: "Film", val: film, set: setFilm },
                  { label: "Kabel USB", val: usb, set: setUsb },
                  { label: "Adaptor", val: adaptor, set: setAdaptor },
                ].map(({ label, val, set }) => (
                  <label key={label} className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="accent-purple-500" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Masa Garansi</label>
                <select
                  value={garansi}
                  onChange={(e) => setGaransi(e.target.value as typeof garansi)}
                  className="w-full text-xs border border-purple-950 rounded-xl px-3 py-2.5 bg-[#0b0621]/90 text-white outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="Garansi">Garansi Resmi JIP</option>
                  <option value="Non-Garansi">Non-Garansi (FOC Atasan)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAnalysis}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold tracking-wider uppercase text-xs py-2.5 rounded-xl transition-all"
                >
                  🚀 Analisis Prognosis AI
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Gejala / Hambatan Detail *</label>
              <textarea
                value={keluhan}
                onChange={(e) => setKeluhan(e.target.value)}
                placeholder="Contoh: Layar printer mati total walaupun dicolok adaptor, atau pita ribbon sobek tergulung saat mulai cetak kartu KTP."
                rows={3}
                className="w-full text-xs border border-purple-950 rounded-xl px-3 py-2.5 bg-[#0b0621]/90 text-white outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          {/* ── Diagnosis Output ─────────────────────────────────── */}
          <div className="bg-[#05020d] border border-purple-950/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-purple-950 pb-2">
                <Sparkles className="text-[#3aebff] animate-pulse" size={16} />
                <h5 className="text-xs font-black text-white font-mono uppercase tracking-widest">
                  Hasil Evaluasi Prognosis JIP
                </h5>
              </div>

              {prognosis ? (
                <div className="space-y-3.5 leading-relaxed font-sans">
                  <div className="flex justify-between items-center bg-[#10072b] border border-purple-950 px-3 py-1.5 rounded-lg text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Mandat Jalur Rujukan:</span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${tipeColor[prognosis.tipe]}`}>
                      🟢 {prognosis.tipe}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300 bg-[#12082b] p-3 rounded-xl border border-purple-950/40">
                    <strong className="text-purple-400 block font-mono text-[9.5px] uppercase">Analisis Penyebab:</strong>
                    <p className="text-[11px] leading-relaxed">{prognosis.analisis}</p>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300 bg-[#12082b] p-3 rounded-xl border border-purple-950/40">
                    <strong className="text-sky-400 block font-mono text-[9.5px] uppercase">Tindakan Swadaya Disarankan:</strong>
                    <p className="text-[11px] leading-relaxed">{prognosis.tindakan}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-16 text-xs flex flex-col items-center justify-center gap-2 select-none">
                  <AlertCircle size={28} />
                  <span>Silakan isi keluhan Anda, lalu jalankan tombol 'Analisis Prognosis AI' di kiri untuk menerbitkan saran swadaya instan.</span>
                </div>
              )}
            </div>

            {prognosis && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !customer.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold tracking-wide uppercase text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FileCheck size={14} />
                <span>{submitting ? "Mengirim..." : "Kirim Laporan Kerusakan Ke Teknisi JIP"}</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
