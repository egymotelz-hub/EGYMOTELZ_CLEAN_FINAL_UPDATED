"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api, ApiClientError } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";
import { translateMessage } from "@/lib/formErrorTranslations";
import { contractorApplicationSchema, type ContractorApplicationFormValues } from "@/lib/validation/contractorApplication.schema";

// English Task 2 (Forms): bilingual UI text only. Validation rules unchanged.
const L = {
  doneTitle: { ar: "تم استلام طلب التسجيل", en: "Your registration has been received" },
  doneSub: { ar: "سيقوم فريقنا بمراجعة طلبك والتواصل معك قريبًا", en: "Our team will review your application and contact you soon" },
  applicationId: { ar: "رقم الطلب:", en: "Application ID:" },
  doneNote: { ar: "سجّل الدخول بكلمة المرور التي أدخلتها لمتابعة حالة طلبك ورفع المستندات المطلوبة.", en: "Log in with the password you entered to track your application status and upload required documents." },
  heroTitle: { ar: "التسجيل كمقاول", en: "Register as a Contractor" },
  heroSub: { ar: "انضم إلى شبكة مقاولي EGYMOTELZ المعتمدين", en: "Join EGYMOTELZ's network of approved contractors" },
  companyName: { ar: "اسم الشركة", en: "Company Name" },
  contractorName: { ar: "اسم المقاول", en: "Contractor Name" },
  phone: { ar: "رقم الهاتف (دولي)", en: "Phone Number (international)" },
  whatsapp: { ar: "رقم واتساب (اختياري)", en: "WhatsApp Number (optional)" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  commercialRegNumber: { ar: "رقم السجل التجاري", en: "Commercial Registration Number" },
  taxCardNumber: { ar: "الرقم الضريبي", en: "Tax Card Number" },
  specialization: { ar: "التخصص", en: "Specialization" },
  specializationPlaceholder: { ar: "مثال: تشطيبات، سباكة، كهرباء", en: "e.g. finishing, plumbing, electrical" },
  governorate: { ar: "المحافظة", en: "Governorate" },
  city: { ar: "المدينة", en: "City" },
  yearsExperience: { ar: "سنوات الخبرة", en: "Years of Experience" },
  portfolio: { ar: "أعمال سابقة (اختياري)", en: "Previous Work (optional)" },
  portfolioPlaceholder: { ar: "اذكر مشاريع سابقة أو روابط لأعمالك", en: "List previous projects or links to your work" },
  disclaimer: { ar: "بعد إرسال الطلب، سيتم إنشاء حسابك تلقائيًا. سجّل الدخول لاحقًا لرفع مستندات السجل التجاري والبطاقة الضريبية وأعمال سابقة.", en: "After submitting, your account will be created automatically. Log in later to upload your commercial registration, tax card, and portfolio documents." },
  terms: { ar: "أوافق على شروط الشراكة الخاصة بـ EGYMOTELZ", en: "I agree to EGYMOTELZ's Partnership Terms" },
  submitting: { ar: "جاري الإرسال...", en: "Submitting..." },
  submit: { ar: "إرسال طلب التسجيل", en: "Submit Registration" },
  loadingCities: { ar: "جاري التحميل...", en: "Loading..." },
  chooseGovernorate: { ar: "اختر المحافظة", en: "Choose governorate" },
  chooseGovernorateFirst: { ar: "اختر المحافظة أولاً", en: "Choose a governorate first" },
  searchCity: { ar: "ابحث عن المدينة", en: "Search for a city" },
} as const;

export default function ContractorRegisterPage() {
  const { locale } = useLocale();

  const { cities, loading: geoLoading, error: geoError } = useGeoData();
  const [governorateId, setGovernorateId] = useState("");
  const governorates = deriveGovernorates(cities);
  const citiesInGovernorate = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : [];
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContractorApplicationFormValues>({
    resolver: zodResolver(contractorApplicationSchema),
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      contractorName: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      password: "",
      commercialRegistrationNumber: "",
      taxCardNumber: "",
      specialization: "",
      governorate: "",
      cityId: "",
      portfolio: "",
      termsAccepted: false as unknown as true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post<{ id: string; status: string }>("/contractor-applications", {
        ...values,
        whatsappNumber: values.whatsappNumber || undefined,
      });
      setApplicationId(res.id);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : translateMessage("حدث خطأ غير متوقع، حاول مرة أخرى", locale)!);
    } finally {
      setSubmitting(false);
    }
  });

  if (done) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>{L.doneTitle[locale]}</h1>
          <p>{L.doneSub[locale]}</p>
        </div>
        <div className="form-wrap">
          <div className="form-card success-state">
            <div className="suc-icon">✓</div>
            <p style={{ fontFamily: "var(--fnar)", color: "var(--txt)", marginBottom: 8 }}>
              {L.applicationId[locale]} <code>{applicationId}</code>
            </p>
            <p style={{ fontFamily: "var(--fnar)", color: "var(--mut)", fontSize: 12 }}>
              {L.doneNote[locale]}
            </p>
          </div>
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
              <label>{L.contractorName[locale]}</label>
              <input {...register("contractorName")} />
              {errors.contractorName && <div className="error-box">{translateMessage(errors.contractorName.message, locale)}</div>}
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
              <label>{L.email[locale]}</label>
              <input type="email" {...register("email")} />
              {errors.email && <div className="error-box">{translateMessage(errors.email.message, locale)}</div>}
            </div>
            <div className="fld">
              <label>{L.password[locale]}</label>
              <input type="password" {...register("password")} />
              {errors.password && <div className="error-box">{translateMessage(errors.password.message, locale)}</div>}
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>{L.commercialRegNumber[locale]}</label>
              <input {...register("commercialRegistrationNumber")} />
              {errors.commercialRegistrationNumber && <div className="error-box">{translateMessage(errors.commercialRegistrationNumber.message, locale)}</div>}
            </div>
            <div className="fld">
              <label>{L.taxCardNumber[locale]}</label>
              <input {...register("taxCardNumber")} />
              {errors.taxCardNumber && <div className="error-box">{translateMessage(errors.taxCardNumber.message, locale)}</div>}
            </div>
          </div>

          <div className="fld">
            <label>{L.specialization[locale]}</label>
            <input {...register("specialization")} placeholder={L.specializationPlaceholder[locale]} />
            {errors.specialization && <div className="error-box">{translateMessage(errors.specialization.message, locale)}</div>}
          </div>

          {geoError && <div className="error-box">{geoError}</div>}
          <div className="frow">
            <div className="fld">
              <label>{L.governorate[locale]}</label>
              <input {...register("governorate")} />
              {errors.governorate && <div className="error-box">{translateMessage(errors.governorate.message, locale)}</div>}
            </div>
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
            <label>{L.yearsExperience[locale]}</label>
            <input type="number" min={0} {...register("yearsOfExperience")} />
            {errors.yearsOfExperience && <div className="error-box">{translateMessage(errors.yearsOfExperience.message, locale)}</div>}
          </div>

          <div className="fld">
            <label>{L.portfolio[locale]}</label>
            <textarea {...register("portfolio")} placeholder={L.portfolioPlaceholder[locale]} />
          </div>

          <div className="disc-box">
            {L.disclaimer[locale]}
          </div>

          <div className="policy-box">
            <input type="checkbox" {...register("termsAccepted")} />
            <div className="policy-txt">
              <p>{L.terms[locale]}</p>
            </div>
          </div>
          {errors.termsAccepted && <div className="error-box">{translateMessage(errors.termsAccepted.message, locale)}</div>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? L.submitting[locale] : L.submit[locale]}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
