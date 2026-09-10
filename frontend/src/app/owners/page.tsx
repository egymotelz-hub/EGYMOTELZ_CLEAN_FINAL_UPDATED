"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MoneyInput } from "@/components/MoneyInput";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api, ApiClientError } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";
import { translateMessage } from "@/lib/formErrorTranslations";
import { ownerApplicationSchema, type OwnerApplicationFormValues } from "@/lib/validation/ownerApplication.schema";

// English Task 2 (Forms): bilingual UI text only — labels, placeholders,
// buttons, step labels, option labels, disclaimers. Validation RULES
// (ownerApplicationSchema) are unchanged; only how their existing messages
// display is affected, via translateMessage().
const STEP_LABELS_AR = ["البيانات", "العقار", "الحالة", "التمويل", "المستندات", "المراجعة"];
const STEP_LABELS_EN = ["Details", "Property", "Condition", "Financing", "Documents", "Review"];

// Which fields belong to each step, so "Next" only validates what's visible
// on that step rather than the whole form at once.
const STEP_FIELDS: (keyof OwnerApplicationFormValues)[][] = [
  ["fullName", "phone", "email", "nationalId", "password"],
  ["propertyType", "cityId", "districtId", "address", "floorCount", "unitCount"],
  ["readinessOptions", "finishingTypes", "furnishingItems", "notes"],
  ["needsFinancing", "needsFurnishingHelp", "budgetAmount"],
  [],
  ["termsAccepted"],
];

const READINESS_OPTIONS = [
  { value: "FINISHING_REQUIRED" as const, ar: "يحتاج تشطيب", en: "Needs finishing" },
  { value: "FURNISHING_REQUIRED" as const, ar: "يحتاج تأثيث", en: "Needs furnishing" },
  { value: "FULLY_READY" as const, ar: "جاهز بالكامل", en: "Fully ready" },
];

const FINISHING_TYPES = [
  { value: "PAINTING" as const, ar: "دهانات", en: "Painting" },
  { value: "PLUMBING" as const, ar: "سباكة", en: "Plumbing" },
  { value: "ELECTRICAL" as const, ar: "كهرباء", en: "Electrical" },
  { value: "FLOORING" as const, ar: "أرضيات", en: "Flooring" },
  { value: "DOORS_WINDOWS" as const, ar: "أبواب ونوافذ", en: "Doors & Windows" },
  { value: "BATHROOMS" as const, ar: "حمامات", en: "Bathrooms" },
  { value: "KITCHEN" as const, ar: "مطبخ", en: "Kitchen" },
  { value: "CEILING" as const, ar: "أسقف", en: "Ceiling" },
  { value: "FULL_FINISHING" as const, ar: "تشطيب كامل", en: "Full finishing" },
  { value: "OTHER" as const, ar: "أخرى", en: "Other" },
];

const FURNISHING_ITEMS = [
  { value: "BEDROOM" as const, ar: "غرفة نوم", en: "Bedroom" },
  { value: "LIVING_ROOM" as const, ar: "غرفة معيشة", en: "Living room" },
  { value: "KITCHEN_APPLIANCES" as const, ar: "أجهزة مطبخ", en: "Kitchen appliances" },
  { value: "AIR_CONDITIONING" as const, ar: "تكييف", en: "Air conditioning" },
  { value: "TV" as const, ar: "تلفزيون", en: "TV" },
  { value: "CURTAINS" as const, ar: "ستائر", en: "Curtains" },
  { value: "COMPLETE_FURNISHING" as const, ar: "تأثيث كامل", en: "Complete furnishing" },
];

const PROPERTY_TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  RESIDENTIAL_BUILDING: { ar: "عمارة سكنية", en: "Residential building" },
  VILLA: { ar: "فيلا", en: "Villa" },
  FULL_FLOOR: { ar: "طابق كامل", en: "Full floor" },
  APARTMENT: { ar: "شقة", en: "Apartment" },
};

const L = {
  doneTitle: { ar: "تم استلام طلبك", en: "Your application has been received" },
  doneSub: { ar: "فريقنا سيتواصل معك خلال ٤٨ ساعة", en: "Our team will contact you within 48 hours" },
  thanks: { ar: "شكرًا", en: "Thank you" },
  applicationNumber: { ar: "رقم الطلب:", en: "Application ID:" },
  doneNote: { ar: "تم إنشاء حسابك بكلمة المرور التي أدخلتها. سجّل الدخول الآن لرفع مستنداتك (البطاقة الشخصية، عقد الملكية، وأي مستندات إضافية) ومتابعة حالة طلبك.", en: "Your account has been created with the password you entered. Log in now to upload your documents (ID, ownership contract, and any additional documents) and track your application status." },
  loginToUpload: { ar: "تسجيل الدخول لرفع المستندات", en: "Log In to Upload Documents" },
  heroTitle: { ar: "انضم كمالك عقار", en: "Join as a Property Owner" },
  heroSub: { ar: "حوّل عقارك إلى مصدر دخل مستقر معنا", en: "Turn your property into a stable source of income with us" },
  fullName: { ar: "الاسم الكامل", en: "Full Name" },
  phone: { ar: "رقم الهاتف (دولي)", en: "Phone Number (international)" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  whatsapp: { ar: "رقم واتساب (اختياري، إذا كان مختلفًا عن الهاتف)", en: "WhatsApp Number (optional, if different from phone)" },
  nationalId: { ar: "الرقم القومي", en: "National ID" },
  password: { ar: "كلمة المرور", en: "Password" },
  passwordHint: { ar: "8 أحرف على الأقل، تحتوي على حرف كبير ورقم واحد على الأقل", en: "At least 8 characters, containing an uppercase letter and at least one digit" },
  next: { ar: "التالي", en: "Next" },
  back: { ar: "رجوع", en: "Back" },
  propertyType: { ar: "نوع العقار", en: "Property Type" },
  governorate: { ar: "المحافظة", en: "Governorate" },
  cityDistrict: { ar: "المدينة / المنطقة", en: "City / Area" },
  district: { ar: "الحي", en: "District" },
  districtPlaceholder: { ar: "ابحث عن الحي", en: "Search for a district" },
  districtFreeTextPlaceholder: { ar: "اكتب اسم الحي", en: "Type the district name" },
  address: { ar: "العنوان التفصيلي", en: "Detailed Address" },
  floorCount: { ar: "عدد الطوابق", en: "Number of Floors" },
  unitCount: { ar: "عدد الوحدات", en: "Number of Units" },
  loadingCities: { ar: "جاري التحميل...", en: "Loading..." },
  chooseGovernorate: { ar: "اختر المحافظة", en: "Choose governorate" },
  chooseGovernorateFirst: { ar: "اختر المحافظة أولاً", en: "Choose a governorate first" },
  searchCity: { ar: "ابحث عن مدينتك", en: "Search for your city" },
  readiness: { ar: "حالة العقار (يمكن اختيار أكثر من خيار)", en: "Property Condition (multiple selections allowed)" },
  finishingNeeded: { ar: "نوع التشطيب المطلوب", en: "Required Finishing Type" },
  furnishingNeeded: { ar: "الأثاث المطلوب", en: "Required Furnishing" },
  notes: { ar: "ملاحظات إضافية", en: "Additional Notes" },
  needsFinancing: { ar: "هل تحتاج تمويلاً؟", en: "Do you need financing?" },
  needsFurnishingHelp: { ar: "هل تحتاج مساعدة في التأثيث؟", en: "Do you need help with furnishing?" },
  no: { ar: "لا", en: "No" },
  partial: { ar: "جزئيًا", en: "Partially" },
  yes: { ar: "نعم", en: "Yes" },
  approxBudget: { ar: "الميزانية التقريبية (جنيه)", en: "Approximate Budget (EGP)" },
  budgetPlaceholder: { ar: "مثال: 250000", en: "e.g. 250000" },
  budgetHint: { ar: "أدخل المبلغ كاملاً (مثال: 250000)، وليس بالآلاف", en: "Enter the full amount (e.g. 250000), not in thousands" },
  step4Notice: { ar: "بعد إرسال الطلب، سيتم إنشاء حسابك تلقائيًا. سجّل الدخول إلى لوحة تحكم المالك في أي وقت لرفع المستندات المطلوبة: صورة البطاقة الشخصية، عقد الملكية، وأي مستندات إضافية.", en: "After submitting, your account will be created automatically. Log in to your owner dashboard anytime to upload the required documents: ID copy, ownership contract, and any additional documents." },
  unitWord: { ar: "وحدة", en: "unit(s)" },
  inCity: { ar: "في", en: "in" },
  termsLine1: { ar: "أوافق على شروط الشراكة وسياسة الخصوصية الخاصة بـ EGYMOTELZ", en: "I agree to EGYMOTELZ's Partnership Terms and Privacy Policy" },
  submitting: { ar: "جاري الإرسال...", en: "Submitting..." },
  submit: { ar: "إرسال الطلب", en: "Submit Application" },
} as const;

export default function OwnersPage() {
  const { locale } = useLocale();
  const STEP_LABELS = locale === "ar" ? STEP_LABELS_AR : STEP_LABELS_EN;

  const [step, setStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  // Item 3/4: captured once, client-side, from the referral URL
  // (?partner=EGY-P-00027) — sent with the submission and persisted
  // server-side there; never trusted again after that single use.
  const [partnerCode, setPartnerCode] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("partner");
    if (code) setPartnerCode(code);
  }, []);

  const { cities, loading: geoLoading, error: geoError } = useGeoData();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OwnerApplicationFormValues>({
    resolver: zodResolver(ownerApplicationSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      nationalId: "",
      password: "",
      propertyType: "RESIDENTIAL_BUILDING",
      cityId: "",
      districtId: "",
      districtFreeText: "",
      address: "",
      readinessOptions: [],
      finishingTypes: [],
      furnishingItems: [],
      notes: "",
      needsFinancing: "NO",
      needsFurnishingHelp: "NO",
      termsAccepted: false as unknown as true, // RHF requires a starting value; the literal(true) schema catches an unchecked submit
    },
  });

  const selectedCityId = watch("cityId");
  const selectedDistricts = cities.find((c) => c.id === selectedCityId)?.districts ?? [];
  const readinessOptions = watch("readinessOptions") ?? [];

  // Governorate is a pure UI filter (Item: Governorate -> City -> District
  // cascade) — not part of the submitted application, so it stays local
  // state rather than a react-hook-form field. The backend only ever
  // needs cityId/districtId/districtFreeText, unchanged.
  const [governorateId, setGovernorateId] = useState("");
  const governorates = deriveGovernorates(cities);
  const citiesInGovernorate = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : [];

  const needsFinancing = watch("needsFinancing");
  const financingRequired = needsFinancing !== "NO";

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  }

  // Root-cause fix: handleSubmit's full-schema re-validation on the final
  // submit can fail on a field belonging to a step that's no longer
  // rendered (steps 0-4 are unmounted once on the review step), and without
  // an onInvalid handler RHF does nothing visible when that happens — no
  // network call, no error shown. This handler makes that failure visible:
  // jump back to the earliest step containing the invalid field (so its
  // existing per-field error message renders again) and surface a message.
  function fieldStep(field: string): number {
    const idx = STEP_FIELDS.findIndex((fields) => (fields as string[]).includes(field));
    return idx === -1 ? 0 : idx;
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await api.post<{ id: string; status: string }>("/owner-applications", {
          ...values,
          whatsappNumber: values.whatsappNumber || undefined,
          districtId: values.districtId || undefined,
          districtFreeText: values.districtFreeText || undefined,
          // Issue 3: when financing isn't needed, don't send a stray amount even
          // if one was entered earlier and the user then switched the toggle back.
          budgetAmount: financingRequired ? values.budgetAmount : undefined,
          budgetCurrency: "EGP",
          partnerCode: partnerCode ?? undefined,
        });
        setSubmittedName(values.fullName);
        setApplicationId(res.id);
        setDone(true);
      } catch (err) {
        setSubmitError(err instanceof ApiClientError ? err.message : translateMessage("حدث خطأ غير متوقع، حاول مرة أخرى", locale)!);
      } finally {
        setSubmitting(false);
      }
    },
    (formErrors) => {
      const erroredFields = Object.keys(formErrors);
      const earliestStep = erroredFields.length ? Math.min(...erroredFields.map(fieldStep)) : 0;
      setStep(earliestStep);
      setSubmitError(translateMessage("هناك بيانات ناقصة أو غير صحيحة، الرجاء المراجعة والمحاولة مرة أخرى", locale)!);
    }
  );

  const progressPct = (step / 5) * 100;

  if (done) {
    return (
      <div className="screen active" id="sc-owners">
        <Navbar />
        <div className="form-hero fh">
          <h1>{L.doneTitle[locale]}</h1>
          <p>{L.doneSub[locale]}</p>
        </div>
        <div className="form-wrap">
          <div className="form-card">
            <div className="success-state">
              <div className="suc-icon">✓</div>
              <p style={{ fontFamily: "var(--fnar)", color: "var(--txt)", marginBottom: 8 }}>
                {L.thanks[locale]} {submittedName} — {L.applicationNumber[locale]} <code>{applicationId}</code>
              </p>
            </div>
            <div className="disc-box">
              {L.doneNote[locale]}
            </div>
            <Link href="/owner/dashboard">
              <button className="btn-primary">{L.loginToUpload[locale]}</button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="screen active" id="sc-owners">
      <Navbar />
      <div className="form-hero fh">
        <h1>{L.heroTitle[locale]}</h1>
        <p>{L.heroSub[locale]}</p>
      </div>
      <div className="form-wrap">
        <form className="form-card" onSubmit={(e) => e.preventDefault()}>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="slabels">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className={`sl${i === step ? " active" : i < step ? " done" : ""}`}>
                {label}
              </span>
            ))}
          </div>

          {submitError && <div className="error-box">{submitError}</div>}

          {step === 0 && (
            <div>
              <div className="fld">
                <label>{L.fullName[locale]}</label>
                <input {...register("fullName")} />
                {errors.fullName && <div className="error-box">{translateMessage(errors.fullName.message, locale)}</div>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>{L.phone[locale]}</label>
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
                  {errors.phone && <div className="error-box">{translateMessage(errors.phone.message, locale)}</div>}
                </div>
                <div className="fld">
                  <label>{L.email[locale]}</label>
                  <input {...register("email")} type="email" />
                  {errors.email && <div className="error-box">{translateMessage(errors.email.message, locale)}</div>}
                </div>
              </div>
              <div className="fld">
                <label>{L.whatsapp[locale]}</label>
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
                {errors.whatsappNumber && <div className="error-box">{translateMessage(errors.whatsappNumber.message, locale)}</div>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>{L.nationalId[locale]}</label>
                  <Controller
                    control={control}
                    name="nationalId"
                    render={({ field }) => (
                      <input
                        value={field.value}
                        maxLength={14}
                        inputMode="numeric"
                        onBlur={field.onBlur}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ""))}
                      />
                    )}
                  />
                  {errors.nationalId && <div className="error-box">{translateMessage(errors.nationalId.message, locale)}</div>}
                </div>
                <div className="fld">
                  <label>{L.password[locale]}</label>
                  <input {...register("password")} type="password" />
                  {errors.password ? (
                    <div className="error-box">{translateMessage(errors.password.message, locale)}</div>
                  ) : (
                    <div className="disc-box">{L.passwordHint[locale]}</div>
                  )}
                </div>
              </div>
              <button type="button" className="btn-primary" onClick={goNext}>
                {L.next[locale]}
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="fld">
                <label>{L.propertyType[locale]}</label>
                <select {...register("propertyType")}>
                  {Object.entries(PROPERTY_TYPE_LABEL).map(([value, lbl]) => (
                    <option value={value} key={value}>{lbl[locale]}</option>
                  ))}
                </select>
              </div>
              {geoError && <div className="error-box">{geoError}</div>}
              <div className="frow">
                <div className="fld">
                  <label>{L.governorate[locale]}</label>
                  <SearchableSelect
                    value={governorateId}
                    onChange={(v) => {
                      setGovernorateId(v);
                      setValue("cityId", ""); // reset city + district when governorate changes
                      setValue("districtId", "");
                    }}
                    disabled={geoLoading}
                    placeholder={geoLoading ? L.loadingCities[locale] : L.chooseGovernorate[locale]}
                    options={governorates.map((g) => ({ value: g.id, label: locale === "ar" ? g.nameAr : g.nameEn }))}
                  />
                </div>
                <div className="fld">
                  <label>{L.cityDistrict[locale]}</label>
                  <Controller
                    control={control}
                    name="cityId"
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={(v) => {
                          field.onChange(v);
                          setValue("districtId", ""); // reset district when city changes
                        }}
                        disabled={geoLoading || !governorateId}
                        placeholder={
                          !governorateId ? L.chooseGovernorateFirst[locale] : geoLoading ? L.loadingCities[locale] : L.searchCity[locale]
                        }
                        options={citiesInGovernorate.map((c) => ({ value: c.id, label: locale === "ar" ? c.nameAr : c.nameEn }))}
                      />
                    )}
                  />
                  {errors.cityId && <div className="error-box">{translateMessage(errors.cityId.message, locale)}</div>}
                </div>
              </div>
              <div className="frow">
                <div className="fld">
                  <label>{L.district[locale]}</label>
                  {selectedDistricts.length > 0 ? (
                    <Controller
                      control={control}
                      name="districtId"
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder={L.districtPlaceholder[locale]}
                          options={selectedDistricts.map((d) => ({ value: d.id, label: locale === "ar" ? d.nameAr : d.nameEn }))}
                        />
                      )}
                    />
                  ) : (
                    <input {...register("districtFreeText")} placeholder={L.districtFreeTextPlaceholder[locale]} disabled={!selectedCityId} />
                  )}
                  {errors.districtId && <div className="error-box">{translateMessage(errors.districtId.message, locale)}</div>}
                </div>
              </div>
              <div className="fld">
                <label>{L.address[locale]}</label>
                <input {...register("address")} />
                {errors.address && <div className="error-box">{translateMessage(errors.address.message, locale)}</div>}
              </div>
              <div className="frow">
                <div className="fld">
                  <label>{L.floorCount[locale]}</label>
                  <input type="number" min={1} {...register("floorCount")} />
                  {errors.floorCount && <div className="error-box">{translateMessage(errors.floorCount.message, locale)}</div>}
                </div>
                <div className="fld">
                  <label>{L.unitCount[locale]}</label>
                  <input type="number" min={1} {...register("unitCount")} />
                  {errors.unitCount && <div className="error-box">{translateMessage(errors.unitCount.message, locale)}</div>}
                </div>
              </div>
              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep(0)}>{L.back[locale]}</button>
                <button type="button" className="btn-primary" onClick={goNext}>{L.next[locale]}</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="fld">
                <label>{L.readiness[locale]}</label>
                <Controller
                  control={control}
                  name="readinessOptions"
                  render={({ field }) => (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {READINESS_OPTIONS.map((opt) => (
                        <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--fnar)", fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={field.value?.includes(opt.value) ?? false}
                            onChange={(e) => {
                              const current = field.value ?? [];
                              field.onChange(e.target.checked ? [...current, opt.value] : current.filter((v) => v !== opt.value));
                            }}
                          />
                          {opt[locale]}
                        </label>
                      ))}
                    </div>
                  )}
                />
                {errors.readinessOptions && <div className="error-box">{translateMessage(errors.readinessOptions.message, locale)}</div>}
              </div>

              {readinessOptions.includes("FINISHING_REQUIRED") && (
                <div className="fld">
                  <label>{L.finishingNeeded[locale]}</label>
                  <Controller
                    control={control}
                    name="finishingTypes"
                    render={({ field }) => (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {FINISHING_TYPES.map((opt) => (
                          <label key={opt.value} className="sl" style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={field.value?.includes(opt.value) ?? false}
                              onChange={(e) => {
                                const current = field.value ?? [];
                                field.onChange(e.target.checked ? [...current, opt.value] : current.filter((v) => v !== opt.value));
                              }}
                            />
                            {opt[locale]}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.finishingTypes && <div className="error-box">{translateMessage(errors.finishingTypes.message, locale)}</div>}
                </div>
              )}

              {readinessOptions.includes("FURNISHING_REQUIRED") && (
                <div className="fld">
                  <label>{L.furnishingNeeded[locale]}</label>
                  <Controller
                    control={control}
                    name="furnishingItems"
                    render={({ field }) => (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {FURNISHING_ITEMS.map((opt) => (
                          <label key={opt.value} className="sl" style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={field.value?.includes(opt.value) ?? false}
                              onChange={(e) => {
                                const current = field.value ?? [];
                                field.onChange(e.target.checked ? [...current, opt.value] : current.filter((v) => v !== opt.value));
                              }}
                            />
                            {opt[locale]}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.furnishingItems && <div className="error-box">{translateMessage(errors.furnishingItems.message, locale)}</div>}
                </div>
              )}

              <div className="fld">
                <label>{L.notes[locale]}</label>
                <textarea {...register("notes")} />
              </div>
              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep(1)}>{L.back[locale]}</button>
                <button type="button" className="btn-primary" onClick={goNext}>{L.next[locale]}</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="fld">
                <label>{L.needsFinancing[locale]}</label>
                <select
                  {...register("needsFinancing", {
                    onChange: (e) => {
                      // Issue 3 fix: "No" disables + clears the amount immediately,
                      // not just at submit time.
                      if (e.target.value === "NO") setValue("budgetAmount", undefined, { shouldValidate: true });
                    },
                  })}
                >
                  <option value="NO">{L.no[locale]}</option>
                  <option value="PARTIAL">{L.partial[locale]}</option>
                  <option value="YES">{L.yes[locale]}</option>
                </select>
              </div>
              <div className="fld">
                <label>{L.needsFurnishingHelp[locale]}</label>
                <select {...register("needsFurnishingHelp")}>
                  <option value="NO">{L.no[locale]}</option>
                  <option value="PARTIAL">{L.partial[locale]}</option>
                  <option value="YES">{L.yes[locale]}</option>
                </select>
              </div>
              <div className="fld">
                <label>
                  {L.approxBudget[locale]} {financingRequired && <span style={{ color: "#dc2626" }}>*</span>}
                </label>
                <Controller
                  control={control}
                  name="budgetAmount"
                  render={({ field }) => (
                    <MoneyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={!financingRequired}
                      placeholder={L.budgetPlaceholder[locale]}
                    />
                  )}
                />
                {errors.budgetAmount ? (
                  <div className="error-box">{translateMessage(errors.budgetAmount.message, locale)}</div>
                ) : (
                  <div className="disc-box">{L.budgetHint[locale]}</div>
                )}
              </div>
              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep(2)}>{L.back[locale]}</button>
                <button type="button" className="btn-primary" onClick={goNext}>{L.next[locale]}</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="disc-box">
                {L.step4Notice[locale]}
              </div>
              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep(3)}>{L.back[locale]}</button>
                <button type="button" className="btn-primary" onClick={() => setStep(5)}>{L.next[locale]}</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <div style={{ fontSize: 12, color: "var(--mut)", fontFamily: "var(--fnar)", lineHeight: 1.9, marginBottom: 14 }}>
                <strong>{watch("fullName")}</strong> — {watch("phone")} — {watch("email")}
                <br />
                {PROPERTY_TYPE_LABEL[watch("propertyType")]?.[locale] ?? PROPERTY_TYPE_LABEL.RESIDENTIAL_BUILDING[locale]}{" "}
                {L.inCity[locale]}{" "}
                {(locale === "ar"
                  ? selectedDistricts.find((d) => d.id === watch("districtId"))?.nameAr
                  : selectedDistricts.find((d) => d.id === watch("districtId"))?.nameEn) ?? watch("districtFreeText") ?? ""}
                ،{" "}
                {(locale === "ar"
                  ? cities.find((c) => c.id === watch("cityId"))?.nameAr
                  : cities.find((c) => c.id === watch("cityId"))?.nameEn) ?? ""}{" "}
                — {watch("unitCount")} {L.unitWord[locale]}
              </div>
              <div className="policy-box">
                <input type="checkbox" {...register("termsAccepted")} />
                <div className="policy-txt">
                  <p>{L.termsLine1[locale]}</p>
                  <div className="sub">Partnership Terms & Privacy Policy</div>
                </div>
              </div>
              {errors.termsAccepted && <div className="error-box">{translateMessage(errors.termsAccepted.message, locale)}</div>}
              <div className="btns-row">
                <button type="button" className="btn-back" onClick={() => setStep(4)}>{L.back[locale]}</button>
                <button type="button" className="btn-primary" disabled={submitting} onClick={onSubmit}>
                  {submitting ? L.submitting[locale] : L.submit[locale]}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}
