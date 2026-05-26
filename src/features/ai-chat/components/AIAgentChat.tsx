/**
 * @file features/ai-chat/components/AIAgentChat.tsx
 * @description Smart Diagnosis & Troubleshooting AI Chat panel untuk JIP.
 *
 * DIPINDAH DARI: src/components/AIAgentChat.tsx (652 baris).
 *
 * PERBAIKAN BERSIH:
 *  - 8 import lucide yang tidak digunakan dihapus (AlertCircle, Wifi, Calendar,
 *    CornerDownRight, HelpCircle, Check, ArrowRight, ShieldAlert)
 *  - 2 field kelengkapan mati (catrigeRibbon, catrigeFilm) dihapus — tidak ada
 *    checkbox yang merender keduanya
 *  - Bug JSX: "${deviceContext}" di dalam string JSX biasa → {deviceContext}
 *  - (msg as any).systemNotice → union type lokal ChatLine yang proper
 *  - Array inline (quickPrompts, device options, checkbox config) dipindah ke
 *    konstanta top-level
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Wrench, Sparkles,
  Cpu, CheckCircle, Activity, Info, RefreshCw, FileText,
  Layers, Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ChatMessage } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** Extends ChatMessage with an optional `systemNotice` flag for info banners. */
type ChatLine = ChatMessage & { systemNotice?: true };

interface SparepartEstimate {
  namaPart: string;
  partNumber: string;
  estimasiQty: number;
  estimasiHarga: number;
}

interface DiagnosisResult {
  analisis: string;
  rekomendasiTindakan: string;
  sparepartsDibutuhkan: SparepartEstimate[];
  keputusanMandat: "Pandu" | "Remote" | "Kirim Service Center";
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Pita/Ribbon macet",       text: "Ribbon terputus atau tersangkut saat mulai mencetak kartu" },
  { label: "Hasil cetak bergaris",    text: "Hasil printing ada garis vertikal kosong berwarna putih tajam" },
  { label: "Kartu tersangkut (Jam)",  text: "Kartu macet di bagian roller encoder magnetic stripe" },
  { label: "Adaptor mati total",      text: "Printer tidak menyala sama sekali saat dihubungkan ke adaptor power" },
] as const;

const DEVICE_OPTIONS = [
  { value: "Printer Umum", label: "-- Ganti Model Perangkat --" },
  { value: "Em2s",         label: "Entrust EM2s" },
  { value: "CR707",        label: "Datacard CR707" },
  { value: "SR200",        label: "Datacard SR200" },
  { value: "SD307",        label: "Datacard SD307" },
  { value: "CR805",        label: "Datacard CR805" },
  { value: "mini PC",      label: "mini PC Client" },
  { value: "Alat rekam",   label: "Alat Rekam" },
] as const;

/** Four kelengkapan checkboxes rendered in the diagnosis input panel. */
const KELENGKAPAN_FIELDS: { key: keyof KelengkapanState; label: string }[] = [
  { key: "ribbon",   label: "Ribbon Cartridge" },
  { key: "film",     label: "Retransfer Film" },
  { key: "adaptor",  label: "Original Adaptor 24V" },
  { key: "kabelUsb", label: "Kabel Data USB" },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface KelengkapanState {
  ribbon: boolean;
  film: boolean;
  adaptor: boolean;
  kabelUsb: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface AIAgentChatProps {
  currentDevice?: string;
  onSetRecommendation?: (
    recommendation: string,
    checklistResult: string,
    actionPath: "Pandu" | "Remote" | "Kirim Service Center"
  ) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AIAgentChat({
  currentDevice = "Printer Umum",
  onSetRecommendation,
}: AIAgentChatProps) {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceContext, setDeviceContext] = useState(currentDevice);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Diagnosis panel states
  const [customKeluhan, setCustomKeluhan] = useState("");
  const [kelengkapan, setKelengkapan] = useState<KelengkapanState>({
    ribbon:   true,
    film:     true,
    adaptor:  true,
    kabelUsb: true,
  });
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState("");

  // ── Initialise welcome message whenever the target device changes ─────────
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: `Halo! Saya adalah Agen AI Smart Diagnosis Servis Printer JIP. 🤖\n\nSaya bertugas menginterogasi keluhan printer, menganalisis korelasi kerusakan, dan memberikan keputusan mandat penanganan Layer 1.\n\nFokus analisis kita saat ini: **${currentDevice}**. Silakan sampaikan keluhan Anda atau gunakan tombol bantuan di bawah untuk menguji respon.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setDeviceContext(currentDevice);
  }, [currentDevice]);

  // ── Auto-scroll to bottom on new message ──────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mirror last user message into the keluhan textarea ────────────────────
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.sender === "user");
    if (userMsgs.length > 0) {
      const lastText = userMsgs[userMsgs.length - 1].text;
      if (lastText.length > 4) setCustomKeluhan(lastText);
    }
  }, [messages]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsgText = input;
    setInput("");
    setCustomKeluhan(userMsgText);

    const userMsg: ChatLine = {
      sender: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], deviceContext }),
      });

      if (!response.ok) throw new Error("Gagal terhubung dengan server");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          sender: "bot",
          text: "💡 *Saran Sistem:* Sembari mengobrol, Anda juga dapat menekan tombol **'Jalankan Analisis Prognosis AI'** di panel sebelah kanan untuk melihat hasil diagnosa komprehensif, rekomendasi langkah kerja mandiri, dan estimasi daftar sparepart.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          systemNotice: true,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Maaf, terjadi gangguan integrasi dengan server Agen AI. Mohon periksa kembali koneksi internet Anda.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDiagnosis = async () => {
    const activeKeluhan = customKeluhan.trim();
    if (!activeKeluhan) {
      setDiagnoseError("Mohon ketik deskripsi keluhan terlebih dahulu atau kirim deskripsi keluhan di chat.");
      return;
    }

    setIsDiagnosing(true);
    setDiagnoseError("");
    setDiagnosisResult(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: deviceContext, keluhan: activeKeluhan, kelengkapan }),
      });

      if (!response.ok) throw new Error("Gagal mengambil diagnosa terstruktur");
      const data = await response.json();
      setDiagnosisResult(data);
    } catch {
      setDiagnoseError("Koneksi gagal atau format salah. Silakan coba kembali dengan kata kunci lain.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleApplyRecommendation = () => {
    if (!diagnosisResult || !onSetRecommendation) return;

    const recStr = `[AI DIAGNOSIS SYSTEM] ${diagnosisResult.analisis}\nEstimasi Spareparts: ${
      diagnosisResult.sparepartsDibutuhkan
        .map((p) => `${p.namaPart} (PN: ${p.partNumber} x${p.estimasiQty})`)
        .join(", ") || "Tidak Ada"
    }`;

    onSetRecommendation(recStr, diagnosisResult.rekomendasiTindakan, diagnosisResult.keputusanMandat);
  };

  const handleQuickPromptClick = (text: string) => {
    setInput(text);
    setCustomKeluhan(text);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-lg">

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-400/20 text-indigo-400">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-300 font-mono tracking-wider font-extrabold uppercase">
                LAYER-1 AI INTERROGATION
              </span>
              <span className="text-[9px] bg-slate-800 text-sky-400 border border-sky-900/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
                PROGNOSIS CAPABLE
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Troubleshooting Assistant & Smart Diagnosis Panel
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
            Ready / Live Connection
          </span>
        </div>
      </div>

      {/* TARGET DEVICE BANNER */}
      <div className="bg-amber-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
          <Sparkles size={14} className="text-amber-600" />
          <span>Sesi Deteksi: <strong>{deviceContext}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Alihkan Unit:</span>
          <select
            value={deviceContext}
            onChange={(e) => setDeviceContext(e.target.value)}
            className="text-xs bg-white text-slate-700 border border-slate-300 rounded-lg px-2.5 py-1 outline-none font-bold hover:border-indigo-500 transition-colors cursor-pointer"
          >
            {DEVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DUAL PANE SPLIT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-white">

        {/* ── LEFT PANEL: CHAT ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col border-r border-slate-200 min-w-0 bg-white overflow-hidden">

          {/* Scrolling chat log */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, index) => {
              if (msg.systemNotice) {
                return (
                  <div
                    key={index}
                    className="mx-auto max-w-[92%] p-3.5 bg-indigo-50/70 border border-indigo-100/40 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed shadow-sm"
                  >
                    <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-indigo-950 uppercase tracking-wide block mb-0.5 text-[10px]">
                        💡 Saran Asisten Diagnosa AI
                      </span>
                      {msg.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {msg.sender === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Bubble */}
                  <div className="space-y-1">
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none font-medium"
                          : "bg-slate-50 text-slate-800 border border-slate-200/70 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className={`text-[9px] text-slate-400 font-mono tracking-tight ${msg.sender === "user" ? "text-right" : ""}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <Bot size={18} />
                </div>
                <div className="bg-slate-50 text-slate-600 border border-slate-200/60 px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-sm">
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150" />
                  </span>
                  <span>Agen AI sedang menganalisis korelasi kelengkapan &amp; kerusakan...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts bar */}
          <div className="px-5 py-3 border-t border-slate-150 bg-slate-50/50 shrink-0 select-none">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-extrabold tracking-wider block mb-2">
              ⚡ Templat Keluhan Kerusakan Cepat (Klik untuk ketik):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleQuickPromptClick(p.text)}
                  className="text-[10px] bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 transition-all duration-150 font-semibold shadow-sm cursor-pointer whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Tulis keluhan atau ajukan interogasi ${deviceContext}...`}
              disabled={loading}
              className="flex-1 text-xs sm:text-sm border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 outline-none transition disabled:bg-slate-50"
              id="ai-agent-chat-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 rounded-xl transition disabled:opacity-40 shrink-0 cursor-pointer flex items-center justify-center"
              id="ai-agent-chat-submit"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* ── RIGHT PANEL: PROGNOSIS HUB ─────────────────────────────────── */}
        <div
          className="w-full lg:w-[450px] bg-slate-50/80 overflow-y-auto flex flex-col p-5 space-y-4 shrink-0 border-t lg:border-t-0"
          id="ai-prognosis-hub-panel"
        >

          {/* Section header */}
          <div className="flex items-center gap-2 pb-1 bg-slate-50 rounded p-1">
            <div className="bg-indigo-600 text-white p-1 rounded-lg">
              <Activity size={15} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase leading-none">
                🩺 DIAGNOSA &amp; PROGNOSIS JIP-AI
              </h4>
              <span className="text-[9px] text-slate-500 font-mono">Rincian Rekomendasi Mandat Layer-1</span>
            </div>
          </div>

          {/* ── Input configuration form ─────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
            <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest block font-mono">
              📋 DATA KERUSAKAN DISERAHKAN KE AI
            </span>

            {/* Keluhan textarea */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-700 uppercase block">
                DESKRIPSI KELUHAN AKTIF
              </label>
              <textarea
                value={customKeluhan}
                onChange={(e) => setCustomKeluhan(e.target.value)}
                placeholder="Tulis keluhan secara manual atau kirim deskripsi di chat..."
                rows={3}
                className="w-full border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-2.5 text-xs outline-none transition resize-none font-medium text-slate-800"
              />
            </div>

            {/* Kelengkapan checkboxes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 uppercase">
                  KELENGKAPAN FISIK BARANG
                </label>
                <span className="text-[8px] text-indigo-600 font-bold uppercase font-mono">
                  Mempengaruhi Prognosis
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-700 font-semibold bg-slate-50 p-2.5 border rounded-xl">
                {KELENGKAPAN_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={kelengkapan[key]}
                      onChange={(e) => setKelengkapan((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trigger button */}
            <button
              type="button"
              onClick={triggerDiagnosis}
              disabled={isDiagnosing}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-[11px] uppercase py-2.5 px-4 rounded-xl transition duration-150 tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isDiagnosing ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-sky-400" />
                  <span>MENGKAJI PROGNOSIS CORE...</span>
                </>
              ) : (
                <>
                  <Cpu size={13} className="text-sky-400" />
                  <span>JALANKAN ANALISIS PROGNOSIS AI ⚡</span>
                </>
              )}
            </button>

            {diagnoseError && (
              <p className="text-[10px] text-rose-600 font-bold text-center animate-pulse">
                {diagnoseError}
              </p>
            )}
          </div>

          {/* ── Diagnosis output window ──────────────────────────────── */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm min-h-[220px] flex flex-col justify-between overflow-hidden">

            <AnimatePresence mode="wait">

              {/* Loading */}
              {isDiagnosing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Cpu size={18} className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider font-mono">
                      MENGKALIBRASI PROGNOSE LAYER-1
                    </h5>
                    <p className="text-[10px] text-slate-500 max-w-[280px] mx-auto mt-1 leading-relaxed">
                      Menganalisis riwayat kegagalan {deviceContext}, struktur sensor, serta menentukan
                      tingkat kesulitan resolusi...
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Empty state */}
              {!isDiagnosing && !diagnosisResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2.5"
                >
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl">
                    <Cpu size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800 uppercase">
                      Menunggu Pemicu Analisis
                    </h5>
                    <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-0.5 leading-relaxed">
                      Kirim keluhan Anda di chat di sebelah kiri, lalu tekan tombol
                      'JALANKAN ANALISIS PROGNOSIS AI' di atas untuk mendapatkan rincian terstruktur.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {!isDiagnosing && diagnosisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col space-y-3"
                >
                  {/* Mandate decision */}
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2 ${
                      diagnosisResult.keputusanMandat === "Pandu"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : diagnosisResult.keputusanMandat === "Remote"
                        ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                        : "bg-amber-50 text-amber-900 border-amber-200"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {diagnosisResult.keputusanMandat === "Pandu" ? (
                        <CheckCircle size={15} className="text-emerald-600" />
                      ) : diagnosisResult.keputusanMandat === "Remote" ? (
                        <Smartphone size={15} className="text-indigo-600" />
                      ) : (
                        <Wrench size={15} className="text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-mono tracking-widest font-extrabold block leading-none uppercase">
                        KEPUTUSAN MANDAT LAYER-1
                      </span>
                      <strong className="text-xs tracking-tight uppercase block mt-0.5">
                        Jalur{" "}
                        {diagnosisResult.keputusanMandat === "Kirim Service Center"
                          ? "Kirim ke Workshop / Service Center"
                          : diagnosisResult.keputusanMandat}
                      </strong>
                    </div>
                  </div>

                  {/* Cause analysis */}
                  <div className="space-y-1 bg-slate-50 border p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-800 uppercase">
                      <FileText size={12} className="text-slate-500" />
                      <span>Analisis Penyebab Kerusakan</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                      {diagnosisResult.analisis}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div className="space-y-1 bg-slate-50 border p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-800 uppercase">
                      <Wrench size={12} className="text-slate-500" />
                      <span>Rekomendasi Tindakan</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-medium whitespace-pre-line leading-relaxed pl-1.5">
                      {diagnosisResult.rekomendasiTindakan}
                    </div>
                  </div>

                  {/* Spareparts list */}
                  <div className="space-y-1.5 bg-slate-50 border p-3 rounded-xl">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-800 uppercase">
                      <div className="flex items-center gap-1.5">
                        <Layers size={12} className="text-slate-500" />
                        <span>Spareparts yang Dibutuhkan</span>
                      </div>
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">
                        ESTIMASI BIAYA
                      </span>
                    </div>

                    {diagnosisResult.sparepartsDibutuhkan.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-1 font-mono">
                        Tidak ada sparepart tambahan yang teridentifikasi wajib ganti
                        (Bisa ditangani via setelan/re-konfigurasi).
                      </p>
                    ) : (
                      <div className="space-y-1.5 divide-y divide-slate-200">
                        {diagnosisResult.sparepartsDibutuhkan.map((part, pIdx) => (
                          <div key={pIdx} className="flex justify-between items-center text-[10px] pt-1.5 first:pt-0">
                            <div>
                              <strong className="text-slate-800 font-extrabold text-[10.5px] block leading-tight">
                                {part.namaPart}
                              </strong>
                              <span className="text-[8px] text-slate-500 font-mono tracking-tight block">
                                P/N: {part.partNumber}
                              </span>
                            </div>
                            <div className="text-right shrink-0 pl-2">
                              <span className="text-slate-700 font-bold block">{part.estimasiQty} Unit</span>
                              <span className="font-mono text-[9.5px] text-indigo-600 font-black">
                                Rp {part.estimasiHarga.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Apply to ticket CTA */}
                  {onSetRecommendation && (
                    <button
                      type="button"
                      onClick={handleApplyRecommendation}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-[11px] uppercase py-2 px-3 rounded-xl transition duration-150 tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-1.5"
                    >
                      <CheckCircle size={13} />
                      <span>TERAPKAN DIAGNOSA KE TIKET AKTIF ➔</span>
                    </button>
                  )}

                </motion.div>
              )}

            </AnimatePresence>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 select-none">
              <span className="font-mono tracking-tighter">PT. JASUINDO INFORMATIKA PRATAMA</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">VERIFIKASI LOG</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
