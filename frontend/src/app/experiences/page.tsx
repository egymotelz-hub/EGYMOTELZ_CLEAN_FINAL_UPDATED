"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";

interface OfferingCard {
  id: string;
  offeringType: string;
  nameEn: string;
  nameAr: string;
  pricingModel: string;
  pricePerPerson: string | null;
  pricePerVehicle: string | null;
  pricePerGroup: string | null;
  privateBookingPrice: string | null;
  currency: string;
  durationMinutes: number | null;
  avgRating: string | null;
  reviewCount: number;
  isFeatured: boolean;
  images: { url: string }[];
  category: { nameAr: string; nameEn: string } | null;
}

const OFFERING_TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  TOUR: { ar: "جولة سياحية", en: "Tour" },
  EXPERIENCE: { ar: "تجربة", en: "Experience" },
  TRANSPORTATION: { ar: "مواصلات", en: "Transportation" },
  EVENT: { ar: "فعالية", en: "Event" },
};

const L = {
  eyebrow: { ar: "اكتشف القاهرة", en: "Explore Cairo" },
  title: { ar: "اكتشف القاهرة", en: "Explore Cairo" },
  subtitle: {
    ar: "جولات وتجارب ومواصلات وفعاليات حقيقية من شركاء معتمدين",
    en: "Real tours, experiences, transportation and events from approved partners",
  },
  filterAll: { ar: "الكل", en: "All" },
  type: { ar: "النوع", en: "Type" },
  city: { ar: "المدينة", en: "City" },
  allCities: { ar: "كل المدن", en: "All cities" },
  date: { ar: "التاريخ", en: "Date" },
  today: { ar: "اليوم", en: "Today" },
  tomorrow: { ar: "غدًا", en: "Tomorrow" },
  availableTomorrow: { ar: "عرض كل المتاح غدًا", en: "See all available tomorrow" },
  anyDate: { ar: "أي تاريخ", en: "Any date" },
  from: { ar: "يبدأ من", en: "From" },
  perPerson: { ar: "/ للفرد", en: "/ person" },
  perVehicle: { ar: "/ للمركبة", en: "/ للمركبة" },
  perGroup: { ar: "/ للمجموعة", en: "/ group" },
  loadError: { ar: "تعذر تحميل العروض، حاول مرة أخرى", en: "Unable to load offerings, please try again" },
  noResults: { ar: "لا توجد عروض متاحة حاليًا لهذا الفلتر", en: "No offerings currently match this filter" },
  featured: { ar: "مميز", en: "Featured" },
  reviews: { ar: "تقييم", en: "reviews" },
  happeningTomorrow: { ar: "يحدث غدًا في القاهرة", en: "Happening Tomorrow in Cairo" },
  tonight: { ar: "الليلة في القاهرة", en: "Tonight in Cairo" },
  popular: { ar: "الأكثر شعبية في القاهرة", en: "Popular in Cairo" },
  seeAll: { ar: "عرض الكل", en: "See all" },
} as const;

function displayPrice(o: OfferingCard): string {
  const raw =
    o.pricingModel === "PER_PERSON" ? o.pricePerPerson :
    o.pricingModel === "PER_VEHICLE" ? o.pricePerVehicle :
    o.pricingModel === "PER_GROUP" ? o.pricePerGroup :
    o.privateBookingPrice;
  return raw ? `${Number(raw).toLocaleString()} ${o.currency}` : "";
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ExplorePage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { cities } = useGeoData();
  const nameFor = (o: { nameAr: string; nameEn: string } | null | undefined) => (o ? (locale === "ar" ? o.nameAr : o.nameEn) : "");

  const [offerings, setOfferings] = useState<OfferingCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offeringType, setOfferingType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; nameAr: string; nameEn: string; offeringType: string }[]>([]);
  const [cityId, setCityId] = useState("");
  const [dateFilter, setDateFilter] = useState<"" | "today" | "tomorrow">("");
  const [happeningTomorrow, setHappeningTomorrow] = useState<OfferingCard[]>([]);
  const [tonight, setTonight] = useState<OfferingCard[]>([]);
  const [popular, setPopular] = useState<OfferingCard[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Category chips (Food/Nile/Museums/Bazaars/Local Experiences/etc. per
    // this phase's spec) are real OfferingCategory rows, not a hardcoded
    // frontend list — if none have been created by an admin yet, the chip
    // row simply doesn't render rather than showing fake categories.
    api
      .get<{ id: string; nameAr: string; nameEn: string; offeringType: string }[]>("/offerings/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    // §8/§9/§11 (Cairo Discovery) — every section below is a real backend
    // query against actual availability/review/booking data. None of these
    // are static or fabricated: an empty result renders nothing, it never
    // falls back to placeholder content.
    api
      .get<{ items: OfferingCard[] }>(`/offerings?date=${tomorrowISO()}&pageSize=8`)
      .then((res) => setHappeningTomorrow(res.items))
      .catch(() => setHappeningTomorrow([]));

    const nowIso = new Date().toISOString();
    api
      .get<{ items: OfferingCard[] }>(`/offerings?date=${todayISO()}&minStartTime=${encodeURIComponent(nowIso)}&pageSize=8`)
      .then((res) => setTonight(res.items))
      .catch(() => setTonight([]));

    api
      .get<{ items: OfferingCard[] }>(`/offerings?popularOnly=true&pageSize=8`)
      .then((res) => setPopular(res.items))
      .catch(() => setPopular([]));
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (offeringType) params.set("offeringType", offeringType);
    if (categoryId) params.set("categoryId", categoryId);
    if (cityId) params.set("cityId", cityId);
    if (dateFilter === "today") params.set("date", todayISO());
    if (dateFilter === "tomorrow") params.set("date", tomorrowISO());
    params.set("pageSize", "30");

    api
      .get<{ items: OfferingCard[] }>(`/offerings?${params.toString()}`)
      .then((res) => {
        setOfferings(res.items);
        setError(null);
      })
      .catch(() => setError(L.loadError[locale]));
  }, [offeringType, categoryId, cityId, dateFilter, locale]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="screen active" id="sc-experiences">
      <Navbar />
      <div className="sect">
        <div className="sect-ctr">
          <div className="eyebrow">{L.eyebrow[locale]}</div>
          <div className="sect-title-ar">{L.title[locale]}</div>
          <div className="gold-rule gold-rule-c" />
          <p style={{ textAlign: "center", color: "var(--mut)", maxWidth: 560, margin: "0 auto 20px" }}>{L.subtitle[locale]}</p>
        </div>

        <DiscoveryRow title={L.happeningTomorrow[locale]} items={happeningTomorrow} locale={locale} router={router} />
        {happeningTomorrow.length > 0 && (
          <div style={{ textAlign: "center", marginTop: -16, marginBottom: 24 }}>
            <button
              className="ab-btn m"
              onClick={() => {
                setDateFilter("tomorrow");
                gridRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {L.availableTomorrow[locale]} ←
            </button>
          </div>
        )}
        <DiscoveryRow title={L.tonight[locale]} items={tonight} locale={locale} router={router} />
        <DiscoveryRow title={L.popular[locale]} items={popular} locale={locale} router={router} />

        {categories.length > 0 && (
          <div className="sect-ctr" style={{ marginBottom: 16, textAlign: "center" }}>
            <button className={`ab-btn ${categoryId === "" ? "g" : "m"}`} onClick={() => setCategoryId("")} style={{ margin: 4 }}>
              {L.filterAll[locale]}
            </button>
            {categories.map((c) => (
              <button key={c.id} className={`ab-btn ${categoryId === c.id ? "g" : "m"}`} onClick={() => setCategoryId(c.id)} style={{ margin: 4 }}>
                {locale === "ar" ? c.nameAr : c.nameEn}
              </button>
            ))}
          </div>
        )}

        <div className="form-card" style={{ maxWidth: 900, margin: "0 auto 24px" }}>
          <div className="frow">
            <div className="fld">
              <label>{L.type[locale]}</label>
              <select value={offeringType} onChange={(e) => setOfferingType(e.target.value)}>
                <option value="">{L.filterAll[locale]}</option>
                {Object.entries(OFFERING_TYPE_LABEL).map(([value, lbl]) => (
                  <option value={value} key={value}>{lbl[locale]}</option>
                ))}
              </select>
            </div>
            <div className="fld">
              <label>{L.city[locale]}</label>
              <SearchableSelect
                options={[{ value: "", label: L.allCities[locale] }, ...cities.map((c) => ({ value: c.id, label: nameFor(c) }))]}
                value={cityId}
                onChange={setCityId}
                placeholder={L.allCities[locale]}
              />
            </div>
            <div className="fld">
              <label>{L.date[locale]}</label>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as "" | "today" | "tomorrow")}>
                <option value="">{L.anyDate[locale]}</option>
                <option value="today">{L.today[locale]}</option>
                <option value="tomorrow">{L.tomorrow[locale]}</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="listings-grid" ref={gridRef}>
          {(offerings ?? []).map((o) => (
            <div className="listing-card" key={o.id} onClick={() => router.push(`/experiences/book?offeringId=${o.id}`)}>
              <div className="lc-img" style={o.images[0]?.url ? { backgroundImage: `url(${o.images[0].url})`, backgroundSize: "cover" } : undefined}>
                {o.isFeatured && <div className="lc-badge">{L.featured[locale]}</div>}
              </div>
              <div className="lc-body">
                {displayPrice(o) && (
                  <div className="lc-price">
                    {L.from[locale]} {displayPrice(o)}
                  </div>
                )}
                <div className="lc-title">{locale === "ar" ? o.nameAr : o.nameEn}</div>
                <div className="lc-loc">
                  {OFFERING_TYPE_LABEL[o.offeringType]?.[locale]}
                  {o.category ? ` — ${nameFor(o.category)}` : ""}
                </div>
                {o.avgRating && (
                  <div style={{ fontSize: 12, color: "var(--mut)" }}>
                    ⭐ {Number(o.avgRating).toFixed(1)} ({o.reviewCount} {L.reviews[locale]})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {offerings && offerings.length === 0 && <p style={{ textAlign: "center", color: "var(--mut)", marginTop: 24 }}>{L.noResults[locale]}</p>}
      </div>
      <Footer />
    </div>
  );
}

function DiscoveryRow({
  title,
  items,
  locale,
  router,
}: {
  title: string;
  items: OfferingCard[];
  locale: "ar" | "en";
  router: ReturnType<typeof useRouter>;
}) {
  // Renders nothing at all when empty — no placeholder text, no fake
  // cards. An empty "Tonight in Cairo" section on a slow night is the
  // honest state, not an error to paper over.
  if (items.length === 0) return null;
  return (
    <div className="sect-ctr" style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      <div className="listings-grid">
        {items.map((o) => (
          <div className="listing-card" key={o.id} onClick={() => router.push(`/experiences/book?offeringId=${o.id}`)}>
            <div className="lc-img" style={o.images[0]?.url ? { backgroundImage: `url(${o.images[0].url})`, backgroundSize: "cover" } : undefined} />
            <div className="lc-body">
              {displayPrice(o) && <div className="lc-price">{displayPrice(o)}</div>}
              <div className="lc-title">{locale === "ar" ? o.nameAr : o.nameEn}</div>
              {o.avgRating && (
                <div style={{ fontSize: 12, color: "var(--mut)" }}>⭐ {Number(o.avgRating).toFixed(1)} ({o.reviewCount})</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
