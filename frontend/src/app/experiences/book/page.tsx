"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";
import { NATIONALITIES } from "@/lib/constants/nationalities";
import { useLocale } from "@/lib/LocaleContext";
import { offeringBookingSchema, type OfferingBookingFormValues } from "@/lib/validation/offeringBooking.schema";

interface OfferingDetail {
  id: string;
  offeringType: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  meetingPoint: string | null;
  durationMinutes: number | null;
  languages: string[];
  minAge: number | null;
  accessibilityInfo: string | null;
  importantInstructions: string | null;
  pricingModel: string;
  pricePerPerson: string | null;
  pricePerVehicle: string | null;
  pricePerGroup: string | null;
  privateBookingPrice: string | null;
  childPrice: string | null;
  currency: string;
  minGuests: number;
  maxGuests: number | null;
  vehicleType: string | null;
  cancellationPolicy: string;
  cancellationPolicyText: string | null;
  images: { url: string }[];
  city: { nameAr: string; nameEn: string };
  district: { nameAr: string; nameEn: string } | null;
  category: { nameAr: string; nameEn: string } | null;
  partner: { companyName: string; phone: string | null };
}

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isRangeAvailability: boolean;
  capacityTotal: number;
  capacityBooked: number;
}

interface BookingResult {
  id: string;
  bookingReference: string;
  status: string;
  totalPrice: string;
  currency: string;
  holdExpiresAt: string | null;
}

const CANCELLATION_LABEL: Record<string, { ar: string; en: string }> = {
  FREE_24H: { ar: "إلغاء مجاني حتى 24 ساعة قبل الموعد", en: "Free cancellation up to 24 hours before" },
  FREE_48H: { ar: "إلغاء مجاني حتى 48 ساعة قبل الموعد", en: "Free cancellation up to 48 hours before" },
  NON_REFUNDABLE: { ar: "غير قابل للاسترداد", en: "Non-refundable" },
  CUSTOM: { ar: "", en: "" },
};

const VEHICLE_TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  SEDAN: { ar: "سيدان", en: "Sedan" },
  SUV: { ar: "دفع رباعي", en: "SUV" },
  VAN: { ar: "فان", en: "Van" },
  MINIBUS: { ar: "ميني باص", en: "Minibus" },
};

interface OfferingReview {
  id: string;
  overallRating: number;
  partnerRating: number | null;
  guideRating: number | null;
  reviewText: string | null;
  photos: string[];
  createdAt: string;
  guest: { fullName: string };
}

const L = {
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  notFound: { ar: "هذا العرض غير متاح حاليًا", en: "This offering is not currently available" },
  chooseSlot: { ar: "اختر الموعد", en: "Choose a time" },
  noSlots: { ar: "لا توجد مواعيد متاحة حاليًا لهذا العرض", en: "No availability currently open for this offering" },
  seatsLeft: { ar: "مقعد متبقٍ", en: "seats left" },
  fullyBooked: { ar: "مكتمل", en: "Fully booked" },
  adults: { ar: "بالغون", en: "Adults" },
  children: { ar: "أطفال", en: "Children" },
  fullName: { ar: "الاسم الكامل", en: "Full name" },
  phone: { ar: "رقم الهاتف", en: "Phone" },
  whatsapp: { ar: "واتساب (اختياري)", en: "WhatsApp (optional)" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  nationality: { ar: "الجنسية", en: "Nationality" },
  notes: { ar: "ملاحظات (اختياري)", en: "Notes (optional)" },
  terms: { ar: "أوافق على سياسة الحجز والإلغاء", en: "I agree to the booking and cancellation policy" },
  reserve: { ar: "تأكيد الحجز", en: "Confirm reservation" },
  submitting: { ar: "جاري الإرسال...", en: "Submitting..." },
  cancellationPolicy: { ar: "سياسة الإلغاء", en: "Cancellation policy" },
  meetingPoint: { ar: "نقطة اللقاء", en: "Meeting point" },
  duration: { ar: "المدة", en: "Duration" },
  languages: { ar: "اللغات", en: "Languages" },
  capacity: { ar: "السعة", en: "Capacity" },
  guests: { ar: "ضيوف", en: "guests" },
  vehicleType: { ar: "نوع المركبة", en: "Vehicle type" },
  passengerCapacity: { ar: "سعة الركاب", en: "Passenger capacity" },
  pickup: { ar: "موقع الانطلاق", en: "Pickup location" },
  destination: { ar: "الوجهة", en: "Destination" },
  bags: { ar: "عدد الحقائب", en: "Bags" },
  childSeat: { ar: "مطلوب مقعد أطفال", en: "Child seat required" },
  minutes: { ar: "دقيقة", en: "minutes" },
  confirmedTitle: { ar: "تم إرسال طلب الحجز", en: "Reservation request sent" },
  confirmedBody: {
    ar: "حجزك الآن قيد الانتظار حتى يتم تأكيده من الشريك. احتفظ برقم المرجع للمتابعة.",
    en: "Your booking is pending confirmation from the partner. Keep your reference number to follow up.",
  },
  reference: { ar: "رقم المرجع", en: "Booking reference" },
  total: { ar: "الإجمالي", en: "Total" },
  reviewsTitle: { ar: "آراء الضيوف", en: "Guest reviews" },
  noReviews: { ar: "لا توجد تقييمات بعد", en: "No reviews yet" },
  crossSellTitle: { ar: "أكمل رحلتك في القاهرة", en: "Complete your Cairo trip" },
} as const;

export default function BookOfferingPage() {
  return (
    <Suspense fallback={null}>
      <OfferingBookingFlow />
    </Suspense>
  );
}

function OfferingBookingFlow() {
  const searchParams = useSearchParams();
  const offeringId = searchParams.get("offeringId") ?? "";
  const { locale } = useLocale();
  const nameFor = (o: { nameAr: string; nameEn: string } | null | undefined) => (o ? (locale === "ar" ? o.nameAr : o.nameEn) : "");

  const [offering, setOffering] = useState<OfferingDetail | null | undefined>(undefined); // undefined = loading, null = not found
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<OfferingReview[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [crossSell, setCrossSell] = useState<{ id: string; nameAr: string; nameEn: string; offeringType: string }[]>([]);

  useEffect(() => {
    if (!offeringId) {
      setOffering(null);
      return;
    }
    api
      .get<OfferingDetail>(`/offerings/${offeringId}`)
      .then(setOffering)
      .catch(() => setOffering(null));
    api
      .get<AvailabilitySlot[]>(`/offerings/${offeringId}/availability`)
      .then(setSlots)
      .catch(() => setSlots([]));
    api
      .get<OfferingReview[]>(`/offerings/${offeringId}/reviews`)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [offeringId]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OfferingBookingFormValues>({
    resolver: zodResolver(offeringBookingSchema),
    defaultValues: { offeringId, adultCount: 1, childCount: 0, termsAccepted: false as unknown as true },
  });

  useEffect(() => setValue("offeringId", offeringId), [offeringId, setValue]);

  useEffect(() => {
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (slot) setValue("bookingDate", new Date(slot.date), { shouldValidate: true });
  }, [selectedSlotId, slots, setValue]);

  const adultCount = watch("adultCount") || 1;
  const childCount = watch("childCount") || 0;

  async function onSubmit(values: OfferingBookingFormValues) {
    if (!offering) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const slot = slots.find((s) => s.id === selectedSlotId);
      const payload = {
        ...values,
        availabilitySlotId: selectedSlotId || undefined,
        bookingDate: slot ? slot.date : values.bookingDate,
        bookingTime: slot?.startTime ?? undefined,
      };
      const created = await api.post<BookingResult>("/offering-bookings", payload);
      setResult(created);
      // §18 cross-sell: real complementary offerings only, never fabricated.
      // Transportation booked → suggest experiences/tours; anything else →
      // suggest transportation (airport transfer etc.). Non-intrusive: just
      // a small list shown once, on the confirmation screen only.
      const complementaryType = offering.offeringType === "TRANSPORTATION" ? "EXPERIENCE" : "TRANSPORTATION";
      api
        .get<{ items: { id: string; nameAr: string; nameEn: string; offeringType: string }[] }>(`/offerings?offeringType=${complementaryType}&pageSize=3`)
        .then((res) => setCrossSell(res.items))
        .catch(() => setCrossSell([]));
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "فشل إتمام الحجز");
    } finally {
      setSubmitting(false);
    }
  }

  if (offering === undefined) {
    return (
      <div className="screen active">
        <Navbar />
        <div className="sect"><p style={{ textAlign: "center" }}>{L.loading[locale]}</p></div>
        <Footer />
      </div>
    );
  }
  if (offering === null) {
    return (
      <div className="screen active">
        <Navbar />
        <div className="sect"><div className="error-box" style={{ maxWidth: 500, margin: "0 auto" }}>{L.notFound[locale]}</div></div>
        <Footer />
      </div>
    );
  }

  if (result) {
    return (
      <div className="screen active">
        <Navbar />
        <div className="sect">
          <div className="form-card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <h2>{L.confirmedTitle[locale]}</h2>
            <p style={{ color: "var(--mut)" }}>{L.confirmedBody[locale]}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: "16px 0" }}>{result.bookingReference}</p>
            <p>{L.total[locale]}: {Number(result.totalPrice).toLocaleString()} {result.currency}</p>
            <a href="/my-bookings" style={{ fontSize: 13, display: "inline-block", marginTop: 8 }}>
              {locale === "ar" ? "تابع حالة حجزك لاحقًا" : "Track your booking status later"}
            </a>
          </div>
          {crossSell.length > 0 && (
            <div style={{ maxWidth: 480, margin: "20px auto 0" }}>
              <h4 style={{ textAlign: "center" }}>{L.crossSellTitle[locale]}</h4>
              <div className="listings-grid">
                {crossSell.map((c) => (
                  <a key={c.id} href={`/experiences/book?offeringId=${c.id}`} className="listing-card" style={{ textDecoration: "none" }}>
                    <div className="lc-body"><div className="lc-title">{locale === "ar" ? c.nameAr : c.nameEn}</div></div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const priceLabel =
    offering.pricingModel === "PER_PERSON" ? offering.pricePerPerson :
    offering.pricingModel === "PER_VEHICLE" ? offering.pricePerVehicle :
    offering.pricingModel === "PER_GROUP" ? offering.pricePerGroup :
    offering.privateBookingPrice;

  return (
    <div className="screen active">
      <Navbar />
      <div className="sect">
        <div className="sect-ctr">
          <div className="sect-title-ar">{locale === "ar" ? offering.nameAr : offering.nameEn}</div>
          <div className="gold-rule gold-rule-c" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          <div>
            {offering.images[0]?.url && (
              <img src={offering.images[0].url} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 16, objectFit: "cover", maxHeight: 320 }} />
            )}
            <p style={{ fontFamily: "var(--fnar)" }}>{locale === "ar" ? offering.descriptionAr : offering.descriptionEn}</p>
            <ul style={{ fontSize: 14, color: "var(--mut)", marginTop: 12 }}>
              <li>{nameFor(offering.city)}{offering.district ? ` — ${nameFor(offering.district)}` : ""}</li>
              {offering.meetingPoint && <li>{L.meetingPoint[locale]}: {offering.meetingPoint}</li>}
              {offering.durationMinutes && <li>{L.duration[locale]}: {offering.durationMinutes} {L.minutes[locale]}</li>}
              {offering.languages.length > 0 && <li>{L.languages[locale]}: {offering.languages.join(", ")}</li>}
              <li>{L.capacity[locale]}: {offering.minGuests}{offering.maxGuests ? `–${offering.maxGuests}` : "+"} {L.guests[locale]}</li>
            </ul>
            {offering.cancellationPolicy !== "CUSTOM" ? (
              <p style={{ fontSize: 13, marginTop: 12 }}>
                <strong>{L.cancellationPolicy[locale]}:</strong> {CANCELLATION_LABEL[offering.cancellationPolicy]?.[locale]}
              </p>
            ) : (
              offering.cancellationPolicyText && (
                <p style={{ fontSize: 13, marginTop: 12 }}>
                  <strong>{L.cancellationPolicy[locale]}:</strong> {offering.cancellationPolicyText}
                </p>
              )
            )}

            <div style={{ marginTop: 24 }}>
              <h3>{L.reviewsTitle[locale]}</h3>
              {reviews.length === 0 && <p style={{ color: "var(--mut)", fontSize: 14 }}>{L.noReviews[locale]}</p>}
              {reviews.map((r) => (
                <div key={r.id} style={{ borderTop: "1px solid var(--line, #eee)", padding: "10px 0" }}>
                  <div style={{ fontWeight: 600 }}>
                    {"⭐".repeat(r.overallRating)} — {r.guest.fullName}
                  </div>
                  {r.reviewText && <p style={{ fontSize: 14, margin: "4px 0" }}>{r.reviewText}</p>}
                  <div style={{ fontSize: 12, color: "var(--mut)" }}>
                    {new Date(r.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {offering.pricingModel === "CUSTOM_QUOTE" ? (
            <QuoteRequestForm offeringId={offering.id} locale={locale} />
          ) : (
          <div className="form-card">
            {priceLabel && (
              <div className="lc-price" style={{ marginBottom: 12 }}>
                {Number(priceLabel).toLocaleString()} {offering.currency}
              </div>
            )}

            <div className="fld">
              <label>{L.chooseSlot[locale]}</label>
              {slots.length === 0 && <p style={{ color: "var(--mut)", fontSize: 13 }}>{L.noSlots[locale]}</p>}
              {slots.map((s) => {
                const remaining = s.capacityTotal - s.capacityBooked;
                return (
                  <label key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", opacity: remaining <= 0 ? 0.5 : 1 }}>
                    <span>
                      <input
                        type="radio"
                        name="slot"
                        disabled={remaining <= 0}
                        checked={selectedSlotId === s.id}
                        onChange={() => setSelectedSlotId(s.id)}
                        style={{ marginInlineEnd: 6 }}
                      />
                      {new Date(s.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
                      {s.startTime && ` — ${new Date(s.startTime).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}`}
                    </span>
                    <span>{remaining > 0 ? `${remaining} ${L.seatsLeft[locale]}` : L.fullyBooked[locale]}</span>
                  </label>
                );
              })}
              {slots.length === 0 && (
                <input type="date" {...register("bookingDate", { valueAsDate: true })} min={new Date().toISOString().slice(0, 10)} />
              )}
              {errors.bookingDate && <div className="error-box">{errors.bookingDate.message}</div>}
            </div>

            <div className="frow">
              <div className="fld">
                <label>{L.adults[locale]}</label>
                <input type="number" min={1} max={offering.maxGuests ?? 200} {...register("adultCount", { valueAsNumber: true })} />
              </div>
              <div className="fld">
                <label>{L.children[locale]}</label>
                <input type="number" min={0} {...register("childCount", { valueAsNumber: true })} />
              </div>
            </div>
            {offering.maxGuests && adultCount + childCount > offering.maxGuests && (
              <div className="error-box">{locale === "ar" ? `الحد الأقصى ${offering.maxGuests} ضيوف` : `Maximum ${offering.maxGuests} guests`}</div>
            )}

            {offering.offeringType === "TRANSPORTATION" && (
              <>
                {offering.vehicleType && (
                  <p style={{ fontSize: 13, color: "var(--mut)" }}>
                    {L.vehicleType[locale]}: {VEHICLE_TYPE_LABEL[offering.vehicleType]?.[locale] ?? offering.vehicleType}
                    {" — "}{L.passengerCapacity[locale]}: {offering.minGuests}{offering.maxGuests ? `–${offering.maxGuests}` : "+"}
                  </p>
                )}
                <div className="fld"><label>{L.pickup[locale]}</label><input {...register("pickupLocation")} /></div>
                <div className="fld"><label>{L.destination[locale]}</label><input {...register("destinationLocation")} /></div>
                <div className="frow">
                  <div className="fld"><label>{L.bags[locale]}</label><input type="number" min={0} {...register("bagCount", { valueAsNumber: true })} /></div>
                  <div className="fld">
                    <label>
                      <input type="checkbox" {...register("childSeatRequired")} style={{ marginInlineEnd: 4 }} />
                      {L.childSeat[locale]}
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="fld"><label>{L.fullName[locale]}</label><input {...register("fullName")} />{errors.fullName && <div className="error-box">{errors.fullName.message}</div>}</div>
            <div className="fld"><label>{L.phone[locale]}</label><input {...register("phone")} dir="ltr" />{errors.phone && <div className="error-box">{errors.phone.message}</div>}</div>
            <div className="fld"><label>{L.whatsapp[locale]}</label><input {...register("whatsappNumber")} dir="ltr" /></div>
            <div className="fld"><label>{L.email[locale]}</label><input {...register("email")} dir="ltr" />{errors.email && <div className="error-box">{errors.email.message}</div>}</div>
            <div className="fld">
              <label>{L.nationality[locale]}</label>
              <select {...register("nationality")}>
                <option value="">—</option>
                {NATIONALITIES.map((n) => (<option value={n.code} key={n.code}>{locale === "ar" ? n.labelAr : n.labelEn}</option>))}
              </select>
              {errors.nationality && <div className="error-box">{errors.nationality.message}</div>}
            </div>
            <div className="fld"><label>{L.notes[locale]}</label><textarea {...register("notes")} /></div>

            <div className="policy-box">
              <input type="checkbox" {...register("termsAccepted")} />
              <div className="policy-txt">{L.terms[locale]}</div>
            </div>
            {errors.termsAccepted && <div className="error-box">{errors.termsAccepted.message}</div>}
            {submitError && <div className="error-box">{submitError}</div>}

            <button className="btn-primary" disabled={submitting} onClick={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
              {submitting ? L.submitting[locale] : L.reserve[locale]}
            </button>
          </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function QuoteRequestForm({ offeringId, locale }: { offeringId: string; locale: "ar" | "en" }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    eventType: "",
    preferredDate: "",
    preferredTime: "",
    guestCount: 50,
    preferredLocation: "",
    budgetRangeMin: "",
    budgetRangeMax: "",
    specialRequirements: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const TXT = {
    title: { ar: "اطلب عرض سعر", en: "Request a Quote" },
    subtitle: {
      ar: "هذا العرض لا يحتوي على سعر ثابت — أرسل التفاصيل وسيتواصل معك مقدم الخدمة بعرض سعر.",
      en: "This offering has no fixed online price — send the details and the provider will follow up with a quote.",
    },
    eventType: { ar: "نوع المناسبة", en: "Event type" },
    date: { ar: "التاريخ المفضل", en: "Preferred date" },
    time: { ar: "الوقت المفضل", en: "Preferred time" },
    guests: { ar: "عدد الضيوف المتوقع", en: "Expected guests" },
    location: { ar: "الموقع المفضل (اختياري)", en: "Preferred location (optional)" },
    budgetMin: { ar: "الميزانية من (اختياري)", en: "Budget from (optional)" },
    budgetMax: { ar: "الميزانية إلى (اختياري)", en: "Budget to (optional)" },
    requirements: { ar: "متطلبات خاصة (اختياري)", en: "Special requirements (optional)" },
    name: { ar: "الاسم", en: "Name" },
    phone: { ar: "الهاتف", en: "Phone" },
    email: { ar: "البريد الإلكتروني", en: "Email" },
    send: { ar: "إرسال الطلب", en: "Send request" },
    sending: { ar: "جاري الإرسال...", en: "Sending..." },
    doneTitle: { ar: "تم إرسال طلبك", en: "Your request has been sent" },
    doneBody: { ar: "سيتواصل معك مقدم الخدمة بعرض السعر قريبًا.", en: "The provider will follow up with a quote soon." },
  } as const;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/offerings/quote-requests", {
        offeringId,
        eventType: form.eventType,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        guestCount: Number(form.guestCount),
        preferredLocation: form.preferredLocation || undefined,
        budgetRangeMin: form.budgetRangeMin ? Number(form.budgetRangeMin) : undefined,
        budgetRangeMax: form.budgetRangeMax ? Number(form.budgetRangeMax) : undefined,
        specialRequirements: form.specialRequirements || undefined,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="form-card" style={{ textAlign: "center" }}>
        <h3>{TXT.doneTitle[locale]}</h3>
        <p style={{ color: "var(--mut)" }}>{TXT.doneBody[locale]}</p>
      </div>
    );
  }

  return (
    <div className="form-card">
      <h3>{TXT.title[locale]}</h3>
      <p style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>{TXT.subtitle[locale]}</p>
      {error && <div className="error-box">{error}</div>}
      <div className="fld"><label>{TXT.eventType[locale]}</label><input value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} /></div>
      <div className="frow">
        <div className="fld"><label>{TXT.date[locale]}</label><input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} /></div>
        <div className="fld"><label>{TXT.time[locale]}</label><input type="time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} /></div>
      </div>
      <div className="fld"><label>{TXT.guests[locale]}</label><input type="number" min={1} value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })} /></div>
      <div className="fld"><label>{TXT.location[locale]}</label><input value={form.preferredLocation} onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })} /></div>
      <div className="frow">
        <div className="fld"><label>{TXT.budgetMin[locale]}</label><input type="number" min={0} value={form.budgetRangeMin} onChange={(e) => setForm({ ...form, budgetRangeMin: e.target.value })} /></div>
        <div className="fld"><label>{TXT.budgetMax[locale]}</label><input type="number" min={0} value={form.budgetRangeMax} onChange={(e) => setForm({ ...form, budgetRangeMax: e.target.value })} /></div>
      </div>
      <div className="fld"><label>{TXT.requirements[locale]}</label><textarea value={form.specialRequirements} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })} /></div>
      <div className="fld"><label>{TXT.name[locale]}</label><input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
      <div className="fld"><label>{TXT.phone[locale]}</label><input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} dir="ltr" placeholder="+201012345678" /></div>
      <div className="fld"><label>{TXT.email[locale]}</label><input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} dir="ltr" /></div>
      <button className="btn-primary" disabled={submitting} onClick={submit} style={{ marginTop: 12 }}>
        {submitting ? TXT.sending[locale] : TXT.send[locale]}
      </button>
    </div>
  );
}
