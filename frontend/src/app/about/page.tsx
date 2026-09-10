"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocale } from "@/lib/LocaleContext";

// Continuation task, Priority 2: approved English copy for the About page.
const L = {
  eyebrow: { ar: "About EGYMOTELZ", en: "About EGYMOTELZ" },
  title: { ar: "من نحن", en: "Who are we?" },
  intro: {
    ar: "إيجي موتيلز منصة مصرية متخصصة في تطوير وتشغيل الشقق الفندقية، تساعد ملاك العقارات على تحويل المباني غير المستغلة إلى وحدات إقامة حديثة تُدار باحترافية.",
    en: "EGYMOTELZ is an Egyptian platform specializing in the development and operation of hotel apartments, helping property owners transform unused buildings into modern, professionally managed accommodation units.",
  },
  messageEyebrow: { ar: "رسالتنا", en: "Our message" },
  messageTitle: { ar: "شريك التحول الفندقي", en: "Hotel Transformation Partner" },
  messageBody1: {
    ar: "إيجي موتيلز منصة مصرية لتحويل الضيافة، تساعد ملاك العقارات على تحويل المباني غير المستغلة إلى شقق مخدومة تُدار باحترافية.",
    en: "EGYMOTELZ is an Egyptian hospitality transformation platform helping property owners transform underutilized buildings into professionally managed serviced apartments.",
  },
  messageBody2: {
    ar: "نعمل كشريك تشغيلي متكامل يتولى إدارة العقارات بمعايير الضيافة الفندقية الحديثة.",
    en: "We operate as an integrated operational partner that manages properties according to modern hotel hospitality standards.",
  },
  disclaimer: {
    ar: "الدخل يعتمد على نسب الإشغال والطلب السياحي وجودة التشغيل وظروف السوق.",
    en: "Income depends on occupancy rates, tourist demand, operational quality, and market conditions.",
  },
  offerTitle: { ar: "ما نقدمه", en: "What we offer" },
} as const;

const OFFERINGS: { ar: string; en: string }[] = [
  { ar: "شريك تحويل الضيافة", en: "Hospitality Transformation Partner" },
  { ar: "مشغّل شقق فندقية", en: "Hotel apartment operator" },
  { ar: "شركة إدارة عقارات", en: "Property Management Company" },
  { ar: "منصة إدارة ضيافة", en: "Hospitality management platform" },
  { ar: "منظومة عمليات سياحية", en: "Tourism operations system" },
];

export default function AboutPage() {
  const { locale } = useLocale();

  return (
    <div className="screen active" id="sc-about">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>{L.eyebrow[locale]}</p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>{L.title[locale]}</h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, maxWidth: 540, margin: "0 auto", fontFamily: "var(--fnar)", lineHeight: 1.8 }}>
          {L.intro[locale]}
        </p>
      </div>
      <div className="sect">
        <div className="about-grid" style={{ maxWidth: 860, margin: "0 auto" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>{L.messageEyebrow[locale]}</p>
            <h2 className="sect-title-ar" style={{ marginBottom: 14 }}>{L.messageTitle[locale]}</h2>
            <div className="gold-rule" style={{ marginBottom: 18 }} />
            <p style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.85, marginBottom: 11, fontFamily: "var(--fnar)" }}>
              {L.messageBody1[locale]}
            </p>
            <p style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.85, marginBottom: 18, fontFamily: "var(--fnar)" }}>
              {L.messageBody2[locale]}
            </p>
            <div className="disc-box">{L.disclaimer[locale]}</div>
          </div>
          <div className="about-vals">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--g)", marginBottom: 14, fontFamily: "var(--fnar)" }}>{L.offerTitle[locale]}</h3>
            {OFFERINGS.map((v) => (
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
