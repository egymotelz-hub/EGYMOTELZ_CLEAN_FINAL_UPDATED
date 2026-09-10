export interface Nationality {
  code: string; // ISO 3166-1 alpha-2, used as the field value
  labelAr: string;
  labelEn: string;
}

// The exact minimum list requested, in ISO-code order isn't required — kept
// roughly geographically grouped (Egypt first, then the region, then wider)
// since that's how a guest picking from this list would expect to scan it.
export const NATIONALITIES: Nationality[] = [
  { code: "EG", labelAr: "مصر", labelEn: "Egypt" },
  { code: "SA", labelAr: "السعودية", labelEn: "Saudi Arabia" },
  { code: "AE", labelAr: "الإمارات", labelEn: "United Arab Emirates" },
  { code: "KW", labelAr: "الكويت", labelEn: "Kuwait" },
  { code: "QA", labelAr: "قطر", labelEn: "Qatar" },
  { code: "BH", labelAr: "البحرين", labelEn: "Bahrain" },
  { code: "OM", labelAr: "عُمان", labelEn: "Oman" },
  { code: "JO", labelAr: "الأردن", labelEn: "Jordan" },
  { code: "LB", labelAr: "لبنان", labelEn: "Lebanon" },
  { code: "IQ", labelAr: "العراق", labelEn: "Iraq" },
  { code: "LY", labelAr: "ليبيا", labelEn: "Libya" },
  { code: "SD", labelAr: "السودان", labelEn: "Sudan" },
  { code: "MA", labelAr: "المغرب", labelEn: "Morocco" },
  { code: "DZ", labelAr: "الجزائر", labelEn: "Algeria" },
  { code: "TN", labelAr: "تونس", labelEn: "Tunisia" },
  { code: "GB", labelAr: "المملكة المتحدة", labelEn: "United Kingdom" },
  { code: "US", labelAr: "الولايات المتحدة", labelEn: "United States" },
  { code: "CA", labelAr: "كندا", labelEn: "Canada" },
  { code: "DE", labelAr: "ألمانيا", labelEn: "Germany" },
  { code: "FR", labelAr: "فرنسا", labelEn: "France" },
  { code: "IT", labelAr: "إيطاليا", labelEn: "Italy" },
  { code: "ES", labelAr: "إسبانيا", labelEn: "Spain" },
  { code: "TR", labelAr: "تركيا", labelEn: "Turkey" },
  { code: "CN", labelAr: "الصين", labelEn: "China" },
  { code: "IN", labelAr: "الهند", labelEn: "India" },
  { code: "PK", labelAr: "باكستان", labelEn: "Pakistan" },
];
