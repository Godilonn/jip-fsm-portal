/**
 * @file features/sph/components/AdministrasiSPH.tsx
 * @description Orchestrator utama modul Administrasi SPH.
 *
 * REFACTORED DARI: src/components/AdministrasiSPH.tsx (973 baris).
 *
 * Tanggung jawab komponen ini:
 *  - Search bar + tombol Buat SPH
 *  - Menampilkan SphTable (listing)
 *  - Panel kanan: SphApprovalPanel (review workflow)
 *  - ConfirmDialog untuk hapus & perubahan status
 *  - SphFormModal untuk pembuatan SPH baru
 *  - SphPreviewModal untuk cetak / ekspor SPH
 *
 * TIDAK ada window.confirm / window.alert di sini.
 * TIDAK ada form state — semuanya ada di SphFormModal → useSphForm.
 */

import React, { useState } from "react";
import { FileText, Plus } from "lucide-react";
import SearchInput from "../../../components/shared/SearchInput";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import SphTable from "./SphTable";
import SphFormModal from "./SphFormModal";
import SphPreviewModal from "./SphPreviewModal";
import SphApprovalPanel from "./SphApprovalPanel";
import type { SPH, PrinterService, SparepartItem } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface AdministrasiSPHProps {
  sphList: SPH[];
  services: PrinterService[];
  spareparts: SparepartItem[];
  onAddSph: (sph: Omit<SPH, "id">) => Promise<void>;
  onDeleteSph: (id: string) => Promise<void>;
  onUpdateSphStatus: (id: string, newStatus: SPH["statusCharge"]) => Promise<void>;
  onRefreshAllData?: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdministrasiSPH({
  sphList,
  services,
  spareparts,
  onAddSph,
  onDeleteSph,
  onUpdateSphStatus,
  onRefreshAllData,
}: AdministrasiSPHProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewSph, setPreviewSph] = useState<SPH | null>(null);
  const [reviewSph, setReviewSph] = useState<SPH | null>(null);
  const [reviewError, setReviewError] = useState("");

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Confirm status change
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    surat: string;
    newStatus: SPH["statusCharge"];
  } | null>(null);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filteredSph = sphList.filter(
    (s) =>
      s.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dinasMana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleReviewToggle = (sph: SPH) => {
    setReviewError("");
    setReviewSph((prev) => (prev?.id === sph.id ? null : sph));
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await onDeleteSph(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    await onUpdateSphStatus(pendingStatusChange.id, pendingStatusChange.newStatus);
    setPendingStatusChange(null);
  };

  return (
    <div className="space-y-6">

      {/* ── Search + CTA ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari SPH (No Surat, Nama Dinas/Instansi)..."
          className="flex-1"
        />
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setIsFormOpen(true)}
          className="shrink-0"
        >
          Buat Surat Penawaran (SPH)
        </Button>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Table Block */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="text-purple-600" size={18} />
              Dokumen SPH Administrasi & Tagihan
            </h3>
            <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filteredSph.length} Dokumen
            </span>
          </div>

          <SphTable
            sphList={filteredSph}
            selectedReviewId={reviewSph?.id}
            onPreview={setPreviewSph}
            onReview={handleReviewToggle}
            onRequestDelete={(id) => setConfirmDeleteId(id)}
            onRequestStatusChange={(id, newStatus) => {
              const sph = sphList.find((s) => s.id === id);
              if (sph) {
                setPendingStatusChange({ id, surat: sph.nomorSurat, newStatus });
              }
            }}
          />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-1">
          {reviewError && (
            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {reviewError}
            </div>
          )}
          <SphApprovalPanel
            selectedSph={reviewSph}
            onCancel={() => { setReviewSph(null); setReviewError(""); }}
            onError={setReviewError}
            onSuccess={() => setReviewSph(null)}
            onRefreshAllData={onRefreshAllData}
          />
        </div>
      </div>

      {/* ── Form Modal ─────────────────────────────────────────────────── */}
      <SphFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        services={services}
        spareparts={spareparts}
        sphCount={sphList.length}
        onSubmit={async (payload) => {
          await onAddSph(payload);
        }}
      />

      {/* ── Preview Modal ───────────────────────────────────────────────── */}
      <SphPreviewModal
        sph={previewSph}
        onClose={() => setPreviewSph(null)}
        onRefreshAllData={onRefreshAllData}
      />

      {/* ── Confirm: Delete SPH ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Hapus Dokumen SPH?"
        message="Dokumen SPH ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
        destructive
      />

      {/* ── Confirm: Status Change ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!pendingStatusChange}
        title="Ubah Status Pembebanan SPH?"
        message={
          pendingStatusChange
            ? `Ubah status SPH ${pendingStatusChange.surat} menjadi "${pendingStatusChange.newStatus}" sesuai instruksi atasan?`
            : ""
        }
        confirmLabel="Ya, Ubah"
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
}
