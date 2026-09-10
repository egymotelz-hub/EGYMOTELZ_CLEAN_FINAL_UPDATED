"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Locale = "ar" | "en";
interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: "rtl" | "ltr";
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);
const STORAGE_KEY = "egymotelz-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  // Restore the last-chosen language on load (session/tab refresh) — without
  // this, dir/lang silently reset to Arabic on every navigation that
  // remounts the root layout, even after the user explicitly chose English.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLocaleState(stored);
  }, []);

  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  // <html> itself is rendered by the server layout and can't read this
  // client context directly, so we sync its lang/dir attributes here.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
