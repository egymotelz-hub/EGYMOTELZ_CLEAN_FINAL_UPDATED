"use client";

import { useState, useEffect } from "react";

interface MoneyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function formatDisplay(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "";
  return n.toLocaleString("en-US");
}

/**
 * Accepts the FULL amount (e.g. 250000), never thousands-shorthand. Shows
 * thousand separators while the user isn't actively typing (on blur/initial
 * render) and the raw digit string while focused, so typing isn't fighting
 * comma insertion — but the value handed to the form is always the plain
 * number, never a formatted string, which is what fixed the NaN/null bug
 * this component was introduced to close off for good.
 */
export function MoneyInput({ value, onChange, onBlur, placeholder, disabled, id }: MoneyInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(formatDisplay(value));

  useEffect(() => {
    if (!focused) setRaw(formatDisplay(value));
  }, [value, focused]);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      placeholder={placeholder}
      value={focused ? raw : formatDisplay(value)}
      onFocus={() => {
        setFocused(true);
        setRaw(value !== undefined && !Number.isNaN(value) ? String(value) : "");
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onChange={(e) => {
        // Reject anything that isn't a digit as it's typed — satisfies
        // "prevent entering letters or invalid characters" directly, rather
        // than only catching it at validation time.
        const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
        setRaw(digitsOnly);
        onChange(digitsOnly === "" ? undefined : Number(digitsOnly));
      }}
    />
  );
}
