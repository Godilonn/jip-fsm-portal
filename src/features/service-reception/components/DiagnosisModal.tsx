/**
 * @file features/service-reception/components/DiagnosisModal.tsx
 * @description Modal Fase-2 pengisian hasil diagnosa — diisi SETELAH teknisi
 *   melakukan pengecekan fisik printer. Terpisah dari form penerimaan awal.
 *
 * FITUR:
 *   - Upload logfile printer (.txt / .log / .csv) → diparsing di browser
 *   - Preview isi log + stats (error count, warning, metrics)
 *   - AI Smart Diagnosis via Gemini — menerima keluhan + data log sekaligus
 *   - Hasil AI auto-mengisi field, teknisi bisa edit sebelum simpan
 *
 * FORMAT LOG YANG DIDUKUNG:
 *   Evolis (CR805, CR8xx), Zebra (ZXP3/7, ZC300), Citizen (CX-02/30),
 *   Datacard (SR200, SD357), dan format teks generik.
 *
 *   Cara ekspor log:
 *   • Evolis   → Evolis Print Center → Tools → Export Log
 *   • Zebra    → ZXP Toolbox → Diagnostics → Save Log
 *   • Citizen  → Citizen Card Printer Utility → Event Log
 *   • Datacard → ID Works / CardWizard → Diagnostic Export
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Bot, ClipboardCheck, Sparkles, AlertCircle, CheckCircle,
  Upload, FileText, X, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { Textarea, TextInput } from "../../../components/ui/Input";
import type { PrinterService, DiagnosaResult } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-SIDE LOG QUICK-STATS
// (Full parsing happens server-side via logParser.ts — ini hanya untuk preview UI)
// ─────────────────────────────────────────────────────────────────────────────

interface QuickStats {
  lines: number;
  errors: number;
  warnings: number;
  hasCardCount: boolean;
  hasTemp: boolean;
  hasRibbon: boolean;
  preview: string[];   // first 15 non-empty lines
}

function quickScanLog(content: string): QuickStats {
  const allLines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const preview  = allLines.slice(0, 15);

  let errors = 0, warnings = 0;
  for (const line of allLines) {
    const u = line.toUpperCase();
    if (/\[ERROR\]|^ERROR[\s|]|^ERR[:=]/i.test(line)) errors++;
    else if (/\[WARN\]|^WARN[\s|]/i.test(line)) warnings++;
    else if (/\berror\b|\bfail\b|\bfault\b|\bjam\b/i.test(line)) errors++;
    else if (/\bwarn\b|\blow\b|\bempty\b/i.test(line)) warnings++;
  }

  return {
    lines: allLines.length,
    errors,
    warnings,
    hasCardCount: /card\s*count|print\s*count|cnt/i.test(content),
    hasTemp:      /head\s*temp|temperature|°C/i.test(content),
    hasRibbon:    /ribbon\s*(?:remain|level|left|pct|%)/i.test(content),
    preview,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface DiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: PrinterService | null;
  onSave: (id: string, data: {
    hasilPengecekan: string;
    catatanRekomendasi: string;
    finalKerusakan: string;
  }) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DiagnosisModal({ isOpen, onClose, service, onSave }: DiagnosisModalProps) {
  // ── Hasil diagnosa fields ─────────────────────────────────────────────────
  const [hasilPengecekan, setHasilPengecekan]       = useState("");
  const [catatanRekomendasi, setCatatanRekomendasi] = useState("");
  const [finalKerusakan, setFinalKerusakan]         = useState("");

  // ── Log file state ────────────────────────────────────────────────────────
  const [logFileName, setLogFileName]   = useState<string | null>(null);
  const [logContent, setLogContent]     = useState<string | null>(null);
  const [logStats, setLogStats]         = useState<QuickStats | null>(null);
  const [showLogPreview, setShowLogPreview] = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── AI & submit state ─────────────────────────────────────────────────────
  const [isDiagLoading, setIsDiagLoading] = useState(false);
  const [diagResult, setDiagResult]       = useState<DiagnosaResult | null>(null);
  const [isSaving, setIsSaving]           = useState(false);
  const [error, setError]                 = useState("");

  // Pre-populate dari data tiket yang sudah ada
  useEffect(() => {
    if (isOpen && service) {
      setHasilPengecekan(service.hasilPengecekan ?? "");
      setCatatanRekomendasi((service as any).catatanRekomendasi ?? "");
      setFinalKerusakan(service.finalKerusakan ?? "");
      setLogFileName(null);
      setLogContent(null);
      setLogStats(null);
      setShowLogPreview(false);
      setDiagResult(null);
      setError("");
    }
  }, [isOpen, service]);

  // ── File reading ──────────────────────────────────────────────────────────

  const readFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("File terlalu besar (maks 5 MB). Gunakan file log yang sudah difilter.");
      return;
    }
    const allowed = [".txt", ".log", ".csv", ".dat"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Format tidak didukung (${ext}). Upload file .txt, .log, atau .csv.`);
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setLogContent(text);
      setLogFileName(file.name);
      setLogStats(quickScanLog(text));
      setShowLogPreview(true);
    };
    reader.onerror = () => setError("Gagal membaca file. Coba lagi.");
    reader.readAsText(file, "utf-8");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = ""; // reset so same file can be re-uploaded
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const clearLog = () => {
    setLogContent(null);
    setLogFileName(null);
    setLogStats(null);
    setShowLogPreview(false);
  };

  // ── AI Diagnosis ──────────────────────────────────────────────────────────

  const handleRunAI = async () => {
    if (!service) return;
    setIsDiagLoading(true);
    setDiagResult(null);
    setError("");
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: service.device,
          keluhan: service.keluhan,
          kelengkapan: service.kelengkapan,
          logContent: logContent ?? undefined,   // kirim logfile jika ada
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: DiagnosaResult = await res.json();
      setDiagResult(result);

      // Auto-isi field dari hasil AI
      setHasilPengecekan(result.analisis);
      setCatatanRekomendasi(
        `${result.rekomendasiTindakan}\n\n[Keputusan Jalur AI: ${result.keputusanMandat}]`
      );
      if (result.sparepartsDibutuhkan.length > 0) {
        setFinalKerusakan(
          `Perlu penggantian: ${result.sparepartsDibutuhkan.map((p) => p.namaPart).join(", ")}`
        );
      } else {
        setFinalKerusakan("Kerusakan ringan / software — tidak perlu penggantian sparepart.");
      }
    } catch {
      setError("Gagal memanggil AI Smart Diagnosis. Periksa koneksi server atau GEMINI_API_KEY di .env.");
    } finally {
      setIsDiagLoading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!service) return;
    if (!hasilPengecekan.trim()) {
      setError("Hasil pengecekan wajib diisi sebelum menyimpan.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await onSave(service.id, { hasilPengecekan, catatanRekomendasi, finalKerusakan });
      onClose();
    } catch {
      setError("Gagal menyimpan hasil diagnosa. Silakan coba kembali.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!service) return null;

  const alreadyHasDiagnosis = !!service.hasilPengecekan;
  const mandatColor: Record<string, string> = {
    "Pandu":               "text-emerald-600 bg-emerald-50 border-emerald-200",
    "Remote":              "text-blue-600 bg-blue-50 border-blue-200",
    "Kirim Service Center":"text-rose-600 bg-rose-50 border-rose-200",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hasil Diagnosa — ${service.id}`}
      headerIcon={<ClipboardCheck size={16} className="text-indigo-400" />}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            loadingText="Menyimpan..."
            leftIcon={<CheckCircle size={14} />}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Simpan Hasil Diagnosa
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">

        {/* ── Konteks tiket ──────────────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              {service.id}
            </span>
            <span className="text-xs font-semibold text-slate-700">{service.customer}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{service.device}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="font-bold">Keluhan:</span> {service.keluhan}
          </p>
        </div>

        {/* Existing diagnosis warning */}
        {alreadyHasDiagnosis && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium flex items-center gap-2">
            <AlertCircle size={13} className="shrink-0" />
            Tiket ini sudah punya diagnosa sebelumnya — data akan ditimpa saat disimpan.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ── UPLOAD LOGFILE ──────────────────────────────────────────── */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-2">
            <FileText size={12} />
            Upload Log Printer
            <span className="ml-auto text-[9px] font-semibold text-slate-400 normal-case tracking-normal">
              Opsional — meningkatkan akurasi AI
            </span>
          </h4>

          {/* Cara ekspor hint */}
          <div className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
            <span className="font-bold text-slate-600">Cara ekspor log:</span>{" "}
            Evolis → Print Center → Tools → Export Log &nbsp;|&nbsp;
            Zebra → ZXP Toolbox → Diagnostics → Save Log &nbsp;|&nbsp;
            Citizen → Card Printer Utility → Event Log
          </div>

          {/* Upload area atau file yang sudah dipilih */}
          {!logContent ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.log,.csv,.dat"
                onChange={handleFileInput}
                className="hidden"
              />
              <Upload size={24} className={isDragging ? "text-indigo-500" : "text-slate-400"} />
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-600">
                  {isDragging ? "Lepaskan file di sini" : "Klik atau drag & drop file log"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">.txt .log .csv .dat — maks 5 MB</p>
              </div>
            </div>
          ) : (
            /* File loaded — tampilkan stats */
            <div className="border border-indigo-200 bg-indigo-50/60 rounded-xl overflow-hidden">
              {/* File header */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-100/70 border-b border-indigo-200">
                <FileText size={14} className="text-indigo-600 shrink-0" />
                <span className="text-[11px] font-bold text-indigo-800 flex-1 truncate">{logFileName}</span>
                <button
                  type="button"
                  onClick={clearLog}
                  className="text-indigo-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                  title="Hapus file log"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Stats chips */}
              {logStats && (
                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                  <StatChip color="slate" label={`${logStats.lines.toLocaleString("id-ID")} baris`} />
                  {logStats.errors > 0 && (
                    <StatChip color="rose" label={`${logStats.errors} error`} />
                  )}
                  {logStats.warnings > 0 && (
                    <StatChip color="amber" label={`${logStats.warnings} warning`} />
                  )}
                  {logStats.hasCardCount && <StatChip color="indigo" label="Card count ✓" />}
                  {logStats.hasTemp      && <StatChip color="orange" label="Suhu printhead ✓" />}
                  {logStats.hasRibbon    && <StatChip color="purple" label="Ribbon level ✓" />}
                </div>
              )}

              {/* Log preview toggle */}
              {logStats && logStats.preview.length > 0 && (
                <div className="border-t border-indigo-200">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-indigo-600 font-semibold hover:bg-indigo-100/50 transition-colors"
                    onClick={() => setShowLogPreview(v => !v)}
                  >
                    Preview 15 baris pertama
                    {showLogPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showLogPreview && (
                    <div className="px-3 pb-3">
                      <div className="bg-slate-950 rounded-lg p-2.5 max-h-32 overflow-y-auto">
                        {logStats.preview.map((line, i) => {
                          const isErr  = /error|fault|fail/i.test(line);
                          const isWarn = /warn|low|empty/i.test(line);
                          return (
                            <p key={i} className={`text-[9px] font-mono leading-relaxed ${
                              isErr ? "text-rose-400" : isWarn ? "text-amber-400" : "text-emerald-300"
                            }`}>
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── AI DIAGNOSIS ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-1 flex items-center gap-2">
            <Sparkles size={12} />
            AI Smart Diagnosis
          </h4>

          <Button
            type="button"
            variant="dark"
            size="sm"
            leftIcon={
              logContent
                ? <Zap size={14} className="text-amber-400" />
                : <Bot size={14} className="text-indigo-400" />
            }
            onClick={handleRunAI}
            loading={isDiagLoading}
            loadingText={logContent ? "AI Menganalisa Log + Keluhan..." : "AI Sedang Menganalisa..."}
            className="w-full justify-center"
          >
            {logContent
              ? "🔍 Jalankan AI + Analisa File Log"
              : "Jalankan AI Smart Diagnosis"}
          </Button>

          {logContent && !isDiagLoading && !diagResult && (
            <p className="text-[10px] text-amber-600 text-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              ⚡ Log terdeteksi — AI akan menganalisa keluhan <strong>+</strong> data log sekaligus untuk akurasi lebih tinggi.
            </p>
          )}
          {!logContent && !isDiagLoading && !diagResult && (
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Tanpa log: diagnosa berdasarkan keluhan teks saja. Upload log di atas untuk hasil lebih akurat.
            </p>
          )}

          {/* AI Result */}
          {diagResult && (
            <div className="bg-indigo-950 text-indigo-100 p-4 rounded-xl border border-indigo-800 space-y-2 text-xs font-mono">
              <p className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                {logContent ? <Zap size={10} className="text-amber-400" /> : <Bot size={10} />}
                {logContent ? "OUTPUT AI + LOG ANALYSIS:" : "OUTPUT AI:"}
              </p>
              <p className="leading-relaxed text-indigo-100 whitespace-pre-wrap">
                {diagResult.analisis}
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
                mandatColor[diagResult.keputusanMandat] || "text-slate-700 bg-slate-100 border-slate-200"
              }`}>
                ▶ Keputusan: {diagResult.keputusanMandat}
              </div>
              {diagResult.sparepartsDibutuhkan.length > 0 && (
                <p className="text-amber-300 text-[10px]">
                  Part dibutuhkan: {diagResult.sparepartsDibutuhkan.map(p => p.namaPart).join(", ")}
                </p>
              )}
              <p className="text-[9px] text-indigo-400 pt-1 border-t border-indigo-800">
                ↳ Hasil di atas sudah mengisi field di bawah. Edit manual jika perlu, lalu simpan.
              </p>
            </div>
          )}
        </section>

        {/* ── HASIL PENGECEKAN FIELDS ────────────────────────────────── */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-1">
            Hasil Pengecekan Fisik
          </h4>
          <Textarea
            label="Hasil Pengecekan & Diagnosa *"
            rows={3}
            value={hasilPengecekan}
            onChange={(e) => setHasilPengecekan(e.target.value)}
            placeholder="Contoh: Sensor optik ribbon tertutup debu. Setelah dibersihkan, printer normal kembali..."
          />
          <Textarea
            label="Catatan & Rekomendasi Tindakan"
            rows={2}
            value={catatanRekomendasi}
            onChange={(e) => setCatatanRekomendasi(e.target.value)}
            placeholder="Tindakan yang direkomendasikan atau sudah dilakukan..."
          />
          <TextInput
            label="Final Kerusakan"
            value={finalKerusakan}
            onChange={(e) => setFinalKerusakan(e.target.value)}
            placeholder="Contoh: Thermal Printhead rusak, perlu penggantian unit"
          />
        </section>

      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Stat Chip
// ─────────────────────────────────────────────────────────────────────────────

const CHIP_COLORS: Record<string, string> = {
  slate:  "bg-slate-100 text-slate-600 border-slate-200",
  rose:   "bg-rose-50 text-rose-700 border-rose-200",
  amber:  "bg-amber-50 text-amber-700 border-amber-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
};

function StatChip({ color, label }: { color: string; label: string }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CHIP_COLORS[color] ?? CHIP_COLORS.slate}`}>
      {label}
    </span>
  );
}
