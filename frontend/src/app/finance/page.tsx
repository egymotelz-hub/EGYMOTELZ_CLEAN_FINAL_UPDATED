"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/apiClient";

interface Summary {
  totalRevenue: number;
  totalPayouts: number;
  totalCommission: number;
}
interface Transaction {
  id: string;
  type: string;
  amount: string;
  method: string;
  status: string;
  occurredAt: string;
}

export default function FinancePage() {
  const { user, accessToken } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const isFinance = user?.roles.some((r) => r === "finance_staff" || r === "super_admin");

  useEffect(() => {
    if (!isFinance || !accessToken) return;
    api.get<Summary>("/finance/summary", accessToken).then(setSummary).catch(() => {});
    api
      .get<{ items: Transaction[] }>("/finance/transactions", accessToken)
      .then((res) => setTransactions(res.items))
      .catch(() => {});
  }, [isFinance, accessToken]);

  if (!user) {
    return (
      <div className="screen active" id="sc-finance">
      <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 سجّل الدخول من لوحة الإدارة أولًا للوصول للبوابة المالية
        </div>
      </div>
    );
  }
  if (!isFinance) {
    return (
      <div className="screen active" id="sc-finance">
      <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذا الحساب لا يملك صلاحيات الوصول للبوابة المالية
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="sc-finance">
      <Navbar />
      <div className="dash-wrap">
        <div className="sidebar">
          <div className="sb-logo">
            <div className="sb-name">
              EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span>
            </div>
            <div className="sb-role">Finance Portal</div>
          </div>
          <div className="sb-sect">المالية — داخلي</div>
          <div className="slink active">نظرة عامة</div>
          <div className="slink">دفعات الملاك</div>
          <div className="slink">العمولات</div>
          <div className="slink">التقارير</div>
        </div>
        <div className="dash-main" dir="rtl">
          <div className="dash-hdr">
            <h2>البوابة المالية</h2>
            <span className="int-badge" style={{ fontSize: 10, padding: "4px 10px" }}>
              🔒 داخلي
            </span>
          </div>
          <div className="int-warn">🔒 هذه البوابة غير مرئية للعملاء أو الملاك</div>

          <div className="metrics">
            <div className="metric">
              <div className="m-lbl">إجمالي الإيراد الشهري</div>
              <div className="m-val">{summary ? Number(summary.totalRevenue).toLocaleString() : "—"} ج</div>
            </div>
            <div className="metric">
              <div className="m-lbl">مدفوعات الملاك</div>
              <div className="m-val">{summary ? Number(summary.totalPayouts).toLocaleString() : "—"} ج</div>
            </div>
            <div className="metric">
              <div className="m-lbl">عمولة EGYMOTELZ</div>
              <div className="m-val">{summary ? Number(summary.totalCommission).toLocaleString() : "—"} ج</div>
            </div>
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>طريقة الدفع</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.type}</td>
                    <td>{Number(t.amount).toLocaleString()} ج</td>
                    <td>{t.method}</td>
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
    </div>
  );
}
