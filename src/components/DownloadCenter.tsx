/**
 * @file components/DownloadCenter.tsx
 * @description Pusat unduhan driver, firmware, manual, dan aplikasi JIP.
 * MANAGER dapat mengupload file baru. Akses file dikontrol per role.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Download, Upload, Search, Filter, FileText, Package,
  Cpu, Wrench, Monitor, Trash2, Plus, X, Loader2,
  HardDrive, AlertCircle,
} from "lucide-react";
import type { UserRole } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DownloadItem {
  id: string;
  name: string;
  version: string;
  type: "Driver" | "Firmware" | "Utility" | "Manual" | "Aplikasi";
  device: string;
  description: string;
  compatibility: string;
  releaseDate: string;
  fileSize: string;
  fileName: string;
  filePath: string;
  status: string;
  allowedRoles?: string[] | null;
  uploadedBy: string;
  createdAt: string;
}

type FileCategory = "Semua" | "Driver" | "Firmware" | "Utility" | "Manual" | "Aplikasi";

const CATEGORY_ICONS: Record<FileCategory, React.ReactNode> = {
  Semua:    <HardDrive size={14} />,
  Driver:   <Cpu size={14} />,
  Firmware: <Package size={14} />,
  Utility:  <Wrench size={14} />,
  Manual:   <FileText size={14} />,
  Aplikasi: <Monitor size={14} />,
};

const CATEGORIES: FileCategory[] = ["Semua", "Driver", "Firmware", "Utility", "Manual", "Aplikasi"];

// ── Upload Modal ──────────────────────────────────────────────────────────────
interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", version: "v1.0.0", type: "Driver",
    device: "Semua", description: "", compatibility: "Windows 10/11",
    releaseDate: new Date().toISOString().split("T")[0],
    status: "Official Release", allowedRoles: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Pilih file terlebih dahulu."); return; }
    if (!form.name.trim()) { setError("Nama file wajib diisi."); return; }

    setLoading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v as string));

      const res = await fetch("/api/downloads", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload gagal.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Upload File Baru</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {/* File picker */}
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              {fileRef.current?.files?.[0]?.name ?? "Klik untuk pilih file"}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, ZIP, EXE, DOCX, XLSX maks. 100 MB</p>
            <input ref={fileRef} type="file" className="hidden" onChange={() => {}} accept=".pdf,.zip,.7z,.rar,.exe,.msi,.docx,.xlsx,.txt,.png,.jpg,.jpeg,.bin,.inf,.cab" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nama</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nama file/software" className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Versi</label>
              <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="v1.0.0" className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kategori</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none">
                {["Driver","Firmware","Utility","Manual","Aplikasi"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Perangkat</label>
              <input value={form.device} onChange={e => setForm(f => ({ ...f, device: e.target.value }))} placeholder="SR200, CR805, Semua..." className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Deskripsi singkat file ini..." className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kompatibilitas</label>
              <input value={form.compatibility} onChange={e => setForm(f => ({ ...f, compatibility: e.target.value }))} className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Akses Role</label>
              <input value={form.allowedRoles} onChange={e => setForm(f => ({ ...f, allowedRoles: e.target.value }))} placeholder="Kosong = Semua" className="px-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-60 flex items-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main DownloadCenter ───────────────────────────────────────────────────────
interface DownloadCenterProps {
  currentUserRole: UserRole;
}

export default function DownloadCenter({ currentUserRole }: DownloadCenterProps) {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<FileCategory>("Semua");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isManager = currentUserRole === "MANAGER";

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/downloads", { credentials: "include" });
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error("[DownloadCenter] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus file ini dari server?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/downloads/${id}`, { method: "DELETE", credentials: "include" });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  // Filter by role access
  const accessible = items.filter(item => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.includes(currentUserRole);
  });

  // Filter by category + search
  const filtered = accessible.filter(item => {
    const matchCat = category === "Semua" || item.type === category;
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.device.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const TYPE_COLOR: Record<string, string> = {
    Driver:   "bg-blue-100 text-blue-700 border-blue-200",
    Firmware: "bg-violet-100 text-violet-700 border-violet-200",
    Utility:  "bg-amber-100 text-amber-700 border-amber-200",
    Manual:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    Aplikasi: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pusat Unduhan</h1>
          <p className="text-sm text-slate-500 mt-1">Driver, Firmware, Manual, Utility & Aplikasi resmi JIP</p>
        </div>
        {isManager && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus size={15} /> Upload File
          </button>
        )}
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, perangkat, deskripsi..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse flex flex-col gap-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-8 bg-slate-100 rounded-xl mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-slate-100 rounded-2xl mb-4"><HardDrive size={28} className="text-slate-400" /></div>
          <p className="font-semibold text-slate-700">Tidak ada file ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">
            {items.length === 0 ? "Belum ada file yang diupload." : "Coba ubah filter atau kata kunci pencarian."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`inline-flex items-center border rounded-full text-[10px] font-bold px-2 py-0.5 ${TYPE_COLOR[item.type] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {item.type}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.version}</span>
                    {item.device !== "Semua" && (
                      <span className="text-[11px] text-slate-400">· {item.device}</span>
                    )}
                  </div>
                </div>
                {isManager && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors flex-shrink-0"
                    title="Hapus file"
                  >
                    {deleting === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.description}</p>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{item.compatibility}</span>
                <span>{item.fileSize}</span>
              </div>

              {/* Download button */}
              <a
                href={`/${item.filePath}`}
                download={item.fileName}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm mt-auto"
              >
                <Download size={14} /> Unduh
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={fetchItems}
      />
    </div>
  );
}
