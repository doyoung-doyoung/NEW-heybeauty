"use client";

import { useEffect, useId, useState } from "react";
import type { Clinic } from "@/lib/types";
import { cityOf } from "@/lib/geo";
import { parseFavoriteIds, type ClinicFilters, type ClinicSort } from "@/lib/clinic-discovery";
import { useT } from "@/lib/i18n";

const FAVORITES_KEY = "heybeauty.clinic-favorites.v1";

export function useClinicFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setFavoriteIds(parseFavoriteIds(localStorage.getItem(FAVORITES_KEY))); } catch { /* 저장 제한 시 현재 세션에서 사용 */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === FAVORITES_KEY) setFavoriteIds(parseFavoriteIds(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds)); } catch { /* 현재 세션의 찜은 유지 */ }
  }, [favoriteIds, ready]);
  return { favoriteIds, toggleFavorite: (id: string) => setFavoriteIds(ids =>
    ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]) };
}

export function ClinicDiscoveryControls({ clinics, filters, onChange, favoritesCount, onReset }: {
  clinics: Clinic[];
  filters: ClinicFilters;
  onChange: (filters: ClinicFilters) => void;
  favoritesCount: number;
  onReset: () => void;
}) {
  const { t, tf } = useT();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const cities = [...new Set(clinics.map(c => cityOf(c.district)))].sort((a, b) =>
    a === "방콕" ? -1 : b === "방콕" ? 1 : t(a).localeCompare(t(b)));
  const districts = [...new Set(clinics.filter(c => !filters.city || cityOf(c.district) === filters.city).map(c => c.district))]
    .sort((a, b) => t(a).localeCompare(t(b)));
  const filterCount = [filters.city, filters.district, filters.maxPrice, filters.minRating].filter(Boolean).length;
  const hasConditions = Boolean(filters.query || filterCount || filters.favoritesOnly || filters.category !== "전체" || filters.sort !== "default");
  const fieldClass = "mt-1.5 w-full min-w-0 rounded-cell bg-white px-3 py-2.5 text-base text-ink outline-none hairline focus:ring-2 focus:ring-hb-400";
  const change = (patch: Partial<ClinicFilters>) => onChange({ ...filters, ...patch });
  return (
    <section className="glass-soft rounded-card p-4" aria-label={t("clinicFilters")}>
      <div className="relative">
        <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-ink-sub" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <input type="search" value={filters.query} onChange={e => change({ query: e.target.value })}
          placeholder={t("clinicSearch")} aria-label={t("clinicSearch")}
          className="w-full rounded-pill bg-white py-3 pl-11 pr-10 text-base outline-none hairline focus:ring-2 focus:ring-hb-400" />
        {filters.query && <button type="button" aria-label={t("clinicSearchClear")} onClick={() => change({ query: "" })}
          className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full text-lg text-ink-sub">×</button>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={panelId}
          className={`min-h-10 rounded-pill px-4 text-sm hairline ${expanded || filterCount ? "bg-ink text-white" : "bg-white/80"}`}>
          {t("clinicFilters")}{filterCount > 0 && ` ${filterCount}`} <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
        <button type="button" onClick={() => change({ favoritesOnly: !filters.favoritesOnly })} aria-pressed={filters.favoritesOnly}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-pill px-3 text-sm hairline ${filters.favoritesOnly ? "bg-hb-600 text-white" : "bg-white/80"}`}>
          <Heart filled={filters.favoritesOnly} /> {t("clinicFavorites")} {favoritesCount}
        </button>
        {hasConditions && <button type="button" onClick={onReset} className="ml-auto min-h-10 px-1 text-xs text-ink-sub underline underline-offset-4">{t("clinicResetFilters")}</button>}
      </div>
      {expanded && <div id={panelId} className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
        <label className="min-w-0 text-xs font-medium text-ink-sub">{t("clinicCity")}
          <select value={filters.city} onChange={e => change({ city: e.target.value, district: "" })} className={fieldClass}>
            <option value="">{t("clinicAllCities")}</option>{cities.map(city => <option key={city} value={city}>{t(city)}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs font-medium text-ink-sub">{t("clinicDistrict")}
          <select value={filters.district} onChange={e => change({ district: e.target.value })} className={fieldClass}>
            <option value="">{t("clinicAllDistricts")}</option>{districts.map(d => <option key={d} value={d}>{t(d)}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs font-medium text-ink-sub">{t("clinicBudget")}
          <select value={filters.maxPrice ?? ""} onChange={e => change({ maxPrice: e.target.value ? Number(e.target.value) : null })} className={fieldClass}>
            <option value="">{t("clinicBudgetAll")}</option>{[3000, 5000, 10000, 20000].map(price => <option key={price} value={price}>{tf("clinicBudgetUnder", price.toLocaleString())}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs font-medium text-ink-sub">{t("clinicRating")}
          <select value={filters.minRating} onChange={e => change({ minRating: Number(e.target.value) })} className={fieldClass}>
            <option value={0}>{t("clinicRatingAll")}</option>{[4.5, 4.7].map(rating => <option key={rating} value={rating}>{tf("clinicRatingAbove", rating)}</option>)}
          </select>
        </label>
        <p className="col-span-2 text-[11px] leading-relaxed text-ink-sub">{t("clinicBudgetHint")}</p>
      </div>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <label htmlFor={`${panelId}-sort`} className="text-xs text-ink-sub">{t("clinicSort")}</label>
        <select id={`${panelId}-sort`} value={filters.sort} onChange={e => change({ sort: e.target.value as ClinicSort })}
          className="max-w-[70%] rounded-pill bg-white/80 px-3 py-2 text-base outline-none hairline focus:ring-2 focus:ring-hb-400">
          <option value="default">{t("clinicSortDefault")}</option><option value="priceAsc">{t("clinicSortLow")}</option>
          <option value="priceDesc">{t("clinicSortHigh")}</option><option value="rating">{t("clinicSortRating")}</option>
        </select>
      </div>
    </section>
  );
}

export function ClinicActions({ clinic, saved, selected, comparisonFull, onFavorite, onCompare }: {
  clinic: Clinic; saved: boolean; selected: boolean; comparisonFull: boolean;
  onFavorite: () => void; onCompare: () => void;
}) {
  const { t } = useT();
  const saveLabel = t(saved ? "clinicUnsave" : "clinicSave");
  const compareLabel = t(selected ? "clinicCompareRemove" : "clinicCompareSelect");
  return <div className="grid grid-cols-2 gap-2">
    <button type="button" onClick={onFavorite} aria-pressed={saved} aria-label={`${t(clinic.name)} ${saveLabel}`}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-pill px-2 text-sm hairline ${saved ? "bg-hb-50 text-hb-600" : "bg-white/70 text-ink-sub"}`}>
      <Heart filled={saved} /> {saveLabel}
    </button>
    <button type="button" onClick={onCompare} aria-pressed={selected} aria-label={`${t(clinic.name)} ${compareLabel}`}
      disabled={!selected && comparisonFull}
      className={`min-h-11 rounded-pill px-2 text-sm hairline disabled:opacity-40 ${selected ? "bg-ink text-white" : "bg-white/70 text-ink-sub"}`}>
      <span aria-hidden="true">{selected ? "✓" : "+"}</span> {compareLabel}
    </button>
  </div>;
}

function Heart({ filled }: { filled: boolean }) {
  return <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
    <path strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>;
}
