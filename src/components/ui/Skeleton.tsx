import React from "react";

// ── Base skeleton pulse ────────────────────────────────────────────────────────
function Pulse({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} style={style} />;
}

// ── KPI Card skeleton (dashboard) ──────────────────────────────────────────────
export function SkeletonKpiCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Pulse className="h-4 w-24" />
        <Pulse className="h-8 w-8 rounded-xl" />
      </div>
      <Pulse className="h-8 w-16" />
      <Pulse className="h-3 w-32" />
    </div>
  );
}

// ── Service table row skeleton ─────────────────────────────────────────────────
export function SkeletonTableRow({ cols: _cols }: { cols?: number } = {}) {
  return (
    <tr>
      {[48, 120, 96, 80, 80, 72, 64].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <Pulse className={`h-4`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── Mobile service card skeleton ───────────────────────────────────────────────
export function SkeletonServiceCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Pulse className="h-5 w-20" />
        <Pulse className="h-6 w-24 rounded-full" />
      </div>
      <Pulse className="h-4 w-40" />
      <Pulse className="h-4 w-32" />
      <div className="flex gap-2 mt-1">
        <Pulse className="h-7 flex-1 rounded-lg" />
        <Pulse className="h-7 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

export default Pulse;
