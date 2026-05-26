/**
 * @file features/service-reception/components/KelengkapanChecklist.tsx
 * @description Checklist kelengkapan fisik printer saat diterima.
 *
 * DIPINDAH DARI: PenerimaanPrinter.tsx baris 1346-1430 (84 baris, 6 button toggle identik).
 *
 * SEBELUM: 6x copy-paste button toggle dengan class string panjang:
 *   <button type="button" onClick={() => setRibbon(!ribbon)}
 *     className={`flex items-center gap-2 p-2 border rounded-xl ...`}>
 *   ...diulang 6 kali
 *
 * SESUDAH: gunakan <Checkbox> component + konfigurasi array.
 */

import React from "react";
import Checkbox from "../../../components/ui/Checkbox";
import { TextInput } from "../../../components/ui/Input";
import type { ServiceFormState } from "../hooks/useServiceForm";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

type KelengkapanKey = keyof Omit<ServiceFormState["kelengkapan"], "lainnya">;

const KELENGKAPAN_ITEMS: { key: KelengkapanKey; label: string }[] = [
  { key: "ribbon",       label: "Ribbon" },
  { key: "film",         label: "Retransfer Film" },
  { key: "catrigeFilm",  label: "Cartridge Film" },
  { key: "catrigeRibbon",label: "Cartridge Ribbon" },
  { key: "adaptor",      label: "Adaptor Power" },
  { key: "kabelUsb",     label: "Kabel USB" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface KelengkapanChecklistProps {
  kelengkapan: ServiceFormState["kelengkapan"];
  onToggle: (key: KelengkapanKey) => void;
  onLainnyaChange: (value: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function KelengkapanChecklist({
  kelengkapan,
  onToggle,
  onLainnyaChange,
}: KelengkapanChecklistProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-1">
        Checklist Kelengkapan Printer (Fisik)
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {KELENGKAPAN_ITEMS.map(({ key, label }) => (
          <Checkbox
            key={key}
            checked={kelengkapan[key]}
            onChange={() => onToggle(key)}
            label={label}
          />
        ))}
      </div>
      <TextInput
        label="Asesoris Tambahan Lainnya (Opsional)"
        value={kelengkapan.lainnya}
        onChange={(e) => onLainnyaChange(e.target.value)}
        placeholder="Contoh: cleaning card, box pembungkus asli"
      />
    </div>
  );
}
