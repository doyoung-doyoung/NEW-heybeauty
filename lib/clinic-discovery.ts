import type { Clinic, Treatment } from "./types";
import { cityOf } from "./geo";

export type ClinicSort = "default" | "priceAsc" | "priceDesc" | "rating";
export interface ClinicFilters {
  query: string;
  category: string;
  city: string;
  district: string;
  maxPrice: number | null;
  minRating: number;
  favoritesOnly: boolean;
  sort: ClinicSort;
}

export const EMPTY_CLINIC_FILTERS: ClinicFilters = {
  query: "", category: "전체", city: "", district: "", maxPrice: null,
  minRating: 0, favoritesOnly: false, sort: "default",
};

export function scopedTreatments(treatments: Treatment[], clinicId: string, category: string) {
  return treatments.filter(t => t.clinicId === clinicId &&
    (category === "전체" || category === "지도로 보기" || t.category === category));
}

export function clinicStartingPrice(treatments: Treatment[], clinicId: string, category: string) {
  const pool = scopedTreatments(treatments, clinicId, category);
  return pool.length ? Math.min(...pool.map(t => t.price)) : Infinity;
}

const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase().trim();

export function discoverClinics(
  clinics: Clinic[], treatments: Treatment[], filters: ClinicFilters,
  favoriteIds: readonly string[] = [], translate: (text: string) => string = text => text,
) {
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
  const favoriteSet = new Set(favoriteIds);
  const prices = new Map(clinics.map(c => [c.id, clinicStartingPrice(treatments, c.id, filters.category)]));
  const result = clinics.filter(c => {
    const pool = scopedTreatments(treatments, c.id, filters.category);
    if (filters.category !== "전체" && filters.category !== "지도로 보기" && !pool.length) return false;
    if (filters.city && cityOf(c.district) !== filters.city) return false;
    if (filters.district && c.district !== filters.district) return false;
    if (filters.maxPrice !== null && prices.get(c.id)! > filters.maxPrice) return false;
    if (c.rating < filters.minRating || (filters.favoritesOnly && !favoriteSet.has(c.id))) return false;
    const fields = [c.name, c.district, cityOf(c.district), c.address,
      ...pool.flatMap(t => [t.name, t.category])];
    const haystack = normalize([...fields, ...fields.map(translate)].join(" "));
    return terms.every(term => haystack.includes(term));
  });
  return result.sort((a, b) => {
    const pa = prices.get(a.id)!, pb = prices.get(b.id)!;
    if (filters.sort === "default") {
      const photos = Number(Boolean(b.image)) - Number(Boolean(a.image));
      if (photos) return photos;
    }
    if (filters.sort === "rating" && a.rating !== b.rating) return b.rating - a.rating;
    // 가격 미등록 클리닉은 높은 가격순에서도 마지막에 둔다.
    if (!Number.isFinite(pa) && Number.isFinite(pb)) return 1;
    if (Number.isFinite(pa) && !Number.isFinite(pb)) return -1;
    if (Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb) {
      return filters.sort === "priceDesc" ? pb - pa : pa - pb;
    }
    return a.id.localeCompare(b.id);
  });
}

export function commonTreatmentNames(clinics: Clinic[], treatments: Treatment[]) {
  if (!clinics.length) return [];
  const lists = clinics.map(c => new Set(treatments.filter(t => t.clinicId === c.id).map(t => t.name)));
  return [...lists[0]].filter(name => lists.every(list => list.has(name)));
}

export function toggleComparison(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter(x => x !== id) : ids.length < 3 ? [...ids, id] : ids;
}

export function parseFavoriteIds(raw: string | null): string[] {
  try {
    const values: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(values) ? [...new Set(values.filter((id): id is string => typeof id === "string" && id.length > 0))] : [];
  } catch { return []; }
}
