/**
 * @file features/sph/components/SphTable.tsx
 * @description Tabel daftar dokumen SPH dengan inline status dropdown.
 *
 * DIPINDAH DARI: AdministrasiSPH.tsx baris 242-354 (~112 baris inline JSX).
 *
 * Aksi preview / review / delete / status-change didelegasikan ke parent via callback.
 * `window.confirm` DIHAPUS — parent harus menampilkan ConfirmDialog.
 */

import React from "react";
import { FileText, Eye, CheckSquare, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import { SphChargeBadge } from "../../../components/shared/StatusBadge";
import { formatRp } from "../../../lib/utils";
import type { SPH } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface SphTableProps {
  sphList: SPH[];
  selectedReviewId?: string | null;
  onPreview: (sph: SPH) => void;
  onReview: (sph: SPH) => void;
  onRequestDelete: (id: string) => void;
  onRequestStatusChange: (id: string, newStatus: SPH["statusCharge"]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS SELECT COLORS
// ─────────────────────────────────────────────────────────────────────────────

function statusSelectClass(status: SPH["statusCharge"]): string {
  if (status === "Bayar")
    return "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100";
  if (status === "Free of Charge")
    return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
  return "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100";
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SphTable({
  sphList,
  selectedReviewId,
  onPreview,
  onReview,
  onRequestDelete,
  onRequestStatusChange,
}: SphTableProps) {
  if (sphList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
        Belum ada SPH (Surat Penawaran Harga) yang diterbitkan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
            <th className="py-3 px-4">No SPH / Tanggal</th>
            <th className="py-3 px-4">Kepada Instansi/Dinas</th>
            <th className="py-3 px-4">Tipe Biaya</th>
            <th className="py-3 px-4">Harga Quoted</th>
            <th className="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {sphList.map((sph) => (
            <tr key={sph.id} className="hover:bg-slate-50/50 transition duration-150">

              {/* No SPH + Tanggal */}
              <td className="py-3 px-4">
                <div className="font-mono text-xs font-semibold text-indigo-950">{sph.nomorSurat}</div>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{sph.tanggal}</span>
              </td>

              {/* Dinas */}
              <td className="py-3 px-4 font-semibold text-slate-800">
                {sph.dinasMana}
                {sph.serviceId && (
                  <div className="text-[10px] font-mono text-slate-400 font-normal mt-0.5">
                    Linked: {sph.serviceId}
                  </div>
                )}
              </td>

              {/* Status dropdown — raises to parent for confirmation */}
              <td className="py-3 px-4">
                <select
                  value={sph.statusCharge}
                  onChange={(e) =>
                    onRequestStatusChange(sph.id, e.target.value as SPH["statusCharge"])
                  }
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border outline-none bg-white cursor-pointer transition ${statusSelectClass(sph.statusCharge)}`}
                >
                  <option value="Bayar">🔴 Bayar (Charged)</option>
                  <option value="Free of Charge">🟢 Free of Charge (FOC)</option>
                  <option value="Garansi">🔵 Garansi (Warranty)</option>
                </select>
              </td>

              {/* Total */}
              <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                {formatRp(sph.total)}
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<Eye size={12} />}
                    onClick={() => onPreview(sph)}
                    title="Preview Surat"
                  >
                    Live Preview
                  </Button>

                  {sph.serviceId && (
                    <Button
                      variant={selectedReviewId === sph.id ? "primary" : "ghost"}
                      size="xs"
                      leftIcon={<CheckSquare size={12} />}
                      onClick={() => onReview(sph)}
                      className={
                        selectedReviewId === sph.id
                          ? "bg-purple-600 hover:bg-purple-700 border-purple-600 text-white"
                          : "text-purple-700 hover:bg-purple-50 border border-purple-200"
                      }
                      title="Tinjau Persetujuan & Logistik SPH"
                    >
                      Review
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onRequestDelete(sph.id)}
                    className="text-rose-600 hover:bg-rose-50"
                    title="Hapus SPH"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
