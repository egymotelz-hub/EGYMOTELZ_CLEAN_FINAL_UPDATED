"use client";

import { useEffect, useState } from "react";
import { api } from "./apiClient";

export interface DistrictData {
  id: string;
  nameAr: string;
  nameEn: string;
}
export interface GovernorateData {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
}
export interface CityData {
  id: string;
  nameAr: string;
  nameEn: string;
  districts: DistrictData[];
  governorate: GovernorateData | null;
}

export function useGeoData() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CityData[]>("/public/cities")
      .then(setCities)
      .catch(() => setError("تعذر تحميل قائمة المدن"))
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading, error };
}

/** Shared across every page using the Governorate -> City cascade — do not
 * reimplement this per page. Dedupes cities' nested governorate into a
 * sorted, unique list for the first-level dropdown. */
export function deriveGovernorates(cities: CityData[]): GovernorateData[] {
  return Array.from(
    new Map(cities.filter((c) => c.governorate).map((c) => [c.governorate!.id, c.governorate!])).values()
  ).sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}
