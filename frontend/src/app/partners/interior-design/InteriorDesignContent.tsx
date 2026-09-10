"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocale } from "@/lib/LocaleContext";

// Continuation task — Partner Requirement: this page is the entry point
// for the unified "شركة ديكور وتشطيبات / Decor & Finishing Company"
// category (PartnerType.INTERIOR_DESIGN — enum key unchanged, label only).
const L = {
  eyebrow: { ar: "Decor & Finishing Partners", en: "Decor & Finishing Partners" },
  title: { ar: "شركة ديكور وتشطيبات", en: "Decor & Finishing Company" },
  intro: {
    ar: "يُعد التصميم الداخلي والتشطيبات جزءًا أساسيًا من منظومة تحويل العقارات لدى إيجي موتيلز — من التصور الأولي وحتى الإشراف على التنفيذ. نبحث عن مكاتب وشركات ديكور وتشطيبات موثوقة للمشاركة في مشاريع الشقق والفلل والوحدات الفندقية.",
    en: "Interior design and finishing are a core part of EGYMOTELZ's property transformation process — from initial concept through execution oversight. We're looking for trusted decor and finishing companies to take part in apartment, villa, and hotel-unit projects.",
  },
  whatWeOfferEyebrow: { ar: "ماذا نقدمه للشركاء", en: "What we offer partners" },
  whatWeOfferTitle: { ar: "فرص مشاريع حقيقية", en: "Real project opportunities" },
  whatWeOfferBody: {
    ar: "يشارك شركاء الديكور والتشطيبات في نظام العطاءات الخاص بإيجي موتيلز للتنافس على مشاريع فعلية تُعرض عليهم من إدارة المنصة، مع مقابل مالي (عمولة) عند الفوز بالمشروع وإتمامه.",
    en: "Decor & finishing partners take part in EGYMOTELZ's bidding system, competing for real projects put forward by the platform's management, with a financial payout (commission) upon winning and completing the project.",
  },
  registerCta: { ar: "سجّل كشريك ديكور وتشطيبات", en: "Register as a Decor & Finishing Partner" },
  collabAreasTitle: { ar: "مجالات التعاون", en: "Areas of collaboration" },
} as const;

const COLLAB_AREAS: { ar: string; en: string }[] = [
  { ar: "تصميم مفاهيمي (Concept Design)", en: "Concept Design" },
  { ar: "لوحات إلهام (Mood Board)", en: "Mood Boards" },
  { ar: "تصور ثلاثي الأبعاد", en: "3D Visualization" },
  { ar: "رسومات AutoCAD", en: "AutoCAD Drawings" },
  { ar: "اختيار الخامات", en: "Material Selection" },
  { ar: "الإشراف على التنفيذ", en: "Execution Supervision" },
];

export function InteriorDesignContent() {
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
        <div className="about-grid" style={{ maxWidth: 860, margin: "0 auto" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>{L.whatWeOfferEyebrow[locale]}</p>
            <h2 className="sect-title-ar" style={{ marginBottom: 14 }}>{L.whatWeOfferTitle[locale]}</h2>
            <div className="gold-rule" style={{ marginBottom: 18 }} />
            <p style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.85, marginBottom: 11, fontFamily: "var(--fnar)" }}>
              {L.whatWeOfferBody[locale]}
            </p>
            <a href="/partners/register?type=INTERIOR_DESIGN" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
              {L.registerCta[locale]}
            </a>
          </div>
          <div className="about-vals">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--g)", marginBottom: 14, fontFamily: "var(--fnar)" }}>{L.collabAreasTitle[locale]}</h3>
            {COLLAB_AREAS.map((v) => (
              <div className="vr" key={v.en}>
                <div className="v-dot" />
                {v[locale]}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
