/**
 * @file features/logistics/components/ImportAsetDemoModal.tsx
 * @description Modal import massal Aset Demo dari file Excel / CSV.
 *
 * Kolom yang dikenali (case-insensitive, flexible header):
 *   Kode | Nama Barang | Jenis | Kondisi | Status | Lokasi | Keterangan
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle,
  ChevronRight, Download, Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedRow {
  kode: string;
  namaBarang: string;
  jenis: string;
  kondisi: string;
  status: string;
  lokasi: string;
  keterangan: string;
  _valid: boolean;
  _error?: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
  total: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER NORMALIZER
// ─────────────────────────────────────────────────────────────────────────────

function normalizeHeader(h: string): keyof ParsedRow | null {
  const s = h.toLowerCase().replace(/[\s_\-\.]+/g, "");
  if (s.includes("kode"))                                  return "kode";
  if (s.includes("nama"))                                  return "namaBarang";
  if (s.includes("jenis") || s.includes("type"))          return "jenis";
  if (s.includes("kondisi") || s.includes("condition"))   return "kondisi";
  if (s.includes("status"))                               return "status";
  if (s.includes("lokasi") || s.includes("location"))     return "lokasi";
  if (s.includes("keterangan") || s.includes("note") || s.includes("catatan")) return "keterangan";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL / CSV PARSER
// ─────────────────────────────────────────────────────────────────────────────

async function parseFile(file: File): Promise<{ rows: ParsedRow[]; headers: string[] }> {
  // @ts-ignore
  const XLSX = await import("xlsx");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (raw.length === 0) return { rows: [], headers: [] };

  const headers = Object.keys(raw[0]);

  const rows: ParsedRow[] = raw.map((r) => {
    const mapped: Partial<ParsedRow> = {
      kode: "", namaBarang: "", jenis: "Printer",
      kondisi: "Baik", status: "Tersedia",
      lokasi: "Kantor", keterangan: "",
    };

    for (const [key, val] of Object.entries(r)) {
      const field = normalizeHeader(key);
      if (!field) continue;
      (mapped as any)[field] = String(val ?? "").trim();
    }

    const valid = !!(mapped.namaBarang && mapped.namaBarang.trim());
    return {
      ...mapped,
      _valid: valid,
      _error: valid ? undefined : "Nama Barang kosong",
    } as ParsedRow;
  });

  return { rows, headers };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DOWNLOAD HELPER
// ─────────────────────────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = ["Kode", "Nama Barang", "Jenis", "Kondisi", "Status", "Lokasi", "Keterangan"];
  const sample = [
    ["DEMO-001", "Printer EM2S #01", "Printer", "Baik", "Tersedia", "Kantor Jakarta", "Unit demo pameran"],
    ["DEMO-002", "Printer CR707 #01", "Printer", "Baik", "Dipinjam", "Klien PT. ABC", "Dipinjam untuk demo 3 bulan"],
    ["DEMO-003", "Mini PC Intel NUC", "Komputer", "Baik", "Tersedia", "Gudang", ""],
  ];
  const csv = [headers, ...sample].map(r => r.join(";")).join("\n");
  const blob = new Blob(["﻿sep=;\n" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-import-aset-demo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

function Steps({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Upload File", "Preview Data", "Hasil Import"];
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active ? "bg-indigo-600 text-white shadow-sm"
              : done  ? "bg-emerald-100 text-emerald-700"
              :         "bg-slate-100 text-slate-400"
            }`}>
              <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold ${
                active ? "bg-white/20" : done ? "bg-emerald-200" : "bg-slate-200"
              }`}>
                {done ? "✓" : idx}
              </span>
              {label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className="text-slate-300 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ImportAsetDemoModal({ isOpen, onClose, onImported }: Props) {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [isDragging, setIsDrag] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows]         = useState<ParsedRow[]>([]);
  const [headers, setHeaders]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult]     = useState<ImportResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      setParseError("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv");
      return;
    }
    setLoading(true);
    setParseError(null);
    try {
      const { rows: parsed, headers: hdrs } = await parseFile(file);
      if (parsed.length === 0) {
        setParseError("File kosong atau tidak memiliki baris data.");
        setLoading(false);
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setHeaders(hdrs);
      setStep(2);
    } catch (err: any) {
      setParseError(err.message || "Gagal membaca file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  // ── Import submit ──────────────────────────────────────────────────────────

  const handleImport = async () => {
    const validRows = rows.filter(r => r._valid).map(({ _valid, _error, ...rest }) => rest);
    if (validRows.length === 0) return;

    setLoading(true);
    try {
      const resp = await fetch("/api/inventory/demo-assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows: validRows }),
      });
      const data: ImportResult = await resp.json();
      setResult(data);
      setStep(3);
      if (data.imported > 0) onImported();
    } catch (err: any) {
      setResult({ imported: 0, errors: [err.message || "Koneksi gagal."], total: validRows.length });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset & close ──────────────────────────────────────────────────────────

  const handleClose = () => {
    setStep(1);
    setFileName("");
    setRows([]);
    setHeaders([]);
    setParseError(null);
    setResult(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const validCount   = rows.filter(r => r._valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-indigo-600" />
              Import Massal Aset Demo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload file Excel atau CSV untuk import data aset demo sekaligus</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Steps step={step} />

          {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Template download */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600 shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-900">Download template CSV terlebih dahulu</p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Isi data aset demo di template, lalu upload di sini. Kolom <strong>Nama Barang</strong> wajib diisi.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="shrink-0 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={13} />
                  Download Template
                </button>
              </div>

              {/* Kolom yang dikenali */}
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-700 mb-2">Kolom yang dikenali (urutan bebas):</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Kode", "Nama Barang *", "Jenis", "Kondisi", "Status", "Lokasi", "Keterangan"].map(c => (
                    <span key={c} className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                      c.includes("*") ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                    }`}>{c}</span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">* Kolom wajib. Kolom lain opsional (akan diisi default).</p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileChange}
                  className="hidden"
                />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="text-indigo-400 animate-spin" />
                    <p className="text-sm text-slate-500">Membaca file…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-2xl transition-colors ${isDragging ? "bg-indigo-100" : "bg-slate-100"}`}>
                      <Upload size={32} className={isDragging ? "text-indigo-500" : "text-slate-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {isDragging ? "Lepaskan file di sini" : "Drag & drop file, atau klik untuk pilih"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Format didukung: .xlsx, .xls, .csv</p>
                    </div>
                  </div>
                )}
              </div>

              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle size={14} className="shrink-0" />
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Preview ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs">
                  <span className="text-slate-400">File:</span>{" "}
                  <span className="font-semibold text-slate-700">{fileName}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs">
                  <span className="text-emerald-600 font-bold">{validCount}</span>
                  <span className="text-emerald-700"> baris siap diimport</span>
                </div>
                {invalidCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs">
                    <span className="text-amber-600 font-bold">{invalidCount}</span>
                    <span className="text-amber-700"> baris akan dilewati (tidak valid)</span>
                  </div>
                )}
                <button
                  onClick={() => { setStep(1); setRows([]); setHeaders([]); setFileName(""); }}
                  className="ml-auto text-xs text-indigo-600 hover:underline"
                >
                  Ganti file
                </button>
              </div>

              {/* Preview table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-semibold">#</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Kode</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Nama Barang</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Jenis</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Kondisi</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Status</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Lokasi</th>
                        <th className="px-3 py-2 text-slate-500 font-semibold">Valid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, i) => (
                        <tr key={i} className={row._valid ? "hover:bg-slate-50" : "bg-red-50/60"}>
                          <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono">{row.kode || "—"}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 max-w-[160px] truncate">
                            {row.namaBarang || <span className="text-red-500 italic">kosong</span>}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.jenis || "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                              row.kondisi === "Baik" ? "bg-emerald-100 text-emerald-700"
                              : row.kondisi === "Rusak" ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-600"
                            }`}>
                              {row.kondisi || "Baik"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                              row.status === "Tersedia" ? "bg-emerald-100 text-emerald-700"
                              : row.status === "Dipinjam" ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                            }`}>
                              {row.status || "Tersedia"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate">{row.lokasi || "—"}</td>
                          <td className="px-3 py-2">
                            {row._valid
                              ? <span className="text-emerald-600 font-bold text-[10px]">✓ OK</span>
                              : <span className="text-red-500 font-bold text-[10px]" title={row._error}>✕ Lewati</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Result ─────────────────────────────────────────────── */}
          {step === 3 && result && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-6 border text-center ${
                result.imported > 0
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}>
                {result.imported > 0 ? (
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                ) : (
                  <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
                )}
                <p className="text-2xl font-black text-slate-800">{result.imported} baris berhasil diimport</p>
                <p className="text-sm text-slate-500 mt-1">
                  dari {result.total} baris yang dikirim
                  {result.errors.length > 0 && `, ${result.errors.length} baris gagal`}
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                    <AlertTriangle size={13} /> Detail Error
                  </p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-700 font-mono">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Tutup
          </button>
          {step === 2 && (
            <button
              onClick={handleImport}
              disabled={loading || validCount === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Mengimpor...</>
              ) : (
                <><Upload size={14} /> Import {validCount} Aset Demo</>
              )}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => { setStep(1); setRows([]); setFileName(""); setResult(null); }}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
            >
              Import Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
