/**
 * @file features/sph/components/SphApprovalPanel.tsx
 * @description Panel kanan: Sales Review Approval untuk SPH terpilih,
 *              atau panel info ketentuan garansi jika tidak ada yang dipilih.
 *
 * DIPINDAH DARI: AdministrasiSPH.tsx baris 356-534 (~178 baris inline JSX).
 *
 * `window.alert` DIHAPUS — error ditangkap via onError callback ke parent.
 */

import React, { useState } from "react";
import { CheckSquare, Award, CheckCircle, Calendar, ThumbsUp, RefreshCw, FileText } from "lucide-react";
import Button from "../../../components/ui/Button";
import { formatRp } from "../../../lib/utils";
import type { SPH } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface SphApprovalPanelProps {
  selectedSph: SPH | null;
  onCancel: () => void;
  onError: (msg: string) => void;
  onSuccess: () => void;
  onRefreshAllData?: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SphApprovalPanel({
  selectedSph,
  onCancel,
  onError,
  onSuccess,
  onRefreshAllData,
}: SphApprovalPanelProps) {
  const [reviewAction, setReviewAction] = useState<"DISETUJUI" | "GRATIS" | "">("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSph || !reviewAction) return;
    if (reviewAction === "GRATIS" && !estimatedDelivery.trim()) {
      onError("Mohon isi estimasi Jadwal Pengiriman terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await fetch(`/api/sph/${selectedSph.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewAction, estimatedDeliverySchedule: estimatedDelivery }),
      });
      if (!resp.ok) throw new Error("Gagal mengirimkan review persetujuan.");
      onSuccess();
      setReviewAction("");
      setEstimatedDelivery("");
      if (onRefreshAllData) await onRefreshAllData();
    } catch (e: any) {
      onError(e.message || "Terjadi kesalahan saat memproses persetujuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── If a SPH is selected for review ───────────────────────────────────
  if (selectedSph) {
    return (
      <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-md p-5 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h4 className="text-sm font-black text-purple-900 flex items-center gap-1.5">
            <CheckSquare className="text-purple-600" size={16} />
            Sales Review Approval
          </h4>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold transition"
          >
            Batal
          </button>
        </div>

        {/* SPH Summary */}
        <div className="space-y-2 text-xs text-slate-700">
          <p className="font-semibold text-slate-500 font-mono">No: {selectedSph.nomorSurat}</p>
          <p><span className="font-semibold text-slate-400">Penerima:</span> {selectedSph.dinasMana}</p>
          <p>
            <span className="font-semibold text-slate-400">Link Unit:</span>{" "}
            <span className="font-mono bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded font-bold">
              {selectedSph.serviceId || "No Link"}
            </span>
          </p>
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <p className="text-[10px] text-slate-500 uppercase tracking-tight">Total Nilai Penawaran</p>
            <p className="text-base font-black text-purple-950 font-mono">{formatRp(selectedSph.total)}</p>
          </div>
        </div>

        {/* Approval Options */}
        <div className="space-y-3 pt-1">
          <span className="block text-xs font-bold text-slate-700">Konfirmasi Hasil SPH Review:</span>

          {/* Option A — DISETUJUI */}
          <label
            className={`block p-3 rounded-xl border cursor-pointer transition ${
              reviewAction === "DISETUJUI"
                ? "bg-purple-50 border-purple-500"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="review_option"
                checked={reviewAction === "DISETUJUI"}
                onChange={() => setReviewAction("DISETUJUI")}
                className="mt-1 h-3.5 w-3.5 text-purple-600 accent-purple-600 cursor-pointer"
              />
              <div>
                <h5 className="font-bold text-xs text-purple-950">A. DISETUJUI (Berbayar)</h5>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Mengaktifkan tagihan biaya SPH, mengubah status tiket ke{" "}
                  <span className="font-semibold">IN_PROGRESS</span>, dan memicu status barang
                  logistik menjadi{" "}
                  <span className="font-semibold font-mono text-purple-900 bg-purple-50 px-1 rounded">
                    READY_TO_PACK
                  </span>.
                </p>
              </div>
            </div>
          </label>

          {/* Option B — GRATIS */}
          <label
            className={`block p-3 rounded-xl border cursor-pointer transition ${
              reviewAction === "GRATIS"
                ? "bg-emerald-50/50 border-emerald-500"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="review_option"
                checked={reviewAction === "GRATIS"}
                onChange={() => setReviewAction("GRATIS")}
                className="mt-1 h-3.5 w-3.5 text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <div>
                <h5 className="font-bold text-xs text-emerald-950">B. GRATIS (Garansi/Free)</h5>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  Menihilkan tagihan (Rp 0), status tiket menjadi{" "}
                  <span className="font-semibold">RESOLVED</span>, langsung memicu logistik ke{" "}
                  <span className="font-semibold font-mono text-emerald-950 bg-emerald-50 px-1 rounded">
                    READY_TO_PACK
                  </span>.
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Delivery schedule (only for GRATIS) */}
        {reviewAction === "GRATIS" && (
          <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <h5 className="text-[10px] uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1 animate-pulse">
              <Calendar size={11} className="text-amber-500" />
              Pengaturan Jadwal Pengiriman *
            </h5>
            <input
              type="text"
              required
              placeholder="Contoh: Senin, 25 Mei 2026 jam 09:00 WIB via Kurir Internal"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full text-xs border border-stone-300 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 outline-none"
            />
            <p className="text-[9px] text-stone-500">
              Estimasi jadwal pengiriman akan langsung tercapai di sirkuit logistik.
            </p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="button"
          disabled={isSubmitting || !reviewAction}
          loading={isSubmitting}
          loadingText="Memproses..."
          leftIcon={<ThumbsUp size={13} />}
          onClick={handleSubmit}
          variant={reviewAction === "GRATIS" ? "success" : reviewAction === "DISETUJUI" ? "primary" : "secondary"}
          className={`w-full justify-center ${
            !reviewAction ? "opacity-50 cursor-not-allowed" : ""
          } ${reviewAction === "DISETUJUI" ? "bg-purple-600 hover:bg-purple-700 border-purple-600" : ""}`}
          size="sm"
        >
          Konfirmasi Review Penawaran
        </Button>

        <div className="flex justify-center pt-1">
          <a
            href={`/api/sph/${selectedSph.id}/docx`}
            download
            className="text-[11px] text-indigo-600 hover:underline font-bold flex items-center gap-1"
          >
            <FileText size={11} /> Unduh Surat Word (SPH)
          </a>
        </div>
      </div>
    );
  }

  // ── Default info panel ─────────────────────────────────────────────────
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Award className="text-yellow-600" size={16} />
        Ketentuan Garansi & SPH Resmi
      </h4>
      <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
        <p>Mekanisme penagihan didasarkan pada diagram Page 1 administrasi SPH:</p>

        <div className="p-3 bg-indigo-50/50 rounded-xl space-y-2 border border-indigo-100/60">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-indigo-950">Garansi (Warranty)</h5>
              <p className="text-[11px] text-indigo-900">
                Segala penukaran sparepart orisinil ditiadakan biayanya jika segel printer
                utuh dan berumur di bawah 1 tahun.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-700">Free of Charge (F.O.C)</h5>
              <p className="text-[11px] text-slate-600">
                Diberikan sebagai program promosi khusus, kesepakatan mufakat (MoU),
                atau bagian kebijakan purnajual pimpinan.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-xl space-y-2 border border-amber-100/50">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-amber-900">Bayar (Charged)</h5>
              <p className="text-[11px] text-amber-800">
                Layanan penggantian Printhead thermal, Roller, Adaptor power, dan Encoder
                yang habis masa pakainya / kelalaian operasional dinas.
              </p>
            </div>
          </div>
        </div>

        <div className="p-2 border border-dashed rounded-xl border-purple-200 text-center text-purple-950 bg-purple-50/30">
          <p className="text-[10px] font-medium leading-normal">
            Pilih salah satu baris SPH lalu klik{" "}
            <span className="font-bold">Review</span> untuk menyetujui, melunaskan gratis,
            serta mentrigger logistik.
          </p>
        </div>
      </div>
    </div>
  );
}
