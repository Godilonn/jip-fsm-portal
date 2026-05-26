/**
 * @file features/logistics/components/LogistikInventori.tsx
 * @description Orchestrator utama modul Logistik & Inventori.
 *
 * REFACTORED DARI: src/components/LogistikInventori.tsx (851 baris).
 *
 * Tanggung jawab komponen ini:
 *  - Render KPI strip + alert stok rendah
 *  - Tab navigation (4 tab)
 *  - Search + Export CSV + tombol Tambah
 *  - Delegasi render tabel ke InventoriTable sub-components
 *  - Buka/tutup LogistikFormModal dan ConfirmDialog
 *
 * State yang dikelola di sini:
 *  - activeTab, searchTerm, modalOpen, editingItem, confirmDelete
 * Semua form state ada di LogistikFormModal → useLogisticsForm hooks.
 */

import React, { useState } from "react";
import {
  Package, Truck, ClipboardList, Layers, AlertTriangle, Plus, Download, FileUp,
} from "lucide-react";
import SearchInput from "../../../components/shared/SearchInput";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import LogistikFormModal from "./LogistikFormModal";
import ImportSparepartModal from "./ImportSparepartModal";
import {
  LogisticsTable,
  SparepartsTable,
  AtkTable,
  AsetTable,
} from "./InventoriTable";
import type {
  BarangAktif, SparepartItem, ATKItem, AsetDemoItem, UserRole,
} from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ActiveTab = "logistics" | "spareparts" | "atk" | "assets";

interface LogistikInventoriProps {
  logistics: BarangAktif[];
  spareparts: SparepartItem[];
  atkList: ATKItem[];
  assets: AsetDemoItem[];
  currentUserRole?: UserRole;

  onAddLogistics: (item: Omit<BarangAktif, "id">) => Promise<void>;
  onUpdateLogistics: (id: string, updated: Partial<BarangAktif>) => Promise<void>;
  onDeleteLogistics: (id: string) => Promise<void>;

  onAddSpareparts: (item: Omit<SparepartItem, "id" | "status">) => Promise<void>;
  onUpdateSpareparts: (id: string, updated: Partial<SparepartItem>) => Promise<void>;
  onDeleteSpareparts: (id: string) => Promise<void>;

  onAddAtk: (item: Omit<ATKItem, "id" | "status">) => Promise<void>;
  onUpdateAtk: (id: string, updated: Partial<ATKItem>) => Promise<void>;
  onDeleteAtk: (id: string) => Promise<void>;

  onAddAsset: (item: Omit<AsetDemoItem, "id">) => Promise<void>;
  onUpdateAsset: (id: string, updated: Partial<AsetDemoItem>) => Promise<void>;
  onDeleteAsset: (id: string) => Promise<void>;

  onRefreshAllData?: () => Promise<void> | void;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { key: ActiveTab; label: string; icon: React.ReactNode; subtitle: string }[] = [
  { key: "logistics",  label: "Barang Aktif (Logistik)", icon: <Truck size={14} />,        subtitle: "Pengiriman Unit Printer & Suku Cadang Aktif" },
  { key: "spareparts", label: "Sparepart",                icon: <Package size={14} />,      subtitle: "Gudang Suku Cadang & Komponen Cetak" },
  { key: "atk",        label: "ATK",                      icon: <ClipboardList size={14} />, subtitle: "Daftar Alat Tulis Kantor Penunjang Administrasi" },
  { key: "assets",     label: "Aset Demo",                icon: <Layers size={14} />,       subtitle: "Inventaris Alat Demo & Unit Pameran Sales" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV EXPORT HELPER
// ─────────────────────────────────────────────────────────────────────────────

function exportCsv(
  activeTab: ActiveTab,
  logistics: BarangAktif[],
  spareparts: SparepartItem[],
  atkList: ATKItem[],
  assets: AsetDemoItem[]
) {
  let rows: string[] = [];
  let filename = "rekap-inventori.csv";

  if (activeTab === "logistics") {
    filename = "data-logistik-aktif.csv";
    rows = [
      "No Resi,Barang,Berat (KG),Ukuran,Pemilik,Tujuan Pengiriman,Status",
      ...logistics.map(l => `"${l.noResi}","${l.barang}","${l.berat}","${l.ukuran}","${l.pemilik}","${l.tujuan}","${l.status}"`),
    ];
  } else if (activeTab === "spareparts") {
    filename = "inventori-spareparts.csv";
    rows = [
      "Kode Item,Part Number,Nama Barang,Kategori,Stok Tersedia,Harga (Sebelum PPN),Status,Kompatibilitas Mesin",
      ...spareparts.map(s => `"${s.kodeItem}","${s.partNumber}","${s.namaBarang}","${s.kategori}","${s.stok}","${s.harga}","${s.status}","${s.untukMesinApa}"`),
    ];
  } else if (activeTab === "atk") {
    filename = "inventori-ATK.csv";
    rows = [
      "Kode,Nama Barang,Kategori,Stok,Status",
      ...atkList.map(a => `"${a.kode}","${a.namaBarang}","${a.kategori}","${a.stok}","${a.status}"`),
    ];
  } else {
    filename = "aset-demo-kantor.csv";
    rows = [
      "Kode,Nama Aset,Jenis,Kondisi Fisik,Status Pinjam,Lokasi Penyimpanan,Keterangan",
      ...assets.map(a => `"${a.kode}","${a.namaBarang}","${a.jenis}","${a.kondisi}","${a.status}","${a.lokasi}","${a.keterangan}"`),
    ];
  }

  const uri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LogistikInventori({
  logistics, spareparts, atkList, assets, currentUserRole,
  onAddLogistics, onUpdateLogistics, onDeleteLogistics,
  onAddSpareparts, onUpdateSpareparts, onDeleteSpareparts,
  onAddAtk, onUpdateAtk, onDeleteAtk,
  onAddAsset, onUpdateAsset, onDeleteAsset,
  onRefreshAllData,
}: LogistikInventoriProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("logistics");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BarangAktif | SparepartItem | ATKItem | AsetDemoItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; tab: ActiveTab } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ── Derived KPI data ──────────────────────────────────────────────────────
  const totalBarangCount = spareparts.length + atkList.length + assets.length;
  const totalStokCount =
    spareparts.reduce((s, i) => s + i.stok, 0) +
    atkList.reduce((s, i) => s + i.stok, 0);
  const lowStockItems = [
    ...spareparts.filter((s) => s.status === "Stok Rendah" || s.status === "Habis")
      .map((i) => ({ name: i.namaBarang, stock: i.stok })),
    ...atkList.filter((a) => a.status === "Stok Rendah" || a.status === "Habis")
      .map((i) => ({ name: i.namaBarang, stock: i.stok })),
  ];

  // ── RBAC helpers ──────────────────────────────────────────────────────────
  const isManager = currentUserRole === "MANAGER";
  const canEditLogistics = currentUserRole !== "CUSTOMER";
  const canEditMaster = isManager; // spareparts, atk, assets = Manager only

  const canEditCurrentTab =
    activeTab === "logistics" ? canEditLogistics : canEditMaster;

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BarangAktif | SparepartItem | ATKItem | AsetDemoItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // ── Tab switch resets search ──────────────────────────────────────────────
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  // ── Confirm delete ────────────────────────────────────────────────────────
  const handleRequestDelete = (id: string, tab: ActiveTab) => {
    setConfirmDelete({ id, tab });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { id, tab } = confirmDelete;
    if (tab === "logistics") await onDeleteLogistics(id);
    else if (tab === "spareparts") await onDeleteSpareparts(id);
    else if (tab === "atk") await onDeleteAtk(id);
    else await onDeleteAsset(id);
    setConfirmDelete(null);
  };

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="space-y-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
              Total Macam Barang
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalBarangCount} Unit</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100/50 text-indigo-600">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
              Total Stok Fisik
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalStokCount} Pcs</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100/50 text-emerald-600">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-800">
              Alert Stok Rendah / Habis
            </span>
            <p className="text-2xl font-black text-amber-900 mt-1">{lowStockItems.length} Komponen</p>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* ── Low-stock alert banner ─────────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-3 text-xs text-amber-800 flex items-start gap-2 shadow-sm">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Pemberitahuan:</strong> Beberapa item mendekati batas habis:{" "}
            <strong>{lowStockItems.map((i) => `${i.name} (${i.stock} sisa)`).join(", ")}</strong>.
            Mohon segera laksanakan restock gudang.
          </span>
        </div>
      )}

      {/* ── Tab + Action Bar ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 space-y-4">

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                  : "text-slate-600 hover:bg-blue-50/60 hover:text-blue-600"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search + Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={`Cari di tab ${activeTab}…`}
            className="flex-1"
          />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={() => exportCsv(activeTab, logistics, spareparts, atkList, assets)}
            >
              Ekspor Excel
            </Button>

            {/* Tombol Import Excel — hanya muncul di tab Sparepart dan role MANAGER */}
            {activeTab === "spareparts" && isManager && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileUp size={14} />}
                onClick={() => setImportModalOpen(true)}
              >
                Import Excel/CSV
              </Button>
            )}

            {canEditCurrentTab ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={15} />}
                onClick={handleOpenAdd}
              >
                Tambah {activeTab === "logistics" ? "Logistik" : "Master"}
              </Button>
            ) : (
              <span className="text-[10px] font-mono bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap">
                ⚠️ Form Dikunci (MANAGER Only)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Table Panel ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          {activeTabConfig.icon}
          <h3 className="font-semibold text-xs sm:text-sm text-slate-700">{activeTabConfig.subtitle}</h3>
        </div>

        {activeTab === "logistics" && (
          <LogisticsTable
            data={logistics}
            searchTerm={searchTerm}
            canEdit={canEditLogistics}
            onEdit={handleOpenEdit}
            onDelete={(id) => handleRequestDelete(id, "logistics")}
          />
        )}
        {activeTab === "spareparts" && (
          <SparepartsTable
            data={spareparts}
            searchTerm={searchTerm}
            canEdit={canEditMaster}
            onEdit={handleOpenEdit}
            onDelete={(id) => handleRequestDelete(id, "spareparts")}
          />
        )}
        {activeTab === "atk" && (
          <AtkTable
            data={atkList}
            searchTerm={searchTerm}
            canEdit={canEditMaster}
            onEdit={handleOpenEdit}
            onDelete={(id) => handleRequestDelete(id, "atk")}
          />
        )}
        {activeTab === "assets" && (
          <AsetTable
            data={assets}
            searchTerm={searchTerm}
            canEdit={canEditMaster}
            onEdit={handleOpenEdit}
            onDelete={(id) => handleRequestDelete(id, "assets")}
          />
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────────────────────────────── */}
      <LogistikFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activeTab={activeTab}
        editingItem={editingItem}
        onAddLogistics={onAddLogistics}
        onUpdateLogistics={onUpdateLogistics}
        onAddSpareparts={onAddSpareparts}
        onUpdateSpareparts={onUpdateSpareparts}
        onAddAtk={onAddAtk}
        onUpdateAtk={onUpdateAtk}
        onAddAsset={onAddAsset}
        onUpdateAsset={onUpdateAsset}
      />

      {/* ── Confirm Delete Dialog ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Hapus Item Inventori?"
        message="Item ini akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
        destructive
      />

      {/* ── Import Massal Modal (Sparepart) ────────────────────────────────── */}
      <ImportSparepartModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={async () => {
          setImportModalOpen(false);
          if (onRefreshAllData) await onRefreshAllData();
        }}
      />
    </div>
  );
}
