import { z } from "zod";
import { internationalPhone, whatsappNumber, strongPassword, email as emailSchema } from "./shared";

// Mirrors backend/src/validators/partners.validators.ts's partnerTypeEnum exactly.
export const PARTNER_TYPES = [
  "CONTRACTOR",
  "HOTEL_MANAGEMENT",
  "INTERIOR_DESIGN",
  "FURNITURE",
  "MAINTENANCE",
  "CLEANING",
  "APPLIANCES",
  "REAL_ESTATE",
  "HOSPITALITY_SERVICES",
  "OTHER",
] as const;

export const PARTNER_TYPE_LABELS: Record<(typeof PARTNER_TYPES)[number], string> = {
  CONTRACTOR: "مقاول",
  HOTEL_MANAGEMENT: "إدارة وتشغيل فندقي",
  INTERIOR_DESIGN: "شركة ديكور وتشطيبات",
  FURNITURE: "فرش وتجهيز",
  MAINTENANCE: "صيانة",
  CLEANING: "نظافة",
  APPLIANCES: "أجهزة منزلية",
  REAL_ESTATE: "عقارات",
  HOSPITALITY_SERVICES: "خدمات ضيافة",
  OTHER: "أخرى",
};

export const partnerRegistrationSchema = z.object({
  companyName: z.string().min(2, "اسم الشركة مطلوب").max(200),
  legalName: z.string().max(200).optional().or(z.literal("")),
  contactPersonName: z.string().min(2, "اسم الشخص المسؤول مطلوب").max(120),
  phone: internationalPhone,
  whatsappNumber,
  email: emailSchema,
  password: strongPassword,

  website: z.string().url("الرجاء إدخال رابط صحيح").max(300).optional().or(z.literal("")),
  governorate: z.string().max(120).optional(),
  cityId: z.string().min(1, "الرجاء اختيار المدينة"),
  address: z.string().max(500).optional(),
  yearsOfExperience: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(0).max(80).optional()
  ),
  employeeCount: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(1).max(100000).optional()
  ),
  companyDescription: z.string().max(3000).optional(),

  primaryType: z.enum(PARTNER_TYPES, { errorMap: () => ({ message: "الرجاء اختيار المجال الرئيسي" }) }),
  capabilities: z.array(z.enum(PARTNER_TYPES)).min(1, "الرجاء اختيار مجال واحد على الأقل"),

  termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على الشروط للمتابعة" }) }),
});
export type PartnerRegistrationFormValues = z.infer<typeof partnerRegistrationSchema>;
