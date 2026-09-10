import { z } from "zod";
import { internationalPhone, whatsappNumber, strongPassword, email as emailSchema } from "./shared";

const PROPERTY_TYPES_MANAGED = ["APARTMENTS", "BUILDINGS", "HOTELS", "SERVICED_APARTMENTS", "RESORTS", "VILLAS", "OTHER"] as const;

function numberField(label: string) {
  return z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ required_error: `${label} مطلوب` }).int().min(0)
  );
}

export const hotelManagementCompanySchema = z.object({
  companyName: z.string().min(2, "اسم الشركة مطلوب").max(200),
  commercialRegistrationNumber: z.string().min(3, "رقم السجل التجاري مطلوب").max(60),
  taxCardNumber: z.string().min(3, "الرقم الضريبي مطلوب").max(60),
  companyAddress: z.string().min(5, "عنوان الشركة مطلوب").max(300),
  governorate: z.string().min(2, "المحافظة مطلوبة").max(120),
  cityId: z.string().min(1, "الرجاء اختيار المدينة"),

  contactPerson: z.string().min(3, "اسم مسؤول التواصل مطلوب").max(120),
  jobTitle: z.string().min(2, "المسمى الوظيفي مطلوب").max(120),
  phone: internationalPhone,
  whatsappNumber,
  email: emailSchema,
  companyWebsite: z.string().url("رابط غير صحيح").optional().or(z.literal("")),
  password: strongPassword,

  yearsOfExperience: numberField("سنوات الخبرة"),
  numberOfEmployees: numberField("عدد الموظفين"),
  propertiesManagedCount: numberField("عدد العقارات المُدارة"),
  propertiesFurnishedCount: numberField("عدد العقارات المؤثثة"),
  propertiesOperatedCount: numberField("عدد العقارات المُشغّلة"),
  propertyTypesManaged: z.array(z.enum(PROPERTY_TYPES_MANAGED)).min(1, "الرجاء اختيار نوع واحد على الأقل"),

  areasOfOperation: z.string().max(2000).optional(),
  availableServices: z.string().max(2000).optional(),
  previousClients: z.string().max(2000).optional(),
  companyDescription: z.string().max(3000).optional(),

  termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على الشروط للمتابعة" }) }),
});
export type HotelManagementCompanyFormValues = z.infer<typeof hotelManagementCompanySchema>;

export const PROPERTY_TYPES_MANAGED_LABELS: Record<(typeof PROPERTY_TYPES_MANAGED)[number], string> = {
  APARTMENTS: "شقق",
  BUILDINGS: "مبانٍ",
  HOTELS: "فنادق",
  SERVICED_APARTMENTS: "شقق فندقية",
  RESORTS: "منتجعات",
  VILLAS: "فيلات",
  OTHER: "أخرى",
};
