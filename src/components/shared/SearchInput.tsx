import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounce?: number;
  className?: string;
  id?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  debounce = 200,
  className = "",
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setLocal(value); }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), debounce);
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
      />
      {local && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
