import React from "react";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({ label, checked, onChange, disabled, className = "" }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-blue-600 w-4 h-4 rounded"
      />
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}
