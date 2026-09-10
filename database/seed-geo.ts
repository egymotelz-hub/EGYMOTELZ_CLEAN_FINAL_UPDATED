import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CitySeed {
  key: string;
  nameAr: string;
  nameEn: string;
  isTouristCity?: boolean;
  governorateKey: string;
  districts: { nameAr: string; nameEn: string }[];
}

interface GovernorateSeed {
  key: string;
  nameAr: string;
  nameEn: string;
}

// 21 governorates, covering exactly the 31 existing cities below — every
// city has exactly one governorateKey, validated 1:1 against the actual
// existing seed data before this was written (no invented/orphaned
// entries either direction). "New Administrative Capital" is grouped
// under Cairo as a product/UI decision, not a claim of formal governorate
// status — see the comment on Governorate.key in schema.prisma.
const GOVERNORATES: GovernorateSeed[] = [
  { key: "cairo-governorate", nameAr: "محافظة القاهرة", nameEn: "Cairo Governorate" },
  { key: "giza-governorate", nameAr: "محافظة الجيزة", nameEn: "Giza Governorate" },
  { key: "alexandria-governorate", nameAr: "محافظة الإسكندرية", nameEn: "Alexandria Governorate" },
  { key: "port-said-governorate", nameAr: "محافظة بورسعيد", nameEn: "Port Said Governorate" },
  { key: "ismailia-governorate", nameAr: "محافظة الإسماعيلية", nameEn: "Ismailia Governorate" },
  { key: "suez-governorate", nameAr: "محافظة السويس", nameEn: "Suez Governorate" },
  { key: "damietta-governorate", nameAr: "محافظة دمياط", nameEn: "Damietta Governorate" },
  { key: "south-sinai", nameAr: "محافظة جنوب سيناء", nameEn: "South Sinai Governorate" },
  { key: "red-sea", nameAr: "محافظة البحر الأحمر", nameEn: "Red Sea Governorate" },
  { key: "matrouh", nameAr: "محافظة مطروح", nameEn: "Matrouh Governorate" },
  { key: "luxor-governorate", nameAr: "محافظة الأقصر", nameEn: "Luxor Governorate" },
  { key: "aswan-governorate", nameAr: "محافظة أسوان", nameEn: "Aswan Governorate" },
  { key: "dakahlia", nameAr: "محافظة الدقهلية", nameEn: "Dakahlia Governorate" },
  { key: "gharbia", nameAr: "محافظة الغربية", nameEn: "Gharbia Governorate" },
  { key: "sharqia", nameAr: "محافظة الشرقية", nameEn: "Sharqia Governorate" },
  { key: "assiut-governorate", nameAr: "محافظة أسيوط", nameEn: "Assiut Governorate" },
  { key: "minya-governorate", nameAr: "محافظة المنيا", nameEn: "Minya Governorate" },
  { key: "sohag-governorate", nameAr: "محافظة سوهاج", nameEn: "Sohag Governorate" },
  { key: "qena-governorate", nameAr: "محافظة قنا", nameEn: "Qena Governorate" },
  { key: "beni-suef-governorate", nameAr: "محافظة بني سويف", nameEn: "Beni Suef Governorate" },
  { key: "fayoum-governorate", nameAr: "محافظة الفيوم", nameEn: "Fayoum Governorate" },
];

// Item 2: the exact city list requested, each with real, commonly-known
// districts/neighborhoods (not placeholders) — "etc." in the brief is
// covered by districtFreeText on the application/property records for any
// neighborhood not yet seeded here.
//
// isTouristCity: first-launch business rule — Cairo and Giza only. Every
// other city defaults to false (via `c.isTouristCity ?? false` in the
// upsert below), so it does not need to be set explicitly on each entry.
const CITIES: CitySeed[] = [
  {
    key: "cairo", governorateKey: "cairo-governorate", nameAr: "القاهرة", nameEn: "Cairo", isTouristCity: true,
    districts: [
      { nameAr: "مدينة نصر", nameEn: "Nasr City" },
      { nameAr: "مصر الجديدة", nameEn: "Heliopolis" },
      { nameAr: "المعادي", nameEn: "Maadi" },
      { nameAr: "القاهرة الجديدة", nameEn: "New Cairo" },
      { nameAr: "التجمع الخامس", nameEn: "Fifth Settlement" },
      { nameAr: "المقطم", nameEn: "Mokattam" },
      { nameAr: "وسط البلد", nameEn: "Downtown" },
      { nameAr: "الشروق", nameEn: "Shorouk" },
      { nameAr: "العباسية", nameEn: "Abbasia" },
      { nameAr: "الزمالك", nameEn: "Zamalek" },
      { nameAr: "المنيل", nameEn: "El Manial" },
      { nameAr: "حلوان", nameEn: "Helwan" },
    ],
  },
  {
    key: "giza", governorateKey: "giza-governorate", nameAr: "الجيزة", nameEn: "Giza", isTouristCity: true,
    districts: [
      { nameAr: "الدقي", nameEn: "Dokki" },
      { nameAr: "المهندسين", nameEn: "Mohandessin" },
      { nameAr: "6 أكتوبر", nameEn: "6th of October" },
      { nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed" },
      { nameAr: "الهرم", nameEn: "Haram" },
      { nameAr: "فيصل", nameEn: "Faisal" },
      { nameAr: "العجوزة", nameEn: "Agouza" },
    ],
  },
  {
    key: "alexandria", governorateKey: "alexandria-governorate", nameAr: "الإسكندرية", nameEn: "Alexandria",
    districts: [
      { nameAr: "سيدي جابر", nameEn: "Sidi Gaber" },
      { nameAr: "سموحة", nameEn: "Smouha" },
      { nameAr: "ستانلي", nameEn: "Stanley" },
      { nameAr: "المندرة", nameEn: "El Mandara" },
      { nameAr: "العجمي", nameEn: "Agami" },
      { nameAr: "المنتزه", nameEn: "Montaza" },
      { nameAr: "سيدي بشر", nameEn: "Sidi Bishr" },
      { nameAr: "الإبراهيمية", nameEn: "Ibrahimeya" },
    ],
  },
  {
    key: "new-administrative-capital", governorateKey: "cairo-governorate", nameAr: "العاصمة الإدارية الجديدة", nameEn: "New Administrative Capital",
    districts: [
      { nameAr: "الحي السكني الأول", nameEn: "R1 Residential District" },
      { nameAr: "الحي السكني الثالث", nameEn: "R3 Residential District" },
      { nameAr: "الحي الحكومي", nameEn: "Government District" },
      { nameAr: "الحي المالي", nameEn: "Financial District (CBD)" },
    ],
  },
  {
    key: "new-alamein", governorateKey: "matrouh", nameAr: "العلمين الجديدة", nameEn: "New Alamein",
    districts: [
      { nameAr: "الحي السكني", nameEn: "Residential District" },
      { nameAr: "المارينا", nameEn: "Marina District" },
      { nameAr: "الكورنيش", nameEn: "Corniche" },
    ],
  },
  {
    key: "ain-sokhna", governorateKey: "red-sea", nameAr: "العين السخنة", nameEn: "Ain Sokhna",
    districts: [
      { nameAr: "الجلالة", nameEn: "Al Galala" },
      { nameAr: "بورتو السخنة", nameEn: "Porto Sokhna" },
      { nameAr: "الزعفرانة", nameEn: "Zafarana Road" },
    ],
  },
  {
    key: "hurghada", governorateKey: "red-sea", nameAr: "الغردقة", nameEn: "Hurghada",
    districts: [
      { nameAr: "السقالة", nameEn: "El Dahar" },
      { nameAr: "الكورنيش", nameEn: "Corniche" },
      { nameAr: "سهل حشيش", nameEn: "Sahl Hasheesh" },
      { nameAr: "الجونة", nameEn: "El Gouna Road" },
      { nameAr: "مكادي باي", nameEn: "Makadi Bay" },
    ],
  },
  {
    key: "el-gouna", governorateKey: "red-sea", nameAr: "الجونة", nameEn: "El Gouna",
    districts: [
      { nameAr: "داون تاون", nameEn: "Downtown El Gouna" },
      { nameAr: "أبيدوس", nameEn: "Abydos" },
      { nameAr: "المارينا", nameEn: "Marina" },
    ],
  },
  {
    key: "marsa-alam", governorateKey: "red-sea", nameAr: "مرسى علم", nameEn: "Marsa Alam",
    districts: [
      { nameAr: "بورت غالب", nameEn: "Port Ghalib" },
      { nameAr: "أبو دباب", nameEn: "Abu Dabbab" },
    ],
  },
  {
    key: "sharm-el-sheikh", governorateKey: "south-sinai", nameAr: "شرم الشيخ", nameEn: "Sharm El Sheikh",
    districts: [
      { nameAr: "نعمة باي", nameEn: "Naama Bay" },
      { nameAr: "شرم الماية", nameEn: "Sharm El Maya" },
      { nameAr: "السوق القديم", nameEn: "Old Market" },
      { nameAr: "نبق", nameEn: "Nabq Bay" },
    ],
  },
  {
    key: "dahab", governorateKey: "south-sinai", nameAr: "دهب", nameEn: "Dahab",
    districts: [
      { nameAr: "المدينة", nameEn: "Dahab City" },
      { nameAr: "أسلة", nameEn: "Assalah" },
      { nameAr: "لاجونا", nameEn: "Laguna" },
    ],
  },
  { key: "nuweiba", governorateKey: "south-sinai", nameAr: "نويبع", nameEn: "Nuweiba", districts: [{ nameAr: "نويبع المدينة", nameEn: "Nuweiba City" }, { nameAr: "ترابين", nameEn: "Tarabin" }] },
  { key: "taba", governorateKey: "south-sinai", nameAr: "طابا", nameEn: "Taba", districts: [{ nameAr: "طابا هايتس", nameEn: "Taba Heights" }] },
  {
    key: "luxor", governorateKey: "luxor-governorate", nameAr: "الأقصر", nameEn: "Luxor",
    districts: [
      { nameAr: "الكرنك", nameEn: "Karnak" },
      { nameAr: "البر الغربي", nameEn: "West Bank" },
      { nameAr: "وسط البلد", nameEn: "Downtown Luxor" },
    ],
  },
  {
    key: "aswan", governorateKey: "aswan-governorate", nameAr: "أسوان", nameEn: "Aswan",
    districts: [
      { nameAr: "الكورنيش", nameEn: "Corniche" },
      { nameAr: "جزيرة إلفنتين", nameEn: "Elephantine Island" },
    ],
  },
  { key: "siwa", governorateKey: "matrouh", nameAr: "سيوة", nameEn: "Siwa", districts: [{ nameAr: "سيوة المدينة", nameEn: "Siwa Town" }] },
  {
    key: "port-said", governorateKey: "port-said-governorate", nameAr: "بورسعيد", nameEn: "Port Said",
    districts: [
      { nameAr: "الشرق", nameEn: "El Sharq" },
      { nameAr: "المناخ", nameEn: "El Manakh" },
      { nameAr: "الضواحي", nameEn: "El Dawahy" },
    ],
  },
  { key: "ismailia", governorateKey: "ismailia-governorate", nameAr: "الإسماعيلية", nameEn: "Ismailia", districts: [{ nameAr: "الحي الأول", nameEn: "First District" }, { nameAr: "المنطقة السياحية", nameEn: "Tourist Zone" }] },
  { key: "suez", governorateKey: "suez-governorate", nameAr: "السويس", nameEn: "Suez", districts: [{ nameAr: "الأربعين", nameEn: "Al Arbaeen" }, { nameAr: "فيصل", nameEn: "Faisal" }] },
  {
    key: "damietta", governorateKey: "damietta-governorate", nameAr: "دمياط", nameEn: "Damietta",
    districts: [
      { nameAr: "دمياط الجديدة", nameEn: "New Damietta" },
      { nameAr: "دمياط المدينة", nameEn: "Damietta City" },
      { nameAr: "رأس البر", nameEn: "Ras El Bar" },
      { nameAr: "كفر سعد", nameEn: "Kafr Saad" },
      { nameAr: "فارسكور", nameEn: "Faraskur" },
      { nameAr: "الزرقا", nameEn: "El Zarqa" },
    ],
  },
  { key: "ras-el-bar", governorateKey: "damietta-governorate", nameAr: "رأس البر", nameEn: "Ras El Bar", districts: [{ nameAr: "الواجهة البحرية", nameEn: "Seafront" }] },
  { key: "mansoura", governorateKey: "dakahlia", nameAr: "المنصورة", nameEn: "Mansoura", districts: [{ nameAr: "الجمهورية", nameEn: "El Gomhoria" }, { nameAr: "توريل", nameEn: "Toriel" }] },
  { key: "tanta", governorateKey: "gharbia", nameAr: "طنطا", nameEn: "Tanta", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Tanta" }, { nameAr: "سبرباي", nameEn: "Sibirbay" }] },
  { key: "zagazig", governorateKey: "sharqia", nameAr: "الزقازيق", nameEn: "Zagazig", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Zagazig" }] },
  { key: "assiut", governorateKey: "assiut-governorate", nameAr: "أسيوط", nameEn: "Assiut", districts: [{ nameAr: "الوليدية", nameEn: "El Waledeya" }, { nameAr: "الحمراء", nameEn: "El Hamra" }] },
  { key: "minya", governorateKey: "minya-governorate", nameAr: "المنيا", nameEn: "Minya", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Minya" }] },
  { key: "sohag", governorateKey: "sohag-governorate", nameAr: "سوهاج", nameEn: "Sohag", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Sohag" }] },
  { key: "qena", governorateKey: "qena-governorate", nameAr: "قنا", nameEn: "Qena", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Qena" }] },
  { key: "beni-suef", governorateKey: "beni-suef-governorate", nameAr: "بني سويف", nameEn: "Beni Suef", districts: [{ nameAr: "وسط البلد", nameEn: "Downtown Beni Suef" }] },
  {
    key: "fayoum", governorateKey: "fayoum-governorate", nameAr: "الفيوم", nameEn: "Fayoum",
    districts: [
      { nameAr: "وسط البلد", nameEn: "Downtown Fayoum" },
      { nameAr: "طاطون", nameEn: "Tatoun" },
    ],
  },
  { key: "marsa-matrouh", governorateKey: "matrouh", nameAr: "مطروح", nameEn: "Marsa Matrouh", districts: [{ nameAr: "الكورنيش", nameEn: "Corniche" }, { nameAr: "الجلالة", nameEn: "El Galala Beach" }] },
];

async function main() {
  const govByKey = new Map<string, string>(); // governorate key -> id
  for (const [i, g] of GOVERNORATES.entries()) {
    const gov = await prisma.governorate.upsert({
      where: { key: g.key },
      update: { nameAr: g.nameAr, nameEn: g.nameEn, sortOrder: i },
      create: { key: g.key, nameAr: g.nameAr, nameEn: g.nameEn, sortOrder: i },
    });
    govByKey.set(g.key, gov.id);
  }

  for (const [i, c] of CITIES.entries()) {
    const governorateId = govByKey.get(c.governorateKey);
    if (!governorateId) {
      // Fail loudly rather than silently leaving a city unmapped — per the
      // requirement that 100% of cities must end up with a governorate.
      throw new Error(`City "${c.key}" references unknown governorateKey "${c.governorateKey}"`);
    }
    const city = await prisma.city.upsert({
      where: { key: c.key },
      update: { nameAr: c.nameAr, nameEn: c.nameEn, isTouristCity: c.isTouristCity ?? false, sortOrder: i, governorateId },
      create: { key: c.key, nameAr: c.nameAr, nameEn: c.nameEn, isTouristCity: c.isTouristCity ?? false, sortOrder: i, governorateId },
    });

    for (const d of c.districts) {
      await prisma.district.upsert({
        where: { cityId_nameEn: { cityId: city.id, nameEn: d.nameEn } },
        update: { nameAr: d.nameAr },
        create: { cityId: city.id, nameAr: d.nameAr, nameEn: d.nameEn },
      });
    }
  }

  const unmapped = await prisma.city.count({ where: { governorateId: null } });
  if (unmapped > 0) {
    throw new Error(`${unmapped} cities still have no governorate after seeding — reporting rather than leaving silently unmapped.`);
  }

  console.log(`Seeded ${GOVERNORATES.length} governorates and ${CITIES.length} cities with their districts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
