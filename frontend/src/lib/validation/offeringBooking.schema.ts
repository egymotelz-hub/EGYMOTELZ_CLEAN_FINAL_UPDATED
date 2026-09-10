import { z } from "zod";
import { internationalPhone, whatsappNumber, email as emailSchema } from "./shared";

export const offeringBookingSchema = z.object({
  offeringId: z.string().min(1),
  availabilitySlotId: z.string().optional(),
  bookingDate: z.coerce.date({ required_error: "الرجاء اختيار التاريخ", invalid_type_error: "التاريخ غير صحيح" }),
  bookingTime: z.string().optional(), // "HH:MM", combined with bookingDate before submit
  adultCount: z.coerce.number().int().min(1, "ضيف واحد على الأقل"),
  childCount: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(1000).optional(),
  // Transportation-only — only rendered/populated when the offering's
  // own offeringType is TRANSPORTATION.
  pickupLocation: z.string().max(300).optional(),
  destinationLocation: z.string().max(300).optional(),
  bagCount: z.coerce.number().int().min(0).optional(),
  childSeatRequired: z.boolean().optional(),
  fullName: z.string().min(3, "الاسم الكامل مطلوب").max(120),
  phone: internationalPhone,
  whatsappNumber,
  email: emailSchema,
  nationality: z.string().min(1, "الرجاء اختيار الجنسية"),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الحجز والإلغاء" }) }),
});
export type OfferingBookingFormValues = z.infer<typeof offeringBookingSchema>;
