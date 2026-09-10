"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/AuthContext";
import { api, ApiClientError, API_BASE } from "@/lib/apiClient";
import { destinationForRoles } from "@/lib/postLoginRouting";

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    if (oauthError === "not_configured") {
      const provider = searchParams.get("provider") ?? "";
      setError(`تسجيل الدخول عبر ${provider} غير مفعّل حاليًا على هذا الخادم`);
    } else if (oauthError) {
      setError("تعذّر إتمام تسجيل الدخول عبر هذه الطريقة، حاول مرة أخرى");
    }
  }, [searchParams]);

  function startOAuth(provider: "google" | "facebook" | "apple") {
    window.location.href = `${API_BASE}/api/auth/oauth/${provider}/start`;
  }

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email, password);
      router.push(destinationForRoles(user.roles ?? []));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/password-reset/request", { email });
      setForgotSent(true); // constant-shape response regardless of whether the email exists — matches existing backend behavior
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen active">
      <Navbar />
      <div className="form-hero" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>EGYMOTELZ</p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, fontFamily: "var(--fnar)", marginBottom: 8 }}>
          تسجيل الدخول
        </h1>
        <div style={{ width: 36, height: 1, background: "var(--gold)", margin: "0 auto 14px" }} />
      </div>

      <div className="sect" dir="rtl">
        <form
          className="form-card"
          style={{ maxWidth: 420, margin: "0 auto" }}
          onSubmit={(e) => e.preventDefault()}
        >
          {error && <div className="error-box">{error}</div>}
          {forgotSent ? (
            <div className="disc-box">
              إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.
            </div>
          ) : mode === "login" ? (
            <>
              <div className="fld">
                <label>البريد الإلكتروني</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="fld">
                <label>كلمة المرور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button type="button" className="ab-btn g" style={{ marginBottom: 10 }} onClick={() => setMode("forgot")}>
                نسيت كلمة المرور؟
              </button>
              <button type="button" className="btn-primary" disabled={submitting} onClick={handleLogin}>
                {submitting ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>

              <div style={{ textAlign: "center", margin: "18px 0", color: "var(--mut)", fontSize: 12, fontFamily: "var(--fnar)" }}>
                أو
              </div>
              {([
                ["google", "Google"],
                ["facebook", "Facebook"],
                ["apple", "Apple"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="ab-btn"
                  style={{ width: "100%", marginBottom: 8 }}
                  onClick={() => startOAuth(key)}
                >
                  المتابعة عبر {label}
                </button>
              ))}

              <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--mut)", fontFamily: "var(--fnar)" }}>
                ليس لديك حساب؟{" "}
                <Link href="/home" style={{ color: "var(--gold)" }}>
                  ابدأ من هنا
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="fld">
                <label>البريد الإلكتروني</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="button" className="btn-primary" disabled={submitting} onClick={handleForgotPassword}>
                {submitting ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
              <button type="button" className="ab-btn g" style={{ marginTop: 10 }} onClick={() => setMode("login")}>
                العودة لتسجيل الدخول
              </button>
            </>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}
