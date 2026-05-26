/**
 * @file features/sph/components/SphPreviewModal.tsx
 * @description Modal preview dokumen SPH dengan format kop surat JIP.
 *
 * DIPINDAH DARI: AdministrasiSPH.tsx baris 779-969 (~190 baris inline JSX).
 *
 * Komponen murni display — tidak ada state form, tidak ada side effect.
 * Tombol Ekspor Word memanggil endpoint /api/sph/{id}/docx secara langsung.
 */

import React from "react";
import { Clipboard, FileText, Printer } from "lucide-react";
import { formatRp } from "../../../lib/utils";
import type { SPH } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface SphPreviewModalProps {
  sph: SPH | null;
  onClose: () => void;
  onRefreshAllData?: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SphPreviewModal({ sph, onClose, onRefreshAllData }: SphPreviewModalProps) {
  if (!sph) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-100 rounded-3xl w-full max-w-4xl p-1 md:p-6 overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-slate-300">

        {/* Action Bar */}
        <div className="bg-slate-800 rounded-2xl p-3 text-white flex justify-between items-center shrink-0 mb-4 px-5">
          <div className="flex items-center gap-2">
            <Clipboard className="text-indigo-400" size={18} />
            <span className="text-sm font-semibold">Akselerasi Cetak Dokumen Hubungan Pelanggan</span>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/sph/${sph.id}/docx`}
              download={`SPH_${sph.id}.docx`}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                if (onRefreshAllData) setTimeout(() => onRefreshAllData(), 1000);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition no-underline"
            >
              <FileText size={12} /> Ekspor Word (.docx)
            </a>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <Printer size={12} /> Cetak (PDF / Kertas)
            </button>
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 font-semibold text-xs px-3 py-1.5 rounded-lg transition text-slate-300"
            >
              Tutup Live View
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto bg-white p-8 md:p-12 text-slate-800 rounded-2xl shadow-inner border border-stone-300 font-serif leading-relaxed max-w-3xl mx-auto min-h-[11in]">

          {/* Kop Surat */}
          <div className="text-center font-sans border-b-4 border-double border-slate-900 pb-4 space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-wide">
              PT. JASUINDO INFORMATIKA PRATAMA
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-normal tracking-wide">
              Spesialis Printer Kartu KTP/Passport/ID-Card Resmi & Suku Cadang Orisinil<br />
              Sentra Bisnis Kebayoran Baru No. 22B, Jakarta Selatan. Telp: (021) 8290-771 / Fax: (021) 8290-772
            </p>
          </div>

          {/* SPH Metadata */}
          <div className="font-sans text-xs mt-6 space-y-4">

            {/* Header meta + date */}
            <div className="flex justify-between items-start">
              <table className="table-auto text-left">
                <tbody>
                  <tr>
                    <td className="pr-4 text-slate-500">Nomor</td>
                    <td className="pr-2">:</td>
                    <td className="font-semibold">{sph.nomorSurat}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-slate-500">Lampiran</td>
                    <td className="pr-2">:</td>
                    <td>1 (Satu) berkas lembaran diagnosis AI</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-slate-500">Hal</td>
                    <td className="pr-2">:</td>
                    <td className="font-bold underline">Penawaran Suku Cadang Printer Layanan Mandat</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-right">Jakarta, {sph.tanggal}</div>
            </div>

            {/* Recipient */}
            <div className="pt-2">
              <p className="font-bold text-slate-900">Kepada Yth,</p>
              <p className="font-semibold text-slate-800">{sph.dinasMana}</p>
              <p className="text-slate-500 text-[11px] font-normal leading-normal">
                Penerima Penawaran Layanan Teknis Operasional<br />
                Di Tempat
              </p>
            </div>

            {/* Opening paragraph */}
            <div className="pt-2">
              <p className="text-[11px] text-slate-700 text-justify">
                Dengan hormat, sehubungan dengan hasil pengujian dan{" "}
                <em>Smart Diagnosis Artificial Intelligence</em> (AI) terhadap unit printer
                penunjang kerja di instansi Bapak/Ibu, tim teknis Technical Support kami
                merekomendasikan penggantian komponen suku cadang demi kelangsungan performa
                prima mesin dengan rincian biaya penawaran harga sebagai berikut:
              </p>
            </div>

            {/* Items Table */}
            <div className="pt-4 overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-8">No</th>
                    <th className="py-2.5 px-3">Part Number</th>
                    <th className="py-2.5 px-3">Deskripsi Suku Cadang</th>
                    <th className="py-2.5 px-3 text-center w-12">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right">Jumlah Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sph.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="py-2 px-3 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-950">{item.partNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.namaPart}</td>
                      <td className="py-2 px-3 text-center">{item.qty}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatRp(item.harga)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{formatRp(item.jumlah)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-slate-50/50 font-semibold">
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right text-slate-500">Subtotal</td>
                    <td colSpan={2} className="py-2 px-3 text-right font-mono">{formatRp(sph.subtotal)}</td>
                  </tr>
                  {sph.statusCharge === "Bayar" ? (
                    <>
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-right text-slate-500">PPN (11%)</td>
                        <td colSpan={2} className="py-2 px-3 text-right font-mono text-indigo-700">{formatRp(sph.ppn)}</td>
                      </tr>
                      <tr className="border-t-2 text-slate-900 bg-indigo-50/30">
                        <td colSpan={4} className="py-2 px-3 text-right text-indigo-950 font-bold uppercase">Grand Total (Rupiah)</td>
                        <td colSpan={2} className="py-2 px-3 text-right font-mono font-extrabold text-slate-950 text-xs sm:text-sm">
                          {formatRp(sph.total)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="border-t text-emerald-800 bg-emerald-50/30">
                      <td colSpan={4} className="py-2 px-3 text-right font-bold uppercase">Status Biaya</td>
                      <td colSpan={2} className="py-2 px-3 text-right font-mono font-bold">
                        {sph.statusCharge} (Bebas Biaya)
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Footnotes */}
            <div className="pt-4 text-[9px] text-slate-400 space-y-0.5 font-normal leading-normal">
              <p><strong>Ketentuan Penawaran:</strong></p>
              <p>
                1. Harga tercantum di atas{" "}
                {sph.statusCharge === "Bayar"
                  ? "belum termasuk potongan diskon instansi jika ada kontrak kerja."
                  : "sudah dibebaskan sesuai persetujuan warranty pabrik."}
              </p>
              <p>2. Masa berlaku penawaran resmi adalah 30 (tiga puluh) hari kalender sejak tanggal terbit SPH di atas.</p>
              <p>3. Estimasi pengerjaan penggantian modul adalah 3-5 hari kerja jika cadangan suku cadang berdaya stok aman.</p>
            </div>

            {/* Signature Block */}
            <div className="pt-10 flex justify-between items-start">
              <div className="w-1/3 text-center">
                <p className="text-[10px] text-slate-400">Penerima Kerja,</p>
                <div className="h-16" />
                <div className="border-b border-black w-3/4 mx-auto" />
                <p className="text-[10px] font-bold uppercase mt-1">Sponsor Pemprov Jatim / Dinas</p>
              </div>
              <div className="w-1/3 text-center">
                <p className="text-[10px] text-slate-400">Hormat Kami,</p>
                <p className="text-[10px] font-bold text-slate-900">PT. JASUINDO INFORMATIKA PRATAMA</p>
                <div className="h-12 flex justify-center items-center">
                  <span className="text-[9px] font-serif border border-dashed border-emerald-400 text-emerald-500 px-2 py-0.5 rounded rotate-3 block font-bold">
                    EMATERAI DIGITAL
                  </span>
                </div>
                <div className="border-b border-black w-3/4 mx-auto" />
                <p className="text-[10px] font-bold uppercase mt-1">Eko Prasetyo, S.T.</p>
                <p className="text-[9px] text-slate-400">Kepala Service Center Mandat</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
