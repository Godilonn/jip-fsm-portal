/**
 * @file features/dashboard/components/StatsDashboard.tsx
 * @description Dashboard Command Center JIP — Analytics, Alur Prosedur, & Lapor Mandiri.
 *
 * REFACTORED DARI: src/components/StatsDashboard.tsx (1.419 baris).
 *
 * PERUBAHAN BERSIH:
 *  - 12 useState → 5 (7 state dipindah ke sub-komponen)
 *  - window.alert() DIHAPUS — error state ada di SelfReportPanel
 *  - Tab "Flow"   → <DashboardFlowGuide />
 *  - Tab "Report" → <SelfReportPanel />
 *  - Dead state dihapus: hoveredPointM1, hoveredStatusSlice (tidak pernah dipakai di render)
 *  - Dead data dihapus: serviceStepsDetails (sudah ada di DashboardFlowGuide)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3, BookOpen, Search, ChevronRight, Wrench,
  Clock, CheckCircle, AlertCircle, ClipboardList,
  Award, Server, Users, Bot,
} from "lucide-react";
import DashboardFlowGuide from "./DashboardFlowGuide";
import SelfReportPanel from "./SelfReportPanel";
import { SkeletonKpiCard } from "../../../components/ui/Skeleton";
import type { PrinterService, SPH, UserRole } from "../../../types";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface StatsDashboardProps {
  services: PrinterService[];
  sphList: SPH[];
  currentUserRole?: UserRole;
  currentUserName?: string;
  onNavigateToTab: (tab: "penerimaan" | "sph" | "logistics" | "ai", ticketId?: string) => void;
  onSelectSearchDevice: (device: string) => void;
  onAddService?: (item: Omit<PrinterService, "id">) => Promise<void>;
  /** Saat true, tampilkan skeleton shimmer pada KPI cards. */
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE BASE DATA
// ─────────────────────────────────────────────────────────────────────────────

const KNOWLEDGE_BASE = [
  {
    device: "SR200",
    keluhan: "Hasil cetak bergaris putih vertikal tajam.",
    kerusakan: "Elemen Thermal Printhead kotor residu debu statis atau tergores fisik.",
    solusi: "Gunakan alcohol cleaning swabs untuk menyapu permukaan printhead dengan gerakan satu arah. Jika pola garis putih tetap permanen, ganti komponen Thermal Printhead di workshop.",
  },
  {
    device: "CR805",
    keluhan: "Retransfer film sobek / meleleh saat proses pemicu panas.",
    kerusakan: "Heating roller melampaui ambang batas temperatur normal JIP, atau setting ketegangan film terlalu melar.",
    solusi: "Akses service utility bawaan, turunkan temperatur roller sebanyak 5–10°C. Ganti roller pemanas jika thermistor pendeteksi panas sudah soak.",
  },
  {
    device: "SD307",
    keluhan: "Kartu selalu selip (Card Jam) sebelum mulai cetak.",
    kerusakan: "Grip karet roller kotor ditimbuni residu minyak tangan pemegang kartu.",
    solusi: "Jalankan program cleaning cycle menggunakan adhesive cleaning card. Usapkan kain microfiber basah berlarutan isopropil pada roller silikon.",
  },
  {
    device: "Em2s",
    keluhan: "Lampu indikator berkedip merah berkode Error: Ribbon Out.",
    kerusakan: "Sensor optik pendeteksi tag RFID ribbon terhalang debu, atau RFID chip ribbon rusak.",
    solusi: "Bersihkan mata sensor di balik dudukan cartridge pita. Pasangkan pita cetak bermutu orisinil yang menyertakan chip RFID utuh.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StatsDashboard({
  services,
  sphList,
  currentUserRole,
  currentUserName,
  onNavigateToTab,
  onSelectSearchDevice,
  onAddService,
  isLoading = false,
}: StatsDashboardProps) {
  const [dashboardTab, setDashboardTab] = useState<"analytics" | "flow" | "report">("analytics");

  // Analytics role toggle — defaults to MANAGER for non-field roles
  const initialRole: "TECHNICIAN" | "MANAGER" =
    currentUserRole === "TECHNICIAN" ? "TECHNICIAN" : "MANAGER";
  const [activeViewRole, setActiveViewRole] = useState<"TECHNICIAN" | "MANAGER">(initialRole);

  // Sync simulated role when logged-in user changes
  React.useEffect(() => {
    if (currentUserRole === "TECHNICIAN" || currentUserRole === "MANAGER") {
      setActiveViewRole(currentUserRole as "TECHNICIAN" | "MANAGER");
    }
  }, [currentUserRole]);

  // Hover state for interactive SVG chart nodes
  const [hoveredPointTS, setHoveredPointTS] = useState<{ month: string; completed: number; idx: number } | null>(null);
  const [hoveredTechBar, setHoveredTechBar] = useState<string | null>(null);

  // Knowledge base search
  const [kbQuery, setKbQuery] = useState("");

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalTicketsAll = services.length;
  const activeTicketsAll = services.filter(
    (s) => !["CLOSED", "RESOLVED", "Selesai", "Diambil"].includes(s.statusServis)
  ).length;
  const techniciansOnFieldCount = 2; // mock placeholder for on-field personnel

  const slaBreachedCount =
    services.filter((s) => s.statusServis === "PENDING" && s.statusGaransi === "Non-Garansi").length || 1;

  // Technician-specific stats (hardcoded to "Eko Prasetyo" as demo TS)
  const techName = "Eko Prasetyo";
  const myActiveTickets = services.filter(
    (s) => s.namaTs === techName && !["CLOSED", "RESOLVED", "Selesai", "Diambil"].includes(s.statusServis)
  ).length;
  const myResolvedCountThisWeek =
    services.filter(
      (s) => s.namaTs === techName && ["CLOSED", "RESOLVED", "Selesai", "Diambil"].includes(s.statusServis)
    ).length + 7;

  const myIncidents = services.filter(
    (s) => s.namaTs === techName && (s.ticketType === "INCIDENT" || !s.ticketType)
  ).length || 3;
  const myTasks = services.filter(
    (s) => s.namaTs === techName && s.ticketType === "TASK/DEMO"
  ).length || 2;
  const myTotalTipeTugas = myIncidents + myTasks;
  const incidentPct = myTotalTipeTugas > 0 ? Math.round((myIncidents / myTotalTipeTugas) * 100) : 60;
  const taskPct = 100 - incidentPct;

  const myActiveJobsTable = services.filter(
    (s) => s.namaTs === techName && !["CLOSED", "RESOLVED", "Selesai", "Diambil"].includes(s.statusServis)
  );
  const managerCriticalAlertsTable = services
    .filter((s) => !["CLOSED", "RESOLVED", "Selesai", "Diambil"].includes(s.statusServis))
    .slice(0, 4);

  const filteredKb = KNOWLEDGE_BASE.filter(
    (k) =>
      k.device.toLowerCase().includes(kbQuery.toLowerCase()) ||
      k.keluhan.toLowerCase().includes(kbQuery.toLowerCase()) ||
      k.kerusakan.toLowerCase().includes(kbQuery.toLowerCase())
  );

  // ── Tab button class helper ────────────────────────────────────────────────
  const tabCls = (active: boolean) =>
    `text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg transition-all ${
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
    }`;

  return (
    <div className="space-y-6 min-h-screen p-1 rounded-3xl">

      {/* ── Header + Tab Switchers ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-indigo-500 to-sky-500" />

        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-200">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-widest text-indigo-700 uppercase font-mono">
                Dashboard Servis Center
              </h2>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-mono border border-emerald-200 px-2 py-0.5 rounded uppercase font-bold">
                Online Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Selamat datang kembali,{" "}
              <strong className="text-slate-800 text-xs">
                {currentUserName || "Aset Manajemen JIP"} ({currentUserRole || "GUEST"})
              </strong>.
            </p>
          </div>
        </div>

        {/* Animated tab switcher — motion layoutId sliding indicator */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 items-center gap-0.5">
          {(
            [
              { key: "analytics", label: "📊 Analytics" },
              { key: "flow",      label: "💡 Prosedur" },
              { key: "report",    label: "🛠️ Lapor Mandiri" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDashboardTab(key)}
              className="relative text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors z-10"
              style={{
                color: dashboardTab === key ? "#fff" : "rgb(71 85 105)",
              }}
            >
              {dashboardTab === key && (
                <motion.span
                  layoutId="dashboard-tab-pill"
                  className="absolute inset-0 bg-indigo-600 rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — ANALYTICS & CHARTS
          ══════════════════════════════════════════════════════════════════════ */}
      {dashboardTab === "analytics" && (
        <div className="space-y-6">


          {/* ── SCENARIO 1: TECHNICIAN VIEW ──────────────────────────────── */}
          {activeViewRole === "TECHNICIAN" && (
            <div className="space-y-6">

              {/* KPI cards — skeleton while loading */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SkeletonKpiCard /><SkeletonKpiCard /><SkeletonKpiCard />
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0 }}
                  onClick={() => onNavigateToTab("penerimaan")}
                  className="bg-white border border-sky-200 hover:border-sky-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute right-0 bottom-0 text-sky-200/30 pointer-events-none translate-x-2 translate-y-2"><Wrench size={100} /></div>
                  <div className="bg-[#0b213b] text-sky-600 p-3.5 rounded-2xl border border-indigo-200 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
                    <Clock size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">TIKET SAYA HARI INI</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{myActiveTickets} Kasus</h3>
                    <span className="text-[9px] text-emerald-600 flex items-center gap-1 mt-0.5 font-semibold">
                      ● {services.filter((s) => s.namaTs === techName && s.statusServis === "IN_PROGRESS").length} Sedang Kerja
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.07 }}
                  onClick={() => onNavigateToTab("penerimaan")}
                  className="bg-white border border-slate-200 hover:border-purple-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute right-0 bottom-0 text-purple-200/30 pointer-events-none translate-x-2 translate-y-2"><CheckCircle size={100} /></div>
                  <div className="bg-purple-50 text-purple-600 p-3.5 rounded-2xl border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-slate-950 transition-colors">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">SELESAI MINGGU INI</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{myResolvedCountThisWeek} Unit Card</h3>
                    <span className="text-[9px] text-purple-300 flex items-center gap-1 mt-0.5 font-semibold">🔥 Naik +20% vs pekan lalu</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.14 }}
                  className="bg-white border border-emerald-200 hover:border-emerald-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute right-0 bottom-0 text-emerald-200/30 pointer-events-none translate-x-2 translate-y-2"><Award size={100} /></div>
                  <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl border border-emerald-500/30 transition-colors">
                    <Award size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">SKOR SLA SAYA (ON-TIME)</span>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-100 mt-0.5">95.8% On Time</h3>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5 font-semibold">🛡️ Melebihi KPI Target (90.0%)</span>
                  </div>
                </motion.div>
              </div>
              )}

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Area chart: tren penyelesaian */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-sky-600 uppercase tracking-widest font-mono">📈 TREN PENYELESAIAN TIKET SAYA</h4>
                      <p className="text-[11px] text-slate-400">Jumlah kasus ter-solve milik Eko Prasetyo (Des – Mei)</p>
                    </div>
                    <span className="text-[9px] font-bold text-sky-400 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded font-mono">Grafik Area</span>
                  </div>
                  <div className="relative pt-4 text-slate-400">
                    <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="neonStroke">
                          <feGaussianBlur stdDeviation="3" result="glow" />
                          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                      {[20, 60, 100, 140].map((y) => (
                        <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3" />
                      ))}
                      {[{ y: 24, v: "24" }, { y: 64, v: "16" }, { y: 104, v: "8" }, { y: 144, v: "0" }].map(({ y, v }) => (
                        <text key={v} x="15" y={y} className="text-[9px] fill-slate-500 font-mono" textAnchor="middle">{v}</text>
                      ))}
                      <path d="M 40,140 Q 128,110 128,110 T 216,70 T 304,115 T 392,50 T 480,30 L 480,140 Z" fill="url(#areaGrad)" />
                      <path d="M 40,140 Q 128,110 128,110 T 216,70 T 304,115 T 392,50 T 480,30" fill="none" stroke="#38bdf8" strokeWidth="3.5" filter="url(#neonStroke)" strokeLinecap="round" />
                      {[
                        { x: 40,  y: 140, m: "Des", val: 0 },
                        { x: 128, y: 110, m: "Jan", val: 6 },
                        { x: 216, y: 70,  m: "Feb", val: 14 },
                        { x: 304, y: 115, m: "Mar", val: 5 },
                        { x: 392, y: 50,  m: "Apr", val: 18 },
                        { x: 480, y: 30,  m: "Mei", val: 22 },
                      ].map((p, i) => (
                        <g key={i} onMouseEnter={() => setHoveredPointTS({ month: p.m, completed: p.val, idx: i })} onMouseLeave={() => setHoveredPointTS(null)} className="cursor-pointer">
                          <circle cx={p.x} cy={p.y} r={hoveredPointTS?.idx === i ? "7" : "4.5"} fill={hoveredPointTS?.idx === i ? "#6366f1" : "#fff"} stroke="#0ea5e9" strokeWidth="2.5" className="transition-all duration-150" />
                          <text x={p.x} y="162" className="text-[9px] fill-slate-400 font-mono" textAnchor="middle">{p.m}</text>
                        </g>
                      ))}
                    </svg>
                    {hoveredPointTS ? (
                      <div className="absolute top-[10px] left-[45%] -translate-x-1/2 bg-white border border-sky-200 px-3 py-1.5 rounded-xl shadow-2xl text-[10px] font-mono flex items-center gap-1.5 z-10 text-sky-600">
                        <span className="font-extrabold">{hoveredPointTS.month}:</span>
                        <span className="text-slate-800 font-bold">{hoveredPointTS.completed} Servis Selesai</span>
                      </div>
                    ) : (
                      <div className="text-center text-[9.5px] italic text-slate-500 select-none">
                        💡 Arahkan kursor ke titik grafik untuk melihat rincian angka bulanan.
                      </div>
                    )}
                  </div>
                </div>

                {/* Donut: distribusi tipe tugas */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest font-mono">🍩 DISTRIBUSI TIPE TUGAS</h4>
                    <p className="text-[11px] text-slate-400">Rasio penugasan INCIDENT vs TASK / DEMO saya</p>
                  </div>
                  <div className="py-2.5 flex flex-col items-center justify-center relative">
                    <div className="relative w-36 h-36">
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4.5" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#38bdf8" strokeWidth="5" strokeDasharray={`${incidentPct} ${100 - incidentPct}`} strokeDashoffset="0" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="5" strokeDasharray={`${taskPct} ${100 - taskPct}`} strokeDashoffset={100 - incidentPct} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Total</span>
                        <span className="text-xl font-black text-slate-900">{myTotalTipeTugas}</span>
                        <span className="text-[9px] text-sky-600 font-bold">Tiket Aktif</span>
                      </div>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[10px] text-center border-t border-slate-200/40 pt-3">
                      <div className="flex flex-col items-center bg-slate-50 p-1.5 rounded-lg border border-sky-950/40">
                        <span className="text-sky-600 font-black">{myIncidents} Kasus</span>
                        <span className="text-sky-600 text-[9px] font-bold">🔥 {incidentPct}% INCIDENT</span>
                      </div>
                      <div className="flex flex-col items-center bg-slate-50 p-1.5 rounded-lg border border-slate-200/40">
                        <span className="text-indigo-600 font-black">{myTasks} Servis</span>
                        <span className="text-indigo-600 text-[9px] font-bold">📋 {taskPct}% TASK/DEMO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active jobs table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="text-sky-400" size={16} />
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                      📝 TUGAS AKTIF SAYA HARI INI ({myActiveJobsTable.length} TIKET)
                    </h4>
                  </div>
                  <button onClick={() => onNavigateToTab("penerimaan")} className="text-[10px] font-bold text-indigo-600 hover:underline">
                    Buka FSM Penerimaan →
                  </button>
                </div>
                {myActiveJobsTable.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 text-xs flex flex-col items-center gap-2.5">
                    <CheckCircle className="text-emerald-500" size={26} />
                    <p className="font-semibold text-slate-300">Hebat! Semua tugas lapangan telah selesai sepenuhnya.</p>
                    <button onClick={() => onNavigateToTab("penerimaan")} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-[10px] px-3.5 py-1.5 rounded-lg border border-indigo-200 font-bold transition">
                      Ambil Kerja / Klaim Tiket Lain
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider bg-slate-50">
                          <th className="py-2.5 px-3">ID Tiket</th>
                          <th className="py-2.5 px-3">Pelanggan / Dinas</th>
                          <th className="py-2.5 px-3">Aset Model</th>
                          <th className="py-2.5 px-3">Tipe</th>
                          <th className="py-2.5 px-3">Tahap Terakhir</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myActiveJobsTable.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-600 hover:underline cursor-pointer" onClick={() => onNavigateToTab("penerimaan", job.id)}>
                              {job.id}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">{job.customer}</td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-600 font-mono border border-slate-800">{job.device}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                                (job.ticketType || "INCIDENT") === "INCIDENT"
                                  ? "bg-rose-50 text-rose-600 border-rose-200"
                                  : "bg-purple-50 text-purple-600 border-purple-200"
                              }`}>
                                {(job.ticketType || "INCIDENT") === "INCIDENT" ? "🔥 Incident" : "📋 Task/Demo"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                ["IN_PROGRESS", "ON_SITE"].includes(job.statusServis)
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-teal-50 text-teal-700"
                              }`}>
                                {job.statusServis}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => onNavigateToTab("penerimaan", job.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg transition-all">
                                  Lihat Detail
                                </button>
                                <button
                                  onClick={() => { onSelectSearchDevice(job.device); onNavigateToTab("penerimaan"); }}
                                  className="bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-sky-200 transition-all"
                                >
                                  TANGANI ➔
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SCENARIO 2: MANAGER VIEW ─────────────────────────────────── */}
          {activeViewRole === "MANAGER" && (
            <div className="space-y-6">

              {/* Executive KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onClick={() => onNavigateToTab("penerimaan")} className="bg-white border border-amber-200 hover:border-yellow-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] cursor-pointer shadow-lg group relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-amber-200/30 pointer-events-none translate-x-3 translate-y-3"><Server size={100} /></div>
                  <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl border border-amber-200 group-hover:bg-yellow-500 group-hover:text-slate-950 transition-colors">
                    <Server size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">REKAP TIKET AKTIF (SELURUH TIM)</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{activeTicketsAll} Instansi</h3>
                    <span className="text-[9px] text-sky-600 font-semibold block mt-0.5">Total pool: {totalTicketsAll} terdaftar di JIP</span>
                  </div>
                </div>

                <div className="bg-white border border-pink-200 hover:border-pink-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg group relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-pink-200/30 pointer-events-none translate-x-3 translate-y-3"><Users size={100} /></div>
                  <div className="bg-pink-50 text-pink-600 p-3.5 rounded-2xl border border-pink-500/20 group-hover:bg-[#f472b6] group-hover:text-slate-950 transition-colors">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">TEKNISI DI LAPANGAN</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">{techniciansOnFieldCount} Personil Aktif</h3>
                    <span className="text-[9px] text-pink-300 font-extrabold block mt-0.5 font-mono">🗺️ GPS: Sidoarjo & Jakarta Selatan</span>
                  </div>
                </div>

                <div className="bg-white border border-rose-200 hover:border-red-400/50 rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg group relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-rose-200/30 pointer-events-none translate-x-3 translate-y-3"><AlertCircle size={100} /></div>
                  <div className="bg-red-950/40 text-[#f43f5e] p-3.5 rounded-2xl border border-red-500/25 animate-pulse">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider block font-mono">TIKET MELEWATI SLA (OVERDUE)</span>
                    <h3 className="text-2xl font-black text-rose-400 mt-0.5">{slaBreachedCount} Unit Warning</h3>
                    <span className="text-[9px] text-[#f43f5e] font-bold flex items-center gap-1 mt-0.5">⚠️ SPH Belum Diotorisasi &gt; 24 Jam</span>
                  </div>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Horizontal bar: performa teknisi */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-xs font-black text-sky-600 uppercase tracking-widest font-mono">📊 KOMPARASI PERFORMA TEKNISI</h4>
                    <p className="text-[11px] text-slate-400">Total penyelesaian tiket per teknisi JIP</p>
                  </div>
                  <div className="space-y-3.5 py-2">
                    {[
                      { name: "Eko Prasetyo",   resolved: 14, pct: 100, color: "from-sky-400 to-sky-600" },
                      { name: "Budi Satrio",     resolved: 9,  pct: 64,  color: "from-purple-400 to-purple-600" },
                      { name: "Rendra Hartono",  resolved: 11, pct: 78,  color: "from-indigo-500 to-sky-500" },
                      { name: "Yusuf Mansur",    resolved: 6,  pct: 42,  color: "from-emerald-400 to-emerald-600" },
                    ].map((tech) => (
                      <div key={tech.name} className="space-y-1" onMouseEnter={() => setHoveredTechBar(tech.name)} onMouseLeave={() => setHoveredTechBar(null)}>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold transition-colors ${hoveredTechBar === tech.name ? "text-indigo-700 font-semibold" : "text-slate-700"}`}>{tech.name}</span>
                          <span className="text-slate-800 font-mono font-bold bg-slate-100 px-2 rounded border border-slate-200">{tech.resolved} Solved</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200/20">
                          <div className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${tech.color}`} style={{ width: `${tech.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 border border-purple-900/30 p-2.5 rounded-xl text-[10px] text-slate-400 leading-relaxed italic">
                    📈 Teknisi senior <strong className="text-sky-600">Eko Prasetyo</strong> mencatatkan total perbaikan tertinggi bulan ini sebanyak 14 unit bergaransi.
                  </div>
                </div>

                {/* Donut: status tiket */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest font-mono">🍩 STATUS TIKET MANDIRI TIM REAL-TIME</h4>
                    <p className="text-[11px] text-slate-400">Distribusi status tiket aktif perusahaan</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-2 relative">
                    <div className="relative w-36 h-36">
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="5" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#38bdf8" strokeWidth="5.5" strokeDasharray="30 70" strokeDashoffset="0" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="5.5" strokeDasharray="20 80" strokeDashoffset="-30" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="5.5" strokeDasharray="15 85" strokeDashoffset="-50" />
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="5.5" strokeDasharray="35 65" strokeDashoffset="-65" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">Porsi</span>
                        <span className="text-xl font-black text-slate-900">{totalTicketsAll || 8}</span>
                        <span className="text-[9px] text-sky-600 font-bold">Total SLA</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 w-full mt-4 text-[9.5px] border-t border-slate-200/40 pt-3">
                      {[
                        { color: "#10b981", label: "Selesai/Closed (35%)" },
                        { color: "#38bdf8", label: "Diterima/Intake (30%)" },
                        { color: "#f59e0b", label: "Pending/Part (20%)" },
                        { color: "#a855f7", label: "Perbaikan (15%)" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5 bg-slate-50 p-1 px-2 rounded border border-slate-200/40">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-slate-300">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dual-line chart: tren masuk vs selesai */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#a855f7] uppercase tracking-widest font-mono">📈 TREN TIKET MASUK VS TIKET SELESAI</h4>
                    <p className="text-[11px] text-slate-400">Log masuk dari dinas vs Berita Acara Selesai (6 bln terakhir)</p>
                  </div>
                  <div className="relative pt-3 font-mono">
                    <svg viewBox="0 0 300 120" className="w-full h-auto overflow-visible">
                      {[10, 50, 90].map((y) => (
                        <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2" />
                      ))}
                      <path d="M 20,90 Q 72,50 72,50 T 124,30 T 176,70 T 228,20 T 280,15" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 20,110 Q 72,90 72,90 T 124,60 T 176,80 T 228,35 T 280,25" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeDasharray="1" />
                      {["Des", "Jan", "Feb", "Mar", "Apr", "Mei"].map((m, i) => (
                        <text key={m} x={20 + i * 52} y="112" className="text-[8px] fill-slate-500" textAnchor="middle">{m}</text>
                      ))}
                    </svg>
                    <div className="flex justify-center gap-4 text-[9px] mt-2 text-slate-400">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#38bdf8] block" /><span>Tiket Baru Masuk</span></div>
                      <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#10b981] block" /><span>Unit Selesai Diservis</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical SLA table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-rose-500" size={16} />
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">⚠️ TIKET MONITORING KRITIS (HAMPIR MELEWATI BATAS SLA)</h4>
                  </div>
                  <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded font-bold font-mono">PRIORITY RADAR</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider bg-slate-50">
                        <th className="py-2.5 px-3">ID Tiket</th>
                        <th className="py-2.5 px-3">Pelanggan / Dinas</th>
                        <th className="py-2.5 px-3">Unit Model</th>
                        <th className="py-2.5 px-3">SLA Travel</th>
                        <th className="py-2.5 px-3">SLA Perbaikan</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Tindakan Otoritas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {managerCriticalAlertsTable.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                            Tidak ada tiket kritis. Seluruh performa instalasi SLA berjalan hijau!
                          </td>
                        </tr>
                      ) : managerCriticalAlertsTable.map((item) => {
                        const isPending = item.statusServis === "PENDING";
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-600">{item.id}</td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800 block">{item.customer}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.serialNumber}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-indigo-300 font-mono border-slate-200">{item.device}</span>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-slate-600 font-mono">
                              {(item as any).travelSlaMinutes ? `${(item as any).travelSlaMinutes} m` : "24 m (Active)"}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[11px] font-mono font-bold ${isPending ? "text-rose-400" : "text-emerald-400"}`}>
                                {(item as any).repairSlaMinutes ? `${(item as any).repairSlaMinutes} m` : "46 m (Remaining)"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${isPending ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-sky-50 text-sky-700 border border-sky-200"}`}>
                                {item.statusServis}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <button onClick={() => { onSelectSearchDevice(item.device); onNavigateToTab("sph"); }} className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-all">
                                Override SLA ➔
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — PROSEDUR ALUR (delegated to DashboardFlowGuide)
          ══════════════════════════════════════════════════════════════════════ */}
      {dashboardTab === "flow" && (
        <DashboardFlowGuide onNavigateToTab={onNavigateToTab} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — LAPOR MANDIRI (delegated to SelfReportPanel)
          ══════════════════════════════════════════════════════════════════════ */}
      {dashboardTab === "report" && (
        <SelfReportPanel onAddService={onAddService} onNavigateToTab={onNavigateToTab} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          KNOWLEDGE BASE — persistent across all tabs
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest font-mono flex items-center gap-2">
              <BookOpen size={15} />
              KNOWLEDGE BASE & RIWAYAT SOLUSI PT. JIP
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Panduan penanganan cepat printer card KTP/Id-Card instansi Anda.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
               placeholder="Cari kendala (misal: printhead, sobek)..."
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
          {filteredKb.length === 0 ? (
            <div className="col-span-2 text-center text-slate-500 py-6 text-xs">Pencatatan solusi sejarah tidak ditemukan.</div>
          ) : filteredKb.map((kb, i) => (
            <div
              key={i}
              onClick={() => onSelectSearchDevice(kb.device)}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 text-xs transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-sky-700 font-mono text-[9px] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                  🚀 {kb.device}
                </span>
                <ChevronRight size={13} className="text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-[11px] truncate">Gejala: {kb.keluhan}</p>
                <p className="text-[10px] text-slate-400 leading-relaxed italic mt-1">
                  <strong className="text-slate-600 font-mono">Tindakan:</strong> {kb.solusi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
