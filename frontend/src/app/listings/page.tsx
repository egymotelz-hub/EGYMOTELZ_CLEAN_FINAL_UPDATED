"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useGeoData, deriveGovernorates } from "@/lib/useGeoData";
import { api } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";

// English Task 3 (Units/Properties/Listings): bilingual UI labels only.
// Amenity.labelEn / City.nameEn / District.nameEn already exist on the
// backend records (just weren't read here) — no schema or API change.
// Free-text business content (unit.description) is shown as stored,
// regardless of locale — it's not a system enum/label, and isn't ours to
// auto-translate.
interface UnitCard {
  id: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string | null;
  floorNumber: number | null;
  description: string | null;
  pricePerNight: string;
  currency: string;
  badge?: "AVAILABLE_NOW" | "RECOMMENDED" | "SPECIAL_OFFER";
  images: { url: string }[];
  property: {
    address: string;
    propertyType: string;
    readinessStatus: string;
    latitude: string | null;
    longitude: string | null;
    city: { nameAr: string; nameEn: string } | null;
    district: { nameAr: string; nameEn: string } | null;
    districtFreeText: string | null;
  };
  amenities: { amenity: { labelAr: string; labelEn: string } }[];
  distanceKm?: number;
}

const BADGE_LABEL: Record<string, { ar: string; en: string }> = {
  AVAILABLE_NOW: { ar: "متاح الآن", en: "Available now" },
  RECOMMENDED: { ar: "مُوصى به", en: "Recommended" },
  SPECIAL_OFFER: { ar: "عرض خاص", en: "Special offer" },
};
const PROPERTY_TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  RESIDENTIAL_BUILDING: { ar: "عمارة سكنية", en: "Residential building" },
  VILLA: { ar: "فيلا", en: "Villa" },
  FULL_FLOOR: { ar: "طابق كامل", en: "Full floor" },
  APARTMENT: { ar: "شقة", en: "Apartment" },
};
const SORT_OPTIONS: { value: string; ar: string; en: string }[] = [
  { value: "newest", ar: "الأحدث", en: "Newest" },
  { value: "price", ar: "السعر", en: "Price" },
  { value: "rated", ar: "الأعلى تقييمًا", en: "Highest Rated" },
  { value: "nearest", ar: "الأقرب لي", en: "Closest to me" },
];

const L = {
  eyebrow: { ar: "Available Now", en: "Available Now" },
  title: { ar: "الوحدات المتاحة", en: "Available units" },
  hideFilters: { ar: "إخفاء الفلاتر", en: "Hide Filters" },
  showFilters: { ar: "الفلاتر", en: "Filters" },
  sortBy: { ar: "ترتيب حسب:", en: "Sort by:" },
  locating: { ar: "جاري تحديد الموقع...", en: "Locating..." },
  useMyLocation: { ar: "استخدم موقعي", en: "Use My Location" },
  governorate: { ar: "المحافظة", en: "Governorate" },
  allGovernorates: { ar: "كل المحافظات", en: "All governorates" },
  city: { ar: "المدينة", en: "City" },
  allCities: { ar: "كل المدن", en: "All cities" },
  propertyType: { ar: "نوع العقار", en: "Property Type" },
  all: { ar: "الكل", en: "All" },
  minPrice: { ar: "الحد الأدنى للسعر", en: "Minimum Price" },
  maxPrice: { ar: "الحد الأقصى للسعر", en: "Maximum Price" },
  bedrooms: { ar: "عدد غرف النوم", en: "Bedrooms" },
  bathrooms: { ar: "عدد الحمامات", en: "Bathrooms" },
  minArea: { ar: "المساحة من (م²)", en: "Min Area (m²)" },
  maxArea: { ar: "المساحة إلى (م²)", en: "Max Area (m²)" },
  loadError: { ar: "تعذر تحميل الوحدات، حاول مرة أخرى", en: "Unable to load units, please try again." },
  noResults: { ar: "لا توجد وحدات متاحة حاليًا لهذا الفلتر", en: "No units currently available for this filter" },
  perNight: { ar: "/ ليلة", en: "/ night" },
  bedroomWord: { ar: "غرفة", en: "bed" },
  bathroomWord: { ar: "حمام", en: "bath" },
  floorWord: { ar: "الطابق", en: "Floor" },
  km: { ar: "كم", en: "km" },
  viewOnMap: { ar: "📍 عرض على الخريطة", en: "📍 View on map" },
} as const;

export default function ListingsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { cities } = useGeoData();
  const governorates = deriveGovernorates(cities);
  const nameFor = (o: { nameAr: string; nameEn: string } | null | undefined) => (o ? (locale === "ar" ? o.nameAr : o.nameEn) : "");

  const [units, setUnits] = useState<UnitCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const filterableCities = governorateId ? cities.filter((c) => c.governorate?.id === governorateId) : cities;
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [sort, setSort] = useState("newest");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);

  const selectedDistricts = cities.find((c) => c.id === cityId)?.districts ?? [];

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (cityId) params.set("cityId", cityId);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (bathrooms) params.set("bathrooms", bathrooms);
    if (minArea) params.set("minArea", minArea);
    if (maxArea) params.set("maxArea", maxArea);
    if (propertyType) params.set("propertyType", propertyType);
    params.set("sort", sort);
    if (sort === "nearest" && origin) {
      params.set("lat", String(origin.lat));
      params.set("lng", String(origin.lng));
    }
    params.set("pageSize", "30");

    api
      .get<{ items: UnitCard[] }>(`/units?${params.toString()}`)
      .then((res) => {
        setUnits(res.items);
        setError(null);
      })
      .catch(() => setError(L.loadError[locale]));
  }, [cityId, minPrice, maxPrice, bedrooms, bathrooms, minArea, maxArea, propertyType, sort, origin, locale]);

  useEffect(() => {
    load();
  }, [load]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort("nearest");
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div className="screen active" id="sc-listings">
      <Navbar />
      <div className="sect">
        <div className="sect-ctr">
          <div className="eyebrow">{L.eyebrow[locale]}</div>
          <div className="sect-title-ar">{L.title[locale]}</div>
          <div className="gold-rule gold-rule-c" />
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <button className="ab-btn m" onClick={() => setShowFilters((s) => !s)}>
            {showFilters ? L.hideFilters[locale] : L.showFilters[locale]}
          </button>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ maxWidth: 160 }}>
            {SORT_OPTIONS.map((o) => (
              <option value={o.value} key={o.value}>
                {L.sortBy[locale]} {o[locale]}
              </option>
            ))}
          </select>
          {sort === "nearest" && !origin && (
            <button className="ab-btn g" onClick={useMyLocation} disabled={geoLocating}>
              {geoLocating ? L.locating[locale] : L.useMyLocation[locale]}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="form-card" style={{ maxWidth: 900, margin: "0 auto 24px" }}>
            <div className="frow">
              <div className="fld">
                <label>{L.governorate[locale]}</label>
                <SearchableSelect
                  value={governorateId}
                  onChange={(v) => {
                    setGovernorateId(v);
                    setCityId(""); // reset city when governorate changes, avoids a stale city from a different governorate staying selected
                  }}
                  placeholder={L.allGovernorates[locale]}
                  options={governorates.map((g) => ({ value: g.id, label: locale === "ar" ? g.nameAr : g.nameEn }))}
                />
              </div>
              <div className="fld">
                <label>{L.city[locale]}</label>
                <SearchableSelect
                  value={cityId}
                  onChange={setCityId}
                  placeholder={L.allCities[locale]}
                  options={filterableCities.map((c) => ({ value: c.id, label: locale === "ar" ? c.nameAr : c.nameEn }))}
                />
              </div>
            </div>
            <div className="frow">
              <div className="fld">
                <label>{L.propertyType[locale]}</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  <option value="">{L.all[locale]}</option>
                  {Object.entries(PROPERTY_TYPE_LABEL).map(([v, l]) => (
                    <option value={v} key={v}>{l[locale]}</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <label>{L.minPrice[locale]}</label>
                <input type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
            </div>
            <div className="frow">
              <div className="fld">
                <label>{L.maxPrice[locale]}</label>
                <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="frow">
              <div className="fld">
                <label>{L.bedrooms[locale]}</label>
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
                  <option value="">{L.all[locale]}</option>
                  {[1, 2, 3, 4, 5].map((n) => <option value={n} key={n}>{n}+</option>)}
                </select>
              </div>
              <div className="fld">
                <label>{L.bathrooms[locale]}</label>
                <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
                  <option value="">{L.all[locale]}</option>
                  {[1, 2, 3, 4].map((n) => <option value={n} key={n}>{n}+</option>)}
                </select>
              </div>
            </div>
            <div className="frow">
              <div className="fld">
                <label>{L.minArea[locale]}</label>
                <input type="number" min={0} value={minArea} onChange={(e) => setMinArea(e.target.value)} />
              </div>
              <div className="fld">
                <label>{L.maxArea[locale]}</label>
                <input type="number" min={0} value={maxArea} onChange={(e) => setMaxArea(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        <div className="listings-grid">
          {(units ?? []).map((unit) => {
            const districtLabel = nameFor(unit.property.district) || unit.property.districtFreeText || "";
            const mapUrl =
              unit.property.latitude && unit.property.longitude
                ? `https://www.google.com/maps?q=${unit.property.latitude},${unit.property.longitude}`
                : null;
            return (
              <div className="listing-card" key={unit.id} onClick={() => router.push(`/booking?unitId=${unit.id}`)}>
                <div
                  className="lc-img"
                  style={unit.images[0]?.url ? { backgroundImage: `url(${unit.images[0].url})`, backgroundSize: "cover" } : undefined}
                >
                  {unit.badge && <div className="lc-badge">{BADGE_LABEL[unit.badge][locale]}</div>}
                  {unit.distanceKm !== undefined && (
                    <div className="lc-badge" style={{ insetInlineStart: 8, insetInlineEnd: "auto" }}>
                      {unit.distanceKm.toFixed(1)} {L.km[locale]}
                    </div>
                  )}
                </div>
                <div className="lc-body">
                  <div className="lc-price">
                    {Number(unit.pricePerNight).toLocaleString()} {unit.currency} {L.perNight[locale]}
                  </div>
                  <div className="lc-title">
                    {PROPERTY_TYPE_LABEL[unit.property.propertyType]?.[locale] ?? ""} — {unit.bedrooms} {L.bedroomWord[locale]}, {unit.bathrooms} {L.bathroomWord[locale]}
                    {unit.areaSqm ? `, ${Number(unit.areaSqm)} m²` : ""}
                    {unit.floorNumber ? `, ${L.floorWord[locale]} ${unit.floorNumber}` : ""}
                  </div>
                  <div className="lc-loc">
                    {districtLabel}{districtLabel ? "، " : ""}{nameFor(unit.property.city)}
                  </div>
                  {unit.description && (
                    <p style={{ fontSize: 11, color: "var(--mut)", fontFamily: "var(--fnar)", margin: "4px 0 8px" }}>
                      {unit.description}
                    </p>
                  )}
                  <div className="lc-ams">
                    {unit.amenities.slice(0, 3).map((a, i) => (
                      <span className="lc-am" key={i}>{locale === "ar" ? a.amenity.labelAr : a.amenity.labelEn}</span>
                    ))}
                  </div>
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 11, color: "var(--g)", fontFamily: "var(--fnar)", display: "inline-block", marginTop: 6 }}
                    >
                      {L.viewOnMap[locale]}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {units && units.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--mut)", marginTop: 24 }}>
            {L.noResults[locale]}
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
}
