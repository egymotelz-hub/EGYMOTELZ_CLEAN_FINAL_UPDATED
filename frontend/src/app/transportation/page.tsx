import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "النقل والمواصلات | EGYMOTELZ",
  description: "منظومة تعاون مستقبلية مع شركات النقل والمواصلات لخدمة ضيوف إيجي موتيلز.",
};

export default function TransportationPage() {
  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Transportation Partners</p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          النقل والمواصلات
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
        <span className="badge bp" style={{ fontSize: 12, padding: "6px 14px", display: "inline-block" }}>قريبًا</span>
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, maxWidth: 520, margin: "14px auto 0", fontFamily: "var(--fnar)", lineHeight: 1.8 }}>
          نعمل على بناء شراكات نقل — من استقبال المطار إلى التنقل داخل المدن — لخدمة ضيوف إيجي موتيلز مستقبلًا.
        </p>
      </div>
      <Footer />
    </div>
  );
}
