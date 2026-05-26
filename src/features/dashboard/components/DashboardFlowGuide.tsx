/**
 * @file features/dashboard/components/DashboardFlowGuide.tsx
 * @description Tab "Prosedur Alur" — panduan langkah-langkah servis printer JIP.
 *
 * DIPINDAH DARI: StatsDashboard.tsx baris 1099-1175 (~76 baris inline JSX).
 * + serviceStepsDetails config data (baris 157-189).
 *
 * Komponen ini murni display/presentasi dengan satu state lokal: flowStep.
 * Navigasi modul terkait didelegasikan ke parent via onNavigateToTab.
 */

import React, { useState } from "react";
import { ClipboardList, Sparkles, Wrench, CheckCircle, FileCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const SERVICE_STEPS = [
  {
    title: "1. Intake & Registrasi Unit",
    description: "Unit printer diantar ke workshop PT. Jasuindo Informatika Pratama atau dijemput logistik. Admin kami melakukan audit fisik atas kelengkapan vital seperti pita ribbon, film, catrige, kabel USB, serta original power adaptor.",
    icon: <ClipboardList className="text-[#38bdf8]" size={20} />,
    info: "Penting untuk memastikan kelengkapan dicatat demi mencegah penyalahgunaan aset pemerintah.",
    navTarget: "penerimaan" as const,
  },
  {
    title: "2. Evaluasi AI & Solusi Penganalisis",
    description: "Teknisi support mengoperasikan modul Smart Diagnosis AI (Gemini Core). Melalui history kerusakan JIP, program menjatuhkan tiket keputusan mandat: PANDU (solusi mandiri instansi), REMOTE (software/firmware), atau KIRIM WORKSHOP.",
    icon: <Sparkles className="text-purple-400" size={20} />,
    info: "Teknologi AI menyingkat waktu breakdown penganalisisan dari semula 4 jam menjadi hanya 3 menit saja.",
    navTarget: "penerimaan" as const,
  },
  {
    title: "3. Kebijakan SPH & Persetujuan Atasan",
    description: "Surat Penawaran Harga (SPH) suku cadang diterbitkan otomatis oleh sistem berdasarkan list part inventori JIP. Jika atasan memberikan wewenang diskon promosi, kontrak kerja khusus, atau warranty claim, status dapat diganti seketika dari BERBAYAR menjadi FREE OF CHARGE (0 Rupiah).",
    icon: <FileCheck className="text-yellow-400" size={20} />,
    info: "Pimpinan/Atasan memiliki otoritas override langsung terhadap status biaya SPH sebelum diajukan ke bendahara dinas.",
    navTarget: "sph" as const,
  },
  {
    title: "4. Eksekusi Perbaikan & Logistik Aktif",
    description: "Begitu SPH disetujui, admin logistik mengambil sparepart orisinil dari gudang tertutup JIP. Teknisi bersertifikasi melakukan penggantian thermal printhead, gears, atau roller. Unit dikemas tahan guncangan dan dipasangi label tracking logistik dengan nomor Resi aktif.",
    icon: <Wrench className="text-teal-400" size={20} />,
    info: "Seluruh suku cadang yang terpasang dijamin asli dan memiliki Garansi Resmi JIP berjangka waktu tertentu.",
    navTarget: "logistics" as const,
  },
  {
    title: "5. Quality Control & Serah-Terima",
    description: "Unit printer dipicu mencetak minimal 10 kartu KTP / ID Card sebagai uji kelayakan output visual dan kerapatan magnetik. Setelah dinyatakan lulus kriteria QC, printer siap diserahterimakan dan status berubah menjadi Selesai / Diambil.",
    icon: <CheckCircle className="text-[#38bdf8]" size={20} />,
    info: "Proses penandatanganan BA (Berita Acara) serah terima didokumentasikan di database guna pengawasan BPK.",
    navTarget: "penerimaan" as const,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardFlowGuideProps {
  onNavigateToTab: (tab: "penerimaan" | "sph" | "logistics" | "ai") => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardFlowGuide({ onNavigateToTab }: DashboardFlowGuideProps) {
  const [step, setStep] = useState(0);
  const active = SERVICE_STEPS[step];

  return (
    <div className="bg-[#0e0a24]/90 border border-purple-500/20 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1.5 border-b border-purple-950/60 pb-3">
        <h4 className="text-base font-black text-[#38bdf8] uppercase tracking-wide flex items-center gap-2">
          <ClipboardList size={18} />
          PANDUAN ALUR PROSEDUR SERVIS PRINTER
        </h4>
        <p className="text-xs text-slate-400 leading-normal">
          Bagaimana unit printer Anda diproses di PT. Jasuindo Informatika Pratama.
          Klik tiap langkah bernomor di bawah ini untuk melihat detail secara dinamis.
        </p>
      </div>

      {/* Step bubbles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SERVICE_STEPS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setStep(idx)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              step === idx
                ? "bg-[#6b21a8]/30 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-[#0b071a]/80 border-purple-950/85 hover:bg-[#120a2e] text-slate-400 hover:border-purple-900/60"
            }`}
          >
            <span className={`text-[10px] font-mono font-black ${step === idx ? "text-[#38bdf8]" : "text-slate-500"}`}>
              LANGKAH {idx + 1}
            </span>
            <p className="text-xs font-bold mt-1 tracking-tight truncate">
              {s.title.split(". ")[1]}
            </p>
          </button>
        ))}
      </div>

      {/* Step detail */}
      <div className="bg-[#05020e]/90 border border-purple-950/60 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start flex-1 text-left">
          <div className="bg-[#12082b] p-3 rounded-2xl border border-purple-900/50 shadow-sm shrink-0">
            {active.icon}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#a855f7] uppercase tracking-wide">
              {active.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{active.description}</p>
            <div className="pt-2 text-[10px] text-slate-500 font-medium">
              💡 <strong>Panduan Tambahan:</strong> {active.info}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToTab(active.navTarget)}
            className="bg-[#12082b] hover:bg-[#1e1050] border border-purple-900/60 text-purple-300 hover:text-white text-xs font-black tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all"
          >
            Buka Modul Terkait ➔
          </button>
        </div>
      </div>
    </div>
  );
}
