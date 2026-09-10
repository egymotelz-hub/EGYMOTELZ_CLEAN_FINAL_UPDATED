import { z } from "zod";
import { internationalPhone, whatsappNumber, strongPassword, email as emailSchema } from "./shared";

export const contractorApplicationSchema = z.object({
  companyName: z.string().min(2, "اسم الشركة مطلوب").max(200),
  contractorName: z.string().min(3, "اسم المقاول مطلوب").max(120),
  phone: internationalPhone,
  whatsappNumber,
  email: emailSchema,
  password: strongPassword,

  commercialRegistrationNumber: z.string().min(3, "رقم السجل التجاري مطلوب").max(60),
  taxCardNumber: z.string().min(3, "الرقم الضريبي مطلوب").max(60),
  specialization: z.string().min(2, "التخصص مطلوب").max(200),
  governorate: z.string().min(2, "المحافظة مطلوبة").max(120),
  cityId: z.string().min(1, "الرجاء اختيار المدينة"),
  yearsOfExperience: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ required_error: "سنوات الخبرة مطلوبة" }).int().min(0).max(80)
  ),
  portfolio: z.string().max(5000).optional(),

  termsAccepted: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على الشروط للمتابعة" }) }),
});
export type ContractorApplicationFormValues = z.infer<typeof contractorApplicationSchema>;
