import { z } from "zod";
import { internationalPhone, whatsappNumber, egyptianNationalId, strongPassword, email as emailSchema, moneyAmount } from "./shared";

export const ownerApplicationSchema = z
  .object({
    // Step 0
    fullName: z.string().min(3, "الاسم الكامل مطلوب (3 أحرف على الأقل)").max(120),
    phone: internationalPhone,
    whatsappNumber, // Item 12: may differ from the primary phone number
    email: emailSchema,
    nationalId: egyptianNationalId,
    password: strongPassword,

    // Step 1 — Item 1: APARTMENT added. Item 2: real city/district records
    // (searchable dropdown), not a hardcoded 3-city enum.
    propertyType: z.enum(["RESIDENTIAL_BUILDING", "VILLA", "FULL_FLOOR", "APARTMENT"]),
    cityId: z.string().min(1, "الرجاء اختيار المدينة"),
    districtId: z.string().optional(),
    districtFreeText: z.string().max(120).optional(),
    address: z.string().min(5, "العنوان التفصيلي مطلوب").max(300),
    // Backend requires floorCount/unitCount >= 1 — coerce so an empty input
    // ("") reliably fails as "required" rather than silently becoming 0 and
    // producing a confusing server-side 422 (the exact bug reported earlier).
    floorCount: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number({ required_error: "عدد الطوابق مطلوب", invalid_type_error: "عدد الطوابق يجب أن يكون رقمًا" }).int().min(1, "يجب أن يكون عدد الطوابق 1 على الأقل").max(200)
    ),
    unitCount: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
      z.number({ required_error: "عدد الوحدات مطلوب", invalid_type_error: "عدد الوحدات يجب أن يكون رقمًا" }).int().min(1, "يجب أن يكون عدد الوحدات 1 على الأقل").max(2000)
    ),

    // Step 2 — Item 1: multi-select readiness, replacing the old single
    // "condition" choice. finishingTypes/furnishingItems are only required
    // to be non-empty when the matching readiness option is selected.
    readinessOptions: z.array(z.enum(["FINISHING_REQUIRED", "FURNISHING_REQUIRED", "FULLY_READY"])).min(1, "الرجاء اختيار حالة واحدة على الأقل"),
    finishingTypes: z.array(z.enum(["PAINTING", "PLUMBING", "ELECTRICAL", "FLOORING", "DOORS_WINDOWS", "BATHROOMS", "KITCHEN", "CEILING", "FULL_FINISHING", "OTHER"])).default([]),
    furnishingItems: z.array(z.enum(["BEDROOM", "LIVING_ROOM", "KITCHEN_APPLIANCES", "AIR_CONDITIONING", "TV", "CURTAINS", "COMPLETE_FURNISHING"])).default([]),
    notes: z.string().max(2000).optional(),

    // Step 3 — budgetAmount's required-ness depends on needsFinancing (see .superRefine below)
    needsFinancing: z.enum(["YES", "NO", "PARTIAL"]),
    needsFurnishingHelp: z.enum(["YES", "NO", "PARTIAL"]),
    budgetAmount: moneyAmount({ required: false, max: 100_000_000 }),

    // Step 5
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على شروط الشراكة للمتابعة" }) }),
  })
  .superRefine((data, ctx) => {
    if (!data.districtId && !data.districtFreeText) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["districtId"], message: "الرجاء اختيار الحي أو كتابته" });
    }
    if (data.readinessOptions.includes("FINISHING_REQUIRED") && data.finishingTypes.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["finishingTypes"], message: "الرجاء اختيار نوع التشطيب المطلوب" });
    }
    if (data.readinessOptions.includes("FURNISHING_REQUIRED") && data.furnishingItems.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["furnishingItems"], message: "الرجاء اختيار الأثاث المطلوب" });
    }
    // Item 3: financing amount required only when financing is actually needed.
    if (data.needsFinancing !== "NO" && (data.budgetAmount === undefined || data.budgetAmount === null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["budgetAmount"], message: "الرجاء إدخال المبلغ المطلوب للتمويل" });
    }
  });

export type OwnerApplicationFormValues = z.infer<typeof ownerApplicationSchema>;
