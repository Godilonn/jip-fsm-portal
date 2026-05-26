import React from "react";

// ── TextInput ────────────────────────────────────────────────────────────────
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  wrapperClassName?: string;
}

export function TextInput({ label, error, hint, mono, wrapperClassName, className = "", id, ...props }: TextInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={`flex flex-col gap-1${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`
          w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400
          bg-slate-50 border transition-all outline-none
          ${error ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${mono ? "font-mono" : ""}
          ${className}
        `}
      />
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={`
          w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400
          bg-slate-50 border transition-all outline-none resize-none
          ${error ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ── SelectInput ───────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string; }
interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export function SelectInput({ label, options, error, placeholder, className = "", id, ...props }: SelectInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={`
          w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800
          bg-slate-50 border transition-all outline-none cursor-pointer
          ${error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ── RadioGroup ────────────────────────────────────────────────────────────────
interface RadioGroupProps {
  label?: string;
  name: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  inline?: boolean;
}

export function RadioGroup({ label, name, options, value, onChange, inline = false }: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
      )}
      <div className={`flex ${inline ? "flex-row gap-4 flex-wrap" : "flex-col gap-2"}`}>
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-blue-600 w-4 h-4"
            />
            <span className="text-sm text-slate-700 group-hover:text-slate-900">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
