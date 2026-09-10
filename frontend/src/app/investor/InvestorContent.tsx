"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocale } from "@/lib/LocaleContext";

// Continuation task, Priority 2: approved English copy for the Investor
// page. Split into a client component (needs useLocale) separate from
// page.tsx so page.tsx can keep its Server Component `metadata` export —
// a client component can't export metadata in the Next.js App Router.
const L = {
  eyebrow: { ar: "Investor Relations", en: "Investor Relations" },
  title: { ar: "استثمر مع EgyMotelz", en: "Invest with EgyMotelz" },
  intro: {
    ar: "نقوم حاليًا بتطوير منصة تتيح للمستثمرين المشاركة في مشاريع الضيافة العقارية المستقبلية لدى إيجي موتيلز.",
    en: "We are currently developing a platform that will allow investors to participate in future real estate hospitality projects at EgyMotelz.",
  },
  comingSoon: { ar: "قريبًا", en: "Coming Soon" },
  body: {
    ar: "هذه الصفحة تعريفية فقط في الوقت الحالي، ولا تمثّل عرضًا استثماريًا فعليًا أو دعوة لتقديم أموال. لا توجد حاليًا أي معاملات مالية أو ضمانات عوائد. سيتم الإعلان عن تفاصيل المنصة الاستثمارية عند إطلاقها رسميًا.",
    en: "This page is for informational purposes only and does not constitute an actual investment offer or a call for funds. There are currently no financial transactions or return guarantees. Details of the investment platform will be announced upon its official launch.",
  },
  disclaimer: {
    ar: "هذا المحتوى لأغراض تعريفية فقط ولا يشكل استشارة مالية أو استثمارية.",
    en: "This content is for informational purposes only and does not constitute financial or investment advice.",
  },
} as const;

export function InvestorContent() {
  const { locale } = useLocale();

  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>{L.eyebrow[locale]}</p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          {L.title[locale]}
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, maxWidth: 560, margin: "0 auto", fontFamily: "var(--fnar)", lineHeight: 1.8 }}>
          {L.intro[locale]}
        </p>
      </div>
      <div className="sect">
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <span className="badge bp" style={{ fontSize: 12, padding: "6px 14px", marginBottom: 18, display: "inline-block" }}>
            {L.comingSoon[locale]}
          </span>
          <p style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.9, fontFamily: "var(--fnar)", marginBottom: 16 }}>
            {L.body[locale]}
          </p>
          <div className="disc-box">{L.disclaimer[locale]}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
