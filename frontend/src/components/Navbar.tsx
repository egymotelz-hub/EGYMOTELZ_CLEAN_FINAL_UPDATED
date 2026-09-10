"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/LocaleContext";

// Scoped to this task: only the Navbar items explicitly listed in the
// language-switching requirement get an English label right now. The rest
// of the Navbar (مستثمر / من نحن / role links / login / CTA) is unchanged —
// full-site translation is a separate, later task.
const NAV_LABELS: Record<"home" | "units" | "experiences" | "joinOwner" | "partner" | "investor" | "about" | "login" | "logout" | "bookNow", { ar: string; en: string }> = {
  home: { ar: "الرئيسية", en: "Home" },
  units: { ar: "الوحدات", en: "Units" },
  experiences: { ar: "اكتشف القاهرة", en: "Explore Cairo" },
  joinOwner: { ar: "انضم كمالك", en: "Join as owner" },
  partner: { ar: "كن شريكًا", en: "Be a partner" },
  investor: { ar: "مستثمر", en: "Investor" },
  about: { ar: "من نحن", en: "Who are we?" },
  login: { ar: "تسجيل الدخول", en: "Log in" },
  logout: { ar: "تسجيل الخروج", en: "Log out" },
  bookNow: { ar: "احجز الآن", en: "Book now" },
};

const PARTNER_LINKS: { href: string; ar: string; en: string }[] = [
  { href: "/partners/register", ar: "سجّل كشريك", en: "Register as a partner" },
  { href: "/contractor/register", ar: "المقاولون", en: "Contractors" },
  // Business requirement: Design Companies + Interior Design Companies are
  // ONE unified category (شركة ديكور وتشطيبات / Decor & Finishing Company),
  // not two — so there is deliberately only one dropdown entry for it. A
  // second "شركات التشطيب" entry used to point here too (mis-linked to the
  // generic OTHER category); removed rather than left as a confusing
  // duplicate.
  { href: "/partners/interior-design", ar: "شركة ديكور وتشطيبات", en: "Decor & Finishing Company" },
  { href: "/partners/other", ar: "شركات الفرش والتجهيز", en: "Furniture & fit-out companies" },
  { href: "/hotel-management-companies/register", ar: "شركات الإدارة والتشغيل", en: "Management & operation companies" },
];

// Merged in from the former TabBar (now retired — this is the single
// canonical navbar per the "unify the two navbars" requirement). Extra
// links only visible when the logged-in user holds a matching role —
// authorization is still enforced server-side regardless; this only
// controls what's *shown*, never what's *allowed*.
const ROLE_LINKS: { href: string; label: string; roles: string[] }[] = [
  { href: "/admin", label: "لوحة الإدارة", roles: ["admin", "super_admin", "employee", "manager"] },
  { href: "/finance", label: "المالية", roles: ["finance_staff", "super_admin"] },
  { href: "/owner/dashboard", label: "لوحة المالك", roles: ["owner"] },
  { href: "/contractor", label: "لوحة المقاول", roles: ["contractor"] },
  { href: "/financial-partner", label: "لوحة الشريك المالي", roles: ["financial_partner"] },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleRoleLinks = ROLE_LINKS.filter((l) => user?.roles.some((r) => l.roles.includes(r)));

  // Root-cause fix: the dropdown is now controlled by click alone (no
  // onMouseEnter/onMouseLeave fighting the click toggle). Outside-click and
  // Escape close it — neither existed before.
  useEffect(() => {
    if (!partnerOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPartnerOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPartnerOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [partnerOpen]);

  return (
    <div className="navbar">
      <div className="nav-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="EGYMOTELZ" />
        <div className="nav-brand">
          <div className="nav-brand-name">EGY MOTELZ</div>
          <div className="nav-brand-tag">The Key to Hospitality</div>
        </div>
      </div>

      <button
        type="button"
        className="nav-hamburger"
        aria-label="القائمة"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${mobileOpen ? " nav-links-open" : ""}`}>
        <Link href="/home" className={`nav-link${pathname === "/home" ? " active" : ""}`}>{NAV_LABELS.home[locale]}</Link>
        <Link href="/listings" className={`nav-link${pathname === "/listings" ? " active" : ""}`}>{NAV_LABELS.units[locale]}</Link>
        <Link href="/experiences" className={`nav-link${pathname === "/experiences" ? " active" : ""}`}>{NAV_LABELS.experiences[locale]}</Link>
        <Link href="/owners" className={`nav-link${pathname === "/owners" ? " active" : ""}`}>{NAV_LABELS.joinOwner[locale]}</Link>
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="nav-link nav-dropdown-trigger"
            onClick={() => setPartnerOpen((v) => !v)}
            aria-expanded={partnerOpen}
            aria-haspopup="menu"
          >
            {NAV_LABELS.partner[locale]} ▾
          </button>
          {partnerOpen && (
            <div className="nav-dropdown-menu" role="menu">
              {PARTNER_LINKS.map((item, i) => (
                <Link key={`${item.href}-${i}`} href={item.href} className="nav-dropdown-item" role="menuitem" onClick={() => setPartnerOpen(false)}>
                  {item[locale]}
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link href="/investor" className={`nav-link${pathname === "/investor" ? " active" : ""}`}>{NAV_LABELS.investor[locale]}</Link>
        <Link href="/about" className={`nav-link${pathname === "/about" ? " active" : ""}`}>{NAV_LABELS.about[locale]}</Link>

        {visibleRoleLinks.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-link${pathname === l.href ? " active" : ""}`}>
            {l.label}
          </Link>
        ))}

        {user ? (
          <button type="button" className="nav-link nav-link-btn" onClick={logout}>
            {NAV_LABELS.logout[locale]}
          </button>
        ) : (
          <Link href="/login" className="nav-link">{NAV_LABELS.login[locale]}</Link>
        )}

        <div className="nav-lang-switch" role="group" aria-label="Language / اللغة">
          <button
            type="button"
            className={`nav-lang-btn${locale === "ar" ? " active" : ""}`}
            aria-pressed={locale === "ar"}
            onClick={() => setLocale("ar")}
          >
            Ar
          </button>
          <span className="nav-lang-sep">|</span>
          <button
            type="button"
            className={`nav-lang-btn${locale === "en" ? " active" : ""}`}
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            En
          </button>
        </div>
      </div>

      <Link href="/listings">
        <button className="nav-cta">{NAV_LABELS.bookNow[locale]}</button>
      </Link>
    </div>
  );
}
