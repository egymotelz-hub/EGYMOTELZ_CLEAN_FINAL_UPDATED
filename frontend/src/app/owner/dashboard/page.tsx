"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api, ApiClientError } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";

interface DocumentRow {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}
interface OwnerApplicationDetail {
  id: string;
  status: string;
  address: string;
  floorCount: number;
  unitCount: number;
  city?: { nameAr: string; nameEn: string };
  district?: { nameAr: string; nameEn: string } | null;
  districtFreeText?: string | null;
  documents: DocumentRow[];
}

const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "صورة البطاقة الشخصية",
  PROOF_OF_OWNERSHIP: "عقد الملكية",
  OTHER: "مستندات إضافية",
};
const DOC_STATUS_LABEL: Record<string, string> = { PENDING: "قيد المراجعة", VERIFIED: "تم التحقق ✓", REJECTED: "مرفوض" };
const APPLICATION_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "بانتظار المراجعة",
  UNDER_REVIEW: "قيد المراجعة",
  DOCS_REQUESTED: "مطلوب مستندات إضافية",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
};

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-wrap">
      <div className="form-card">
        <h2 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 14 }}>تسجيل دخول المالك</h2>
        {error && <div className="error-box">{error}</div>}
        <div className="fld">
          <label>البريد الإلكتروني</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="fld">
          <label>كلمة المرور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <button className="btn-primary" disabled={loading} onClick={submit}>
          {loading ? "..." : "دخول"}
        </button>
      </div>
    </div>
  );
}

interface OwnerReferral {
  partner: { companyName: string };
  ownerLifecycleStage: string;
}

// Priority 8: reuses the existing GET /partner-referrals/me/owner —
// returns null for the (common) case of no referral, never another
// owner's referral.
function ReferralBanner({ accessToken }: { accessToken: string }) {
  const [referral, setReferral] = useState<OwnerReferral | null>(null);

  useEffect(() => {
    api
      .get<OwnerReferral | null>("/partner-referrals/me/owner", accessToken)
      .then(setReferral)
      .catch(() => {});
  }, [accessToken]);

  if (!referral) return null;
  return (
    <div className="disc-box" style={{ marginBottom: 16 }}>
      تم ترشيحك بواسطة الشريك: <strong>{referral.partner.companyName}</strong>
    </div>
  );
}

const MAINT_STATUS_LABEL: Record<string, string> = {
  OPEN: "بانتظار التعيين", ASSIGNED: "تم التعيين", ACCEPTED: "تم القبول", IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "تم التنفيذ — بانتظار التأكيد", CONFIRMED: "تم التأكيد", CLOSED: "مغلق", CANCELLED: "ملغي",
};

interface MaintenanceRequestRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  unit: { unitNumber: string; property: { city: { nameAr: string } | null } };
  partner: { companyName: string } | null;
}

// Priority 9: reuses the existing MaintenanceRequest model (linked to
// SupportTicket, no second ticketing system) via GET/POST /maintenance.
function MaintenanceSection({ accessToken }: { accessToken: string }) {
  const [requests, setRequests] = useState<MaintenanceRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function load() {
    api
      .get<{ items: MaintenanceRequestRow[] }>("/maintenance/mine", accessToken)
      .then((res) => setRequests(res.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "تعذر تحميل طلبات الصيانة"));
  }

  useEffect(load, [accessToken]);

  async function submit() {
    setError(null);
    try {
      await api.post("/maintenance", { unitId, title, description: description || undefined }, accessToken);
      setUnitId("");
      setTitle("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إنشاء طلب الصيانة");
    }
  }

  async function confirmDone(id: string) {
    setError(null);
    try {
      await api.patch(`/maintenance/${id}/transition`, { action: "confirm" }, accessToken);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل التأكيد");
    }
  }

  return (
    <div>
      {error && <div className="error-box">{error}</div>}
      <div style={{ marginBottom: 16 }}>
        <button className="ab-btn g" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "إلغاء" : "+ طلب صيانة جديد"}
        </button>
      </div>
      {showForm && (
        <div className="form-card" style={{ marginBottom: 20 }}>
          <div className="fld">
            <label>معرّف الوحدة (Unit ID)</label>
            <input value={unitId} onChange={(e) => setUnitId(e.target.value)} />
          </div>
          <div className="fld">
            <label>عنوان المشكلة</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="fld">
            <label>وصف (اختياري)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={!unitId || !title} onClick={submit}>إرسال</button>
        </div>
      )}
      <div className="data-table">
        <table>
          <thead><tr><th>العنوان</th><th>الوحدة</th><th>الشريك</th><th>الحالة</th><th>إجراء</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.unit.unitNumber} — {r.unit.property.city?.nameAr ?? "—"}</td>
                <td>{r.partner?.companyName ?? "—"}</td>
                <td><span className="badge bp">{MAINT_STATUS_LABEL[r.status] ?? r.status}</span></td>
                <td>{r.status === "COMPLETED" && <button className="ab-btn g" onClick={() => confirmDone(r.id)}>تأكيد الانتهاء</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات صيانة</p>}
      </div>
    </div>
  );
}

function DocumentsSection({ accessToken }: { accessToken: string }) {
  const [application, setApplication] = useState<OwnerApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "idle" | "uploading" | "error">>({});

  async function refresh() {
    try {
      const res = await api.get<{ application: OwnerApplicationDetail }>("/owner-applications/me", accessToken);
      setApplication(res.application);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات الطلب");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(type: "NATIONAL_ID" | "PROOF_OF_OWNERSHIP" | "OTHER", file: File) {
    if (!application) return;
    setUploadStatus((s) => ({ ...s, [type]: "uploading" }));
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);
      await api.postForm(`/owner-applications/${application.id}/documents`, body, accessToken);
      setUploadStatus((s) => ({ ...s, [type]: "idle" }));
      await refresh(); // pick up the newly-added document in the list
    } catch {
      setUploadStatus((s) => ({ ...s, [type]: "error" }));
    }
  }

  if (loadError) {
    return <div className="error-box">{loadError}</div>;
  }
  if (!application) {
    return <div className="disc-box">جاري تحميل بيانات طلبك...</div>;
  }

  const districtLabel = application.district?.nameAr ?? application.districtFreeText ?? "—";

  return (
    <div>
      <div className="metrics" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="metric">
          <div className="m-lbl">حالة الطلب</div>
          <div className="m-val" style={{ fontSize: 14 }}>{APPLICATION_STATUS_LABEL[application.status] ?? application.status}</div>
        </div>
        <div className="metric">
          <div className="m-lbl">الموقع</div>
          <div className="m-val" style={{ fontSize: 14 }}>{application.city?.nameAr ?? "—"} — {districtLabel}</div>
        </div>
        <div className="metric">
          <div className="m-lbl">عدد الوحدات</div>
          <div className="m-val">{application.unitCount}</div>
        </div>
      </div>

      <h3 style={{ fontFamily: "var(--fnar)", color: "var(--g)", margin: "18px 0 10px" }}>رفع المستندات</h3>
      {(["NATIONAL_ID", "PROOF_OF_OWNERSHIP", "OTHER"] as const).map((type) => {
        const existing = application.documents.filter((d) => d.type === type);
        return (
          <div key={type} style={{ marginBottom: 14 }}>
            <label className="upload-zone" style={{ display: "block" }}>
              <span className="uz-icon">📄</span>
              <p>
                {DOC_LABELS[type]} —{" "}
                {uploadStatus[type] === "uploading" ? "جاري الرفع..." : uploadStatus[type] === "error" ? "فشل الرفع، حاول مرة أخرى" : "اضغط للرفع"}
              </p>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleUpload(type, e.target.files[0])}
              />
            </label>
            {existing.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--mut)", fontFamily: "var(--fnar)", paddingInlineStart: 4 }}>
                {existing.map((d) => (
                  <div key={d.id}>
                    {new Date(d.createdAt).toLocaleDateString("ar-EG")} — <span className={`badge ${d.status === "VERIFIED" ? "ba" : d.status === "REJECTED" ? "br" : "bp"}`}>{DOC_STATUS_LABEL[d.status] ?? d.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CalculatorSection() {
  const [units, setUnits] = useState(5);
  const [rate, setRate] = useState(1200);
  const [occupancy, setOccupancy] = useState(72);
  const [commission, setCommission] = useState(20);
  // Item 8: Finishing Cost is now a distinct input from Furnishing Cost,
  // both feeding into "Expected Investment" — average Egyptian market
  // ranges used as defaults/bounds.
  const [finishingCost, setFinishingCost] = useState(300_000);
  const [furnishingCost, setFurnishingCost] = useState(400_000);

  // Formula preserved exactly as it existed on the standalone /calc page —
  // only additive outputs were introduced (expectedInvestment, roi), per
  // Item 8's explicit ask, nothing existing was changed.
  const results = useMemo(() => {
    const gross = Math.round(units * rate * 30 * (occupancy / 100));
    const motelRevenue = Math.round(gross * (commission / 100)); // Estimated Motel Revenue
    const ownerRevenue = gross - motelRevenue; // Estimated Owner Revenue / Expected Monthly Income
    const annual = ownerRevenue * 12;
    const expectedInvestment = finishingCost + furnishingCost;
    const estimatedRoi = expectedInvestment > 0 ? (annual / expectedInvestment) * 100 : 0;
    const paybackMonths = ownerRevenue > 0 && expectedInvestment > 0 ? Math.ceil(expectedInvestment / ownerRevenue) : 0;
    return { gross, motelRevenue, ownerRevenue, annual, expectedInvestment, estimatedRoi, paybackMonths };
  }, [units, rate, occupancy, commission, finishingCost, furnishingCost]);

  return (
    <div className="calc-card" style={{ border: "0.5px solid rgba(0,0,0,0.07)", borderRadius: 14, padding: 24 }}>
      <h3 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 16 }}>حاسبة الاستثمار المتوقع</h3>

      <div className="sblk">
        <div className="sr"><label>عدد الوحدات</label><span className="sv">{units} وحدة</span></div>
        <input type="range" min={1} max={50} value={units} onChange={(e) => setUnits(Number(e.target.value))} />
      </div>
      <div className="sblk">
        <div className="sr"><label>متوسط سعر الليلة</label><span className="sv">{rate.toLocaleString()} ج</span></div>
        <input type="range" min={300} max={3000} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
      </div>
      <div className="sblk">
        <div className="sr"><label>نسبة الإشغال المتوقعة</label><span className="sv">{occupancy}%</span></div>
        <input type="range" min={20} max={100} value={occupancy} onChange={(e) => setOccupancy(Number(e.target.value))} />
      </div>
      <div className="sblk">
        <div className="sr"><label>نسبة عمولة إيجي موتيلز</label><span className="sv">{commission}%</span></div>
        <input type="range" min={10} max={35} value={commission} onChange={(e) => setCommission(Number(e.target.value))} />
      </div>
      <div className="sblk">
        <div className="sr"><label>تكلفة التشطيب</label><span className="sv">{finishingCost.toLocaleString()} ج</span></div>
        <input type="range" min={0} max={1_500_000} step={25_000} value={finishingCost} onChange={(e) => setFinishingCost(Number(e.target.value))} />
      </div>
      <div className="sblk">
        <div className="sr"><label>تكلفة التأثيث</label><span className="sv">{furnishingCost.toLocaleString()} ج</span></div>
        <input type="range" min={0} max={2_000_000} step={50_000} value={furnishingCost} onChange={(e) => setFurnishingCost(Number(e.target.value))} />
      </div>

      <div className="results">
        <div className="rr"><label>الاستثمار المتوقع (تشطيب + تأثيث)</label><span className="rv">{results.expectedInvestment.toLocaleString()} ج</span></div>
        <div className="rr"><label>الإيراد الإجمالي الشهري</label><span className="rv">{results.gross.toLocaleString()} ج</span></div>
        <div className="rr comm"><label style={{ color: "#dc2626" }}>الإيراد المقدر لموتيلز</label><span className="rv comm">({results.motelRevenue.toLocaleString()} ج)</span></div>
        <div className="rr total"><label>الدخل الشهري المتوقع للمالك</label><span className="rv">{results.ownerRevenue.toLocaleString()} ج</span></div>
        <div className="rr" style={{ border: "none", paddingTop: 9 }}>
          <label style={{ fontWeight: 600, color: "var(--g)" }}>الدخل السنوي المتوقع</label>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{results.annual.toLocaleString()} ج</span>
        </div>
        <div className="rr" style={{ border: "none" }}>
          <label>العائد على الاستثمار المقدر (ROI)</label>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g)" }}>{results.estimatedRoi.toFixed(1)}%</span>
        </div>
        <div className="rr" style={{ border: "none" }}>
          <label>مدة استرداد الاستثمار المقدرة</label>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4E9B93" }}>{results.paybackMonths > 0 ? `${results.paybackMonths} شهر` : "—"}</span>
        </div>
      </div>
      <div className="disc-box" style={{ marginTop: 12 }}>
        الأرقام تقديرية بناءً على متوسط أسعار السوق المصري ولا تمثل ضمانًا لعائد فعلي.
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const [tab, setTab] = useState<"documents" | "calculator" | "maintenance">("documents");
  const isOwner = user?.roles.some((r) => ["owner", "admin", "super_admin"].includes(r));

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>لوحة تحكم المالك</h1>
          <p>سجّل الدخول لمتابعة طلبك ورفع مستنداتك</p>
        </div>
        <LoginForm />
      </div>
    );
  }
  if (!isOwner) {
    return (
      <div>
        <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذا الحساب ليس حساب مالك عقار
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
          <div className="sb-name">EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span></div>
          <div className="sb-role">Owner Dashboard</div>
        </div>
        <div className="sb-sect">حسابي</div>
        <div className={`slink${tab === "documents" ? " active" : ""}`} onClick={() => setTab("documents")}>
          طلبي ومستنداتي
        </div>
        <div className={`slink${tab === "calculator" ? " active" : ""}`} onClick={() => setTab("calculator")}>
          حاسبة الاستثمار
        </div>
        <div className={`slink${tab === "maintenance" ? " active" : ""}`} onClick={() => setTab("maintenance")}>
          طلبات الصيانة
        </div>
      </div>
      <div className="dash-main" dir="rtl">
        <div className="dash-hdr">
          <h2>{tab === "documents" ? "طلبي ومستنداتي" : tab === "calculator" ? "حاسبة الاستثمار" : "طلبات الصيانة"}</h2>
          <div className="user-pill">
            <div className="user-av">{user.fullName?.[0] ?? "M"}</div>
            <button className="ab-btn m" onClick={logout}>خروج</button>
          </div>
        </div>
        {tab === "documents" && accessToken && (
          <>
            <ReferralBanner accessToken={accessToken} />
            <DocumentsSection accessToken={accessToken} />
          </>
        )}
        {tab === "calculator" && <CalculatorSection />}
        {tab === "maintenance" && accessToken && <MaintenanceSection accessToken={accessToken} />}
      </div>
      </div>
    </>
  );
}
