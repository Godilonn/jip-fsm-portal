/**
 * @file features/logistics/components/LogistikFormModal.tsx
 * @description Modal form Add/Edit untuk semua tab di LogistikInventori.
 *
 * DIPINDAH DARI: LogistikInventori.tsx baris 668-840 (~172 baris inline).
 *
 * Satu modal generik yang menampilkan form berbeda tergantung `activeTab`.
 * Menggunakan hooks form terpisah: useLogistikForm, useSparepartForm, dll.
 */

import React, { useEffect, useState } from "react";
import { Package } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { TextInput, SelectInput } from "../../../components/ui/Input";
import { useLogistikForm, useSparepartForm, useAtkForm, useAsetForm } from "../hooks/useLogisticsForm";
import type { BarangAktif, SparepartItem, ATKItem, AsetDemoItem } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = "logistics" | "spareparts" | "atk" | "assets";

interface LogistikFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  editingItem?: BarangAktif | SparepartItem | ATKItem | AsetDemoItem | null;
  onAddLogistics: (item: Omit<BarangAktif, "id">) => Promise<void>;
  onUpdateLogistics: (id: string, item: Partial<BarangAktif>) => Promise<void>;
  onAddSpareparts: (item: Omit<SparepartItem, "id" | "status">) => Promise<void>;
  onUpdateSpareparts: (id: string, item: Partial<SparepartItem>) => Promise<void>;
  onAddAtk: (item: Omit<ATKItem, "id" | "status">) => Promise<void>;
  onUpdateAtk: (id: string, item: Partial<ATKItem>) => Promise<void>;
  onAddAsset: (item: Omit<AsetDemoItem, "id">) => Promise<void>;
  onUpdateAsset: (id: string, item: Partial<AsetDemoItem>) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB LABELS
// ─────────────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<ActiveTab, string> = {
  logistics: "Resi Logistik",
  spareparts: "Sparepart",
  atk: "ATK",
  assets: "Aset Demo",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LogistikFormModal({
  isOpen,
  onClose,
  activeTab,
  editingItem,
  onAddLogistics, onUpdateLogistics,
  onAddSpareparts, onUpdateSpareparts,
  onAddAtk, onUpdateAtk,
  onAddAsset, onUpdateAsset,
}: LogistikFormModalProps) {

  const logistik = useLogistikForm();
  const sparepart = useSparepartForm();
  const atk = useAtkForm();
  const aset = useAsetForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Populate atau reset saat modal terbuka
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (editingItem) {
      if (activeTab === "logistics") logistik.load(editingItem as BarangAktif);
      else if (activeTab === "spareparts") sparepart.load(editingItem as SparepartItem);
      else if (activeTab === "atk") atk.load(editingItem as ATKItem);
      else if (activeTab === "assets") aset.load(editingItem as AsetDemoItem);
    } else {
      logistik.reset(); sparepart.reset(); atk.reset(); aset.reset();
    }
  }, [isOpen, activeTab, editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const editingId = (editingItem as any)?.id;
      if (activeTab === "logistics") {
        const payload = logistik.toPayload();
        if (!payload.noResi || !payload.barang) { setError("Isi No. Resi dan Nama Barang."); return; }
        editingId ? await onUpdateLogistics(editingId, payload) : await onAddLogistics(payload);
      } else if (activeTab === "spareparts") {
        const payload = sparepart.toPayload();
        if (!payload.namaBarang) { setError("Isi Nama Barang."); return; }
        editingId ? await onUpdateSpareparts(editingId, payload) : await onAddSpareparts(payload);
      } else if (activeTab === "atk") {
        const payload = atk.toPayload();
        if (!payload.namaBarang) { setError("Isi Nama Barang."); return; }
        editingId ? await onUpdateAtk(editingId, payload) : await onAddAtk(payload);
      } else if (activeTab === "assets") {
        const payload = aset.toPayload();
        if (!payload.namaBarang) { setError("Isi Nama Barang."); return; }
        editingId ? await onUpdateAsset(editingId, payload) : await onAddAsset(payload);
      }
      onClose();
    } catch {
      setError("Gagal menyimpan data. Coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabLabel = TAB_LABELS[activeTab];
  const isEditing = !!editingItem;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`${isEditing ? "Edit" : "Tambah"} ${tabLabel}`}
      headerIcon={<Package size={16} className="text-indigo-400" />}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button variant="primary" size="sm" loading={isSubmitting} loadingText="Menyimpan..." onClick={handleSubmit as any} form="logistik-form" type="submit">
            {isEditing ? "Simpan Perubahan" : `Tambah ${tabLabel}`}
          </Button>
        </>
      }
    >
      <form id="logistik-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">{error}</div>
        )}

        {/* ── LOGISTIK ──────────────────────────────────────────────── */}
        {activeTab === "logistics" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput label="No. Resi" required mono value={logistik.form.noResi} onChange={(e) => logistik.setField("noResi", e.target.value)} placeholder="RESI-12345678" />
              <TextInput label="Nama Barang" required value={logistik.form.barang} onChange={(e) => logistik.setField("barang", e.target.value)} placeholder="Sparepart Printhead SR200" />
              <TextInput label="Berat (kg)" type="number" value={String(logistik.form.berat)} onChange={(e) => logistik.setField("berat", parseFloat(e.target.value) || 0)} />
              <TextInput label="Ukuran (cm)" value={logistik.form.ukuran} onChange={(e) => logistik.setField("ukuran", e.target.value)} placeholder="30x20x15 cm" />
              <TextInput label="Pemilik / Pengirim" value={logistik.form.pemilik} onChange={(e) => logistik.setField("pemilik", e.target.value)} />
              <TextInput label="Tujuan" value={logistik.form.tujuan} onChange={(e) => logistik.setField("tujuan", e.target.value)} />
            </div>
            <SelectInput
              label="Status Pengiriman"
              value={logistik.form.status}
              onChange={(e) => logistik.setField("status", e.target.value as BarangAktif["status"])}
              options={["Menunggu", "Dalam Perjalanan", "Sampai", "Diterima"].map((s) => ({ value: s, label: s }))}
            />
          </>
        )}

        {/* ── SPAREPART ─────────────────────────────────────────────── */}
        {activeTab === "spareparts" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Kode Item" mono value={sparepart.form.kodeItem} onChange={(e) => sparepart.setField("kodeItem", e.target.value)} />
            <TextInput label="Part Number" mono value={sparepart.form.partNumber} onChange={(e) => sparepart.setField("partNumber", e.target.value)} />
            <TextInput label="Nama Barang" required value={sparepart.form.namaBarang} onChange={(e) => sparepart.setField("namaBarang", e.target.value)} wrapperClassName="sm:col-span-2" />
            <TextInput label="Kategori" value={sparepart.form.kategori} onChange={(e) => sparepart.setField("kategori", e.target.value)} />
            <TextInput label="Kompatibel dengan Mesin" value={sparepart.form.untukMesinApa} onChange={(e) => sparepart.setField("untukMesinApa", e.target.value)} placeholder="SR200, CR805" />
            <TextInput label="Stok" type="number" value={String(sparepart.form.stok)} onChange={(e) => sparepart.setField("stok", parseInt(e.target.value) || 0)} />
            <TextInput label="Harga (Rp, ex-PPN)" type="number" value={String(sparepart.form.harga)} onChange={(e) => sparepart.setField("harga", parseInt(e.target.value) || 0)} />
          </div>
        )}

        {/* ── ATK ───────────────────────────────────────────────────── */}
        {activeTab === "atk" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Kode ATK" mono value={atk.form.kode} onChange={(e) => atk.setField("kode", e.target.value)} />
            <TextInput label="Kategori" value={atk.form.kategori} onChange={(e) => atk.setField("kategori", e.target.value)} />
            <TextInput label="Nama Barang" required value={atk.form.namaBarang} onChange={(e) => atk.setField("namaBarang", e.target.value)} wrapperClassName="sm:col-span-2" />
            <TextInput label="Stok" type="number" value={String(atk.form.stok)} onChange={(e) => atk.setField("stok", parseInt(e.target.value) || 0)} />
          </div>
        )}

        {/* ── ASET ──────────────────────────────────────────────────── */}
        {activeTab === "assets" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Kode Aset" mono value={aset.form.kode} onChange={(e) => aset.setField("kode", e.target.value)} />
            <TextInput label="Jenis Aset" value={aset.form.jenis} onChange={(e) => aset.setField("jenis", e.target.value)} />
            <TextInput label="Nama Barang" required value={aset.form.namaBarang} onChange={(e) => aset.setField("namaBarang", e.target.value)} wrapperClassName="sm:col-span-2" />
            <SelectInput label="Kondisi" value={aset.form.kondisi} onChange={(e) => aset.setField("kondisi", e.target.value as AsetDemoItem["kondisi"])}
              options={["Bagus", "Rusak", "Perlu Servis"].map((s) => ({ value: s, label: s }))} />
            <SelectInput label="Status" value={aset.form.status} onChange={(e) => aset.setField("status", e.target.value as AsetDemoItem["status"])}
              options={["Tersedia", "Dipinjam", "Maintenance"].map((s) => ({ value: s, label: s }))} />
            <TextInput label="Lokasi" value={aset.form.lokasi} onChange={(e) => aset.setField("lokasi", e.target.value)} placeholder="Gudang Surabaya" />
            <TextInput label="Keterangan" value={aset.form.keterangan} onChange={(e) => aset.setField("keterangan", e.target.value)} wrapperClassName="sm:col-span-2" />
          </div>
        )}
      </form>
    </Modal>
  );
}
