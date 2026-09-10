/**
 * English Task 2 (Forms): translates the existing zod validation error
 * strings for display only. The schemas themselves (rules, regexes,
 * min/max) are unchanged — this is a display-time lookup, not a new
 * validation system. Falls back to the original Arabic message if a string
 * isn't in the table (e.g. one added later), so nothing ever renders blank.
 */
const AR_TO_EN: Record<string, string> = {
  // shared.ts
  "رقم الهاتف مطلوب": "Phone number is required",
  "رقم الهاتف يجب أن يكون بصيغة دولية، مثال: ‎+201012345678": "Phone number must be in international format, e.g. +201012345678",
  "الرقم القومي مطلوب": "National ID is required",
  "الرقم القومي يجب أن يتكوّن من 14 رقمًا بالضبط": "National ID must be exactly 14 digits",
  "كلمة المرور يجب ألا تقل عن 8 أحرف": "Password must be at least 8 characters",
  "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)": "Password must contain at least one uppercase letter (A-Z)",
  "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل": "Password must contain at least one digit",
  "البريد الإلكتروني مطلوب": "Email is required",
  "صيغة البريد الإلكتروني غير صحيحة": "Invalid email format",
  "الرجاء إدخال رقم صحيح بدون رموز": "Please enter a valid number without symbols",
  "المبلغ يجب أن يكون أكبر من صفر": "Amount must be greater than zero",

  // ownerApplication.schema.ts
  "الاسم الكامل مطلوب (3 أحرف على الأقل)": "Full name is required (at least 3 characters)",
  "الرجاء اختيار المدينة": "Please select a city",
  "العنوان التفصيلي مطلوب": "Detailed address is required",
  "عدد الطوابق مطلوب": "Number of floors is required",
  "عدد الطوابق يجب أن يكون رقمًا": "Number of floors must be a number",
  "يجب أن يكون عدد الطوابق 1 على الأقل": "Number of floors must be at least 1",
  "عدد الوحدات مطلوب": "Number of units is required",
  "عدد الوحدات يجب أن يكون رقمًا": "Number of units must be a number",
  "يجب أن يكون عدد الوحدات 1 على الأقل": "Number of units must be at least 1",
  "الرجاء اختيار حالة واحدة على الأقل": "Please select at least one condition",
  "الرجاء إدخال المبلغ المطلوب للتمويل": "Please enter the requested financing amount",
  "يجب الموافقة على شروط الشراكة للمتابعة": "You must accept the partnership terms to continue",
  "الرجاء اختيار الحي أو كتابته": "Please select or type the district",
  "الرجاء اختيار نوع التشطيب المطلوب": "Please select the required finishing type",
  "الرجاء اختيار الأثاث المطلوب": "Please select the required furnishing",

  // partnerRegistration.schema.ts
  "اسم الشركة مطلوب": "Company name is required",
  "اسم الشخص المسؤول مطلوب": "Contact person's name is required",
  "الرجاء إدخال رابط صحيح": "Please enter a valid URL",
  "الرجاء اختيار المجال الرئيسي": "Please select a primary category",
  "الرجاء اختيار مجال واحد على الأقل": "Please select at least one category",
  "يجب الموافقة على الشروط للمتابعة": "You must accept the terms to continue",

  // contractorApplication.schema.ts
  "اسم المقاول مطلوب": "Contractor name is required",
  "رقم السجل التجاري مطلوب": "Commercial registration number is required",
  "الرقم الضريبي مطلوب": "Tax card number is required",
  "التخصص مطلوب": "Specialization is required",
  "المحافظة مطلوبة": "Governorate is required",
  "سنوات الخبرة مطلوبة": "Years of experience is required",

  // generic submit-failure fallback used by all three forms
  "حدث خطأ غير متوقع، حاول مرة أخرى": "An unexpected error occurred, please try again",
  "هناك بيانات ناقصة أو غير صحيحة، الرجاء المراجعة والمحاولة مرة أخرى": "Some fields are missing or invalid — please review and try again",
};

export function translateMessage(message: string | undefined, locale: "ar" | "en"): string | undefined {
  if (!message) return message;
  if (locale === "ar") return message;
  const dynamicMax = message.match(/^المبلغ يجب ألا يتجاوز ([\d,]+)$/);
  if (dynamicMax) return `Amount must not exceed ${dynamicMax[1]}`;
  return AR_TO_EN[message] ?? message;
}
