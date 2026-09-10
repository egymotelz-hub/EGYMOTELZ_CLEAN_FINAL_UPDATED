"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";

interface UnifiedBookingItem {
  kind: "ACCOMMODATION" | "OFFERING";
  id: string;
  reference: string | null;
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  locationEn: string | null;
  startDate: string;
  endDate: string | null;
  time: string | null;
  status: string;
  bookingGroupId: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { ar: string; en: string }> = {
  PENDING: { ar: "قيد الانتظار", en: "Pending" },
  CONTACTED: { ar: "تم التواصل", en: "Contacted" },
  CONFIRMED: { ar: "مؤكد", en: "Confirmed" },
  CHECKED_IN: { ar: "تم تسجيل الوصول", en: "Checked in" },
  CHECKED_OUT: { ar: "تم تسجيل المغادرة", en: "Checked out" },
  DECLINED: { ar: "مرفوض", en: "Declined" },
  CANCELLED: { ar: "ملغى", en: "Cancelled" },
  COMPLETED: { ar: "مكتمل", en: "Completed" },
  NO_SHOW: { ar: "لم يحضر", en: "No-show" },
};
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "ba", CHECKED_IN: "ba", CHECKED_OUT: "ba", COMPLETED: "ba",
  DECLINED: "br", CANCELLED: "br", NO_SHOW: "br",
};

const L = {
  title: { ar: "منطقة الحجوزات", en: "My Bookings" },
  subtitle: { ar: "كل حجوزاتك في مكان واحد — إقامة، تجارب، مواصلات وفعاليات", en: "All your bookings in one place — stays, experiences, transportation and events" },
  phone: { ar: "رقم الهاتف", en: "Phone" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  search: { ar: "عرض حجوزاتي", en: "Show my bookings" },
  searching: { ar: "جاري البحث...", en: "Searching..." },
  noResults: { ar: "لا توجد حجوزات لهذه البيانات", en: "No bookings found for these details" },
  filterAll: { ar: "الكل", en: "All" },
  filterAccommodation: { ar: "الإقامة", en: "Accommodation" },
  filterOffering: { ar: "تجارب ومواصلات", en: "Experiences & Transportation" },
  accommodation: { ar: "إقامة", en: "Accommodation" },
  trip: { ar: "رحلة مرتبطة", en: "Linked trip" },
} as const;

export default function MyBookingsPage() {
  const { locale } = useLocale();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<UnifiedBookingItem[] | null>(null);
  const [kindFilter, setKindFilter] = useState<"" | "ACCOMMODATION" | "OFFERING">("");

  async function search() {
    setLoading(true);
    setError(null);
    setItems(null);
    try {
      const res = await api.get<UnifiedBookingItem[]>(`/booking-area?phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}`);
      setItems(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "تعذر تحميل الحجوزات");
    } finally {
      setLoading(false);
    }
  }

  const filtered = (items ?? []).filter((i) => !kindFilter || i.kind === kindFilter);

  // Phase 6: group by bookingGroupId so a Trip/company-group relationship
  // (Accommodation + Airport Transfer + Tour + Experience sharing one
  // BookingGroup) is visible without restructuring anything underneath —
  // ungrouped items (bookingGroupId null) render individually as before.
  const grouped = new Map<string, UnifiedBookingItem[]>();
  const ungrouped: UnifiedBookingItem[] = [];
  for (const item of filtered) {
    if (item.bookingGroupId) {
      const list = grouped.get(item.bookingGroupId) ?? [];
      list.push(item);
      grouped.set(item.bookingGroupId, list);
    } else {
      ungrouped.push(item);
    }
  }

  return (
    <div className="screen active">
      <Navbar />
      <div className="sect">
        <div className="sect-ctr">
          <div className="sect-title-ar">{L.title[locale]}</div>
          <div className="gold-rule gold-rule-c" />
          <p style={{ textAlign: "center", color: "var(--mut)", maxWidth: 500, margin: "0 auto 20px" }}>{L.subtitle[locale]}</p>
        </div>

        <div className="form-card" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          <div className="fld"><label>{L.phone[locale]}</label><input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+201012345678" /></div>
          <div className="fld"><label>{L.email[locale]}</label><input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></div>
          {error && <div className="error-box">{error}</div>}
          <button className="btn-primary" disabled={loading || !phone || !email} onClick={search}>
            {loading ? L.searching[locale] : L.search[locale]}
          </button>
        </div>

        {items && (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <button className={`ab-btn ${kindFilter === "" ? "g" : "m"}`} onClick={() => setKindFilter("")} style={{ margin: 4 }}>{L.filterAll[locale]}</button>
              <button className={`ab-btn ${kindFilter === "ACCOMMODATION" ? "g" : "m"}`} onClick={() => setKindFilter("ACCOMMODATION")} style={{ margin: 4 }}>{L.filterAccommodation[locale]}</button>
              <button className={`ab-btn ${kindFilter === "OFFERING" ? "g" : "m"}`} onClick={() => setKindFilter("OFFERING")} style={{ margin: 4 }}>{L.filterOffering[locale]}</button>
            </div>

            {filtered.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)" }}>{L.noResults[locale]}</p>}

            <div style={{ maxWidth: 700, margin: "0 auto" }}>
              {[...grouped.entries()].map(([groupId, groupItems]) => (
                <div key={groupId} className="form-card" style={{ marginBottom: 16, borderInlineStart: "3px solid var(--gold, #b8860b)" }}>
                  <p style={{ fontSize: 12, color: "var(--mut)", marginBottom: 8 }}>{L.trip[locale]}</p>
                  {groupItems.map((item) => <BookingRow key={`${item.kind}-${item.id}`} item={item} locale={locale} phone={phone} email={email} />)}
                </div>
              ))}
              {ungrouped.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="form-card" style={{ marginBottom: 12 }}>
                  <BookingRow item={item} locale={locale} phone={phone} email={email} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

function BookingRow({ item, locale, phone, email }: { item: UnifiedBookingItem; locale: "ar" | "en"; phone: string; email: string }) {
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const title = locale === "ar" ? item.titleAr : item.titleEn;
  const location = locale === "ar" ? item.locationAr : item.locationEn;
  const start = new Date(item.startDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "short" });
  const end = item.endDate ? new Date(item.endDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "short" }) : null;
  const time = item.time ? new Date(item.time).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : null;

  // Phase 7: reviews only ever allowed once the booking is genuinely
  // COMPLETED — this mirrors, not duplicates, the backend's own gate
  // (offering-reviews.service.ts rejects with 409 if the booking isn't
  // COMPLETED), so hiding the button here is a UX courtesy, not the real
  // enforcement.
  const canReview = item.kind === "OFFERING" && item.status === "COMPLETED" && item.reference;

  async function submitReview() {
    setReviewError(null);
    try {
      await api.post("/offering-bookings/reviews", { bookingReference: item.reference, phone, email, overallRating: rating, reviewText: reviewText || undefined });
      setReviewSubmitted(true);
    } catch (err) {
      setReviewError(err instanceof ApiClientError ? err.message : "فشل إرسال التقييم");
    }
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--mut)", textTransform: "uppercase" }}>
            {item.kind === "ACCOMMODATION" ? (locale === "ar" ? "إقامة" : "Accommodation") : location}
          </div>
          <strong>{title}</strong>
          <div style={{ fontSize: 13, color: "var(--mut)" }}>
            {start}{end && ` – ${end}`}{time && ` — ${time}`}
          </div>
          {item.reference && <div style={{ fontSize: 12, color: "var(--mut)" }}>{item.reference}</div>}
        </div>
        <span className={`badge ${STATUS_BADGE[item.status] ?? "bp"}`}>{STATUS_LABEL[item.status]?.[locale] ?? item.status}</span>
      </div>

      {canReview && !reviewSubmitted && (
        <div style={{ marginTop: 8 }}>
          {!showReview ? (
            <button className="ab-btn m" onClick={() => setShowReview(true)}>{locale === "ar" ? "أضف تقييمًا" : "Leave a review"}</button>
          ) : (
            <div style={{ marginTop: 6 }}>
              {reviewError && <div className="error-box">{reviewError}</div>}
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (<option key={n} value={n}>{"⭐".repeat(n)}</option>))}
              </select>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder={locale === "ar" ? "رأيك (اختياري)" : "Your review (optional)"} style={{ display: "block", width: "100%", marginTop: 6 }} />
              <button className="ab-btn g" onClick={submitReview} style={{ marginTop: 6 }}>{locale === "ar" ? "إرسال" : "Submit"}</button>
            </div>
          )}
        </div>
      )}
      {reviewSubmitted && <p style={{ fontSize: 13, color: "var(--mut)", marginTop: 6 }}>{locale === "ar" ? "شكرًا لتقييمك!" : "Thanks for your review!"}</p>}
    </div>
  );
}
