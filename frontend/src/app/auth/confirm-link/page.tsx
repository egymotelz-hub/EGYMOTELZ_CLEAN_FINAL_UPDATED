"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";

function ConfirmLinkForm() {
  const searchParams = useSearchParams();
  const linkToken = searchParams.get("linkToken") ?? "";
  const provider = searchParams.get("provider") ?? "";

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function confirmWithPassword() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/oauth/link/confirm-password", { linkToken, password });
      // The session cookie was set by this request too. Full navigation
      // (not client-side router.push) so AuthContext's existing silent-
      // refresh-on-mount picks it up fresh, same as any other login.
      window.location.href = "/home";
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
      setSubmitting(false);
    }
  }

  async function sendEmailInstead() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/oauth/link/send-email", { linkToken });
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  if (!linkToken) {
    return <div className="error-box">رابط غير صالح — الرجاء إعادة محاولة تسجيل الدخول.</div>;
  }

  return (
    <div className="form-card" style={{ maxWidth: 420, margin: "0 auto" }}>
      {error && <div className="error-box">{error}</div>}
      <div className="disc-box" style={{ marginBottom: 16 }}>
        يوجد حساب EGYMOTELZ مسجّل بنفس البريد الإلكتروني المرتبط بحساب {provider}. للربط بين الحسابين، أكّد ملكيتك للحساب الحالي.
      </div>

      {emailSent ? (
        <div className="disc-box">تم إرسال رابط التأكيد إلى بريدك الإلكتروني.</div>
      ) : (
        <>
          <div className="fld">
            <label>كلمة مرور حسابك الحالي</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="button" className="btn-primary" disabled={submitting || !password} onClick={confirmWithPassword}>
            {submitting ? "جاري التأكيد..." : "تأكيد وربط الحساب"}
          </button>
          <button type="button" className="ab-btn g" style={{ marginTop: 10 }} disabled={submitting} onClick={sendEmailInstead}>
            إرسال رابط تأكيد بالبريد الإلكتروني بدلاً من ذلك
          </button>
        </>
      )}
    </div>
  );
}

export default function ConfirmLinkPage() {
  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          تأكيد ربط الحساب
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
      </div>
      <div className="sect" dir="rtl">
        <Suspense fallback={null}>
          <ConfirmLinkForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
