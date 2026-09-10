import { z } from "zod";

/**
 * These mirror backend/src/validators/auth.validators.ts field-for-field.
 * Keeping them duplicated (not shared via a package) is deliberate for this
 * project's structure — frontend and backend are separate deployables — but
 * the exact regexes/rules must stay identical or the client will accept
 * input the server rejects (the root cause of several reported bugs).
 */

/**
 * Item 12: international phone support. Mirrors backend/src/validators/auth.validators.ts's
 * internationalPhone exactly — E.164 format (+<country code><number>).
 */
export const internationalPhone = z
  .string()
  .min(1, "رقم الهاتف مطلوب")
  .regex(/^\+[1-9]\d{6,14}$/, "رقم الهاتف يجب أن يكون بصيغة دولية، مثال: ‎+201012345678");

export const whatsappNumber = internationalPhone.optional().or(z.literal(""));

// Egyptian national ID: exactly 14 digits
export const egyptianNationalId = z
  .string()
  .min(1, "الرقم القومي مطلوب")
  .regex(/^[0-9]{14}$/, "الرقم القومي يجب أن يتكوّن من 14 رقمًا بالضبط");

// Mirrors backend's strongPassword exactly (min 8, one uppercase, one digit).
// This was the #1 confirmed root cause of "validation fails even though I
// filled everything in": the backend enforced this but the client never
// told the user the rule existed.
export const strongPassword = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)")
  .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل");

export const email = z.string().min(1, "البريد الإلكتروني مطلوب").email("صيغة البريد الإلكتروني غير صحيحة");

/**
 * A monetary amount entered as the FULL value (e.g. 250000, not 250 meaning
 * thousands). Accepts either a raw number or a string that may contain
 * thousand-separator commas/spaces (from the MoneyInput component's display
 * formatting) and strips them before validating — this directly fixes the
 * confirmed bug where `Number("250,000")` produced NaN -> null server-side.
 */
export function moneyAmount(opts: { required?: boolean; max?: number } = {}) {
  const { required = false, max = 100_000_000 } = opts;
  const base = z.preprocess((val) => {
    if (typeof val === "string") {
      const cleaned = val.replace(/[,\s]/g, "");
      if (cleaned === "") return undefined;
      const n = Number(cleaned);
      return Number.isNaN(n) ? val /* let zod report the invalid_type error */ : n;
    }
    return val;
  }, z.number({ invalid_type_error: "الرجاء إدخال رقم صحيح بدون رموز" }).positive("المبلغ يجب أن يكون أكبر من صفر").max(max, `المبلغ يجب ألا يتجاوز ${max.toLocaleString()}`));

  return required ? base : base.optional();
}
