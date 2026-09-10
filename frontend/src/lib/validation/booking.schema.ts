import { z } from "zod";
import { internationalPhone, whatsappNumber, email as emailSchema } from "./shared";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const bookingSchema = z
  .object({
    unitId: z.string().min(1, "الرجاء اختيار وحدة"),
    fullName: z.string().min(3, "الاسم الكامل مطلوب").max(120),
    phone: internationalPhone,
    whatsappNumber,
    email: emailSchema,
    nationality: z.string().min(1, "الرجاء اختيار الجنسية"),
    checkIn: z.coerce.date({ required_error: "تاريخ الوصول مطلوب", invalid_type_error: "تاريخ الوصول غير صحيح" }),
    checkOut: z.coerce.date({ required_error: "تاريخ المغادرة مطلوب", invalid_type_error: "تاريخ المغادرة غير صحيح" }),
    // Mirrors backend/src/validators/bookings.validators.ts — was 5, not
    // tied to any real per-unit capacity (Unit has no such field), so
    // raised to a generous sanity bound rather than an arbitrary ceiling.
    guestCount: z.coerce.number().int().min(1).max(100),
    notes: z.string().max(1000).optional(),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الحجز والإلغاء" }) }),
  })
  .superRefine((data, ctx) => {
    // Issue 7: same relational date rules the backend enforces
    // (bookings.validators.ts), checked client-side so the user sees the
    // problem immediately instead of after a round-trip 422.
    if (data.checkIn < startOfToday()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["checkIn"], message: "تاريخ الوصول لا يمكن أن يكون في الماضي" });
    }
    if (data.checkOut <= data.checkIn) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["checkOut"], message: "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول" });
    }
  });

export type BookingFormValues = z.infer<typeof bookingSchema>;
