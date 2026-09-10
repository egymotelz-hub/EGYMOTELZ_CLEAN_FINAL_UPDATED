import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "شركاء آخرون | EGYMOTELZ",
  description: "انضم كشريك في مجالات الأثاث والصيانة والنظافة والأجهزة والخدمات العقارية والضيافة.",
};

// These all map to real, already-supported PartnerType values — the
// registration form (built this session) genuinely accepts them today.
// Previously this page marked all of them "قريبًا" (coming soon), which
// was accurate when written but is now stale/incorrect.
const CATEGORIES: { label: string; type: string }[] = [
  { label: "شركات الأثاث والتأثيث", type: "FURNITURE" },
  { label: "شركات الصيانة", type: "MAINTENANCE" },
  { label: "شركات النظافة", type: "CLEANING" },
  { label: "موردو الأجهزة المنزلية", type: "APPLIANCES" },
  { label: "شركات عقارية / وسطاء", type: "REAL_ESTATE" },
  { label: "خدمات ضيافة أخرى", type: "HOSPITALITY_SERVICES" },
];

export default function OtherPartnersPage() {
  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Partner Categories</p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          شركاء آخرون
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, maxWidth: 560, margin: "0 auto", fontFamily: "var(--fnar)", lineHeight: 1.8 }}>
          تعمل إيجي موتيلز على توسيع شبكة شركائها لتشمل مزودي خدمات إضافية لمنظومة تحويل وتشغيل العقارات.
        </p>
      </div>
      <div className="sect" dir="rtl">
        <div className="about-vals" style={{ maxWidth: 640, margin: "0 auto" }}>
          {CATEGORIES.map((c) => (
            <Link
              href={`/partners/register?type=${c.type}`}
              key={c.type}
              className="vr"
              style={{ justifyContent: "space-between", textDecoration: "none" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="v-dot" />
                {c.label}
              </span>
              <span className="ab-btn g">سجّل الآن</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
