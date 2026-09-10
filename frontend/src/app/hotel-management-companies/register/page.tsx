"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api, ApiClientError } from "@/lib/apiClient";
import {
  hotelManagementCompanySchema,
  PROPERTY_TYPES_MANAGED_LABELS,
  type HotelManagementCompanyFormValues,
} from "@/lib/validation/hotelManagementCompany.schema";

const PROPERTY_TYPE_OPTIONS = Object.entries(PROPERTY_TYPES_MANAGED_LABELS) as [
  keyof typeof PROPERTY_TYPES_MANAGED_LABELS,
  string
][];

export default function HotelManagementCompanyRegisterPage() {
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
  } = useForm<HotelManagementCompanyFormValues>({
    resolver: zodResolver(hotelManagementCompanySchema),
    mode: "onBlur",
    defaultValues: {
      companyName: "",
      commercialRegistrationNumber: "",
      taxCardNumber: "",
      companyAddress: "",
      governorate: "",
      cityId: "",
      contactPerson: "",
      jobTitle: "",
      phone: "",
      whatsappNumber: "",
      email: "",
      companyWebsite: "",
      password: "",
      propertyTypesManaged: [],
      areasOfOperation: "",
      availableServices: "",
      previousClients: "",
      companyDescription: "",
      termsAccepted: false as unknown as true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post<{ id: string; status: string }>("/hotel-management-companies", {
        ...values,
        whatsappNumber: values.whatsappNumber || undefined,
        companyWebsite: values.companyWebsite || undefined,
      });
      setApplicationId(res.id);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  });

  if (done) {
    return (
      <div>
        <Navbar />
        <div className="form-hero fh">
          <h1>تم استلام طلب التسجيل</h1>
          <p>سيقوم فريقنا بمراجعة الطلب والتواصل معكم قريبًا</p>
        </div>
        <div className="form-wrap">
          <div className="form-card success-state">
            <div className="suc-icon">✓</div>
            <p style={{ fontFamily: "var(--fnar)", color: "var(--txt)", marginBottom: 8 }}>
              رقم الطلب: <code>{applicationId}</code>
            </p>
            <p style={{ fontFamily: "var(--fnar)", color: "var(--mut)", fontSize: 12 }}>
              سجّلوا الدخول لاحقًا لمتابعة حالة الطلب ورفع المستندات المطلوبة.
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
        <h1>شركات إدارة العقارات الفندقية</h1>
        <p>سجّل شركتك للانضمام كشريك تشغيل معتمد لدى EGYMOTELZ</p>
      </div>
      <div className="form-wrap">
        <form className="form-card" onSubmit={onSubmit}>
          {submitError && <div className="error-box">{submitError}</div>}

          <div className="fld">
            <label>اسم الشركة</label>
            <input {...register("companyName")} />
            {errors.companyName && <div className="error-box">{errors.companyName.message}</div>}
          </div>

          <div className="frow">
            <div className="fld">
              <label>رقم السجل التجاري</label>
              <input {...register("commercialRegistrationNumber")} />
              {errors.commercialRegistrationNumber && <div className="error-box">{errors.commercialRegistrationNumber.message}</div>}
            </div>
            <div className="fld">
              <label>الرقم الضريبي</label>
              <input {...register("taxCardNumber")} />
              {errors.taxCardNumber && <div className="error-box">{errors.taxCardNumber.message}</div>}
            </div>
          </div>

          <div className="fld">
            <label>عنوان الشركة</label>
            <input {...register("companyAddress")} />
            {errors.companyAddress && <div className="error-box">{errors.companyAddress.message}</div>}
          </div>

          {geoError && <div className="error-box">{geoError}</div>}
          <div className="frow">
            <div className="fld">
              <label>المحافظة</label>
              <input {...register("governorate")} />
              {errors.governorate && <div className="error-box">{errors.governorate.message}</div>}
            </div>
            <div className="fld">
              <label>المحافظة</label>
              <SearchableSelect
                value={governorateId}
                onChange={(v) => {
                  setGovernorateId(v);
                  setValue("cityId", "");
                }}
                disabled={geoLoading}
                placeholder={geoLoading ? "جاري التحميل..." : "اختر المحافظة"}
                options={governorates.map((g) => ({ value: g.id, label: g.nameAr }))}
              />
            </div>
            <div className="fld">
              <label>المدينة</label>
              <Controller
                control={control}
                name="cityId"
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    disabled={geoLoading || !governorateId}
                    placeholder={!governorateId ? "اختر المحافظة أولاً" : geoLoading ? "جاري التحميل..." : "ابحث عن المدينة"}
                    options={citiesInGovernorate.map((c) => ({ value: c.id, label: c.nameAr }))}
                  />
                )}
              />
              {errors.cityId && <div className="error-box">{errors.cityId.message}</div>}
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>مسؤول التواصل</label>
              <input {...register("contactPerson")} />
              {errors.contactPerson && <div className="error-box">{errors.contactPerson.message}</div>}
            </div>
            <div className="fld">
              <label>المسمى الوظيفي</label>
              <input {...register("jobTitle")} />
              {errors.jobTitle && <div className="error-box">{errors.jobTitle.message}</div>}
            </div>
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
              <label>رقم واتساب (اختياري)</label>
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
              <label>البريد الإلكتروني</label>
              <input type="email" {...register("email")} />
              {errors.email && <div className="error-box">{errors.email.message}</div>}
            </div>
            <div className="fld">
              <label>كلمة المرور</label>
              <input type="password" {...register("password")} />
              {errors.password && <div className="error-box">{errors.password.message}</div>}
            </div>
          </div>

          <div className="fld">
            <label>موقع الشركة الإلكتروني (اختياري)</label>
            <input {...register("companyWebsite")} placeholder="https://example.com" />
            {errors.companyWebsite && <div className="error-box">{errors.companyWebsite.message}</div>}
          </div>

          <div className="frow">
            <div className="fld">
              <label>سنوات الخبرة</label>
              <input type="number" min={0} {...register("yearsOfExperience")} />
              {errors.yearsOfExperience && <div className="error-box">{errors.yearsOfExperience.message}</div>}
            </div>
            <div className="fld">
              <label>عدد الموظفين</label>
              <input type="number" min={0} {...register("numberOfEmployees")} />
              {errors.numberOfEmployees && <div className="error-box">{errors.numberOfEmployees.message}</div>}
            </div>
          </div>

          <div className="frow">
            <div className="fld">
              <label>عدد العقارات المُدارة</label>
              <input type="number" min={0} {...register("propertiesManagedCount")} />
              {errors.propertiesManagedCount && <div className="error-box">{errors.propertiesManagedCount.message}</div>}
            </div>
            <div className="fld">
              <label>عدد العقارات المؤثثة بنجاح</label>
              <input type="number" min={0} {...register("propertiesFurnishedCount")} />
              {errors.propertiesFurnishedCount && <div className="error-box">{errors.propertiesFurnishedCount.message}</div>}
            </div>
          </div>
          <div className="fld">
            <label>عدد العقارات المُشغّلة بنجاح</label>
            <input type="number" min={0} {...register("propertiesOperatedCount")} />
            {errors.propertiesOperatedCount && <div className="error-box">{errors.propertiesOperatedCount.message}</div>}
          </div>

          <div className="fld">
            <label>أنواع العقارات المُدارة</label>
            <Controller
              control={control}
              name="propertyTypesManaged"
              render={({ field }) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PROPERTY_TYPE_OPTIONS.map(([value, label]) => (
                    <label key={value} className="sl" style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={field.value?.includes(value) ?? false}
                        onChange={(e) => {
                          const current = field.value ?? [];
                          field.onChange(e.target.checked ? [...current, value] : current.filter((v) => v !== value));
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.propertyTypesManaged && <div className="error-box">{errors.propertyTypesManaged.message}</div>}
          </div>

          <div className="fld">
            <label>مناطق التشغيل (اختياري)</label>
            <textarea {...register("areasOfOperation")} />
          </div>
          <div className="fld">
            <label>الخدمات المتاحة (اختياري)</label>
            <textarea {...register("availableServices")} />
          </div>
          <div className="fld">
            <label>عملاء سابقون (اختياري)</label>
            <textarea {...register("previousClients")} />
          </div>
          <div className="fld">
            <label>نبذة عن الشركة (اختياري)</label>
            <textarea {...register("companyDescription")} />
          </div>

          <div className="disc-box">
            بعد إرسال الطلب، سيتم إنشاء حسابكم تلقائيًا. سجّلوا الدخول لاحقًا لرفع مستندات السجل التجاري والبطاقة الضريبية وملف الشركة.
          </div>

          <div className="policy-box">
            <input type="checkbox" {...register("termsAccepted")} />
            <div className="policy-txt">
              <p>نوافق على شروط الشراكة الخاصة بـ EGYMOTELZ</p>
            </div>
          </div>
          {errors.termsAccepted && <div className="error-box">{errors.termsAccepted.message}</div>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "جاري الإرسال..." : "إرسال طلب التسجيل"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
