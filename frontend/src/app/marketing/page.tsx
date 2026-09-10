"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api, ApiClientError } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface ReadyUnit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  property: { address: string; city: { nameAr: string } | null };
}
interface AdRow {
  id: string;
  title: string;
  status: string;
  slug: string;
  createdAt: string;
  unit: { unitNumber: string; property: { city: { nameAr: string } | null } };
  campaign: { id: string; name: string } | null;
}
interface CampaignRow {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  _count?: { advertisements: number };
}

const AD_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bp", PENDING_REVIEW: "bp", PUBLISHED: "ba", PAUSED: "br", EXPIRED: "br", REJECTED: "br",
};
const AD_STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة", PENDING_REVIEW: "بانتظار المراجعة", PUBLISHED: "منشور", PAUSED: "موقوف", EXPIRED: "منتهي", REJECTED: "مرفوض",
};
const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة", ACTIVE: "نشطة", PAUSED: "موقوفة", ENDED: "منتهية",
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
        <h2 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 14 }}>تسجيل دخول مدير التسويق</h2>
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

type Tab = "ready" | "ads" | "campaigns";

export default function MarketingDashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("ready");
  const [error, setError] = useState<string | null>(null);

  const [readyUnits, setReadyUnits] = useState<ReadyUnit[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  const [newAdTitle, setNewAdTitle] = useState("");
  const [creatingForUnit, setCreatingForUnit] = useState<string | null>(null);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignStart, setNewCampaignStart] = useState("");

  const isMarketing = user?.roles.some((r) => ["marketing_manager", "admin", "super_admin"].includes(r));

  async function loadReadyUnits() {
    if (!accessToken) return;
    const res = await api.get<{ items: ReadyUnit[] }>("/advertisements/ready-for-marketing", accessToken);
    setReadyUnits(res.items);
  }
  async function loadAds() {
    if (!accessToken) return;
    const res = await api.get<{ items: AdRow[] }>("/advertisements", accessToken);
    setAds(res.items);
  }
  async function loadCampaigns() {
    if (!accessToken) return;
    const res = await api.get<{ items: CampaignRow[] }>("/campaigns", accessToken);
    setCampaigns(res.items);
  }

  useEffect(() => {
    if (!isMarketing || !accessToken) return;
    if (tab === "ready") loadReadyUnits().catch(() => setError("تعذر تحميل الوحدات"));
    if (tab === "ads") loadAds().catch(() => setError("تعذر تحميل الإعلانات"));
    if (tab === "campaigns") loadCampaigns().catch(() => setError("تعذر تحميل الحملات"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMarketing, accessToken, tab]);

  async function createAd(unitId: string) {
    if (!accessToken || !newAdTitle.trim()) return;
    setError(null);
    try {
      await api.post("/advertisements", { unitId, title: newAdTitle.trim() }, accessToken);
      setNewAdTitle("");
      setCreatingForUnit(null);
      await loadReadyUnits();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إنشاء الإعلان");
    }
  }

  async function adAction(id: string, action: string) {
    if (!accessToken) return;
    setError(null);
    try {
      await api.patch(`/advertisements/${id}/review`, { action }, accessToken);
      await loadAds();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  async function createCampaign() {
    if (!accessToken || !newCampaignName.trim() || !newCampaignStart) return;
    setError(null);
    try {
      await api.post("/campaigns", { name: newCampaignName.trim(), startDate: newCampaignStart }, accessToken);
      setNewCampaignName("");
      setNewCampaignStart("");
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إنشاء الحملة");
    }
  }

  async function campaignAction(id: string, action: string) {
    if (!accessToken) return;
    setError(null);
    try {
      await api.patch(`/campaigns/${id}/transition`, { action }, accessToken);
      await loadCampaigns();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>لوحة التسويق</h1>
          <p>سجّل الدخول لإدارة الإعلانات والحملات</p>
        </div>
        <LoginForm />
        <Footer />
      </div>
    );
  }

  if (!isMarketing) {
    return (
      <div>
        <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>🔒 هذا الحساب ليس حساب مدير تسويق</div>
        <Footer />
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
            <div className="sb-role">Marketing Dashboard</div>
          </div>
          <div className="sb-sect">التسويق</div>
          <div className={`slink${tab === "ready" ? " active" : ""}`} onClick={() => setTab("ready")}>وحدات جاهزة للتسويق</div>
          <div className={`slink${tab === "ads" ? " active" : ""}`} onClick={() => setTab("ads")}>الإعلانات</div>
          <div className={`slink${tab === "campaigns" ? " active" : ""}`} onClick={() => setTab("campaigns")}>الحملات</div>
        </div>
        <div className="dash-main" dir="rtl">
          <div className="dash-hdr">
            <h2>
              {tab === "ready" && "وحدات جاهزة للتسويق"}
              {tab === "ads" && "الإعلانات"}
              {tab === "campaigns" && "الحملات"}
            </h2>
            <div className="user-pill">
              <div className="user-av">{user.fullName?.[0] ?? "M"}</div>
              <button className="ab-btn m" onClick={logout}>خروج</button>
            </div>
          </div>

          {error && <div className="error-box">{error}</div>}

          {tab === "ready" && (
            <div className="data-table">
              <table>
                <thead><tr><th>الوحدة</th><th>الموقع</th><th>إجراء</th></tr></thead>
                <tbody>
                  {readyUnits.map((u) => (
                    <tr key={u.id}>
                      <td>{u.unitNumber} ({u.bedrooms} غرف)</td>
                      <td>{u.property.city?.nameAr ?? u.property.address}</td>
                      <td>
                        {creatingForUnit === u.id ? (
                          <>
                            <input
                              value={newAdTitle}
                              onChange={(e) => setNewAdTitle(e.target.value)}
                              placeholder="عنوان الإعلان"
                              style={{ width: 160, marginInlineEnd: 6 }}
                            />
                            <button className="ab-btn g" onClick={() => createAd(u.id)}>حفظ</button>{" "}
                            <button className="ab-btn m" onClick={() => setCreatingForUnit(null)}>إلغاء</button>
                          </>
                        ) : (
                          <button className="ab-btn g" onClick={() => setCreatingForUnit(u.id)}>+ إنشاء إعلان</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {readyUnits.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد وحدات جاهزة للتسويق حاليًا</p>}
            </div>
          )}

          {tab === "ads" && (
            <div className="data-table">
              <table>
                <thead><tr><th>العنوان</th><th>الوحدة</th><th>الحملة</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id}>
                      <td>{ad.title}</td>
                      <td>{ad.unit.unitNumber} — {ad.unit.property.city?.nameAr ?? "—"}</td>
                      <td>{ad.campaign?.name ?? "—"}</td>
                      <td><span className={`badge ${AD_STATUS_BADGE[ad.status] ?? "bp"}`}>{AD_STATUS_LABEL[ad.status] ?? ad.status}</span></td>
                      <td>
                        {ad.status === "DRAFT" && <button className="ab-btn g" onClick={() => adAction(ad.id, "submit_for_review")}>إرسال للمراجعة</button>}
                        {ad.status === "PENDING_REVIEW" && (
                          <>
                            <button className="ab-btn g" onClick={() => adAction(ad.id, "publish")}>نشر</button>{" "}
                            <button className="ab-btn m" onClick={() => adAction(ad.id, "reject")}>رفض</button>
                          </>
                        )}
                        {ad.status === "PUBLISHED" && <button className="ab-btn m" onClick={() => adAction(ad.id, "pause")}>إيقاف مؤقت</button>}
                        {ad.status === "PAUSED" && <button className="ab-btn g" onClick={() => adAction(ad.id, "resume")}>استئناف</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ads.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد إعلانات بعد</p>}
            </div>
          )}

          {tab === "campaigns" && (
            <>
              <div className="form-card" style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 10 }}>حملة جديدة</h3>
                <div className="fld">
                  <label>اسم الحملة</label>
                  <input value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} />
                </div>
                <div className="fld">
                  <label>تاريخ البدء</label>
                  <input type="date" value={newCampaignStart} onChange={(e) => setNewCampaignStart(e.target.value)} />
                </div>
                <button className="btn-primary" disabled={!newCampaignName.trim() || !newCampaignStart} onClick={createCampaign}>
                  إنشاء
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead><tr><th>الاسم</th><th>البداية</th><th>الإعلانات</th><th>الحالة</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{new Date(c.startDate).toLocaleDateString("ar-EG")}</td>
                        <td>{c._count?.advertisements ?? 0}</td>
                        <td>{CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}</td>
                        <td>
                          {c.status === "DRAFT" && <button className="ab-btn g" onClick={() => campaignAction(c.id, "activate")}>تفعيل</button>}
                          {c.status === "ACTIVE" && (
                            <>
                              <button className="ab-btn m" onClick={() => campaignAction(c.id, "pause")}>إيقاف مؤقت</button>{" "}
                              <button className="ab-btn m" onClick={() => campaignAction(c.id, "end")}>إنهاء</button>
                            </>
                          )}
                          {c.status === "PAUSED" && (
                            <>
                              <button className="ab-btn g" onClick={() => campaignAction(c.id, "resume")}>استئناف</button>{" "}
                              <button className="ab-btn m" onClick={() => campaignAction(c.id, "end")}>إنهاء</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {campaigns.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد حملات بعد</p>}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
