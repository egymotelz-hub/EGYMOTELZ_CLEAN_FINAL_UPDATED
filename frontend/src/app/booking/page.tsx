"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";
import { NATIONALITIES } from "@/lib/constants/nationalities";
import { bookingSchema, type BookingFormValues } from "@/lib/validation/booking.schema";

interface UnitOption {
  id: string;
  bedrooms: number;
  pricePerNight: string;
  currency: string;
  property: {
    city: { nameAr: string } | null;
    district: { nameAr: string } | null;
    districtFreeText: string | null;
  };
}

interface BookingResult {
  id: string;
  status: string;
  paymentStatus: string;
  paymentReference: string | null;
  totalPrice: string | null;
  currency: string;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayISO(): string {
  return formatLocalDate(new Date());
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingForm />
    </Suspense>
  );
}

type Step = "details" | "payment" | "confirmation";

function BookingForm() {
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get("unitId") ?? "";

  const [step, setStep] = useState<Step>("details");
  const [unitsStatus, setUnitsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<BookingFormValues | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  // Item 6: purely decorative mock card fields — no real payment gateway
  // exists in this environment. The actual "charge" happens server-side via
  // a mock PaymentAdapter when the booking is created; these fields are
  // never sent anywhere, they just make the step feel like a real payment form.
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onBlur",
    defaultValues: {
      unitId: preselectedUnitId,
      fullName: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      nationality: "",
      guestCount: 1,
      notes: "",
      termsAccepted: false as unknown as true,
    },
  });

  async function loadUnits() {
    setUnitsStatus("loading");
    try {
      const res = await api.get<{ items: UnitOption[] }>("/units?pageSize=50");
      let items = res.items;
      if (preselectedUnitId && !items.some((u) => u.id === preselectedUnitId)) {
        try {
          const specific = await api.get<UnitOption>(`/units/${preselectedUnitId}`);
          items = [specific, ...items];
        } catch {
          // preselected unit may no longer be published — not fatal
        }
      }
      setUnits(items);
      setUnitsStatus("ready");
    } catch {
      setUnitsStatus("error");
    }
  }

  useEffect(() => {
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkInValue = watch("checkIn");
  const checkInMin = todayISO();
  const checkOutMin = checkInValue ? formatLocalDate(new Date(checkInValue)) : checkInMin;

  const selectedUnitId = watch("unitId");
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const nights = useMemo(() => {
    const ci = watch("checkIn");
    const co = watch("checkOut");
    if (!ci || !co) return 0;
    const d = (new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000;
    return d > 0 ? Math.round(d) : 0;
  }, [watch]);
  const estimatedTotal = selectedUnit ? Number(selectedUnit.pricePerNight) * nights : 0;

  // Step 1 -> Step 2: validate details, don't hit the API yet.
  const proceedToPayment = handleSubmit((values) => {
    setPendingValues(values);
    setStep("payment");
  });

  // Step 2 -> Step 3: this is where the booking is actually created, and
  // where the server-side mock payment charge actually happens.
  async function pay() {
    if (!pendingValues) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post<BookingResult>("/bookings", {
        ...pendingValues,
        checkIn: pendingValues.checkIn.toISOString().slice(0, 10),
        checkOut: pendingValues.checkOut.toISOString().slice(0, 10),
        notes: pendingValues.notes || undefined,
        whatsappNumber: pendingValues.whatsappNumber || undefined,
      });
      setResult(res);
      setStep("confirmation");
    } catch (err) {
      // Surfaces the 409 "dates unavailable" / 402 "payment failed" cases cleanly.
      setSubmitError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen active" id="sc-booking">
      <Navbar />
      <div className="form-hero fh">
        <h1>احجز إقامتك</h1>
        <p>
          {step === "details" && "الخطوة ١ من ٣ — بيانات الحجز"}
          {step === "payment" && "الخطوة ٢ من ٣ — الدفع"}
          {step === "confirmation" && "تم تأكيد الحجز"}
        </p>
      </div>
      <div className="form-wrap">
        <div className="form-card">
          {step === "confirmation" && result && (
            <div className="success-state">
              <div className="suc-icon">✓</div>
              <p style={{ fontFamily: "var(--fnar)", color: "var(--txt)", marginBottom: 6 }}>
                تم استلام طلبك وتأكيد الدفع، سيتواصل فريقنا خلال ٢٤ ساعة
              </p>
              <p style={{ fontFamily: "var(--fnar)", color: "var(--mut)", fontSize: 12 }}>
                رقم الحجز: <code>{result.id}</code>
                <br />
                حالة الدفع: {result.paymentStatus === "PAID" ? "تم الدفع ✓" : result.paymentStatus}
                {result.paymentReference && (
                  <>
                    <br />
                    مرجع العملية: <code>{result.paymentReference}</code>
                  </>
                )}
              </p>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line, #eee)" }}>
                <p style={{ fontFamily: "var(--fnar)", marginBottom: 8 }}>أكمل رحلتك في القاهرة</p>
                <a href="/experiences" className="ab-btn g" style={{ textDecoration: "none" }}>اكتشف الجولات والتجارب</a>
              </div>
            </div>
          )}

          {step === "details" && (
            <form onSubmit={proceedToPayment}>
              {submitError && <div className="error-box">{submitError}</div>}

              <div className="fld">
                <label>الوحدة</label>
                {unitsStatus === "loading" && (
                  <select disabled><option>جاري تحميل الوحدات...</option></select>
                )}
                {unitsStatus === "error" && (
                  <div className="error-box">
                    تعذر تحميل الوحدات المتاحة.{" "}
                    <button type="button" className="ab-btn g" onClick={loadUnits}>إعادة المحاولة</button>
                  </div>
                )}
                {unitsStatus === "ready" && units.length === 0 && (
                  <div className="disc-box">لا توجد وحدات متاحة للحجز حاليًا، حاول مرة أخرى لاحقًا</div>
                )}
                {unitsStatus === "ready" && units.length > 0 && (
                  <select {...register("unitId")}>
                    <option value="">اختر وحدة</option>
                    {units.map((u) => {
                      const districtLabel = u.property.district?.nameAr ?? u.property.districtFreeText ?? "";
                      return (
                        <option value={u.id} key={u.id}>
                          {u.bedrooms} غرفة — {districtLabel}{districtLabel ? "، " : ""}{u.property.city?.nameAr ?? ""} —{" "}
                          {Number(u.pricePerNight).toLocaleString()} {u.currency}/ليلة
                        </option>
                      );
                    })}
                  </select>
                )}
                {errors.unitId && <div className="error-box">{errors.unitId.message}</div>}
              </div>

              <div className="fld">
                <label>الاسم الكامل</label>
                <input {...register("fullName")} />
                {errors.fullName && <div className="error-box">{errors.fullName.message}</div>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>رقم الهاتف (دولي)</label>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <input
                        value={field.value}
                        placeholder="+201012345678"
                        maxLength={16}
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9+]/g, ""))}
                      />
                    )}
                  />
                  {errors.phone && <div className="error-box">{errors.phone.message}</div>}
                </div>
                <div className="fld">
                  <label>البريد الإلكتروني</label>
                  <input type="email" {...register("email")} />
                  {errors.email && <div className="error-box">{errors.email.message}</div>}
                </div>
              </div>
              <div className="fld">
                <label>رقم واتساب (اختياري، إذا كان مختلفًا عن الهاتف)</label>
                <Controller
                  control={control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <input
                      value={field.value ?? ""}
                      placeholder="+201012345678"
                      maxLength={16}
                      onBlur={field.onBlur}
                      onChange={(e) => field.onChange(e.target.value.replace(/[^0-9+]/g, ""))}
                    />
                  )}
                />
                {errors.whatsappNumber && <div className="error-box">{errors.whatsappNumber.message}</div>}
              </div>
              <div className="fld">
                <label>الجنسية</label>
                <select {...register("nationality")}>
                  <option value="">اختر الجنسية</option>
                  {NATIONALITIES.map((n) => (
                    <option value={n.labelEn} key={n.code}>{n.labelAr}</option>
                  ))}
                </select>
                {errors.nationality && <div className="error-box">{errors.nationality.message}</div>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>تاريخ الوصول</label>
                  <input type="date" min={checkInMin} {...register("checkIn")} />
                  {errors.checkIn && <div className="error-box">{errors.checkIn.message}</div>}
                </div>
                <div className="fld">
                  <label>تاريخ المغادرة</label>
                  <input type="date" min={checkOutMin} {...register("checkOut")} />
                  {errors.checkOut && <div className="error-box">{errors.checkOut.message}</div>}
                </div>
              </div>
              <div className="fld">
                <label>عدد الضيوف</label>
                <input type="number" min={1} max={100} {...register("guestCount", { valueAsNumber: true })} />
              </div>
              <div className="fld">
                <label>ملاحظات</label>
                <textarea {...register("notes")} />
              </div>
              <div className="policy-box">
                <input type="checkbox" {...register("termsAccepted")} />
                <div className="policy-txt">
                  <p>أوافق على سياسة الحجز والإلغاء الخاصة بـ EGYMOTELZ</p>
                </div>
              </div>
              {errors.termsAccepted && <div className="error-box">{errors.termsAccepted.message}</div>}
              <button type="submit" className="btn-primary">المتابعة للدفع</button>
            </form>
          )}

          {step === "payment" && pendingValues && (
            <div>
              {submitError && <div className="error-box">{submitError}</div>}
              <div className="results" style={{ marginBottom: 16 }}>
                <div className="rr">
                  <label>عدد الليالي</label>
                  <span className="rv">{nights}</span>
                </div>
                <div className="rr total">
                  <label>الإجمالي المتوقع</label>
                  <span className="rv">
                    {estimatedTotal.toLocaleString()} {selectedUnit?.currency ?? "EGP"}
                  </span>
                </div>
              </div>

              <div className="disc-box">
                هذه بيانات دفع تجريبية لأغراض العرض فقط — لا توجد بوابة دفع حقيقية متصلة بعد. لن يتم خصم أي مبلغ فعلي.
              </div>

              <div className="fld">
                <label>رقم البطاقة</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={16}
                />
              </div>
              <div className="frow">
                <div className="fld">
                  <label>تاريخ الانتهاء</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="fld">
                  <label>CVV</label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep("details")}>رجوع</button>
                <button type="button" className="btn-primary" disabled={submitting} onClick={pay}>
                  {submitting ? "جاري الدفع..." : `ادفع ${estimatedTotal.toLocaleString()} ${selectedUnit?.currency ?? "EGP"}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
