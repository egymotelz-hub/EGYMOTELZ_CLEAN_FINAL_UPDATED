"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Navbar } from "@/components/Navbar";
import { api, ApiClientError } from "@/lib/apiClient";
import { PARTNER_TYPE_LABELS } from "@/lib/validation/partnerRegistration.schema";

interface Metrics {
  totalOwners: number;
  pendingApplications: number;
  activeBookings: number;
  managedUnits: number;
  activeUnits: number;
}

interface ApplicationRow {
  id: string;
  fullName: string;
  city: { nameAr: string } | null;
  district: { nameAr: string } | null;
  districtFreeText: string | null;
  status: string;
  submittedAt: string;
}

interface BookingRow {
  id: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guest: { fullName: string; phone: string };
  unit: { bedrooms: number; property: { city: { nameAr: string } | null } };
}

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roles: { role: { key: string; name: string } }[];
}

interface PartnerDocument {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  createdAt: string;
}

interface UnitReviewRow {
  id: string;
  unitNumber: string;
  bedrooms: number;
  status: string;
  createdAt: string;
  property: {
    address: string;
    city: { nameAr: string } | null;
    district: { nameAr: string } | null;
    submittedByPartner: { companyName: string } | null;
  };
  siteVisits: { id: string; status: string; completedAt: string | null; notes: string | null }[];
}

interface AdminQuoteRequestRow {
  id: string;
  eventType: string;
  preferredDate: string | null;
  guestCount: number;
  status: string;
  quotedPrice: string | null;
  contactName: string;
  contactPhone: string;
  offering: { nameAr: string; nameEn: string; id?: string };
  partner: { id: string; companyName: string } | null;
  createdAt: string;
}

interface CommissionRuleRow {
  id: string;
  partnerId: string | null;
  partner: { id: string; companyName: string } | null;
  offeringType: string | null;
  categoryId: string | null;
  bookingType: string | null;
  ruleType: string;
  percentageValue: string | null;
  fixedAmount: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GroupReservationRow {
  id: string;
  companyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  requestedUnitCount: number | null;
  requestedGuestCount: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  partner: { id: string; companyName: string; phone: string | null } | null;
  bookings: { id: string; checkIn: string; checkOut: string; guest: { fullName: string }; unit: { bedrooms: number } }[];
}

interface ReferralRow {
  id: string;
  referralCode: string;
  ownerLifecycleStage: string;
  status: string;
  createdAt: string;
  partner: { id: string; companyName: string };
  owner: { userId: string } | null;
}

const LIFECYCLE_LABEL: Record<string, string> = {
  REFERRED: "تمت الإحالة", REGISTERED: "تم التسجيل", VERIFIED: "تم التحقق",
  PROPERTY_SUBMITTED: "تم إرسال عقار", PROPERTY_APPROVED: "تم اعتماد العقار",
  UNIT_APPROVED: "تم اعتماد الوحدة", ACTIVE: "نشط",
};

interface AdminMaintenanceRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  unit: { unitNumber: string; property: { city: { nameAr: string } | null } };
  partner: { companyName: string } | null;
}

const MAINT_STATUS_LABEL: Record<string, string> = {
  OPEN: "بانتظار التعيين", ASSIGNED: "بانتظار القبول", ACCEPTED: "تم القبول", IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "بانتظار تأكيد المالك", CONFIRMED: "بانتظار الإغلاق", CLOSED: "مغلق", CANCELLED: "ملغي",
};

interface ContractorDocument {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
}
interface ContractorRow {
  id: string;
  companyName: string;
  contractorName: string;
  phone: string;
  specialization: string;
  status: string;
  submittedAt: string;
  city: { nameAr: string } | null;
  documents?: ContractorDocument[];
}
const CONTRACTOR_STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bp", UNDER_REVIEW: "bp", APPROVED: "ba", REJECTED: "br",
};
const CONTRACTOR_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "بانتظار المراجعة", UNDER_REVIEW: "قيد المراجعة", APPROVED: "معتمد", REJECTED: "مرفوض",
};

interface PartnerRow {
  id: string;
  companyName: string;
  partnerType: string;
  verificationStatus: string;
  createdAt: string;
  users: { isPrimary: boolean; user: { fullName: string; email: string; phone: string } }[];
  documents?: PartnerDocument[];
  agreementAcceptances?: { id: string; agreementType: string; version: string; acceptedAt: string }[];
}

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bp", UNDER_REVIEW: "bp", DOCS_REQUESTED: "br", APPROVED: "ba", REJECTED: "br",
  PENDING: "bp", CONTACTED: "bp", CONFIRMED: "ba", CHECKED_IN: "ba", CHECKED_OUT: "ba", DECLINED: "br", CANCELLED: "br",
  PENDING_REVIEW: "bp", SUSPENDED: "br", INACTIVE: "br",
};
const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "بانتظار المراجعة", UNDER_REVIEW: "قيد المراجعة", DOCS_REQUESTED: "بانتظار المستندات",
  APPROVED: "معتمد", REJECTED: "مرفوض",
  PENDING: "بانتظار", CONTACTED: "تم التواصل", CONFIRMED: "مؤكد", CHECKED_IN: "تم تسجيل الوصول",
  CHECKED_OUT: "تمت المغادرة", DECLINED: "مرفوض", CANCELLED: "ملغي",
  PENDING_REVIEW: "بانتظار المراجعة", SUSPENDED: "موقوف", INACTIVE: "غير نشط",
};

const UNIT_STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bp", UNDER_REVIEW: "bp", SITE_VISIT_REQUIRED: "bp", SITE_VISIT_COMPLETED: "bp", REJECTED: "br",
};
const UNIT_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "تم الإرسال", UNDER_REVIEW: "قيد المراجعة", SITE_VISIT_REQUIRED: "بانتظار زيارة الموقع",
  SITE_VISIT_COMPLETED: "تمت الزيارة — بانتظار الاعتماد", REJECTED: "مرفوضة",
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
        <h2 style={{ fontFamily: "var(--fnar)", color: "var(--g)", marginBottom: 14 }}>تسجيل دخول الإدارة</h2>
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

type Tab = "applications" | "bookings" | "users" | "partners" | "units" | "referrals" | "maintenance" | "contractors" | "groups" | "commissions" | "specialEvents";

export default function AdminPage() {
  const { user, accessToken, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("applications");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(null);
  const [reviewUnits, setReviewUnits] = useState<UnitReviewRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [reassignTargetPartnerId, setReassignTargetPartnerId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [maintenanceRequests, setMaintenanceRequests] = useState<AdminMaintenanceRow[]>([]);
  const [assigningMaintId, setAssigningMaintId] = useState<string | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState("");
  const [contractors, setContractors] = useState<ContractorRow[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorRow | null>(null);
  const [groupReservations, setGroupReservations] = useState<GroupReservationRow[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRuleRow[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<AdminQuoteRequestRow[]>([]);
  const [promotionOfferingId, setPromotionOfferingId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Item 7: Admin Dashboard accessible ONLY to Admin, Employees, Managers —
  // matches the backend's requireRole("admin","super_admin","employee","manager")
  // on every /admin/* route exactly. This frontend check is a UX convenience
  // (hide the UI, avoid a flash of protected content) — the real boundary
  // is enforced server-side regardless, per Phase 7's security model.
  const isAdmin = user?.roles.some((r) => ["admin", "super_admin", "employee", "manager"].includes(r));
  // Priority 8: reassignment is restricted server-side to super_admin only
  // (requireRole("super_admin") on PATCH /partner-referrals/:id/reassign) —
  // this mirrors that client-side purely to hide the unusable button for
  // plain admins; it is not the actual security boundary.
  const isSuperAdmin = user?.roles.includes("super_admin");

  async function refreshMetricsAndApplications() {
    if (!accessToken) return;
    const [m, apps] = await Promise.all([
      api.get<Metrics>("/admin/metrics", accessToken),
      api.get<{ items: ApplicationRow[] }>("/admin/owner-applications", accessToken),
    ]);
    setMetrics(m);
    setApplications(apps.items);
  }

  async function loadBookings() {
    if (!accessToken) return;
    const res = await api.get<{ items: BookingRow[] }>("/admin/bookings", accessToken);
    setBookings(res.items);
  }

  async function loadUsers() {
    if (!accessToken) return;
    const res = await api.get<{ items: UserRow[] }>("/admin/users", accessToken);
    setUsers(res.items);
  }

  // Reuses the existing /partners review-queue API (already admin/super_admin-only server-side).
  async function loadPartners() {
    if (!accessToken) return;
    const res = await api.get<{ items: PartnerRow[] }>("/partners", accessToken);
    setPartners(res.items);
  }

  async function openPartner(id: string) {
    if (!accessToken) return;
    setActionError(null);
    try {
      const partner = await api.get<PartnerRow>(`/partners/${id}`, accessToken);
      setSelectedPartner(partner);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات الشريك");
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "applications") refreshMetricsAndApplications().catch(() => setActionError("تعذر تحميل البيانات"));
    if (tab === "bookings") loadBookings().catch(() => setActionError("تعذر تحميل الحجوزات"));
    if (tab === "users") loadUsers().catch(() => setActionError("تعذر تحميل المستخدمين"));
    if (tab === "partners") loadPartners().catch(() => setActionError("تعذر تحميل طلبات الشركاء"));
    if (tab === "units") loadReviewUnits().catch(() => setActionError("تعذر تحميل الوحدات"));
    if (tab === "referrals") loadReferrals().catch(() => setActionError("تعذر تحميل الترشيحات"));
    if (tab === "maintenance") loadMaintenanceRequests().catch(() => setActionError("تعذر تحميل طلبات الصيانة"));
    if (tab === "contractors") loadContractors().catch(() => setActionError("تعذر تحميل طلبات المقاولين"));
    if (tab === "groups") loadGroupReservations().catch(() => setActionError("تعذر تحميل حجوزات الشركات"));
    if (tab === "commissions") loadCommissionRules().catch(() => setActionError("تعذر تحميل إعدادات العمولة"));
    if (tab === "specialEvents") loadQuoteRequests().catch(() => setActionError("تعذر تحميل طلبات المناسبات الخاصة"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, accessToken, tab]);

  // Special Events session: admin-wide quote-requests view and promotion
  // tier control — Featured/Premium is admin-only, never provider-initiated.
  async function loadQuoteRequests() {
    if (!accessToken) return;
    const res = await api.get<AdminQuoteRequestRow[]>("/offerings/quote-requests/admin", accessToken);
    setQuoteRequests(res);
  }

  async function setPromotionTier(offeringId: string, promotionTier: "NORMAL" | "FEATURED" | "PREMIUM") {
    if (!accessToken || !offeringId) return;
    setActionError(null);
    try {
      await api.patch(`/offerings/${offeringId}/promotion-tier`, { promotionTier }, accessToken);
      setActionError(null);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تحديث حالة الترويج");
    }
  }

  // Business commission model (this session): STANDARD (10%) / COMPANY_GROUP
  // (8%) rates, admin-editable through the existing commission-rules CRUD.
  async function loadCommissionRules() {
    if (!accessToken) return;
    const res = await api.get<CommissionRuleRow[]>("/offerings/commission-rules", accessToken);
    setCommissionRules(res);
  }

  async function bootstrapCommissionDefaults() {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.post("/offerings/commission-rules/bootstrap-defaults", {}, accessToken);
      loadCommissionRules();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل إنشاء الإعدادات الافتراضية");
    }
  }

  async function saveCommissionRate(id: string, percentageValue: number) {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.patch(`/offerings/commission-rules/${id}`, { percentageValue }, accessToken);
      loadCommissionRules();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تحديث نسبة العمولة");
    }
  }

  // Priority 2 (this session): company/group reservations were entirely
  // missing from the admin dashboard — backend (§1) built this session too.
  async function loadGroupReservations() {
    if (!accessToken) return;
    const res = await api.get<GroupReservationRow[]>("/group-reservations/admin", accessToken);
    setGroupReservations(res);
  }

  async function updateGroupStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.patch(`/group-reservations/${id}/status`, { status }, accessToken);
      loadGroupReservations();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تحديث حالة الحجز");
    }
  }

  // Priority 10: reuses the existing admin-gated GET /contractor-applications
  // and PATCH /contractor-applications/:id/review — backend was already
  // fully done, only the Admin UI was missing.
  async function loadContractors() {
    if (!accessToken) return;
    const res = await api.get<{ items: ContractorRow[] }>("/contractor-applications", accessToken);
    setContractors(res.items);
  }

  async function openContractor(id: string) {
    if (!accessToken) return;
    setActionError(null);
    try {
      const app = await api.get<ContractorRow>(`/contractor-applications/${id}`, accessToken);
      setSelectedContractor(app);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات المقاول");
    }
  }

  async function reviewContractor(id: string, action: "start_review" | "approve" | "reject") {
    if (!accessToken) return;
    setActionError(null);
    try {
      const updated = await api.patch<ContractorRow>(`/contractor-applications/${id}/review`, { action }, accessToken);
      await loadContractors();
      setSelectedContractor((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  // Priority 9: admin queue — reuses the existing GET /maintenance
  // (admin-only) and PATCH /maintenance/:id/assign (admin-only, target
  // partner's MAINTENANCE capability + APPROVED status validated server-side).
  async function loadMaintenanceRequests() {
    if (!accessToken) return;
    const res = await api.get<{ items: AdminMaintenanceRow[] }>("/maintenance", accessToken);
    setMaintenanceRequests(res.items);
  }

  async function assignMaintenance(id: string) {
    if (!accessToken || !assignPartnerId.trim()) return;
    setActionError(null);
    try {
      await api.patch(`/maintenance/${id}/assign`, { partnerId: assignPartnerId.trim() }, accessToken);
      setAssigningMaintId(null);
      setAssignPartnerId("");
      await loadMaintenanceRequests();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تعيين الطلب");
    }
  }

  async function closeMaintenance(id: string) {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.patch(`/maintenance/${id}/transition`, { action: "close" }, accessToken);
      await loadMaintenanceRequests();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل الإغلاق");
    }
  }

  // Priority 8: admin view of all referrals — reuses the existing GET
  // /partner-referrals (admin/super_admin) and PATCH /:id/reassign
  // (super_admin only, enforced server-side).
  async function loadReferrals() {
    if (!accessToken) return;
    const res = await api.get<{ items: ReferralRow[] }>("/partner-referrals", accessToken);
    setReferrals(res.items);
  }

  async function reassign(id: string) {
    if (!accessToken || !reassignTargetPartnerId.trim() || !reassignReason.trim()) return;
    setActionError(null);
    try {
      await api.patch(`/partner-referrals/${id}/reassign`, { newPartnerId: reassignTargetPartnerId.trim(), reason: reassignReason.trim() }, accessToken);
      setReassigningId(null);
      setReassignTargetPartnerId("");
      setReassignReason("");
      await loadReferrals();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل نقل الترشيح");
    }
  }

  // Priority 4: admin/staff-only review queue — reuses the existing
  // /units/review-queue, /units/:id/require-site-visit, /units/:id/site-visit,
  // /units/:id/approve, /units/:id/reject endpoints (all admin/staff-gated server-side).
  async function loadReviewUnits() {
    if (!accessToken) return;
    const res = await api.get<{ items: UnitReviewRow[] }>("/units/review-queue", accessToken);
    setReviewUnits(res.items);
  }

  async function unitAction(id: string, path: string, method: "patch" | "post" = "patch") {
    if (!accessToken) return;
    setActionError(null);
    try {
      if (method === "post") await api.post(`/units/${id}/${path}`, {}, accessToken);
      else await api.patch(`/units/${id}/${path}`, {}, accessToken);
      await loadReviewUnits();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  async function review(id: string, action: "start_review" | "approve" | "reject") {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.patch(`/admin/owner-applications/${id}/review`, { action }, accessToken);
      await refreshMetricsAndApplications();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  async function reviewPartner(id: string, action: "start_review" | "approve" | "reject") {
    if (!accessToken) return;
    setActionError(null);
    try {
      const updated = await api.patch<PartnerRow>(`/partners/${id}/review`, { action }, accessToken);
      await loadPartners();
      setSelectedPartner((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  async function updateBookingStatus(id: string, action: string) {
    if (!accessToken) return;
    setActionError(null);
    try {
      await api.patch(`/admin/bookings/${id}`, { action }, accessToken);
      await loadBookings();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  if (!user) {
    return (
      <div className="screen active" id="sc-admin">
      <Navbar />
        <div className="form-hero fh">
          <h1>لوحة الإدارة</h1>
        </div>
        <LoginForm />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="screen active" id="sc-admin">
      <Navbar />
        <div className="int-warn" style={{ margin: 24 }}>
          🔒 هذا الحساب لا يملك صلاحيات الإدارة
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="sc-admin">
      <Navbar />
      <div className="dash-wrap">
        <div className="sidebar">
          <div className="sb-logo">
            <div className="sb-name">EGY <span style={{ color: "var(--gold)" }}>MOTELZ</span></div>
            <div className="sb-role">Admin Console</div>
          </div>
          <div className="sb-sect">إدارة</div>
          <div className={`slink${tab === "applications" ? " active" : ""}`} onClick={() => setTab("applications")}>
            طلبات الملاك
          </div>
          <div className={`slink${tab === "bookings" ? " active" : ""}`} onClick={() => setTab("bookings")}>
            الحجوزات
          </div>
          <div className={`slink${tab === "users" ? " active" : ""}`} onClick={() => setTab("users")}>
            المستخدمون
          </div>
          <div className={`slink${tab === "partners" ? " active" : ""}`} onClick={() => { setTab("partners"); setSelectedPartner(null); }}>
            الشركاء
          </div>
          <div className={`slink${tab === "units" ? " active" : ""}`} onClick={() => setTab("units")}>
            الوحدات
          </div>
          <div className={`slink${tab === "referrals" ? " active" : ""}`} onClick={() => setTab("referrals")}>
            الترشيحات
          </div>
          <div className={`slink${tab === "maintenance" ? " active" : ""}`} onClick={() => setTab("maintenance")}>
            طلبات الصيانة
          </div>
          <div className={`slink${tab === "contractors" ? " active" : ""}`} onClick={() => { setTab("contractors"); setSelectedContractor(null); }}>
            المقاولون
          </div>
          <div className={`slink${tab === "groups" ? " active" : ""}`} onClick={() => setTab("groups")}>
            حجوزات الشركات
          </div>
          <div className={`slink${tab === "commissions" ? " active" : ""}`} onClick={() => setTab("commissions")}>
            إعدادات العمولة
          </div>
          <div className={`slink${tab === "specialEvents" ? " active" : ""}`} onClick={() => setTab("specialEvents")}>
            المناسبات الخاصة
          </div>
          <div className="sb-sect">داخلي</div>
          <div className="slink">المالية <span className="int-badge">🔒</span></div>
        </div>
        <div className="dash-main" dir="rtl">
          <div className="dash-hdr">
            <h2>لوحة تحكم الإدارة</h2>
            <div className="user-pill">
              <div className="user-av">{user.fullName?.[0] ?? "A"}</div>
              <button className="ab-btn m" onClick={logout}>خروج</button>
            </div>
          </div>

          {actionError && <div className="error-box">{actionError}</div>}

          {tab === "applications" && (
            <>
              <div className="metrics">
                <div className="metric">
                  <div className="m-lbl">إجمالي الملاك</div>
                  <div className="m-val">{metrics?.totalOwners ?? "—"}</div>
                </div>
                <div className="metric">
                  <div className="m-lbl">طلبات بانتظار المراجعة</div>
                  <div className="m-val">{metrics?.pendingApplications ?? "—"}</div>
                </div>
                <div className="metric">
                  <div className="m-lbl">حجوزات نشطة</div>
                  <div className="m-val">{metrics?.activeBookings ?? "—"}</div>
                </div>
                <div className="metric">
                  <div className="m-lbl">وحدات مُدارة</div>
                  <div className="m-val">{metrics?.managedUnits ?? "—"}</div>
                  <div className="m-sub">{metrics?.activeUnits ?? 0} نشطة</div>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>المالك</th><th>المدينة</th><th>تاريخ التقديم</th><th>الحالة</th><th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.fullName}</td>
                        <td>{app.district?.nameAr ?? app.districtFreeText ?? ""}، {app.city?.nameAr ?? ""}</td>
                        <td>{new Date(app.submittedAt).toLocaleDateString("ar-EG")}</td>
                        <td><span className={`badge ${STATUS_BADGE[app.status] ?? "bp"}`}>{STATUS_LABEL[app.status] ?? app.status}</span></td>
                        <td>
                          {app.status === "SUBMITTED" && (
                            <button className="ab-btn g" onClick={() => review(app.id, "start_review")}>بدء المراجعة</button>
                          )}
                          {app.status === "UNDER_REVIEW" && (
                            <>
                              <button className="ab-btn g" onClick={() => review(app.id, "approve")}>اعتماد</button>{" "}
                              <button className="ab-btn m" onClick={() => review(app.id, "reject")}>رفض</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "bookings" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>الضيف</th><th>الوحدة</th><th>الوصول</th><th>المغادرة</th><th>الدفع</th><th>الحالة</th><th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.guest.fullName} — {b.guest.phone}</td>
                      <td>{b.unit.bedrooms} غرفة — {b.unit.property.city?.nameAr ?? ""}</td>
                      <td>{new Date(b.checkIn).toLocaleDateString("ar-EG")}</td>
                      <td>{new Date(b.checkOut).toLocaleDateString("ar-EG")}</td>
                      <td><span className={`badge ${b.paymentStatus === "PAID" ? "ba" : "bp"}`}>{b.paymentStatus}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[b.status] ?? "bp"}`}>{STATUS_LABEL[b.status] ?? b.status}</span></td>
                      <td>
                        {b.status === "PENDING" && (
                          <button className="ab-btn g" onClick={() => updateBookingStatus(b.id, "mark_contacted")}>تم التواصل</button>
                        )}
                        {b.status === "CONTACTED" && (
                          <button className="ab-btn g" onClick={() => updateBookingStatus(b.id, "confirm")}>تأكيد</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد حجوزات</p>}
            </div>
          )}

          {tab === "users" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الأدوار</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.roles.map((r) => r.role.name).join("، ") || "—"}</td>
                      <td><span className={`badge ${u.status === "ACTIVE" ? "ba" : "bp"}`}>{u.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا يوجد مستخدمون</p>}
            </div>
          )}

          {tab === "partners" && (
            <>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>الشركة</th><th>الشخص المسؤول</th><th>الفئة</th><th>تاريخ التسجيل</th><th>الحالة</th><th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => {
                      const contact = p.users.find((u) => u.isPrimary)?.user ?? p.users[0]?.user;
                      return (
                        <tr key={p.id}>
                          <td>
                            <a onClick={() => openPartner(p.id)} style={{ cursor: "pointer", textDecoration: "underline" }}>
                              {p.companyName}
                            </a>
                          </td>
                          <td>{contact?.fullName ?? "—"}</td>
                          <td>{PARTNER_TYPE_LABELS[p.partnerType as keyof typeof PARTNER_TYPE_LABELS] ?? p.partnerType}</td>
                          <td>{new Date(p.createdAt).toLocaleDateString("ar-EG")}</td>
                          <td><span className={`badge ${STATUS_BADGE[p.verificationStatus] ?? "bp"}`}>{STATUS_LABEL[p.verificationStatus] ?? p.verificationStatus}</span></td>
                          <td>
                            {p.verificationStatus === "PENDING_REVIEW" && (
                              <button className="ab-btn g" onClick={() => reviewPartner(p.id, "start_review")}>بدء المراجعة</button>
                            )}
                            {p.verificationStatus === "UNDER_REVIEW" && (
                              <>
                                <button className="ab-btn g" onClick={() => reviewPartner(p.id, "approve")}>اعتماد</button>{" "}
                                <button className="ab-btn m" onClick={() => reviewPartner(p.id, "reject")}>رفض</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {partners.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات شراكة</p>}
              </div>

              {selectedPartner && (
                <div className="form-card" style={{ marginTop: 20 }}>
                  <h3 style={{ marginBottom: 10 }}>{selectedPartner.companyName}</h3>
                  <p>
                    <strong>الحالة:</strong>{" "}
                    <span className={`badge ${STATUS_BADGE[selectedPartner.verificationStatus] ?? "bp"}`}>
                      {STATUS_LABEL[selectedPartner.verificationStatus] ?? selectedPartner.verificationStatus}
                    </span>
                  </p>
                  <p><strong>الفئة:</strong> {PARTNER_TYPE_LABELS[selectedPartner.partnerType as keyof typeof PARTNER_TYPE_LABELS] ?? selectedPartner.partnerType}</p>
                  {selectedPartner.users.map((u) => (
                    <p key={u.user.email}>
                      <strong>{u.isPrimary ? "الشخص المسؤول:" : "مستخدم:"}</strong> {u.user.fullName} — {u.user.email} — {u.user.phone}
                    </p>
                  ))}

                  <h4 style={{ marginTop: 14, marginBottom: 6 }}>المستندات</h4>
                  {(selectedPartner.documents ?? []).length === 0 && <p style={{ color: "var(--mut)" }}>لا توجد مستندات مرفوعة</p>}
                  <ul>
                    {(selectedPartner.documents ?? []).map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">{doc.type}</a>{" "}
                        <span className={`badge ${doc.status === "VERIFIED" ? "ba" : doc.status === "REJECTED" ? "br" : "bp"}`}>{doc.status}</span>
                      </li>
                    ))}
                  </ul>

                  <h4 style={{ marginTop: 14, marginBottom: 6 }}>الموافقة على الاتفاقية</h4>
                  {(selectedPartner.agreementAcceptances ?? []).length === 0 && (
                    <p style={{ color: "var(--mut)" }}>لا يوجد سجل موافقة</p>
                  )}
                  {(selectedPartner.agreementAcceptances ?? []).map((a) => (
                    <p key={a.id}>
                      تمت الموافقة على اتفاقية الشراكة (إصدار {a.version}) بتاريخ {new Date(a.acceptedAt).toLocaleDateString("ar-EG")}
                    </p>
                  ))}

                  <div style={{ marginTop: 14 }}>
                    {selectedPartner.verificationStatus === "PENDING_REVIEW" && (
                      <button className="ab-btn g" onClick={() => reviewPartner(selectedPartner.id, "start_review")}>بدء المراجعة</button>
                    )}
                    {selectedPartner.verificationStatus === "UNDER_REVIEW" && (
                      <>
                        <button className="ab-btn g" onClick={() => reviewPartner(selectedPartner.id, "approve")}>اعتماد</button>{" "}
                        <button className="ab-btn m" onClick={() => reviewPartner(selectedPartner.id, "reject")}>رفض</button>
                      </>
                    )}
                    {" "}
                    <button className="ab-btn m" onClick={() => setSelectedPartner(null)}>إغلاق</button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "units" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>الوحدة</th><th>الشريك</th><th>الموقع</th><th>الحالة</th><th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewUnits.map((u) => {
                    const lastVisit = u.siteVisits[0];
                    return (
                      <tr key={u.id}>
                        <td>{u.unitNumber} ({u.bedrooms} غرف)</td>
                        <td>{u.property.submittedByPartner?.companyName ?? "—"}</td>
                        <td>{u.property.district?.nameAr ?? u.property.city?.nameAr ?? "—"}</td>
                        <td>
                          <span className={`badge ${UNIT_STATUS_BADGE[u.status] ?? "bp"}`}>{UNIT_STATUS_LABEL[u.status] ?? u.status}</span>
                          {lastVisit?.status === "COMPLETED" && lastVisit.notes && (
                            <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 4 }}>ملاحظات الزيارة: {lastVisit.notes}</div>
                          )}
                        </td>
                        <td>
                          {(u.status === "SUBMITTED" || u.status === "UNDER_REVIEW") && (
                            <button className="ab-btn g" onClick={() => unitAction(u.id, "require-site-visit")}>طلب زيارة موقع</button>
                          )}
                          {u.status === "SITE_VISIT_REQUIRED" && (
                            <button className="ab-btn g" onClick={() => unitAction(u.id, "site-visit", "post")}>تسجيل الزيارة</button>
                          )}
                          {u.status === "SITE_VISIT_COMPLETED" && (
                            <button className="ab-btn g" onClick={() => unitAction(u.id, "approve")}>اعتماد نهائي</button>
                          )}
                          {u.status !== "REJECTED" && (
                            <>
                              {" "}
                              <button className="ab-btn m" onClick={() => unitAction(u.id, "reject")}>رفض</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {reviewUnits.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد وحدات بانتظار المراجعة</p>}
            </div>
          )}

          {tab === "referrals" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>كود الترشيح</th><th>الشريك</th><th>المرحلة</th><th>الحالة</th><th>تاريخ الإحالة</th>
                    {isSuperAdmin && <th>نقل الترشيح</th>}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id}>
                      <td>{r.referralCode}</td>
                      <td>{r.partner.companyName}</td>
                      <td><span className="badge bp">{LIFECYCLE_LABEL[r.ownerLifecycleStage] ?? r.ownerLifecycleStage}</span></td>
                      <td>{r.status}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("ar-EG")}</td>
                      {isSuperAdmin && (
                        <td>
                          {reassigningId === r.id ? (
                            <>
                              <input
                                value={reassignTargetPartnerId}
                                onChange={(e) => setReassignTargetPartnerId(e.target.value)}
                                placeholder="معرّف الشريك الجديد"
                                style={{ width: 140, marginInlineEnd: 4 }}
                              />
                              <input
                                value={reassignReason}
                                onChange={(e) => setReassignReason(e.target.value)}
                                placeholder="سبب النقل"
                                style={{ width: 140, marginInlineEnd: 4 }}
                              />
                              <button className="ab-btn g" onClick={() => reassign(r.id)}>تأكيد</button>{" "}
                              <button className="ab-btn m" onClick={() => setReassigningId(null)}>إلغاء</button>
                            </>
                          ) : (
                            <button className="ab-btn m" onClick={() => setReassigningId(r.id)}>نقل</button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {referrals.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد ترشيحات بعد</p>}
            </div>
          )}

          {tab === "maintenance" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr><th>العنوان</th><th>الوحدة</th><th>الشريك</th><th>الحالة</th><th>إجراء</th></tr>
                </thead>
                <tbody>
                  {maintenanceRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.unit.unitNumber} — {r.unit.property.city?.nameAr ?? "—"}</td>
                      <td>{r.partner?.companyName ?? "—"}</td>
                      <td><span className="badge bp">{MAINT_STATUS_LABEL[r.status] ?? r.status}</span></td>
                      <td>
                        {r.status === "OPEN" && (
                          assigningMaintId === r.id ? (
                            <>
                              <input
                                value={assignPartnerId}
                                onChange={(e) => setAssignPartnerId(e.target.value)}
                                placeholder="معرّف الشريك"
                                style={{ width: 160, marginInlineEnd: 6 }}
                              />
                              <button className="ab-btn g" onClick={() => assignMaintenance(r.id)}>تأكيد</button>{" "}
                              <button className="ab-btn m" onClick={() => setAssigningMaintId(null)}>إلغاء</button>
                            </>
                          ) : (
                            <button className="ab-btn g" onClick={() => setAssigningMaintId(r.id)}>تعيين شريك</button>
                          )
                        )}
                        {r.status === "CONFIRMED" && (
                          <button className="ab-btn g" onClick={() => closeMaintenance(r.id)}>إغلاق الطلب</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {maintenanceRequests.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات صيانة</p>}
            </div>
          )}

          {tab === "contractors" && (
            <>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>الشركة</th><th>المقاول</th><th>التخصص</th><th>المدينة</th><th>تاريخ التسجيل</th><th>الحالة</th><th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <a onClick={() => openContractor(c.id)} style={{ cursor: "pointer", textDecoration: "underline" }}>
                            {c.companyName}
                          </a>
                        </td>
                        <td>{c.contractorName}</td>
                        <td>{c.specialization}</td>
                        <td>{c.city?.nameAr ?? "—"}</td>
                        <td>{new Date(c.submittedAt).toLocaleDateString("ar-EG")}</td>
                        <td><span className={`badge ${CONTRACTOR_STATUS_BADGE[c.status] ?? "bp"}`}>{CONTRACTOR_STATUS_LABEL[c.status] ?? c.status}</span></td>
                        <td>
                          {c.status === "SUBMITTED" && (
                            <button className="ab-btn g" onClick={() => reviewContractor(c.id, "start_review")}>بدء المراجعة</button>
                          )}
                          {c.status === "UNDER_REVIEW" && (
                            <>
                              <button className="ab-btn g" onClick={() => reviewContractor(c.id, "approve")}>اعتماد</button>{" "}
                              <button className="ab-btn m" onClick={() => reviewContractor(c.id, "reject")}>رفض</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contractors.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات تسجيل مقاولين</p>}
              </div>

              {selectedContractor && (
                <div className="form-card" style={{ marginTop: 20 }}>
                  <h3 style={{ marginBottom: 10 }}>{selectedContractor.companyName}</h3>
                  <p>
                    <strong>الحالة:</strong>{" "}
                    <span className={`badge ${CONTRACTOR_STATUS_BADGE[selectedContractor.status] ?? "bp"}`}>
                      {CONTRACTOR_STATUS_LABEL[selectedContractor.status] ?? selectedContractor.status}
                    </span>
                  </p>
                  <p><strong>المقاول:</strong> {selectedContractor.contractorName} — {selectedContractor.phone}</p>
                  <p><strong>التخصص:</strong> {selectedContractor.specialization}</p>

                  <h4 style={{ marginTop: 14, marginBottom: 6 }}>المستندات</h4>
                  {(selectedContractor.documents ?? []).length === 0 && <p style={{ color: "var(--mut)" }}>لا توجد مستندات مرفوعة</p>}
                  <ul>
                    {(selectedContractor.documents ?? []).map((doc) => (
                      <li key={doc.id}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">{doc.type}</a>{" "}
                        <span className={`badge ${doc.status === "VERIFIED" ? "ba" : doc.status === "REJECTED" ? "br" : "bp"}`}>{doc.status}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 14 }}>
                    {selectedContractor.status === "SUBMITTED" && (
                      <button className="ab-btn g" onClick={() => reviewContractor(selectedContractor.id, "start_review")}>بدء المراجعة</button>
                    )}
                    {selectedContractor.status === "UNDER_REVIEW" && (
                      <>
                        <button className="ab-btn g" onClick={() => reviewContractor(selectedContractor.id, "approve")}>اعتماد</button>{" "}
                        <button className="ab-btn m" onClick={() => reviewContractor(selectedContractor.id, "reject")}>رفض</button>
                      </>
                    )}
                    {" "}
                    <button className="ab-btn m" onClick={() => setSelectedContractor(null)}>إغلاق</button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "groups" && (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>الشركة</th><th>الشريك المُرسِل</th><th>وحدات مطلوبة</th><th>ضيوف متوقعون</th><th>وحدات مرتبطة</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {groupReservations.map((g) => (
                    <tr key={g.id}>
                      <td>{g.companyName}<br /><span style={{ fontSize: 12, color: "var(--mut)" }}>{g.contactName} — {g.contactPhone}</span></td>
                      <td>{g.partner?.companyName ?? "—"}</td>
                      <td>{g.requestedUnitCount ?? "—"}</td>
                      <td>{g.requestedGuestCount ?? "—"}</td>
                      <td>{g.bookings.length}</td>
                      <td>{new Date(g.createdAt).toLocaleDateString("ar-EG")}</td>
                      <td><span className={`badge ${g.status === "CONFIRMED" ? "ba" : g.status === "CANCELLED" ? "br" : "bp"}`}>{g.status}</span></td>
                      <td>
                        {g.status === "SUBMITTED" && (
                          <>
                            <button className="ab-btn g" onClick={() => updateGroupStatus(g.id, "CONFIRMED")}>اعتماد</button>{" "}
                            <button className="ab-btn m" onClick={() => updateGroupStatus(g.id, "CANCELLED")}>إلغاء</button>
                          </>
                        )}
                        {g.status === "CONFIRMED" && (
                          <button className="ab-btn m" onClick={() => updateGroupStatus(g.id, "CANCELLED")}>إلغاء</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groupReservations.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد حجوزات شركات بعد</p>}
            </div>
          )}

          {tab === "commissions" && (
            <div>
              <p style={{ color: "var(--mut)", marginBottom: 12 }}>
                هذه النسب تُطبَّق تلقائيًا عند تأكيد أي حجز تجربة/فعالية — عادي أو جماعي (شركات)، حسب نوع الحجز الفعلي وليس أي خيار من الواجهة.
              </p>
              {commissionRules.length === 0 && (
                <button className="ab-btn g" onClick={bootstrapCommissionDefaults}>إنشاء الإعدادات الافتراضية (10% / 8%)</button>
              )}
              <div className="data-table" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr><th>النطاق</th><th>نوع الحجز</th><th>النوع</th><th>النسبة/المبلغ</th><th>الحالة</th><th>إجراء</th></tr>
                  </thead>
                  <tbody>
                    {commissionRules.map((r) => (
                      <CommissionRuleRowView key={r.id} rule={r} onSave={saveCommissionRate} />
                    ))}
                  </tbody>
                </table>
                {commissionRules.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد قواعد عمولة بعد</p>}
              </div>
            </div>
          )}

          {tab === "specialEvents" && (
            <div>
              <h3 style={{ marginBottom: 8 }}>طلبات عروض الأسعار للمناسبات الخاصة</h3>
              <div className="data-table" style={{ marginBottom: 24 }}>
                <table>
                  <thead>
                    <tr><th>العرض</th><th>الشريك</th><th>نوع المناسبة</th><th>التاريخ</th><th>الضيوف</th><th>السعر المعروض</th><th>الحالة</th></tr>
                  </thead>
                  <tbody>
                    {quoteRequests.map((q) => (
                      <tr key={q.id}>
                        <td>{q.offering.nameAr}</td>
                        <td>{q.partner?.companyName ?? "—"}</td>
                        <td>{q.eventType}</td>
                        <td>{q.preferredDate ? new Date(q.preferredDate).toLocaleDateString("ar-EG") : "—"}</td>
                        <td>{q.guestCount}</td>
                        <td>{q.quotedPrice ?? "—"}</td>
                        <td><span className="badge bp">{q.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {quoteRequests.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات عروض أسعار بعد</p>}
              </div>

              <h3 style={{ marginBottom: 8 }}>ترويج عرض (مميز / بريميوم)</h3>
              <p style={{ color: "var(--mut)", fontSize: 13, marginBottom: 8 }}>
                هذا لا يمثل عمولة الحجز — رسوم ترويج منفصلة تُدار خارج النظام حاليًا. أدخل معرّف العرض (Offering ID) لتغيير حالته.
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input placeholder="Offering ID" value={promotionOfferingId} onChange={(e) => setPromotionOfferingId(e.target.value)} style={{ width: 280 }} dir="ltr" />
                <button className="ab-btn g" onClick={() => setPromotionTier(promotionOfferingId, "FEATURED")}>تمييز (Featured)</button>
                <button className="ab-btn g" onClick={() => setPromotionTier(promotionOfferingId, "PREMIUM")}>بريميوم (Premium)</button>
                <button className="ab-btn m" onClick={() => setPromotionTier(promotionOfferingId, "NORMAL")}>إزالة الترويج</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommissionRuleRowView({ rule, onSave }: { rule: CommissionRuleRow; onSave: (id: string, percentageValue: number) => void }) {
  const [value, setValue] = useState(rule.percentageValue ?? "");
  const scopeLabel = rule.partner ? rule.partner.companyName : rule.offeringType ? rule.offeringType : rule.categoryId ? "فئة محددة" : "عام (كل الشركاء)";
  return (
    <tr>
      <td>{scopeLabel}</td>
      <td>{rule.bookingType === "COMPANY_GROUP" ? "جماعي / شركات" : rule.bookingType === "STANDARD" ? "عادي" : "الكل"}</td>
      <td>{rule.ruleType === "PERCENTAGE" ? "نسبة مئوية" : "مبلغ ثابت"}</td>
      <td>
        {rule.ruleType === "PERCENTAGE" ? (
          <input type="number" step="0.1" min={0} max={100} value={value} onChange={(e) => setValue(e.target.value)} style={{ width: 80 }} />
        ) : (
          rule.fixedAmount
        )}
        {rule.ruleType === "PERCENTAGE" && "%"}
      </td>
      <td><span className={`badge ${rule.isActive ? "ba" : "br"}`}>{rule.isActive ? "فعّالة" : "متوقفة"}</span></td>
      <td>
        {rule.ruleType === "PERCENTAGE" && (
          <button className="ab-btn m" onClick={() => onSave(rule.id, Number(value))}>حفظ</button>
        )}
      </td>
    </tr>
  );
}
