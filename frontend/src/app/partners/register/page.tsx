"use client";

import { useState, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api, ApiClientError } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";
import { translateMessage } from "@/lib/formErrorTranslations";
import {
  partnerRegistrationSchema,
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  type PartnerRegistrationFormValues,
} from "@/lib/validation/partnerRegistration.schema";

// English Task 2 (Forms): bilingual UI text for this form only — labels,
// placeholders, buttons, headings. Validation RULES are unchanged; only
// how their existing messages are displayed is affected, via
// translateMessage() (see lib/formErrorTranslations.ts).
const PARTNER_TYPE_LABELS_EN: Record<(typeof PARTNER_TYPES)[number], string> = {
  CONTRACTOR: "Contractor",
  HOTEL_MANAGEMENT: "Hotel Management & Operation",
  INTERIOR_DESIGN: "Decor & Finishing Company",
  FURNITURE: "Furniture & Furnishing",
  MAINTENANCE: "Maintenance",
  CLEANING: "Cleaning",
  APPLIANCES: "Home Appliances",
  REAL_ESTATE: "Real Estate",
  HOSPITALITY_SERVICES: "Hospitality Services",
  OTHER: "Other",
};

const L = {
  doneTitle: { ar: "تم استلام طلبك", en: "Your application has been received" },
  doneBody: { ar: "سيقوم فريقنا بمراجعة طلب انضمامك كشريك والتواصل معك قريبًا عبر البريد الإلكتروني.", en: "Our team will review your partner application and contact you soon by email." },
  heroTitle: { ar: "سجّل كشريك", en: "Register as a Partner" },
  heroSub: { ar: "انضم إلى شبكة شركاء EGYMOTELZ المعتمدين", en: "Join EGYMOTELZ's network of approved partners" },
  companyName: { ar: "اسم الشركة", en: "Company Name" },
  legalName: { ar: "الاسم القانوني (اختياري)", en: "Legal Name (optional)" },
  contactPersonName: { ar: "اسم الشخص المسؤول", en: "Contact Person Name" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone: { ar: "رقم الهاتف (دولي)", en: "Phone Number (international)" },
  whatsapp: { ar: "رقم واتساب (اختياري)", en: "WhatsApp Number (optional)" },
  password: { ar: "كلمة المرور", en: "Password" },
  website: { ar: "الموقع الإلكتروني (اختياري)", en: "Website (optional)" },
  governorate: { ar: "المحافظة", en: "Governorate" },
  city: { ar: "المدينة", en: "City" },
  address: { ar: "العنوان (اختياري)", en: "Address (optional)" },
  yearsExperience: { ar: "سنوات الخبرة (اختياري)", en: "Years of Experience (optional)" },
  employeeCount: { ar: "عدد الموظفين (اختياري)", en: "Number of Employees (optional)" },
  companyDescription: { ar: "نبذة عن الشركة (اختياري)", en: "About the Company (optional)" },
  primaryType: { ar: "المجال الرئيسي", en: "Primary Category" },
  capabilities: { ar: "المجالات التي تقدمها (يمكن اختيار أكثر من مجال)", en: "Services Offered (select all that apply)" },
  terms: { ar: "أوافق على الشروط والأحكام الخاصة بشركاء EGYMOTELZ", en: "I agree to EGYMOTELZ's Partner Terms & Conditions" },
  submitting: { ar: "جاري الإرسال...", en: "Submitting..." },
  submit: { ar: "إرسال طلب الانضمام", en: "Submit Application" },
  loadingCities: { ar: "جاري التحميل...", en: "Loading..." },
  chooseGovernorate: { ar: "اختر المحافظة", en: "Choose governorate" },
  chooseGovernorateFirst: { ar: "اختر المحافظة أولاً", en: "Choose a governorate first" },
  searchCity: { ar: "ابحث عن المدينة", en: "Search for a city" },
} as const;

export default function PartnerRegisterPage() {
  return (
    <Suspense fallback={null}>
      <PartnerRegisterForm />
    </Suspense>
  );
}

function PartnerRegisterForm() {
  const { locale } = useLocale();
  const typeLabel = (t: (typeof PARTNER_TYPES)[number]) => (locale === "ar" ? PARTNER_TYPE_LABELS[t] : PARTNER_TYPE_LABELS_EN[t]);

  const searchParams = useSearchParams();
  const presetType = searchParams.get("type") as (typeof PARTNER_TYPES)[number] | null;
  const initialType: (typeof PARTNER_TYPES)[number] = presetType && (PARTNER_TYPES as readonly string[]).includes(presetType) ? presetType : "CONTRACTOR";

  const { cities, loading: geoLoading, error: geoError } = useGeoData();
  const [governorateId, setGovernorateId] = useState("");
  const governorates = deriveGovernorates(cities);
  const citiesInGovernorate = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : [];
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerRegistrationFormValues>({
    resolver: zodResolver(partnerRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      legalName: "",
      contactPersonName: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      password: "",
      website: "",
      governorate: "",
      cityId: "",
      address: "",
      companyDescription: "",
      primaryType: initialType,
      capabilities: [initialType],
      termsAccepted: false as unknown as true,
    },
  });

  const primaryType = watch("primaryType");
  const capabilities = watch("capabilities") ?? [];

  function toggleCapability(type: (typeof PARTNER_TYPES)[number]) {
    const next = capabilities.includes(type) ? capabilities.filter((t) => t !== type) : [...capabilities, type];
    setValue("capabilities", next, { shouldValidate: true });
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await api.post("/partners", {
          ...values,
          legalName: values.legalName || undefined,
          website: values.website || undefined,
          whatsappNumber: values.whatsappNumber || undefined,
        });
        setDone(true);
      } catch (err) {
        setSubmitError(err instanceof ApiClientError ? err.message : translateMessage("حدث خطأ غير متوقع، حاول مرة أخرى", locale)!);
      } finally {
        setSubmitting(false);
      }
    },
    () => {
      setSubmitError(translateMessage("هناك بيانات ناقصة أو غير صحيحة، الرجاء المراجعة والمحاولة مرة أخرى", locale)!);
    }
  );

  if (done) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>{L.doneTitle[locale]}</h1>
          <p>{L.doneBody[locale]}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="form-hero fh">
        <h1>{L.heroTitle[locale]}</h1>
        <p>{L.heroSub[locale]}</p>
      </div>
      <div className="form-wrap">
        <form className="form-card" onSubmit={onSubmit}>
          {submitError && <div className="error-box">{submitError}</div>}

          <div className="frow">
            <div className="fld">
              <label>{L.companyName[locale]}</label>
              <input {...register("companyName")} />
              {errors.companyName && <div className="error-box">{translateMessage(errors.companyName.message, locale)}</div>}
            </div>
            <div className="fld">
              <label>{L.legalName[locale]}</label>
              <input {...register("legalName")} />
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>{L.contactPersonName[locale]}</label>
              <input {...register("contactPersonName")} />
              {errors.contactPersonName && <div className="error-box">{translateMessage(errors.contactPersonName.message, locale)}</div>}
            </div>
            <div className="fld">
              <label>{L.email[locale]}</label>
              <input type="email" {...register("email")} />
              {errors.email && <div className="error-box">{translateMessage(errors.email.message, locale)}</div>}
            </div>
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
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>{L.password[locale]}</label>
              <input type="password" {...register("password")} />
              {errors.password && <div className="error-box">{translateMessage(errors.password.message, locale)}</div>}
            </div>
            <div className="fld">
              <label>{L.website[locale]}</label>
              <input {...register("website")} placeholder="https://" />
              {errors.website && <div className="error-box">{translateMessage(errors.website.message, locale)}</div>}
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>{L.governorate[locale]}</label>
              <SearchableSelect
                value={governorateId}
                onChange={(v) => {
                  setGovernorateId(v);
                  setValue("cityId", "");
                }}
                disabled={geoLoading}
                placeholder={geoLoading ? L.loadingCities[locale] : L.chooseGovernorate[locale]}
                options={governorates.map((g) => ({ value: g.id, label: locale === "ar" ? g.nameAr : g.nameEn }))}
              />
              {geoError && <div className="error-box">{geoError}</div>}
            </div>
            <div className="fld">
              <label>{L.city[locale]}</label>
              <Controller
                control={control}
                name="cityId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    disabled={geoLoading || !governorateId}
                    placeholder={!governorateId ? L.chooseGovernorateFirst[locale] : geoLoading ? L.loadingCities[locale] : L.searchCity[locale]}
                    options={citiesInGovernorate.map((c) => ({ value: c.id, label: locale === "ar" ? c.nameAr : c.nameEn }))}
                  />
                )}
              />
              {errors.cityId && <div className="error-box">{translateMessage(errors.cityId.message, locale)}</div>}
            </div>
          </div>

          <div className="fld">
            <label>{L.address[locale]}</label>
            <input {...register("address")} />
          </div>

          <div className="frow">
            <div className="fld">
              <label>{L.yearsExperience[locale]}</label>
              <input type="number" min={0} {...register("yearsOfExperience")} />
            </div>
            <div className="fld">
              <label>{L.employeeCount[locale]}</label>
              <input type="number" min={1} {...register("employeeCount")} />
            </div>
          </div>

          <div className="fld">
            <label>{L.companyDescription[locale]}</label>
            <textarea rows={4} {...register("companyDescription")} />
          </div>

          <div className="fld">
            <label>{L.primaryType[locale]}</label>
            <Controller
              control={control}
              name="primaryType"
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (!capabilities.includes(e.target.value as (typeof PARTNER_TYPES)[number])) {
                      setValue("capabilities", [...capabilities, e.target.value as (typeof PARTNER_TYPES)[number]]);
                    }
                  }}
                >
                  {PARTNER_TYPES.map((t) => (
                    <option value={t} key={t}>{typeLabel(t)}</option>
                  ))}
                </select>
              )}
            />
            {errors.primaryType && <div className="error-box">{translateMessage(errors.primaryType.message, locale)}</div>}
          </div>

          <div className="fld">
            <label>{L.capabilities[locale]}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {PARTNER_TYPES.map((t) => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "var(--fnar)" }}>
                  <input
                    type="checkbox"
                    checked={capabilities.includes(t)}
                    disabled={t === primaryType}
                    onChange={() => toggleCapability(t)}
                  />
                  {typeLabel(t)}
                </label>
              ))}
            </div>
            {errors.capabilities && <div className="error-box">{translateMessage(errors.capabilities.message, locale)}</div>}
          </div>

          <div className="fld">
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: "var(--fnar)" }}>
              <input type="checkbox" {...register("termsAccepted")} />
              {L.terms[locale]}
            </label>
            {errors.termsAccepted && <div className="error-box">{translateMessage(errors.termsAccepted.message, locale)}</div>}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? L.submitting[locale] : L.submit[locale]}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
