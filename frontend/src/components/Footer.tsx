"use client";

import Link from "next/link";
import { useLocale } from "@/lib/LocaleContext";

// Root-cause fix: every item below used to be a bare <li>text</li> with no
// href at all — not broken links, just never links. Now real navigation.
const PLATFORM_LINKS = [
  { href: "/listings", ar: "الوحدات", en: "Units" },
  { href: "/owners", ar: "انضم كمالك", en: "Join as owner" },
  { href: "/booking", ar: "احجز إقامة", en: "Book a stay" },
  { href: "/partners", ar: "كن شريكًا", en: "Be a partner" },
];
const COMPANY_LINKS = [
  { href: "/about", ar: "من نحن", en: "Who are we?" },
  // No dedicated /contact page exists yet — WhatsApp is the actual working
  // contact channel today, so "تواصل معنا" points there rather than a
  // non-existent route.
  { href: "https://wa.me/201204763095", ar: "تواصل معنا", en: "Contact us", external: true },
];

// Terms & Privacy pages don't exist anywhere in the project yet — left as
// plain text (unchanged from before) rather than linking to pages that
// would 404, or fabricating placeholder legal pages outside this bug fix's
// scope.
const LEGAL_ITEMS: { ar: string; en: string }[] = [
  { ar: "الشروط والأحكام", en: "Terms and Conditions" },
  { ar: "سياسة الخصوصية", en: "Privacy Policy" },
];

// Social links: NEVER fabricated. Each only renders if its env var is
// actually set — by default all are empty, so nothing renders, matching
// "do not invent social media URLs." Fill these in via
// NEXT_PUBLIC_FACEBOOK_URL / NEXT_PUBLIC_INSTAGRAM_URL / NEXT_PUBLIC_LINKEDIN_URL
// when real accounts exist.
const SOCIAL_LINKS = [
  { label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "LinkedIn", url: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { label: "TikTok", url: process.env.NEXT_PUBLIC_TIKTOK_URL },
].filter((s): s is { label: string; url: string } => !!s.url);

const WHATSAPP_URL = "https://wa.me/201204763095";

const L = {
  tagline: {
    ar: "منصة مصرية متخصصة في تطوير وتشغيل الشقق الفندقية وتحويل العقارات إلى وحدات إقامة حديثة.",
    en: "An Egyptian platform specializing in the development and operation of hotel apartments and the conversion of real estate into modern accommodation units.",
  },
  platform: { ar: "المنصة", en: "Platform" },
  company: { ar: "الشركة", en: "Company" },
  legal: { ar: "قانوني", en: "Legal" },
  disclaimer: {
    ar: "الدخل يعتمد على نسب الإشغال والطلب السياحي وجودة التشغيل وظروف السوق.",
    en: "Income depends on occupancy rates, tourist demand, operational quality, and market conditions.",
  },
} as const;

export function Footer() {
  const { locale } = useLocale();

  return (
    <div className="footer">
      <div className="footer-grid">
        <div>
          <div className="nav-brand-name">EGY MOTELZ</div>
          <p className="fg-tag">{L.tagline[locale]}</p>
          <div className="fg-social">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fg-social-link" aria-label="WhatsApp">
              WhatsApp
            </a>
            {SOCIAL_LINKS.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="fg-social-link" aria-label={s.label}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="fg-head">{L.platform[locale]}</div>
          <ul className="fg-links">
            {PLATFORM_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="fg-link">{l[locale]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="fg-head">{L.company[locale]}</div>
          <ul className="fg-links">
            {COMPANY_LINKS.map((l) =>
              l.external ? (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="fg-link">{l[locale]}</a>
                </li>
              ) : (
                <li key={l.href}>
                  <Link href={l.href} className="fg-link">{l[locale]}</Link>
                </li>
              )
            )}
          </ul>
        </div>
        <div>
          <div className="fg-head">{L.legal[locale]}</div>
          <ul className="fg-links">
            {LEGAL_ITEMS.map((item) => (
              <li key={item.en}>{item[locale]}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="fb-copy">© {new Date().getFullYear()} EGYMOTELZ. All rights reserved.</div>
        <div className="fb-disc">{L.disclaimer[locale]}</div>
      </div>
    </div>
  );
}
