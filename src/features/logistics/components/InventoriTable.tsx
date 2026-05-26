/**
 * @file features/logistics/components/InventoriTable.tsx
 * @description Empat tabel data inventori berdasarkan activeTab.
 *
 * DIPINDAH DARI: LogistikInventori.tsx baris 413-665 (~252 baris inline).
 *
 * Masing-masing tabel punya kolom dan badge styling sendiri.
 * Aksi Edit/Hapus didelegasikan ke parent via callback.
 */

import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import { StokBadge } from "../../../components/shared/StatusBadge";
import Button from "../../../components/ui/Button";
import { formatRp } from "../../../lib/utils";
import type {
  BarangAktif,
  SparepartItem,
  ATKItem,
  AsetDemoItem,
  UserRole,
} from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TABLE SHELL
// ─────────────────────────────────────────────────────────────────────────────

function TableShell({
  head,
  children,
  empty,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  empty: string;
}) {
  const hasRows = React.Children.count(children) > 0;
  return (
    <div className="overflow-x-auto">
      {hasRows ? (
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">{children}</tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">{empty}</div>
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`py-3 px-4 ${right ? "text-right" : ""}`}>{children}</th>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

function RowActions({
  onEdit,
  onDelete,
  canEdit,
}: {
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return (
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight bg-slate-100 px-2 py-0.5 rounded">
        Only Manager
      </span>
    );
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="xs"
        leftIcon={<Edit3 size={12} />}
        onClick={onEdit}
        className="text-indigo-600 hover:bg-indigo-50"
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={onDelete}
        className="text-rose-600 hover:bg-rose-50"
        title="Hapus"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGISTICS TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface LogisticsTableProps {
  data: BarangAktif[];
  searchTerm: string;
  canEdit: boolean;
  onEdit: (item: BarangAktif) => void;
  onDelete: (id: string) => void;
}

export function LogisticsTable({ data, searchTerm, canEdit, onEdit, onDelete }: LogisticsTableProps) {
  const filtered = data.filter(
    (l) =>
      l.barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.noResi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TableShell
      empty="Tidak ada pengiriman logistik aktif."
      head={
        <>
          <Th>No Resi / Item</Th>
          <Th>Spesifikasi Fisik</Th>
          <Th>Instansi Pemilik</Th>
          <Th>Tujuan / Alamat</Th>
          <Th>Status</Th>
          <Th right>Aksi</Th>
        </>
      }
    >
      {filtered.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition">
          <td className="py-3 px-4">
            <div className="font-mono text-xs font-semibold text-slate-900">{item.noResi}</div>
            <span className="text-[11px] text-slate-600 font-medium block mt-0.5">{item.barang}</span>
          </td>
          <td className="py-3 px-4 font-mono text-xs text-slate-500">
            {item.berat} KG | {item.ukuran}
          </td>
          <td className="py-3 px-4 font-semibold text-slate-800">{item.pemilik}</td>
          <td className="py-3 px-4 font-medium text-slate-600 max-w-xs truncate">{item.tujuan}</td>
          <td className="py-3 px-4">
            <div className="space-y-1">
              <span
                className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  item.status === "Sampai" || item.status === "Diterima"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {item.status}
              </span>
              {item.packingStatus && (
                <div className="space-y-1">
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      item.packingStatus === "READY_TO_PACK"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : item.packingStatus === "PACKED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    📦 {item.packingStatus}
                  </span>
                  {item.scheduleShipping && (
                    <span className="text-[9px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 block whitespace-pre-wrap max-w-xs">
                      🚚 {item.scheduleShipping}
                    </span>
                  )}
                </div>
              )}
            </div>
          </td>
          <td className="py-3 px-4 text-right">
            <RowActions canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPAREPARTS TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface SparepartsTableProps {
  data: SparepartItem[];
  searchTerm: string;
  canEdit: boolean;
  onEdit: (item: SparepartItem) => void;
  onDelete: (id: string) => void;
}

export function SparepartsTable({ data, searchTerm, canEdit, onEdit, onDelete }: SparepartsTableProps) {
  const filtered = data.filter(
    (s) =>
      s.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TableShell
      empty="Tidak ada data spareparts."
      head={
        <>
          <Th>Kode / P/N</Th>
          <Th>Nama Suku Cadang</Th>
          <Th>Kategori</Th>
          <Th>Stok</Th>
          <Th>Harga (Ex PPN)</Th>
          <Th>Kompatibilitas</Th>
          <Th right>Aksi</Th>
        </>
      }
    >
      {filtered.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition">
          <td className="py-3 px-4 font-mono">
            <div className="font-semibold text-slate-900 text-xs">{item.kodeItem}</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">P/N: {item.partNumber}</span>
          </td>
          <td className="py-3 px-4 font-semibold text-slate-800">{item.namaBarang}</td>
          <td className="py-3 px-4 text-slate-500">{item.kategori}</td>
          <td className="py-3 px-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono font-bold text-slate-800 text-sm">{item.stok} unit</span>
              <StokBadge stok={item.stok} />
            </div>
          </td>
          <td className="py-3 px-4 font-mono font-semibold text-slate-900">{formatRp(item.harga)}</td>
          <td className="py-3 px-4 font-mono text-xs">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{item.untukMesinApa}</span>
          </td>
          <td className="py-3 px-4 text-right">
            <RowActions canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATK TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface AtkTableProps {
  data: ATKItem[];
  searchTerm: string;
  canEdit: boolean;
  onEdit: (item: ATKItem) => void;
  onDelete: (id: string) => void;
}

export function AtkTable({ data, searchTerm, canEdit, onEdit, onDelete }: AtkTableProps) {
  const filtered = data.filter((a) =>
    a.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TableShell
      empty="Tidak ada inventori ATK."
      head={
        <>
          <Th>Kode ATK</Th>
          <Th>Nama Barang</Th>
          <Th>Kategori</Th>
          <Th>Stok</Th>
          <Th>Status</Th>
          <Th right>Aksi</Th>
        </>
      }
    >
      {filtered.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition">
          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">{item.kode}</td>
          <td className="py-3 px-4 font-medium text-slate-800">{item.namaBarang}</td>
          <td className="py-3 px-4 text-slate-500">{item.kategori}</td>
          <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.stok} unit</td>
          <td className="py-3 px-4">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${
                item.status === "Tersedia"
                  ? "bg-emerald-100 text-emerald-800"
                  : item.status === "Stok Rendah"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {item.status}
            </span>
          </td>
          <td className="py-3 px-4 text-right">
            <RowActions canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASET TABLE
// ─────────────────────────────────────────────────────────────────────────────

interface AsetTableProps {
  data: AsetDemoItem[];
  searchTerm: string;
  canEdit: boolean;
  onEdit: (item: AsetDemoItem) => void;
  onDelete: (id: string) => void;
}

export function AsetTable({ data, searchTerm, canEdit, onEdit, onDelete }: AsetTableProps) {
  const filtered = data.filter((a) =>
    a.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.kode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TableShell
      empty="Tidak ada data aset demo."
      head={
        <>
          <Th>Kode Aset</Th>
          <Th>Nama / Jenis Unit</Th>
          <Th>Kondisi Fisik</Th>
          <Th>Status Kantor</Th>
          <Th>Lokasi Showroom</Th>
          <Th>Keterangan</Th>
          <Th right>Aksi</Th>
        </>
      }
    >
      {filtered.map((item) => (
        <tr key={item.id} className="hover:bg-slate-50/50 transition">
          <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">{item.kode}</td>
          <td className="py-3 px-4">
            <div className="font-semibold text-slate-800">{item.namaBarang}</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{item.jenis}</span>
          </td>
          <td className="py-3 px-4">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                item.kondisi === "Bagus"
                  ? "bg-emerald-100 text-emerald-800"
                  : item.kondisi === "Rusak"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {item.kondisi}
            </span>
          </td>
          <td className="py-3 px-4">
            <span
              className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold border ${
                item.status === "Tersedia"
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : item.status === "Dipinjam"
                  ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              }`}
            >
              {item.status}
            </span>
          </td>
          <td className="py-3 px-4 font-semibold text-slate-500">{item.lokasi}</td>
          <td className="py-3 px-4 text-slate-400 max-w-xs truncate text-[11px]">{item.keterangan}</td>
          <td className="py-3 px-4 text-right whitespace-nowrap">
            <RowActions canEdit={canEdit} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}
