"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/password-reset/confirm", { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sect" dir="rtl">
      <div className="form-card" style={{ maxWidth: 420, margin: "0 auto" }}>
        {!token && <div className="error-box">الرابط غير صالح أو غير مكتمل — الرجاء استخدام الرابط المُرسل إلى بريدك الإلكتروني.</div>}
        {error && <div className="error-box">{error}</div>}
        {done ? (
          <>
            <div className="disc-box">تم تغيير كلمة المرور بنجاح.</div>
            <Link href="/login" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 12 }}>
              تسجيل الدخول
            </Link>
          </>
        ) : (
          <>
            <div className="fld">
              <label>كلمة المرور الجديدة</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <button type="button" className="btn-primary" disabled={submitting || !token} onClick={handleSubmit}>
              {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          إعادة تعيين كلمة المرور
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
      </div>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
      <Footer />
    </div>
  );
}
