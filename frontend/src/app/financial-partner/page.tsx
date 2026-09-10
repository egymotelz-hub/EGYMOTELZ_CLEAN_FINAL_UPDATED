"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navbar } from "@/components/Navbar";
import { api, ApiClientError } from "@/lib/apiClient";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  occurredAt: string;
}

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل تسجيل الدخول");
    }
  }

  return (
    <div className="form-wrap">
      <div className="form-card">
        <h2 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 14 }}>دخول الشريك المالي</h2>
        {error && <div className="error-box">{error}</div>}
        <div className="fld">
          <label>البريد الإلكتروني</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="fld">
          <label>كلمة المرور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <button className="btn-primary" onClick={submit}>دخول</button>
      </div>
    </div>
  );
}

export default function FinancialPartnerPage() {
  const { user, accessToken } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const isPartner = user?.roles.includes("financial_partner");

  useEffect(() => {
    if (!isPartner || !accessToken) return;
    api.get<{ items: Transaction[] }>("/financial-partner/transactions", accessToken).then((res) => setTransactions(res.items)).catch(() => {});
  }, [isPartner, accessToken]);

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>بوابة الشريك المالي</h1>
          <p>New — external investor/lender portal</p>
        </div>
        <LoginForm />
      </div>
    );
  }
  if (!isPartner) {
    return (
      <div>
        <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذا الحساب ليس شريكًا ماليًا مسجّلًا
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dash-wrap">
        <div className="sidebar">
        <div className="sb-logo">
          <div className="sb-name">
            EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span>
          </div>
          <div className="sb-role">Financial Partner</div>
        </div>
        <div className="sb-sect">حسابي</div>
        <div className="slink active">استثماراتي</div>
      </div>
      <div className="dash-main" dir="rtl">
        <div className="dash-hdr">
          <h2>معاملاتي المالية</h2>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td>
                    {Number(t.amount).toLocaleString()} {t.currency}
                  </td>
                  <td>
                    <span className={`badge ${t.status === "CONFIRMED" ? "ba" : "bp"}`}>{t.status}</span>
                  </td>
                  <td>{new Date(t.occurredAt).toLocaleDateString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}
