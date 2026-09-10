"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";

interface PlatformStats {
  unitsManaged: number;
  avgRating: number;
  activeNeighborhoods: number;
  confirmedBookings: number;
}

// Continuation task, Priority 2: approved English copy for the Home page,
// applied via the existing LocaleContext (no duplicate /home-en route).
const L = {
  eyebrow: { ar: "Hospitality Transformation Platform", en: "Hospitality Transformation Platform" },
  heroPre: { ar: "نحوّل عقارك إلى ", en: "We transform your property into a professional " },
  heroEm: { ar: "وجهة ضيافة", en: "hospitality destination" },
  heroPost: { ar: " احترافية", en: "." },
  heroBody: {
    ar: "EGYMOTELZ تساعد ملاك العقارات في مصر على تحويل المباني غير المستغلة إلى شقق فندقية مُدارة باحترافية، بعائد شهري مستقر دون عناء التشغيل اليومي.",
    en: "EGYMOTELZ helps property owners in Egypt convert unused buildings into professionally managed hotel apartments, with a stable monthly return without the hassle of daily operation.",
  },
  joinOwner: { ar: "انضم كمالك", en: "Join as owner" },
  browseUnits: { ar: "تصفح الوحدات", en: "Browse units" },
  disclaimer: {
    ar: "الدخل يعتمد على نسب الإشغال والطلب السياحي وجودة التشغيل وظروف السوق ولا يمثل ضمانًا.",
    en: "Income depends on occupancy rates, tourist demand, operational quality, and market conditions, and is not a guarantee.",
  },
  atAGlance: { ar: "EGYMOTELZ AT A GLANCE", en: "EGYMOTELZ AT A GLANCE" },
  unitsManaged: { ar: "وحدة تحت الإدارة", en: "units under management" },
  avgRating: { ar: "متوسط تقييم الضيوف", en: "average guest rating" },
  neighborhoods: { ar: "حي بالقاهرة والجيزة والإسكندرية", en: "neighborhoods across Cairo, Giza & Alexandria" },
  confirmedBookings: { ar: "حجز مؤكد", en: "confirmed bookings" },
  howItWorks: { ar: "How It Works", en: "How It Works" },
  howItWorksTitle: { ar: "من التقديم إلى أول حجز", en: "From application to first booking" },
  ownerCtaTitle: { ar: "حوّل عقارك إلى مصدر دخل مستقر", en: "Turn your property into a stable source of income" },
  ownerCtaBody: {
    ar: "ننضم كشريك تشغيلي متكامل — أنت تملك العقار، ونحن نتولى التشغيل اليومي.",
    en: "We join as a fully integrated operating partner — you own the property, and we handle the day-to-day operations.",
  },
  ownerCtaDisclaimer: { ar: "الدخل يعتمد على ظروف السوق ولا يمثل ضمانًا.", en: "Income depends on market conditions and is not a guarantee." },
  startApplying: { ar: "ابدأ التقديم الآن", en: "Start applying now" },
} as const;

const STEPS = [
  {
    num: { ar: "١", en: "1" },
    title: { ar: "قدّم بياناتك", en: "Submit your details" },
    desc: { ar: "املأ نموذج الانضمام بمعلومات العقار", en: "Fill out the joining form with the property information." },
  },
  {
    num: { ar: "٢", en: "2" },
    title: { ar: "تقييم الجاهزية", en: "Readiness assessment" },
    desc: { ar: "فريقنا يقيّم حالة العقار ومتطلبات التجهيز", en: "Our team assesses the property's condition and furnishing requirements." },
  },
  {
    num: { ar: "٣", en: "3" },
    title: { ar: "التجهيز والتشغيل", en: "Preparation and operation" },
    desc: { ar: "نتولى التأثيث والتشغيل بمعايير فندقية", en: "We handle the furnishing and operation according to hotel standards." },
  },
  {
    num: { ar: "٤", en: "4" },
    title: { ar: "استلام العائد", en: "Receipt of returns" },
    desc: { ar: "تحصل على دخل شهري ثابت بشفافية كاملة", en: "You receive a fixed monthly income with complete transparency." },
  },
] as const;

const BENEFITS: { ar: string; en: string }[] = [
  { ar: "إدارة كاملة للعقار", en: "Full property management" },
  { ar: "تسويق واستقبال ضيوف", en: "Marketing and guest reception" },
  { ar: "صيانة ودعم فني", en: "Maintenance and Technical Support" },
  { ar: "تقارير مالية شفافة", en: "Transparent financial reporting" },
];

export default function HomePage() {
  const { locale } = useLocale();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.get<PlatformStats>("/public/platform-stats").then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="screen active" id="sc-home">
      <Navbar />

      <div className="hero">
        <div>
          <div className="hero-eyebrow">{L.eyebrow[locale]}</div>
          <h1>
            {L.heroPre[locale]}
            <em>{L.heroEm[locale]}</em>
            {L.heroPost[locale]}
          </h1>
          <p>{L.heroBody[locale]}</p>
          <div className="hero-btns">
            <Link href="/owners">
              <button className="btn-gold">{L.joinOwner[locale]}</button>
            </Link>
            <Link href="/listings">
              <button className="btn-out-w">{L.browseUnits[locale]}</button>
            </Link>
          </div>
          <div className="hero-disc">{L.disclaimer[locale]}</div>
        </div>

        <div className="stats-panel">
          <div className="sp-rule" />
          <div className="sp-label">{L.atAGlance[locale]}</div>
          <div className="sp-row">
            <span className="sp-num">{stats ? `${stats.unitsManaged}+` : "—"}</span>
            <span className="sp-txt">{L.unitsManaged[locale]}</span>
          </div>
          <div className="sp-row">
            <span className="sp-num">{stats ? `${stats.avgRating}` : "—"}</span>
            <span className="sp-txt">{L.avgRating[locale]}</span>
          </div>
          <div className="sp-row">
            <span className="sp-num">{stats ? `${stats.activeNeighborhoods}+` : "—"}</span>
            <span className="sp-txt">{L.neighborhoods[locale]}</span>
          </div>
          <div className="sp-row">
            <span className="sp-num">{stats ? `${stats.confirmedBookings}+` : "—"}</span>
            <span className="sp-txt">{L.confirmedBookings[locale]}</span>
          </div>
        </div>
      </div>

      <div className="sect">
        <div className="sect-ctr">
          <div className="eyebrow">{L.howItWorks[locale]}</div>
          <div className="sect-title-ar">{L.howItWorksTitle[locale]}</div>
          <div className="gold-rule gold-rule-c" />
        </div>
        <div className="hiw">
          <div className="hiw-line" />
          {STEPS.map((step, i) => (
            <div className="hiw-step" key={step.title.en}>
              <div className={`step-circle${i === 0 ? " first" : ""}`}>
                <span className="step-num">{step.num[locale]}</span>
              </div>
              <h3>{step.title[locale]}</h3>
              <p>{step.desc[locale]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="owner-cta">
        <div className="owner-grid">
          <div>
            <h2>{L.ownerCtaTitle[locale]}</h2>
            <p>{L.ownerCtaBody[locale]}</p>
            <div className="disc-small">{L.ownerCtaDisclaimer[locale]}</div>
            <Link href="/owners">
              <button className="btn-gold">{L.startApplying[locale]}</button>
            </Link>
          </div>
          <div className="bens-panel">
            {BENEFITS.map((b) => (
              <div className="ben-row" key={b.en}>
                <div className="ben-dot" />
                <span>{b[locale]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
