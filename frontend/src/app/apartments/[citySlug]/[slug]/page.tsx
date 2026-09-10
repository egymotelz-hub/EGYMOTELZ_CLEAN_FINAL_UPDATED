"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api, ApiClientError } from "@/lib/apiClient";
import { useLocale } from "@/lib/LocaleContext";

// English Task 3 (Units/Properties/Listings): bilingual UI labels only.
// listing.title/shortDescription/fullDescription are free-text business
// content set by the Marketing Manager (Advertisement model) — shown as
// stored regardless of locale, not auto-translated. Amenity.labelEn /
// City.nameEn already exist on the backend records.
interface ListingDetail {
  id: string;
  title: string;
  shortDescription: string | null;
  fullDescription: string | null;
  coverImage: { url: string } | null;
  galleryImages: { unitImage: { url: string } }[];
  unit: {
    id: string;
    bedrooms: number;
    bathrooms: number;
    areaSqm: string | null;
    pricePerNight: string;
    currency: string;
    status: string;
    isActive: boolean;
    amenities: { amenity: { key: string; labelAr: string; labelEn: string; icon: string | null } }[];
    property: {
      address: string;
      city: { nameAr: string; nameEn: string } | null;
    };
  };
}

const L = {
  loadError: { ar: "تعذر تحميل الإعلان", en: "Could not load the listing" },
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  perNight: { ar: "/ ليلة", en: "/ night" },
  available: { ar: "متاحة للحجز", en: "Available for booking" },
  unavailable: { ar: "غير متاحة حاليًا", en: "Currently unavailable" },
  bedrooms: { ar: "غرف نوم", en: "Bedrooms" },
  bathrooms: { ar: "حمامات", en: "Bathrooms" },
  bookNow: { ar: "احجز الآن / تواصل معنا", en: "Book Now / Contact Us" },
} as const;

export default function ApartmentDetailPage() {
  const { locale } = useLocale();
  const params = useParams<{ citySlug: string; slug: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reuses the existing public GET /public/apartments/:citySlug/:slug —
    // already excludes ID/ownership/bank/tenant/admin-note/inspection data
    // by construction (Advertisement has no such fields).
    api
      .get<ListingDetail>(`/public/apartments/${params.citySlug}/${params.slug}`)
      .then(setListing)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : L.loadError[locale]));
  }, [params.citySlug, params.slug, locale]);

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="error-box" style={{ margin: 24 }}>{error}</div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: 60, color: "var(--mut)" }}>{L.loading[locale]}</div>
        <Footer />
      </div>
    );
  }

  const { unit } = listing;
  const images = [listing.coverImage?.url, ...listing.galleryImages.map((g) => g.unitImage.url)].filter(
    (u): u is string => !!u
  );
  const isAvailable = unit.status === "PUBLISHED" && unit.isActive;
  const cityName = unit.property.city ? (locale === "ar" ? unit.property.city.nameAr : unit.property.city.nameEn) : "";

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {images.length > 0 && (
          <div
            style={{
              width: "100%",
              height: 360,
              borderRadius: 12,
              backgroundImage: `url(${images[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: 8,
            }}
          />
        )}
        {images.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20 }}>
            {images.slice(1, 8).map((url, i) => (
              <div
                key={i}
                style={{
                  width: 100,
                  height: 70,
                  flexShrink: 0,
                  borderRadius: 8,
                  backgroundImage: `url(${url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "var(--fnar)", fontSize: 24, color: "var(--g)" }}>{listing.title}</h1>
            <div className="lc-loc" style={{ marginTop: 4 }}>
              {unit.property.address}{cityName ? `، ${cityName}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div className="lc-price" style={{ fontSize: 20 }}>
              {Number(unit.pricePerNight).toLocaleString()} {unit.currency} {L.perNight[locale]}
            </div>
            <span className={`badge ${isAvailable ? "ba" : "br"}`}>
              {isAvailable ? L.available[locale] : L.unavailable[locale]}
            </span>
          </div>
        </div>

        <div className="form-card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
            <div><strong>{unit.bedrooms}</strong> {L.bedrooms[locale]}</div>
            <div><strong>{unit.bathrooms}</strong> {L.bathrooms[locale]}</div>
            {unit.areaSqm && <div><strong>{Number(unit.areaSqm)}</strong> m²</div>}
          </div>

          {(listing.fullDescription || listing.shortDescription) && (
            <p style={{ fontFamily: "var(--fnar)", lineHeight: 1.8, marginBottom: 14 }}>
              {listing.fullDescription ?? listing.shortDescription}
            </p>
          )}

          {unit.amenities.length > 0 && (
            <div className="lc-ams" style={{ marginBottom: 14 }}>
              {unit.amenities.map((a) => (
                <span className="lc-am" key={a.amenity.key}>{locale === "ar" ? a.amenity.labelAr : a.amenity.labelEn}</span>
              ))}
            </div>
          )}

          <Link href={`/booking?unitId=${unit.id}`} className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
            {L.bookNow[locale]}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
