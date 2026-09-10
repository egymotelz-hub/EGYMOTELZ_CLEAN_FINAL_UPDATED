"use client";

import { useEffect, useState, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiClientError } from "@/lib/apiClient";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import {
  offeringFormSchema,
  type OfferingFormValues,
  OFFERING_TYPES,
  OFFERING_TYPE_LABELS,
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  CANCELLATION_POLICIES,
  CANCELLATION_POLICY_LABELS,
  OFFERING_STATUS_LABELS,
  OFFERING_STATUS_BADGE,
} from "@/lib/validation/offering.schema";

interface OfferingImage { id: string; url: string; altText: string | null; }
interface OfferingCategory { id: string; nameAr: string; nameEn: string; offeringType: string; }
interface OfferingListItem {
  id: string;
  offeringType: string;
  nameEn: string;
  nameAr: string;
  status: string;
  rejectionReason: string | null;
  pricingModel: string;
  pricePerPerson: string | null;
  pricePerVehicle: string | null;
  pricePerGroup: string | null;
  privateBookingPrice: string | null;
  currency: string;
  createdAt: string;
  images: OfferingImage[];
  category: { nameAr: string; nameEn: string } | null;
  avgRating: string | null;
  reviewCount: number;
  _count: { availability: number; bookings: number };
}
interface OfferingDetail extends OfferingListItem {
  categoryId: string | null;
  descriptionEn: string;
  descriptionAr: string;
  cityId: string;
  districtId: string | null;
  meetingPoint: string | null;
  durationMinutes: number | null;
  languages: string[];
  minAge: number | null;
  accessibilityInfo: string | null;
  importantInstructions: string | null;
  vehicleType: string | null;
  childPrice: string | null;
  minGuests: number;
  maxGuests: number | null;
  advanceBookingHours: number;
  cancellationPolicy: string;
  cancellationPolicyText: string | null;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isRangeAvailability: boolean;
  capacityTotal: number;
  capacityBooked: number;
  status: string;
}

function displayPrice(o: OfferingListItem): string {
  const raw =
    o.pricingModel === "PER_PERSON" ? o.pricePerPerson :
    o.pricingModel === "PER_VEHICLE" ? o.pricePerVehicle :
    o.pricingModel === "PER_GROUP" ? o.pricePerGroup :
    o.privateBookingPrice;
  return raw ? `${raw} ${o.currency}` : "—";
}

export function OffersSection({ accessToken }: { accessToken: string }) {
  const [offerings, setOfferings] = useState<OfferingListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "create" | { edit: OfferingDetail }>("list");
  const [managingId, setManagingId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null);

  function loadOfferings() {
    api
      .get<OfferingListItem[]>("/offerings/mine", accessToken)
      .then(setOfferings)
      .catch((err) => setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل عروضك"));
  }

  useEffect(() => {
    loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEdit(id: string) {
    setLoadingEdit(id);
    setLoadError(null);
    try {
      const detail = await api.get<OfferingDetail>(`/offerings/${id}/manage`, accessToken);
      setMode({ edit: detail });
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات العرض للتعديل");
    } finally {
      setLoadingEdit(null);
    }
  }

  async function transition(id: string, action: string, reason?: string) {
    try {
      await api.patch(`/offerings/${id}/transition`, { action, reason }, accessToken);
      loadOfferings();
    } catch (err) {
      setLoadError(err instanceof ApiClientError ? err.message : "فشل تنفيذ الإجراء");
    }
  }

  if (mode === "create" || typeof mode === "object") {
    const editing = typeof mode === "object" ? mode.edit : null;
    return (
      <OfferingForm
        accessToken={accessToken}
        editing={editing}
        onDone={(createdId) => {
          setMode("list");
          loadOfferings();
          if (createdId) setManagingId(createdId);
        }}
        onCancel={() => setMode("list")}
      />
    );
  }

  return (
    <>
      <EarningsPanel accessToken={accessToken} />
      <BookingsPanel accessToken={accessToken} />
      <QuoteRequestsPanel accessToken={accessToken} />

      {loadError && <div className="error-box" style={{ marginBottom: 12 }}>{loadError}</div>}

      <div style={{ marginBottom: 16 }}>
        <button className="ab-btn g" onClick={() => setMode("create")}>+ إضافة عرض جديد</button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>الاسم</th><th>الفئة</th><th>النوع</th><th>الحالة</th><th>السعر</th><th>المواعيد المتاحة</th><th>الحجوزات</th><th>التقييم</th><th>الصور</th><th>تاريخ الإنشاء</th><th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {offerings.map((o) => (
              <Fragment key={o.id}>
                <tr>
                  <td>{o.nameAr}</td>
                  <td>{o.category ? o.category.nameAr : "—"}</td>
                  <td>{OFFERING_TYPE_LABELS[o.offeringType as keyof typeof OFFERING_TYPE_LABELS] ?? o.offeringType}</td>
                  <td>
                    <span className={`badge ${OFFERING_STATUS_BADGE[o.status] ?? "bp"}`}>
                      {OFFERING_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td>{displayPrice(o)}</td>
                  <td>{o._count.availability}</td>
                  <td>{o._count.bookings}</td>
                  <td>{o.avgRating ? `⭐ ${Number(o.avgRating).toFixed(1)} (${o.reviewCount})` : "—"}</td>
                  <td>{o.images.length}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(o.status === "DRAFT" || o.status === "REJECTED" || o.status === "SUSPENDED") && (
                      <button className="ab-btn m" disabled={loadingEdit === o.id} onClick={() => startEdit(o.id)}>
                        {loadingEdit === o.id ? "..." : "تعديل"}
                      </button>
                    )}
                    {o.status === "DRAFT" && (
                      <button className="ab-btn g" onClick={() => transition(o.id, "submit_for_review")}>إرسال للمراجعة</button>
                    )}
                    {o.status === "APPROVED" && (
                      <button className="ab-btn m" onClick={() => transition(o.id, "suspend", "أوقفه الشريك مؤقتًا")}>إيقاف</button>
                    )}
                    <button className="ab-btn m" onClick={() => setManagingId(managingId === o.id ? null : o.id)}>
                      {managingId === o.id ? "إغلاق" : "الصور والمواعيد"}
                    </button>
                  </td>
                </tr>
                {o.status === "REJECTED" && o.rejectionReason && (
                  <tr>
                    <td colSpan={11}>
                      <div className="error-box">سبب الرفض: {o.rejectionReason}</div>
                    </td>
                  </tr>
                )}
                {managingId === o.id && (
                  <tr>
                    <td colSpan={11}>
                      <OfferingManagePanel accessToken={accessToken} offeringId={o.id} onImagesChanged={loadOfferings} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {offerings.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--mut)", padding: 24 }}>لا توجد عروض بعد.</p>
        )}
      </div>
    </>
  );
}

// ── Create / Edit form ──────────────────────────────────────────────

function OfferingForm({
  accessToken,
  editing,
  onDone,
  onCancel,
}: {
  accessToken: string;
  editing: OfferingDetail | null;
  onDone: (createdId?: string) => void;
  onCancel: () => void;
}) {
  const { cities, loading: geoLoading } = useGeoData();
  const governorates = deriveGovernorates(cities);
  const [governorateId, setGovernorateId] = useState("");
  const citiesInGovernorate = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : [];

  const [categories, setCategories] = useState<OfferingCategory[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<OfferingFormValues>({
    resolver: zodResolver(offeringFormSchema),
    defaultValues: editing
      ? {
          offeringType: editing.offeringType as never,
          categoryId: editing.categoryId ?? "",
          nameEn: editing.nameEn,
          nameAr: editing.nameAr,
          descriptionEn: editing.descriptionEn,
          descriptionAr: editing.descriptionAr,
          cityId: editing.cityId,
          districtId: editing.districtId ?? "",
          meetingPoint: editing.meetingPoint ?? "",
          durationMinutes: editing.durationMinutes ?? undefined,
          languages: editing.languages ?? [],
          minAge: editing.minAge ?? undefined,
          accessibilityInfo: editing.accessibilityInfo ?? "",
          importantInstructions: editing.importantInstructions ?? "",
          vehicleType: (editing.vehicleType as never) ?? undefined,
          pricingModel: editing.pricingModel as never,
          pricePerPerson: editing.pricePerPerson ? Number(editing.pricePerPerson) : undefined,
          pricePerVehicle: editing.pricePerVehicle ? Number(editing.pricePerVehicle) : undefined,
          pricePerGroup: editing.pricePerGroup ? Number(editing.pricePerGroup) : undefined,
          privateBookingPrice: editing.privateBookingPrice ? Number(editing.privateBookingPrice) : undefined,
          childPrice: editing.childPrice ? Number(editing.childPrice) : undefined,
          currency: editing.currency,
          minGuests: editing.minGuests,
          maxGuests: editing.maxGuests ?? undefined,
          advanceBookingHours: editing.advanceBookingHours,
          cancellationPolicy: editing.cancellationPolicy as never,
          cancellationPolicyText: editing.cancellationPolicyText ?? "",
        }
      : { offeringType: "TOUR", pricingModel: "PER_PERSON", currency: "EGP", minGuests: 1, advanceBookingHours: 0, cancellationPolicy: "FREE_24H", languages: [] },
  });

  // Once the geo list loads, pre-select the governorate matching the
  // offering's existing city so the SearchableSelect cascade shows it —
  // without this, editing an offering would show "choose a city" as if
  // none were set, even though cityId is already populated in the form.
  useEffect(() => {
    if (!editing || governorateId || cities.length === 0) return;
    const match = cities.find((c) => c.id === editing.cityId);
    if (match?.governorate) setGovernorateId(match.governorate.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, cities]);

  const offeringType = watch("offeringType");
  const pricingModel = watch("pricingModel");
  const cancellationPolicy = watch("cancellationPolicy");
  const cityId = watch("cityId");

  useEffect(() => {
    // §4/§28: categories come from the backend's OfferingCategory table,
    // filtered by the selected type — never a hardcoded per-type list here.
    api
      .get<OfferingCategory[]>(`/offerings/categories?offeringType=${offeringType}`)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [offeringType]);

  async function onSubmit(values: OfferingFormValues) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || undefined,
        districtId: values.districtId || undefined,
        meetingPoint: values.meetingPoint || undefined,
        accessibilityInfo: values.accessibilityInfo || undefined,
        importantInstructions: values.importantInstructions || undefined,
        cancellationPolicyText: values.cancellationPolicyText || undefined,
        // Deliberately no `images` key here: photos are managed one at a
        // time via ImageManager's own upload/delete endpoints. Sending
        // even an empty images array would make the backend's update()
        // treat it as "replace the gallery with nothing" and delete every
        // photo already uploaded for this offering.
        ...(editing ? {} : { images: [] as { url: string; altText?: string }[] }),
      };
      if (editing) {
        await api.patch(`/offerings/${editing.id}`, payload, accessToken);
        onDone();
      } else {
        const created = await api.post<{ id: string }>("/offerings", payload, accessToken);
        onDone(created.id);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "فشل حفظ العرض");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 10 }}>{editing ? "تعديل العرض" : "إضافة عرض جديد"}</h3>
      {submitError && <div className="error-box">{submitError}</div>}

      <div className="fld">
        <label>نوع العرض</label>
        <select {...register("offeringType")}>
          {OFFERING_TYPES.map((t) => (
            <option key={t} value={t}>{OFFERING_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div className="fld">
        <label>الفئة</label>
        <select {...register("categoryId")}>
          <option value="">بدون فئة محددة</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameAr}</option>
          ))}
        </select>
        {categories.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--mut)" }}>لا توجد فئات معرّفة لهذا النوع بعد — يمكنك المتابعة بدون فئة.</p>
        )}
      </div>

      <div className="fld">
        <label>الاسم بالعربية</label>
        <input {...register("nameAr")} />
        {errors.nameAr && <div className="error-box">{errors.nameAr.message}</div>}
      </div>
      <div className="fld">
        <label>Name in English</label>
        <input {...register("nameEn")} dir="ltr" />
        {errors.nameEn && <div className="error-box">{errors.nameEn.message}</div>}
      </div>

      <div className="fld">
        <label>الوصف بالعربية</label>
        <textarea {...register("descriptionAr")} />
        {errors.descriptionAr && <div className="error-box">{errors.descriptionAr.message}</div>}
      </div>
      <div className="fld">
        <label>Description in English</label>
        <textarea {...register("descriptionEn")} dir="ltr" />
        {errors.descriptionEn && <div className="error-box">{errors.descriptionEn.message}</div>}
      </div>

      <div className="fld">
        <label>المحافظة</label>
        <SearchableSelect
          options={governorates.map((g) => ({ value: g.id, label: g.nameAr }))}
          value={governorateId}
          onChange={(v) => setGovernorateId(v)}
          placeholder="اختر المحافظة"
          disabled={geoLoading}
        />
      </div>
      <div className="fld">
        <label>المدينة</label>
        <Controller
          control={control}
          name="cityId"
          render={({ field }) => (
            <SearchableSelect
              options={citiesInGovernorate.map((c) => ({ value: c.id, label: c.nameAr }))}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="اختر المدينة"
              disabled={!governorateId}
            />
          )}
        />
        {errors.cityId && <div className="error-box">{errors.cityId.message}</div>}
      </div>
      <div className="fld">
        <label>المنطقة (اختياري)</label>
        <Controller
          control={control}
          name="districtId"
          render={({ field }) => (
            <SearchableSelect
              options={(cities.find((c) => c.id === cityId)?.districts ?? []).map((d) => ({ value: d.id, label: d.nameAr }))}
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="اختر المنطقة"
              disabled={!cityId}
            />
          )}
        />
      </div>

      <div className="fld">
        <label>نقطة اللقاء (اختياري)</label>
        <input {...register("meetingPoint")} />
      </div>
      <div className="fld">
        <label>المدة بالدقائق (اختياري)</label>
        <input type="number" min={1} {...register("durationMinutes", { valueAsNumber: true })} />
      </div>
      <div className="fld">
        <label>اللغات المتاحة</label>
        <Controller
          control={control}
          name="languages"
          render={({ field }) => (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { code: "ar", label: "العربية" },
                { code: "en", label: "English" },
                { code: "fr", label: "Français" },
                { code: "de", label: "Deutsch" },
                { code: "es", label: "Español" },
                { code: "ru", label: "Русский" },
                { code: "zh", label: "中文" },
              ].map((l) => (
                <label key={l.code} style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 400 }}>
                  <input
                    type="checkbox"
                    checked={(field.value ?? []).includes(l.code)}
                    onChange={(e) => {
                      const current = field.value ?? [];
                      field.onChange(e.target.checked ? [...current, l.code] : current.filter((c) => c !== l.code));
                    }}
                  />
                  {l.label}
                </label>
              ))}
            </div>
          )}
        />
      </div>

      <div className="fld">
        <label>الحد الأدنى لعدد الضيوف</label>
        <input type="number" min={1} {...register("minGuests", { valueAsNumber: true })} />
      </div>
      <div className="fld">
        <label>الحد الأقصى لعدد الضيوف (اختياري — بدون حد أقصى ثابت، حسب سعة العرض)</label>
        <input type="number" min={1} {...register("maxGuests", { valueAsNumber: true })} />
        {errors.maxGuests && <div className="error-box">{errors.maxGuests.message}</div>}
      </div>
      <div className="fld">
        <label>الحد الأدنى للعمر (اختياري)</label>
        <input type="number" min={0} {...register("minAge", { valueAsNumber: true })} />
      </div>
      <div className="fld">
        <label>معلومات إمكانية الوصول (اختياري)</label>
        <textarea {...register("accessibilityInfo")} />
      </div>
      <div className="fld">
        <label>تعليمات مهمة (اختياري)</label>
        <textarea {...register("importantInstructions")} />
      </div>

      {offeringType === "TRANSPORTATION" && (
        <div className="fld">
          <label>نوع المركبة</label>
          <select {...register("vehicleType")}>
            <option value="">اختر</option>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>{VEHICLE_TYPE_LABELS[v]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="fld">
        <label>نموذج التسعير</label>
        <select {...register("pricingModel")}>
          {PRICING_MODELS.map((p) => (
            <option key={p} value={p}>{PRICING_MODEL_LABELS[p]}</option>
          ))}
        </select>
        {errors.pricingModel && <div className="error-box">{errors.pricingModel.message}</div>}
      </div>

      {/* Only the price field matching the selected pricing model is shown
          — §4/§5: "do not force every experience into a single pricing model". */}
      {pricingModel === "PER_PERSON" && (
        <>
          <div className="fld"><label>السعر للفرد (بالغ)</label><input type="number" step="0.01" {...register("pricePerPerson", { valueAsNumber: true })} /></div>
          <div className="fld"><label>سعر الطفل (اختياري)</label><input type="number" step="0.01" {...register("childPrice", { valueAsNumber: true })} /></div>
        </>
      )}
      {pricingModel === "PER_VEHICLE" && (
        <div className="fld"><label>السعر للمركبة</label><input type="number" step="0.01" {...register("pricePerVehicle", { valueAsNumber: true })} /></div>
      )}
      {pricingModel === "PER_GROUP" && (
        <div className="fld"><label>السعر للمجموعة</label><input type="number" step="0.01" {...register("pricePerGroup", { valueAsNumber: true })} /></div>
      )}
      {pricingModel === "PRIVATE_BOOKING" && (
        <div className="fld"><label>سعر الحجز الخاص</label><input type="number" step="0.01" {...register("privateBookingPrice", { valueAsNumber: true })} /></div>
      )}

      <div className="fld">
        <label>سياسة الإلغاء</label>
        <select {...register("cancellationPolicy")}>
          {CANCELLATION_POLICIES.map((c) => (
            <option key={c} value={c}>{CANCELLATION_POLICY_LABELS[c]}</option>
          ))}
        </select>
      </div>
      {cancellationPolicy === "CUSTOM" && (
        <div className="fld">
          <label>نص سياسة الإلغاء المخصصة</label>
          <textarea {...register("cancellationPolicyText")} />
          {errors.cancellationPolicyText && <div className="error-box">{errors.cancellationPolicyText.message}</div>}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn-primary" disabled={submitting} onClick={handleSubmit(onSubmit)}>
          {submitting ? "..." : editing ? "حفظ التعديلات" : "حفظ كمسودة"}
        </button>
        <button className="ab-btn m" onClick={onCancel} disabled={submitting}>إلغاء</button>
      </div>
      {!editing && (
        <p style={{ fontSize: 12, color: "var(--mut)", marginTop: 8 }}>
          سيتم حفظ العرض كمسودة أولاً — يمكنك بعدها إضافة الصور والمواعيد قبل إرساله للمراجعة.
        </p>
      )}
    </div>
  );
}

// ── Photos + availability management for one offering ────────────────

function OfferingManagePanel({ accessToken, offeringId, onImagesChanged }: { accessToken: string; offeringId: string; onImagesChanged: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 12, background: "var(--bg2, #f7f7f7)", borderRadius: 8 }}>
      <ImageManager accessToken={accessToken} offeringId={offeringId} onChanged={onImagesChanged} />
      <AvailabilityManager accessToken={accessToken} offeringId={offeringId} />
    </div>
  );
}

function ImageManager({ accessToken, offeringId, onChanged }: { accessToken: string; offeringId: string; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      await api.postForm(`/offerings/${offeringId}/images`, body, accessToken);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h4>الصور</h4>
      {error && <div className="error-box">{error}</div>}
      <input
        type="file"
        accept="image/jpeg,image/png"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {uploading && <p style={{ fontSize: 12 }}>جاري الرفع...</p>}
    </div>
  );
}

function AvailabilityManager({ accessToken, offeringId }: { accessToken: string; offeringId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [offeringInfo, setOfferingInfo] = useState<{ minGuests: number; maxGuests: number | null; advanceBookingHours: number } | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRange, setIsRange] = useState(false);
  const [capacity, setCapacity] = useState(10);
  const [repeatDays, setRepeatDays] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadSlots() {
    api
      .get<AvailabilitySlot[]>(`/offerings/${offeringId}/availability/mine`, accessToken)
      .then(setSlots)
      .catch(() => setSlots([]));
  }

  useEffect(() => {
    loadSlots();
    api
      .get<{ minGuests: number; maxGuests: number | null; advanceBookingHours: number }>(`/offerings/${offeringId}/manage`, accessToken)
      .then((o) => setOfferingInfo({ minGuests: o.minGuests, maxGuests: o.maxGuests, advanceBookingHours: o.advanceBookingHours }))
      .catch(() => setOfferingInfo(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offeringId]);

  function addDaysISO(base: string, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Phase 3: "repeating availability where the existing backend supports
  // it" — the backend has no recurrence concept on OfferingAvailabilitySlot,
  // so this is a client-side convenience that calls the real, existing
  // single-slot endpoint once per day. Every resulting row is a genuine,
  // individually capacity-tracked slot — not a fabricated recurring rule.
  async function addSlot(status: "OPEN" | "BLACKOUT" = "OPEN") {
    if (!date || (status === "OPEN" && capacity < 1)) return;
    setSubmitting(true);
    setError(null);
    try {
      const days = Math.max(1, Math.min(90, repeatDays));
      for (let i = 0; i < days; i++) {
        const d = addDaysISO(date, i);
        await api.post(
          `/offerings/${offeringId}/availability`,
          {
            date: d,
            startTime: startTime ? `${d}T${startTime}:00` : undefined,
            endTime: isRange && endTime ? `${d}T${endTime}:00` : undefined,
            isRangeAvailability: isRange,
            capacityTotal: status === "BLACKOUT" ? 0 : capacity,
            status,
          },
          accessToken
        );
      }
      setDate("");
      setStartTime("");
      setEndTime("");
      setRepeatDays(1);
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إضافة الموعد");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSlot(slotId: string) {
    try {
      await api.del(`/offerings/${offeringId}/availability/${slotId}`, accessToken);
      loadSlots();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل حذف الموعد");
    }
  }

  return (
    <div>
      <h4>إدارة المواعيد المتاحة</h4>
      {offeringInfo && (
        <p style={{ fontSize: 12, color: "var(--mut)", marginBottom: 8 }}>
          الحد الأدنى للضيوف: {offeringInfo.minGuests} — الحد الأقصى: {offeringInfo.maxGuests ?? "بدون حد"} — الحجز المسبق المطلوب: {offeringInfo.advanceBookingHours} ساعة
          {" "}(هذه الإعدادات تُعدَّل من نموذج تعديل العرض، وتُطبَّق تلقائيًا على كل الحجوزات)
        </p>
      )}
      {error && <div className="error-box">{error}</div>}
      <div className="fld"><label>التاريخ</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="frow">
        <div className="fld"><label>وقت البدء (اختياري)</label><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        <div className="fld">
          <label>
            <input type="checkbox" checked={isRange} onChange={(e) => setIsRange(e.target.checked)} style={{ marginInlineEnd: 4 }} />
            نطاق زمني مستمر (مثل سيارة متاحة طوال اليوم)
          </label>
          {isRange && <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="وقت الانتهاء" />}
        </div>
      </div>
      <div className="frow">
        <div className="fld"><label>السعة</label><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></div>
        <div className="fld"><label>تكرار لعدد أيام (اختياري)</label><input type="number" min={1} max={90} value={repeatDays} onChange={(e) => setRepeatDays(Number(e.target.value))} /></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ab-btn g" disabled={submitting || !date} onClick={() => addSlot("OPEN")}>+ إضافة موعد متاح</button>
        <button className="ab-btn m" disabled={submitting || !date} onClick={() => addSlot("BLACKOUT")}>حظر هذا التاريخ (غير متاح)</button>
      </div>

      <ul style={{ marginTop: 10 }}>
        {slots.map((s) => {
          const remaining = s.capacityTotal - s.capacityBooked;
          return (
            <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--line, #eee)" }}>
              <span>
                <strong>{new Date(s.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}</strong>
                {s.startTime && ` — ${new Date(s.startTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
                {s.endTime && s.isRangeAvailability && ` – ${new Date(s.endTime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
                <br />
                {s.status === "BLACKOUT" ? (
                  <span style={{ color: "var(--mut)" }}>محظور (غير متاح)</span>
                ) : (
                  <span style={{ fontSize: 13 }}>السعة: {s.capacityTotal} — المحجوز: {s.capacityBooked} — المتبقي: {remaining}</span>
                )}
              </span>
              <button className="ab-btn m" onClick={() => removeSlot(s.id)}>حذف</button>
            </li>
          );
        })}
        {slots.length === 0 && <p style={{ color: "var(--mut)", fontSize: 13 }}>لا توجد مواعيد متاحة بعد.</p>}
      </ul>
    </div>
  );
}

// ── Earnings summary (§2, commercial-layer session) ───────────────────

interface EarningsData {
  totalSales: number;
  egymotelzCommission: number;
  partnerEarnings: number;
  bookingCounts: { pending: number; confirmed: number; completed: number; cancelled: number; noShow: number; refunded: number };
}

function EarningsPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EarningsData>("/offering-bookings/earnings/mine", accessToken)
      .then(setData)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "تعذر تحميل بيانات الأرباح"));
  }, [accessToken]);

  if (error) return <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>;
  if (!data) return null;

  const stat = (label: string, value: string | number) => (
    <div style={{ background: "var(--bg2, #f7f7f7)", borderRadius: 8, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "var(--mut)" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 10 }}>ملخص الأرباح</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 12 }}>
        {stat("إجمالي المبيعات", data.totalSales.toLocaleString("ar-EG"))}
        {stat("عمولة إيجي موتيلز", data.egymotelzCommission.toLocaleString("ar-EG"))}
        {stat("أرباحك", data.partnerEarnings.toLocaleString("ar-EG"))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
        {stat("قيد الانتظار", data.bookingCounts.pending)}
        {stat("مؤكدة", data.bookingCounts.confirmed)}
        {stat("مكتملة", data.bookingCounts.completed)}
        {stat("ملغاة", data.bookingCounts.cancelled)}
        {stat("لم يحضر", data.bookingCounts.noShow)}
        {stat("مستردة", data.bookingCounts.refunded)}
      </div>
    </div>
  );
}

// ── Bookings list (found missing during final QA — partners had no way
// to actually see who booked their offerings) ─────────────────────────

interface OfferingBookingRow {
  id: string;
  bookingReference: string;
  status: string;
  bookingDate: string;
  bookingTime: string | null;
  adultCount: number;
  childCount: number;
  totalPrice: string;
  currency: string;
  createdAt: string;
  guest: { fullName: string; phone: string };
  offering: { nameAr: string; nameEn: string };
  commission: { partnerAmount: string; egymotelzAmount: string; percentageApplied: string | null; status: string } | null;
}

const BOOKING_STATUS_LABELS_AR: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
  NO_SHOW: "لم يحضر",
};

function BookingsPanel({ accessToken }: { accessToken: string }) {
  const [rows, setRows] = useState<OfferingBookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: OfferingBookingRow[] }>("/offering-bookings/mine/list?pageSize=20", accessToken)
      .then((res) => setRows(res.items))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "تعذر تحميل الحجوزات"));
  }, [accessToken]);

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 10 }}>أحدث الحجوزات</h3>
      {error && <div className="error-box">{error}</div>}
      <div className="data-table">
        <table>
          <thead>
            <tr><th>المرجع</th><th>العرض</th><th>العميل</th><th>التاريخ</th><th>الحالة</th><th>المبلغ الإجمالي</th><th>عمولة إيجي موتيلز</th><th>صافي أرباحك</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.bookingReference}</td>
                <td>{r.offering.nameAr}</td>
                <td>{r.guest.fullName}</td>
                <td>{new Date(r.bookingDate).toLocaleDateString("ar-EG")}</td>
                <td>{BOOKING_STATUS_LABELS_AR[r.status] ?? r.status}</td>
                <td>{r.totalPrice} {r.currency}</td>
                <td>
                  {r.commission
                    ? r.commission.status === "CANCELLED"
                      ? <span style={{ color: "var(--mut)" }}>ملغاة (لا تُحتسب)</span>
                      : `${r.commission.percentageApplied ? `${r.commission.percentageApplied}% = ` : ""}${r.commission.egymotelzAmount} ${r.currency}`
                    : "—"}
                </td>
                <td>{r.commission && r.commission.status !== "CANCELLED" ? `${r.commission.partnerAmount} ${r.currency}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !error && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد حجوزات بعد.</p>}
      </div>
    </div>
  );
}

// ── Quote requests (Part 5/11, Special Events session) ─────────────────

interface QuoteRequestRow {
  id: string;
  eventType: string;
  preferredDate: string | null;
  guestCount: number;
  preferredLocation: string | null;
  budgetRangeMin: string | null;
  budgetRangeMax: string | null;
  status: string;
  quotedPrice: string | null;
  contactName: string;
  contactPhone: string;
  offering: { nameAr: string; nameEn: string };
  createdAt: string;
}

const QUOTE_STATUS_LABEL: Record<string, string> = { PENDING: "بانتظار الرد", QUOTED: "تم إرسال عرض السعر", CONVERTED: "تم التحويل لحجز", DECLINED: "مرفوض" };

function QuoteRequestsPanel({ accessToken }: { accessToken: string }) {
  const [rows, setRows] = useState<QuoteRequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  function load() {
    api
      .get<QuoteRequestRow[]>("/offerings/quote-requests/mine", accessToken)
      .then(setRows)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "تعذر تحميل طلبات عروض الأسعار"));
  }

  useEffect(load, [accessToken]);

  async function respond(id: string, status: "QUOTED" | "DECLINED") {
    try {
      await api.patch(`/offerings/quote-requests/${id}/respond`, { status, quotedPrice: status === "QUOTED" ? Number(price) : undefined, quotedNotes: notes || undefined }, accessToken);
      setRespondingId(null);
      setPrice("");
      setNotes("");
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إرسال الرد");
    }
  }

  return (
    <div className="form-card" style={{ marginBottom: 20 }}>
      <h3 style={{ marginBottom: 10 }}>طلبات عروض الأسعار (مناسبات خاصة)</h3>
      {error && <div className="error-box">{error}</div>}
      <div className="data-table">
        <table>
          <thead>
            <tr><th>العرض</th><th>نوع المناسبة</th><th>التاريخ</th><th>الضيوف</th><th>الميزانية</th><th>الحالة</th><th>إجراء</th></tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id}>
                <td>{q.offering.nameAr}</td>
                <td>{q.eventType}</td>
                <td>{q.preferredDate ? new Date(q.preferredDate).toLocaleDateString("ar-EG") : "—"}</td>
                <td>{q.guestCount}</td>
                <td>{q.budgetRangeMin && q.budgetRangeMax ? `${q.budgetRangeMin}–${q.budgetRangeMax}` : "—"}</td>
                <td><span className="badge bp">{QUOTE_STATUS_LABEL[q.status] ?? q.status}</span></td>
                <td>
                  {q.status === "PENDING" && (
                    respondingId === q.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input type="number" placeholder="السعر" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: 90 }} />
                        <button className="ab-btn g" onClick={() => respond(q.id, "QUOTED")}>إرسال</button>
                        <button className="ab-btn m" onClick={() => respond(q.id, "DECLINED")}>رفض</button>
                      </div>
                    ) : (
                      <button className="ab-btn m" onClick={() => setRespondingId(q.id)}>الرد</button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات عروض أسعار بعد</p>}
      </div>
    </div>
  );
}
