"use client";

import { useMemo, useState } from "react";

export interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A plain <select> doesn't scale to Egypt's full city/district list (Item 2
 * explicitly asks for "searchable dropdowns"). This keeps the same form-field
 * visual language (.fld input styling) but adds a filter-as-you-type text
 * box above a scrollable option list — no new UI framework/library pulled
 * in for this, just a small controlled component.
 */
export function SearchableSelect({ options, value, onChange, placeholder, disabled }: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div style={{ position: "relative" }}>
      <input
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} // allow the click on an option to register first
      />
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "100%",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 9,
            marginTop: 4,
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--sub)", fontFamily: "var(--fnar)" }}>
              لا توجد نتائج
            </div>
          )}
          {filtered.map((o) => (
            <div
              key={o.value}
              onMouseDown={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--fnar)",
                background: o.value === value ? "var(--bg2)" : "transparent",
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
