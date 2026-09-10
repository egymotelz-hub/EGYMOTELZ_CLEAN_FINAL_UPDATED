import { z } from "zod";

// Mirrors backend/src/validators/offerings.validators.ts's enums exactly —
// keep these two lists in sync by hand if the backend enum ever changes.
export const OFFERING_TYPES = ["TOUR", "EXPERIENCE", "TRANSPORTATION", "EVENT"] as const;
export type OfferingTypeValue = (typeof OFFERING_TYPES)[number];

export const OFFERING_TYPE_LABELS: Record<OfferingTypeValue, string> = {
  TOUR: "جولة سياحية",
  EXPERIENCE: "تجربة",
  TRANSPORTATION: "مواصلات",
  EVENT: "فعالية",
};

export const PRICING_MODELS = ["PER_PERSON", "PER_VEHICLE", "PER_GROUP", "PRIVATE_BOOKING"] as const;
export type PricingModelValue = (typeof PRICING_MODELS)[number];

export const PRICING_MODEL_LABELS: Record<PricingModelValue, string> = {
  PER_PERSON: "بالفرد",
  PER_VEHICLE: "بالمركبة",
  PER_GROUP: "بالمجموعة",
  PRIVATE_BOOKING: "حجز خاص",
};

export const VEHICLE_TYPES = ["SEDAN", "SUV", "VAN", "MINIBUS"] as const;
export type VehicleTypeValue = (typeof VEHICLE_TYPES)[number];
export const VEHICLE_TYPE_LABELS: Record<VehicleTypeValue, string> = {
  SEDAN: "سيدان",
  SUV: "دفع رباعي",
  VAN: "فان",
  MINIBUS: "ميني باص",
};

export const CANCELLATION_POLICIES = ["FREE_24H", "FREE_48H", "NON_REFUNDABLE", "CUSTOM"] as const;
export type CancellationPolicyValue = (typeof CANCELLATION_POLICIES)[number];
export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicyValue, string> = {
  FREE_24H: "إلغاء مجاني حتى 24 ساعة",
  FREE_48H: "إلغاء مجاني حتى 48 ساعة",
  NON_REFUNDABLE: "غير قابل للاسترداد",
  CUSTOM: "سياسة مخصصة",
};

export const OFFERING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "بانتظار المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};
export const OFFERING_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bp",
  PENDING_REVIEW: "bp",
  APPROVED: "ba",
  REJECTED: "br",
  SUSPENDED: "br",
};

// Client-side mirror of the backend's cross-field checks (§4: "do not
// force every experience into a single pricing model"). Kept intentionally
// close to backend/src/validators/offerings.validators.ts's
// offeringBaseSchema so a rejected submission here matches what the
// server would also reject, rather than surprising the partner with a
// second, different error after a round trip.
export const offeringFormSchema = z
  .object({
    offeringType: z.enum(OFFERING_TYPES),
    categoryId: z.string().optional().or(z.literal("")),
    nameEn: z.string().min(3, "الاسم بالإنجليزية مطلوب (3 أحرف على الأقل)").max(160),
    nameAr: z.string().min(3, "الاسم بالعربية مطلوب (3 أحرف على الأقل)").max(160),
    descriptionEn: z.string().min(10, "الوصف بالإنجليزية مطلوب (10 أحرف على الأقل)").max(5000),
    descriptionAr: z.string().min(10, "الوصف بالعربية مطلوب (10 أحرف على الأقل)").max(5000),
    cityId: z.string().min(1, "المدينة مطلوبة"),
    districtId: z.string().optional().or(z.literal("")),
    meetingPoint: z.string().max(500).optional().or(z.literal("")),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    durationMinutes: z.number().int().min(1).max(10080).optional(),
    languages: z.array(z.string()).default([]),
    minAge: z.number().int().min(0).max(120).optional(),
    accessibilityInfo: z.string().max(2000).optional().or(z.literal("")),
    importantInstructions: z.string().max(2000).optional().or(z.literal("")),
    vehicleType: z.enum(VEHICLE_TYPES).optional(),
    pricingModel: z.enum(PRICING_MODELS),
    pricePerPerson: z.number().positive().optional(),
    pricePerVehicle: z.number().positive().optional(),
    pricePerGroup: z.number().positive().optional(),
    privateBookingPrice: z.number().positive().optional(),
    childPrice: z.number().positive().optional(),
    currency: z.string().default("EGP"),
    minGuests: z.number().int().min(1).max(500).default(1),
    maxGuests: z.number().int().min(1).max(500).optional(),
    advanceBookingHours: z.number().int().min(0).max(720).default(0),
    cancellationPolicy: z.enum(CANCELLATION_POLICIES).default("FREE_24H"),
    cancellationPolicyText: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine((v) => v.maxGuests === undefined || v.maxGuests >= v.minGuests, {
    message: "الحد الأقصى للضيوف يجب أن يكون أكبر من أو يساوي الحد الأدنى",
    path: ["maxGuests"],
  })
  .refine(
    (v) => {
      switch (v.pricingModel) {
        case "PER_PERSON":
          return v.pricePerPerson !== undefined;
        case "PER_VEHICLE":
          return v.pricePerVehicle !== undefined;
        case "PER_GROUP":
          return v.pricePerGroup !== undefined;
        case "PRIVATE_BOOKING":
          return v.privateBookingPrice !== undefined;
      }
    },
    { message: "الرجاء إدخال السعر المطابق لنموذج التسعير المختار", path: ["pricingModel"] }
  )
  .refine((v) => v.cancellationPolicy !== "CUSTOM" || !!v.cancellationPolicyText, {
    message: "الرجاء كتابة نص سياسة الإلغاء المخصصة",
    path: ["cancellationPolicyText"],
  });

export type OfferingFormValues = z.infer<typeof offeringFormSchema>;
