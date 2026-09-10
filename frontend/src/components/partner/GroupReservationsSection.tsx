"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, ApiClientError } from "@/lib/apiClient";

interface GroupReservationRow {
  id: string;
  companyName: string;
  contactName: string;
  requestedUnitCount: number;
  requestedGuestCount: number;
  status: string;
  createdAt: string;
  bookings: { id: string; checkIn: string; checkOut: string }[];
}

interface FormValues {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  requestedUnitCount: number;
  requestedGuestCount: number;
  notes?: string;
}

const STATUS_LABEL: Record<string, string> = { SUBMITTED: "بانتظار المراجعة", CONFIRMED: "مؤكد", CANCELLED: "ملغى" };

export function GroupReservationsSection({ accessToken }: { accessToken: string }) {
  const [rows, setRows] = useState<GroupReservationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function load() {
    api
      .get<GroupReservationRow[]>("/group-reservations/mine", accessToken)
      .then(setRows)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "تعذر تحميل طلبات الحجز الجماعي"));
  }

  useEffect(load, [accessToken]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        "/group-reservations",
        { ...values, requestedUnitCount: Number(values.requestedUnitCount), requestedGuestCount: Number(values.requestedGuestCount) },
        accessToken
      );
      reset();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "فشل إرسال طلب الحجز الجماعي");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <button className="ab-btn g" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "إلغاء" : "+ طلب حجز جماعي / شركة جديد"}
        </button>
      </div>

      {showForm && (
        <div className="form-card" style={{ marginBottom: 20 }}>
          <div className="fld"><label>اسم الشركة</label><input {...register("companyName", { required: true })} /></div>
          <div className="fld"><label>اسم المسؤول</label><input {...register("contactName", { required: true })} /></div>
          <div className="fld"><label>هاتف المسؤول</label><input {...register("contactPhone", { required: true })} dir="ltr" placeholder="+201012345678" /></div>
          <div className="fld"><label>بريد المسؤول</label><input {...register("contactEmail", { required: true })} dir="ltr" /></div>
          <div className="fld"><label>عدد الوحدات المطلوبة</label><input type="number" min={1} {...register("requestedUnitCount", { required: true, valueAsNumber: true })} /></div>
          <div className="fld"><label>عدد الضيوف المتوقع</label><input type="number" min={1} {...register("requestedGuestCount", { required: true, valueAsNumber: true })} /></div>
          <div className="fld"><label>ملاحظات (اختياري)</label><textarea {...register("notes")} /></div>
          <button className="btn-primary" disabled={submitting} onClick={handleSubmit(onSubmit)}>
            {submitting ? "..." : "إرسال الطلب"}
          </button>
        </div>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr><th>الشركة</th><th>الوحدات المطلوبة</th><th>الضيوف</th><th>الوحدات المرتبطة</th><th>الحالة</th><th>التاريخ</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.companyName}</td>
                <td>{r.requestedUnitCount}</td>
                <td>{r.requestedGuestCount}</td>
                <td>{r.bookings.length}</td>
                <td><span className="badge bp">{STATUS_LABEL[r.status] ?? r.status}</span></td>
                <td>{new Date(r.createdAt).toLocaleDateString("ar-EG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", padding: 16 }}>لا توجد طلبات حجز جماعي بعد</p>}
      </div>
    </>
  );
}
