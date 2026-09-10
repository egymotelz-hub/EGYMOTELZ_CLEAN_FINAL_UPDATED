"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api, ApiClientError } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { PARTNER_TYPE_LABELS } from "@/lib/validation/partnerRegistration.schema";
import { OffersSection } from "@/components/partner/OffersSection";
import { GroupReservationsSection } from "@/components/partner/GroupReservationsSection";

interface PartnerDocument {
  id: string;
  type: string;
  status: string;
  createdAt: string;
}
interface PartnerService {
  id: string;
  serviceType: string;
}
interface PartnerProfile {
  id: string;
  companyName: string;
  legalName: string | null;
  partnerType: string;
  verificationStatus: string;
  partnerCode: string | null;
  phone: string;
  whatsappNumber: string | null;
  email: string;
  website: string | null;
  address: string | null;
  createdAt: string;
  services: PartnerService[];
  documents: PartnerDocument[];
  city: { nameAr: string; nameEn: string } | null;
  agreementAcceptances?: { id: string; agreementType: string; version: string; acceptedAt: string }[];
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: "bp", UNDER_REVIEW: "bp", APPROVED: "ba", REJECTED: "br", SUSPENDED: "br", INACTIVE: "br",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "بانتظار المراجعة", UNDER_REVIEW: "قيد المراجعة", APPROVED: "معتمد",
  REJECTED: "مرفوض", SUSPENDED: "موقوف", INACTIVE: "غير نشط",
};

interface PartnerUnit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  status: string;
  createdAt: string;
  property: {
    address: string;
    city: { nameAr: string } | null;
    district: { nameAr: string } | null;
  };
}

interface PartnerReferral {
  id: string;
  referralCode: string;
  ownerLifecycleStage: string;
  createdAt: string;
  owner: { userId: string } | null;
}

const LIFECYCLE_LABEL: Record<string, string> = {
  REFERRED: "تمت الإحالة", REGISTERED: "تم التسجيل", VERIFIED: "تم التحقق",
  PROPERTY_SUBMITTED: "تم إرسال عقار", PROPERTY_APPROVED: "تم اعتماد العقار",
  UNIT_APPROVED: "تم اعتماد الوحدة", ACTIVE: "نشط",
};

interface PartnerMaintenanceRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  unit: { unitNumber: string; property: { city: { nameAr: string } | null } };
}

const MAINT_STATUS_LABEL: Record<string, string> = {
  OPEN: "بانتظار التعيين", ASSIGNED: "بانتظار القبول", ACCEPTED: "تم القبول", IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "بانتظار تأكيد المالك", CONFIRMED: "تم التأكيد", CLOSED: "مغلق", CANCELLED: "ملغي",
};


const UNIT_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bp", SUBMITTED: "bp", UNDER_REVIEW: "bp",
  SITE_VISIT_REQUIRED: "bp", SITE_VISIT_COMPLETED: "bp",
  REJECTED: "br", NOT_READY: "bp", READY: "ba", PUBLISHED: "ba", INACTIVE: "br",
};
const UNIT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة", SUBMITTED: "تم الإرسال — بانتظار المراجعة", UNDER_REVIEW: "قيد المراجعة",
  SITE_VISIT_REQUIRED: "بانتظار زيارة الموقع", SITE_VISIT_COMPLETED: "تمت زيارة الموقع — بانتظار الاعتماد النهائي",
  REJECTED: "مرفوضة", NOT_READY: "غير جاهزة", READY: "جاهزة (بانتظار النشر)", PUBLISHED: "منشورة", INACTIVE: "غير نشطة",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL_BUILDING: "مبنى سكني", VILLA: "فيلا", FULL_FLOOR: "دور كامل", APARTMENT: "شقة",
};

function RegisterUnitForm({ accessToken, onRegistered }: { accessToken: string; onRegistered: () => void }) {
  const { cities, loading: geoLoading } = useGeoData();
  const governorates = deriveGovernorates(cities);
  const [governorateId, setGovernorateId] = useState("");
  const citiesInGovernorate = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : [];

  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState("");
  const [floorCount, setFloorCount] = useState(1);
  const [unitNumber, setUnitNumber] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [areaSqm, setAreaSqm] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        "/units",
        {
          propertyType,
          cityId,
          address,
          floorCount,
          unitNumber,
          bedrooms,
          bathrooms,
          areaSqm: areaSqm ? Number(areaSqm) : undefined,
          description: description || undefined,
        },
        accessToken
      );
      onRegistered();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل تسجيل الوحدة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 10 }}>تسجيل وحدة جديدة</h3>
      {error && <div className="error-box">{error}</div>}

      <div className="fld">
        <label>نوع العقار</label>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="fld">
        <label>المحافظة</label>
        <SearchableSelect
          options={governorates.map((g) => ({ value: g.id, label: g.nameAr }))}
          value={governorateId}
          onChange={(v) => { setGovernorateId(v); setCityId(""); }}
          placeholder="اختر المحافظة"
          disabled={geoLoading}
        />
      </div>
      <div className="fld">
        <label>المدينة</label>
        <SearchableSelect
          options={citiesInGovernorate.map((c) => ({ value: c.id, label: c.nameAr }))}
          value={cityId}
          onChange={setCityId}
          placeholder="اختر المدينة"
          disabled={!governorateId}
        />
      </div>
      <div className="fld">
        <label>العنوان</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="fld">
        <label>عدد الأدوار</label>
        <input type="number" min={1} value={floorCount} onChange={(e) => setFloorCount(Number(e.target.value))} />
      </div>
      <div className="fld">
        <label>رقم/اسم الوحدة</label>
        <input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
      </div>
      <div className="fld">
        <label>عدد غرف النوم</label>
        <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} />
      </div>
      <div className="fld">
        <label>عدد الحمامات</label>
        <input type="number" min={1} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} />
      </div>
      <div className="fld">
        <label>المساحة (م²)</label>
        <input type="number" min={1} value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
      </div>
      <div className="fld">
        <label>وصف مختصر</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <button
        className="btn-primary"
        disabled={submitting || !cityId || !address || !unitNumber}
        onClick={submit}
      >
        {submitting ? "..." : "إرسال للمراجعة"}
      </button>
    </div>
  );
}


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
        <h2 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 14 }}>تسجيل دخول الشريك</h2>
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

type Tab = "overview" | "profile" | "units" | "offers" | "groups" | "referrals" | "maintenance" | "status";

export default function PartnerDashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [units, setUnits] = useState<PartnerUnit[]>([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [referrals, setReferrals] = useState<PartnerReferral[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<PartnerMaintenanceRow[]>([]);

  // Matches the role key assigned in backend/src/services/partners.service.ts's
  // submit() (tx.role.findUnique({ where: { key: "partner" } })).
  const isPartner = user?.roles.some((r) => ["partner", "admin", "super_admin"].includes(r));

  useEffect(() => {
    if (!user || !accessToken || !isPartner) return;
    // Reuses the existing GET /partners/me endpoint — returns only the
    // caller's own Partner record (partnersService.getByUserId(req.user.id)).
    api
      .get<PartnerProfile>("/partners/me", accessToken)
      .then(setPartner)
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات الشريك"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken, isPartner]);

  function loadUnits() {
    if (!accessToken) return;
    // GET /units/mine — server derives the Partner from the authenticated user;
    // never returns another Partner's units.
    api
      .get<{ items: PartnerUnit[] }>("/units/mine", accessToken)
      .then((res) => setUnits(res.items))
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل الوحدات"));
  }

  useEffect(() => {
    // Task 7: Overview needs unit counts too, not just the Units tab.
    if (!accessToken || !isPartner || (tab !== "units" && tab !== "overview")) return;
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isPartner, tab]);

  useEffect(() => {
    if (!accessToken || !isPartner || tab !== "referrals") return;
    // Reuses the existing GET /partner-referrals/me/partner — own referrals only.
    api
      .get<{ items: PartnerReferral[] }>("/partner-referrals/me/partner", accessToken)
      .then((res) => setReferrals(res.items))
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل الترشيحات"));
  }, [accessToken, isPartner, tab]);

  function loadMaintenanceRequests() {
    if (!accessToken) return;
    // Reuses the existing GET /maintenance/assigned-to-me — own assigned requests only.
    api
      .get<{ items: PartnerMaintenanceRow[] }>("/maintenance/assigned-to-me", accessToken)
      .then((res) => setMaintenanceRequests(res.items))
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل طلبات الصيانة"));
  }

  useEffect(() => {
    if (!accessToken || !isPartner || tab !== "maintenance") return;
    loadMaintenanceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isPartner, tab]);

  async function maintenanceAction(id: string, action: string) {
    if (!accessToken) return;
    try {
      await api.patch(`/maintenance/${id}/transition`, { action }, accessToken);
      loadMaintenanceRequests();
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>لوحة تحكم الشريك</h1>
          <p>سجّل الدخول لمتابعة حالة شراكتك</p>
        </div>
        <LoginForm />
        <Footer />
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div>
        <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذا الحساب ليس حساب شريك
        </div>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Navbar />
        <div className="error-box" style={{ margin: 24 }}>{loadError}</div>
        <Footer />
      </div>
    );
  }

  const statusBadge = partner ? (STATUS_BADGE[partner.verificationStatus] ?? "bp") : "bp";
  const statusLabel = partner ? (STATUS_LABEL[partner.verificationStatus] ?? partner.verificationStatus) : "—";

  return (
    <>
      <Navbar />
      <div className="dash-wrap">
        <div className="sidebar">
          <div className="sb-logo">
            <div className="sb-name">EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span></div>
            <div className="sb-role">Partner Dashboard</div>
          </div>
          <div className="sb-sect">حسابي</div>
          <div className={`slink${tab === "overview" ? " active" : ""}`} onClick={() => setTab("overview")}>نظرة عامة</div>
          <div className={`slink${tab === "profile" ? " active" : ""}`} onClick={() => setTab("profile")}>بيانات الشركة</div>
          <div className={`slink${tab === "units" ? " active" : ""}`} onClick={() => setTab("units")}>وحداتي</div>
          <div className={`slink${tab === "offers" ? " active" : ""}`} onClick={() => setTab("offers")}>عروضي (جولات وتجارب)</div>
          <div className={`slink${tab === "groups" ? " active" : ""}`} onClick={() => setTab("groups")}>حجوزات جماعية / شركات</div>
          <div className={`slink${tab === "referrals" ? " active" : ""}`} onClick={() => setTab("referrals")}>الترشيحات</div>
          <div className={`slink${tab === "maintenance" ? " active" : ""}`} onClick={() => setTab("maintenance")}>طلبات الصيانة</div>
          <div className={`slink${tab === "status" ? " active" : ""}`} onClick={() => setTab("status")}>حالة التوثيق</div>
        </div>
        <div className="dash-main" dir="rtl">
          <div className="dash-hdr">
            <h2>
              {tab === "overview" && "نظرة عامة"}
              {tab === "profile" && "بيانات الشركة"}
              {tab === "units" && "وحداتي"}
              {tab === "offers" && "عروضي (جولات وتجارب)"}
              {tab === "groups" && "حجوزات جماعية / شركات"}
              {tab === "referrals" && "الترشيحات"}
              {tab === "maintenance" && "طلبات الصيانة"}
              {tab === "status" && "حالة التوثيق"}
            </h2>
            <div className="user-pill">
              <div className="user-av">{user.fullName?.[0] ?? "P"}</div>
              <button className="ab-btn m" onClick={logout}>خروج</button>
            </div>
          </div>

          {!partner && <div className="disc-box">جاري تحميل بيانات الشريك...</div>}

          {partner && tab === "overview" && (
            <div className="metrics">
              <div className="metric">
                <div className="m-lbl">اسم الشركة</div>
                <div className="m-val" style={{ fontSize: 14 }}>{partner.companyName}</div>
              </div>
              <div className="metric">
                <div className="m-lbl">الفئة</div>
                <div className="m-val" style={{ fontSize: 14 }}>
                  {PARTNER_TYPE_LABELS[partner.partnerType as keyof typeof PARTNER_TYPE_LABELS] ?? partner.partnerType}
                </div>
              </div>
              <div className="metric">
                <div className="m-lbl">حالة التوثيق</div>
                <div className="m-val" style={{ fontSize: 14 }}>
                  <span className={`badge ${statusBadge}`}>{statusLabel}</span>
                </div>
              </div>
              <div className="metric">
                <div className="m-lbl">تاريخ التسجيل</div>
                <div className="m-val" style={{ fontSize: 14 }}>{new Date(partner.createdAt).toLocaleDateString("ar-EG")}</div>
              </div>
              <div className="metric">
                <div className="m-lbl">عدد الوحدات المسجّلة</div>
                <div className="m-val" style={{ fontSize: 14 }}>{units.length}</div>
              </div>
              <div className="metric">
                <div className="m-lbl">وحدات بانتظار المراجعة</div>
                <div className="m-val" style={{ fontSize: 14 }}>
                  {units.filter((u) => ["SUBMITTED", "UNDER_REVIEW", "SITE_VISIT_REQUIRED", "SITE_VISIT_COMPLETED"].includes(u.status)).length}
                </div>
              </div>
              <div className="metric">
                <div className="m-lbl">وحدات معتمدة</div>
                <div className="m-val" style={{ fontSize: 14 }}>{units.filter((u) => u.status === "READY" || u.status === "PUBLISHED").length}</div>
              </div>
              <div className="metric">
                <div className="m-lbl">بانتظار زيارة الموقع</div>
                <div className="m-val" style={{ fontSize: 14 }}>{units.filter((u) => u.status === "SITE_VISIT_REQUIRED").length}</div>
              </div>
              <div className="metric">
                <div className="m-lbl">زيارات مكتملة</div>
                <div className="m-val" style={{ fontSize: 14 }}>{units.filter((u) => u.status === "SITE_VISIT_COMPLETED" || u.status === "READY" || u.status === "PUBLISHED").length}</div>
              </div>
            </div>
          )}

          {partner && tab === "profile" && (
            <div className="form-card">
              <p><strong>اسم الشركة:</strong> {partner.companyName}</p>
              {partner.legalName && <p><strong>الاسم القانوني:</strong> {partner.legalName}</p>}
              <p><strong>الفئة:</strong> {PARTNER_TYPE_LABELS[partner.partnerType as keyof typeof PARTNER_TYPE_LABELS] ?? partner.partnerType}</p>
              <p><strong>الهاتف:</strong> {partner.phone}</p>
              {partner.whatsappNumber && <p><strong>واتساب:</strong> {partner.whatsappNumber}</p>}
              <p><strong>البريد الإلكتروني:</strong> {partner.email}</p>
              {partner.website && <p><strong>الموقع الإلكتروني:</strong> {partner.website}</p>}
              {partner.city && <p><strong>المدينة:</strong> {partner.city.nameAr}</p>}
              {partner.address && <p><strong>العنوان:</strong> {partner.address}</p>}
              {partner.services.length > 0 && (
                <p>
                  <strong>الخدمات:</strong>{" "}
                  {partner.services.map((s) => PARTNER_TYPE_LABELS[s.serviceType as keyof typeof PARTNER_TYPE_LABELS] ?? s.serviceType).join("، ")}
                </p>
              )}
            </div>
          )}

          {partner && tab === "units" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <button className="ab-btn g" onClick={() => setShowRegisterForm((v) => !v)}>
                  {showRegisterForm ? "إلغاء" : "+ تسجيل وحدة"}
                </button>
              </div>

              {showRegisterForm && accessToken && (
                <RegisterUnitForm
                  accessToken={accessToken}
                  onRegistered={() => {
                    setShowRegisterForm(false);
                    loadUnits();
                  }}
                />
              )}

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>الوحدة</th><th>المبنى/العقار</th><th>الموقع</th><th>الحالة</th><th>تاريخ الإرسال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u.id}>
                        <td>{u.unitNumber} ({u.bedrooms} غرف)</td>
                        <td>{u.property.address}</td>
                        <td>{u.property.district?.nameAr ?? u.property.city?.nameAr ?? "—"}</td>
                        <td><span className={`badge ${UNIT_STATUS_BADGE[u.status] ?? "bp"}`}>{UNIT_STATUS_LABEL[u.status] ?? u.status}</span></td>
                        <td>{new Date(u.createdAt).toLocaleDateString("ar-EG")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {units.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--mut)", padding: 24 }}>
                    لا توجد وحدات مسجّلة بعد.
                  </p>
                )}
              </div>
            </>
          )}

          {partner && tab === "offers" && accessToken && (
            <OffersSection accessToken={accessToken} />
          )}

          {partner && tab === "groups" && accessToken && (
            <GroupReservationsSection accessToken={accessToken} />
          )}

          {partner && tab === "referrals" && (
            <>
              {partner.partnerCode && (
                <div className="disc-box" style={{ marginBottom: 16 }}>
                  رابط الترشيح الخاص بك:{" "}
                  <strong>
                    {typeof window !== "undefined" ? window.location.origin : ""}/owners?partner={partner.partnerCode}
                  </strong>
                </div>
              )}
              <div className="data-table">
                <table>
                  <thead><tr><th>كود الترشيح</th><th>المرحلة</th><th>تاريخ الترشيح</th></tr></thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id}>
                        <td>{r.referralCode}</td>
                        <td><span className="badge bp">{LIFECYCLE_LABEL[r.ownerLifecycleStage] ?? r.ownerLifecycleStage}</span></td>
                        <td>{new Date(r.createdAt).toLocaleDateString("ar-EG")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {referrals.length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--mut)", padding: 24 }}>لا توجد ترشيحات بعد</p>
                )}
              </div>
            </>
          )}

          {partner && tab === "maintenance" && (
            <div className="data-table">
              <table>
                <thead><tr><th>العنوان</th><th>الوحدة</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {maintenanceRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.unit.unitNumber} — {r.unit.property.city?.nameAr ?? "—"}</td>
                      <td><span className="badge bp">{MAINT_STATUS_LABEL[r.status] ?? r.status}</span></td>
                      <td>
                        {r.status === "ASSIGNED" && <button className="ab-btn g" onClick={() => maintenanceAction(r.id, "accept")}>قبول</button>}
                        {r.status === "ACCEPTED" && <button className="ab-btn g" onClick={() => maintenanceAction(r.id, "start")}>بدء التنفيذ</button>}
                        {r.status === "IN_PROGRESS" && <button className="ab-btn g" onClick={() => maintenanceAction(r.id, "complete")}>إنهاء العمل</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {maintenanceRequests.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--mut)", padding: 24 }}>لا توجد طلبات صيانة مُسندة إليك</p>
              )}
            </div>
          )}

          {partner && tab === "status" && (
            <div className="form-card">
              <p>
                <strong>الحالة الحالية:</strong>{" "}
                <span className={`badge ${statusBadge}`}>{statusLabel}</span>
              </p>
              {partner.partnerCode && <p><strong>رمز الشريك:</strong> {partner.partnerCode}</p>}
              <h4 style={{ marginTop: 14, marginBottom: 6 }}>المستندات</h4>
              {partner.documents.length === 0 && <p style={{ color: "var(--mut)" }}>لا توجد مستندات مرفوعة</p>}
              <ul>
                {partner.documents.map((doc) => (
                  <li key={doc.id}>
                    {doc.type} —{" "}
                    <span className={`badge ${doc.status === "VERIFIED" ? "ba" : doc.status === "REJECTED" ? "br" : "bp"}`}>{doc.status}</span>
                  </li>
                ))}
              </ul>

              <h4 style={{ marginTop: 14, marginBottom: 6 }}>الموافقة على الاتفاقية</h4>
              {(partner.agreementAcceptances ?? []).length === 0 && (
                <p style={{ color: "var(--mut)" }}>لا يوجد سجل موافقة</p>
              )}
              {(partner.agreementAcceptances ?? []).map((a) => (
                <p key={a.id}>
                  تمت الموافقة على اتفاقية الشراكة (إصدار {a.version}) بتاريخ {new Date(a.acceptedAt).toLocaleDateString("ar-EG")}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
