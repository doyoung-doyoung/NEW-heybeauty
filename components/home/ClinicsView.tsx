"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { discounted, promoTreatments } from "@/lib/promo";
import type { Promotion } from "@/lib/types";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import { branchImage, promoImage, treatmentImage } from "@/lib/images";
import { useAuth } from "@/lib/auth";
import DoctorProfile from "./DoctorProfile";
import MembershipPrompt from "./MembershipPrompt";
import ClinicComparison from "./ClinicComparison";
import { ClinicDiscoveryControls, ClinicActions, useClinicFavorites } from "./ClinicDiscoveryControls";
import { discoverClinics, EMPTY_CLINIC_FILTERS, toggleComparison } from "@/lib/clinic-discovery";
import ClinicMap from "@/components/home/ClinicMap";
import { Badge, GlassCard, InkButton, GhostButton } from "@/components/ui/primitives";

// 지도로 보기는 많이 쓰는 기능이라 홈 왼쪽 메뉴("클리닉 둘러보기" 바로 옆)로 올렸다.
// 그래서 칩 줄에는 시술 분류만 남긴다. HomeTab이 이 값을 initialCategory로 넘겨 지도를 연다.
export const MAP = "지도로 보기";
const CATEGORIES = ["전체", "화이트닝", "V라인", "리프팅", "스킨부스터", "필러"];

// 사전 키는 영문이라 "전체"·"지도로 보기"만 갈아끼우면 나머지는 한국어 그대로 붙여 쓴다.
const CATEGORY_KEY: Record<string, string> = { 전체: "All", [MAP]: "Map" };

export default function ClinicsView({
  initialCategory = "전체",
  initialOpenId = null,
  onBook,
  fromChat = false,
}: {
  fromChat?: boolean;
  initialCategory?: string;
  /** 처음부터 이 클리닉 상세를 연다 (공지 팝업 → 클리닉 둘러보기). */
  initialOpenId?: string | null;
  onBook: (clinicId: string, treatmentId: string, promoId?: string) => void;
}) {
  const { t } = useT();
  const { loggedIn } = useAuth();
  const [signupOpen, setSignupOpen] = useState(false);
  const { db } = useDb();
  const [category, setCategory] = useState(initialCategory);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [promoId, setPromoId] = useState<string | null>(null);

  const [filters, setFilters] = useState(EMPTY_CLINIC_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_CLINIC_FILTERS);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const { favoriteIds, toggleFavorite } = useClinicFavorites();

  if (!db) return null;

  // 지도로 보기는 시술 분류가 아니라 보는 방식이다. 거르는 기준은 "전체"와 같다.
  const isMap = category === MAP;
  const isAll = category === "전체" || isMap;
  const suffix = CATEGORY_KEY[category] ?? category;
  const categoryLabel = t(`cat${suffix}`);
  const categoryDesc = t(`catDesc${suffix}`);

  // 지금 보이는 카테고리 안에서 제일 싼 시술 가격. 시술이 없으면 정렬 맨 뒤로 밀려나게 무한대.
  const cheapestPrice = (clinicId: string) => {
    const pool = db.treatments.filter(
      (x) => x.clinicId === clinicId && (isAll || x.category === category),
    );
    return pool.length ? Math.min(...pool.map((x) => x.price)) : Infinity;
  };
  // 사진 있는 클리닉을 무조건 앞에 세운다 (10/2 노트) — 사진 없는 카드가 맨 위에 오면 휑하다.
  // 그 안에서는 최저가 순. 그래서 "최저가" 배지는 맨 위가 아니라 실제로 제일 싼 카드에 붙인다.
  const clinics = discoverClinics(db.clinics, db.treatments, { ...appliedFilters, category }, favoriteIds, t);
  const resetFilters = () => { setFilters(EMPTY_CLINIC_FILTERS); setAppliedFilters(EMPTY_CLINIC_FILTERS); setCategory("전체"); };
  const comparison = <ClinicComparison clinics={comparisonIds.flatMap(id => db.clinics.filter(c => c.id === id))} treatments={db.treatments} onClear={() => setComparisonIds([])} onRemove={id => setComparisonIds(ids => ids.filter(x => x !== id))} onOpen={setOpenId} />;
  const actions = (clinic: typeof db.clinics[number]) => <ClinicActions hideRemove={fromChat} clinic={clinic} saved={favoriteIds.includes(clinic.id)} selected={comparisonIds.includes(clinic.id)} comparisonFull={comparisonIds.length >= 3} onFavorite={() => toggleFavorite(clinic.id)} onCompare={() => setComparisonIds(ids => toggleComparison(ids, clinic.id))} />;
  // 정렬이 사진 우선이라 맨 위가 최저가가 아닐 수 있다. 배지는 진짜 최저가 클리닉에만.
  const lowestId = clinics.reduce<string | null>(
    (best, c) =>
      cheapestPrice(c.id) < (best ? cheapestPrice(best) : Infinity) ? c.id : best,
    null,
  );
  const open = openId ? db.clinics.find((c) => c.id === openId) : null;

  if (open) {
    const treatments = db.treatments.filter((x) => x.clinicId === open.id);
    const promos = db.promotions.filter((p) => p.clinicId === open.id);
    const branches = db.branches.filter((b) => b.clinicId === open.id);
    const doctors = db.doctors.filter((d) => d.clinicId === open.id);
    const reviews = db.reviews.filter(
      (r) => r.clinicId === open.id && r.approved && !r.blocked,
    );
    const sorted = isAll
      ? treatments
      : [...treatments].sort(
          (a, b) =>
            Number(b.category === category) - Number(a.category === category),
        );

    return (
      <div className={`space-y-4 ${comparisonIds.length ? "pb-48" : ""}`}>
        <MembershipPrompt open={signupOpen} onClose={() => setSignupOpen(false)} />
        {comparison}
        <GhostButton onClick={() => setOpenId(null)}>← {t("back")}</GhostButton>
        {actions(open)}

        <GlassCard className="overflow-hidden">
          <div className="h-48 w-full ">
            <ClinicPhoto
              clinicId={open.id}
              name={t(open.name)}
              district={t(open.district)}
              src={open.image}
            />
          </div>
          <div className="p-4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{t(open.name)}</h2>
                <p className="mt-1 text-sm text-ink-sub">
                  {t(open.district)} · {t(open.address)}
                </p>
              </div>
              <div className="text-right">
                {loggedIn && <><div className="text-xl font-bold">★ {open.rating}</div>
                <div className="text-xs text-ink-sub">
                  {open.reviewCount} {t("reviewCount")}
                </div></>}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/75">{t(open.intro)}</p>

            <div className="mt-5 grid gap-3 grid-cols-1">
              <div className="rounded-cell bg-white/60 p-4 hairline">
                <div className="text-xs font-semibold text-ink-sub">
                  {t("hours")}
                </div>
                <ul className="mt-2 space-y-0.5 text-sm">
                  {open.hours.map((h) => (
                    <li key={h.day} className="flex justify-between">
                      <span>{t(h.day)}</span>
                      <span className={h.closed ? "text-ink-sub" : ""}>
                        {h.closed ? t("closedDay") : `${h.open} - ${h.close}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <div className="rounded-cell bg-white/60 p-4 hairline">
                  <div className="text-xs font-semibold text-ink-sub">
                    {t("parking")}
                  </div>
                  <div className="mt-1 text-sm">{t(open.parking)}</div>
                </div>
                <div className="rounded-cell bg-white/60 p-4 hairline">
                  <div className="text-xs font-semibold text-ink-sub">
                    {t("contact")}
                  </div>
                  <div className="mt-1 text-sm">
                    {open.phone} · LINE {open.lineId}
                  </div>
                </div>
                {branches.length > 1 && (
                  <div className="rounded-cell bg-white/60 p-4 hairline">
                    <div className="text-xs font-semibold text-ink-sub">
                      {t("branches")}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {branches.map((b) => {
                        const img = branchImage(b);
                        return (
                          <div key={b.id} className="overflow-hidden rounded-cell bg-white hairline">
                            {img && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={t(b.name)}
                                loading="lazy"
                                className="h-14 w-full object-cover"
                              />
                            )}
                            <div className="truncate px-1.5 py-1 text-[11px] font-medium">
                              {t(b.name)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {promos.length > 0 && (
          <GlassCard soft className="p-4 p-4">
            <h3 className="font-bold">{t("activePromos")}</h3>
            <div className="mt-3 grid gap-3 grid-cols-1">
              {promos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPromoId(p.id)}
                  className="lift group overflow-hidden rounded-cell bg-hb-50 p-4 text-left transition duration-100 hairline active:scale-[0.97]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={promoImage(p)}
                    alt=""
                    loading="lazy"
                    className="-mx-4 -mt-4 mb-3 h-24 w-[calc(100%+2rem)] max-w-none object-cover"
                  />
                  <Badge tone="pink">{p.discountPct}%</Badge>
                  <div className="mt-2 text-sm font-semibold">{t(p.title)}</div>
                  <p className="mt-1 text-xs text-ink-sub">{t(p.description)}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-sub">
                    <span>{t("promoOngoing")}</span>
                    <span className="font-semibold text-ink group-hover:underline">
                      {t("promoSee")} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        )}

        {promoId &&
          (() => {
            const promo = promos.find((p) => p.id === promoId);
            return promo ? (
              <PromoSheet
                promo={promo}
                onClose={() => setPromoId(null)}
                onBook={(treatmentId) => {
                  setPromoId(null);
                  onBook(open.id, treatmentId, promo.id);
                }}
              />
            ) : null;
          })()}

        <GlassCard soft className="p-4 p-4">
          <h3 className="font-bold">{t("treatmentList")}</h3>
          <div className="mt-3 space-y-2">
            {sorted.map((x) => {
              const hit = !isAll && x.category === category;
              return (
                <div
                  key={x.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-cell p-4 transition ${
                    hit
                      ? "bg-hb-200 text-ink ring-2 ring-hb-600/60"
                      : "bg-white/70 hairline"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={treatmentImage(x)}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-cell object-cover"
                    />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={hit ? "font-black" : "font-semibold"}>{t(x.name)}</span>
                      <Badge tone={hit ? "pink" : "neutral"}>{t(x.category)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-sub">
                      {x.durationMin}
                      {t("minutes")} · {t(x.description)}
                    </p>
                  </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap font-bold">
                      ฿{x.price.toLocaleString()}
                    </span>
                    <InkButton onClick={() => onBook(open.id, x.id)}>
                      {t("book")}
                    </InkButton>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-4">
          <GlassCard soft className="p-4 p-4">
            <h3 className="font-bold">{t("doctors")}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {doctors.map((d) => (
                <DoctorProfile key={d.id} doctor={d} />
              ))}
            </div>
          </GlassCard>

          <GlassCard soft className="p-4 p-4">
            <h3 className="font-bold">{t("reviews")}</h3>
            <div className="mt-3 space-y-2">
              {!loggedIn && <button type="button" onClick={() => setSignupOpen(true)} className="w-full rounded-cell bg-hb-50 p-5 text-sm font-semibold">{t("회원가입 후 후기와 평점 보기")} →</button>}
              {loggedIn && <p className="mb-3 text-sm font-semibold">★ {open.rating} · {open.reviewCount} {t("reviewCount")}</p>}
              {loggedIn && reviews.length === 0 && (
                <p className="text-sm text-ink-sub">{t("noReviews")}</p>
              )}
              {loggedIn && reviews.map((r) => (
                <div key={r.id} className="rounded-cell bg-white/70 p-3 hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{"★".repeat(r.rating)}</span>
                    {r.code && (
                      <Badge tone="pink">
                        {t("reviewCode")} {r.code}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink/80">{t(r.text)}</p>
                  {r.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {r.images.map((src) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          src={src}
                          alt=""
                          className="h-20 w-full rounded-cell object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${comparisonIds.length ? "pb-48" : ""}`}>
      {comparison}
      {!isMap && <ClinicDiscoveryControls clinics={db.clinics} filters={{ ...filters, category }} onChange={setFilters} onSearch={() => setAppliedFilters(filters)} favoritesCount={db.clinics.filter(c => favoriteIds.includes(c.id)).length} onReset={resetFilters} />}
      {/* 칩이 줄바꿈되면 두 번째 줄이 화면 아래로 밀려 안 보인다. 한 줄로 고정하고
          다 안 들어가면 옆으로 넘기게 한다 — HomeTab 사이드 탭과 같은 패턴. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <GhostButton
            key={c}
            active={c === category}
            onClick={() => setCategory(c)}
            className="flex min-w-[56px] shrink-0 flex-col items-center gap-1 whitespace-nowrap px-2"
          >
            <CategoryIcon index={CATEGORIES.indexOf(c)} />
            {t(`cat${CATEGORY_KEY[c] ?? c}`)}
          </GhostButton>
        ))}
      </div>

      <GlassCard
        key={category}
        className="animate-pop overflow-hidden bg-gradient-to-br from-hb-50/80 to-hb-200/50 p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-widest text-hb-600">
              {isMap ? "MAP" : isAll ? "ALL" : categoryLabel.toUpperCase()}
            </div>
            <h2 className="mt-1 text-2xl font-bold">{categoryLabel}</h2>
            <p className="mt-1.5 max-w-xl text-sm text-ink/70">{categoryDesc}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black tabular-nums">{clinics.length}</div>
            <div className="text-xs text-ink-sub">{t("clinicCount")}</div>
          </div>
        </div>
      </GlassCard>

      {isMap && <ClinicMap onOpen={(id) => setOpenId(id)} />}

      {!isMap && clinics.length === 0 && (
        <GlassCard soft className="p-8 text-center text-sm text-ink-sub">
          <p className="font-semibold text-ink">{t(filters.favoritesOnly && !favoriteIds.length ? "clinicNoFavorites" : "clinicNoResults")}</p>
          <p className="mt-2">{t(filters.favoritesOnly && !favoriteIds.length ? "clinicNoFavoritesHint" : "clinicNoResultsHint")}</p>
          <button type="button" onClick={resetFilters} className="mt-4 rounded-pill bg-ink px-5 py-3 text-white">{t("clinicResetFilters")}</button>
        </GlassCard>
      )}

      {!isMap && (
      <div className="grid gap-4">
        {clinics.map((c) => {
          const pool = db.treatments.filter((x) => x.clinicId === c.id);
          const scoped = isAll
            ? pool
            : pool.filter((x) => x.category === category);
          // 시술이 아직 하나도 없는 클리닉(어드민에서 갓 등록한 경우)이면 scoped가 빈 배열이다.
          // reduce에 초기값 없이 빈 배열을 넣으면 예외가 터져서 홈 탭 전체가 하얗게 된다.
          const best = scoped.length
            ? scoped.reduce((a, b) => (a.price <= b.price ? a : b))
            : null;
          const promo = db.promotions.find((p) => p.clinicId === c.id);
          return (
<article key={c.id} className="lift glass-soft overflow-hidden rounded-card">
            <button type="button" onClick={() => setOpenId(c.id)} className="flex w-full items-stretch text-left" aria-label={`${t(c.name)} ${t("viewDetail")}`}>
              <div className="w-24 shrink-0 overflow-hidden">
                <ClinicPhoto
                  clinicId={c.id}
                  name={t(c.name)}
                  district={t(c.district)}
                  src={c.image}
                />
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{t(c.name)}</div>
                    <div className="mt-1 text-xs text-ink-sub">
                      {t(c.district)}
                      {c.hasBranches
                        ? ` · ${t("branches")} ${db.branches.filter((b) => b.clinicId === c.id).length}`
                        : ""}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-semibold">
                    {loggedIn ? `★ ${c.rating}` : ""}
                  </div>
                </div>

                {(c.id === lowestId && best) || promo ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.id === lowestId && best && (
                      <Badge tone="pink">{t("fromPrice")}</Badge>
                    )}
                    {promo && (
                      <Badge tone="pink">
                        {t(promo.title)} {promo.discountPct}%
                      </Badge>
                    )}
                  </div>
                ) : null}

                <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink/10 pt-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-ink-sub">
                      {isAll
                        ? `${t("treatments")} ${scoped.length}`
                        : `${categoryLabel} ${t("fromPrice")}`}
                    </div>
                    <div className="truncate text-sm font-medium">
                      {best ? t(best.name) : t("preparingTreatments")}
                    </div>
                  </div>
                  {best && (
                    <span className="whitespace-nowrap font-bold">
                      ฿{best.price.toLocaleString()}~
                    </span>
                  )}
                </div>
              </div>
            </button>
            <div className="px-4 pb-4 ">{actions(c)}</div>
            </article>
          );
        })}
      </div>
      )}
    </div>
  );
}

/**
 * 프로모션 상세. 할인율 · 기간 · 설명을 보여 주고, 이 프로모션이 걸리는 시술을
 * 원래 값과 할인가로 늘어놓는다. 시술을 고르면 곧장 예약(→ QR → 송금) 화면으로 간다.
 * <main>에 transform이 걸려 있어 fixed가 main 기준으로 붙으니 body로 빼낸다.
 */
function PromoSheet({
  promo,
  onClose,
  onBook,
}: {
  promo: Promotion;
  onClose: () => void;
  onBook: (treatmentId: string) => void;
}) {
  const { t } = useT();
  const { db } = useDb();
  if (!db) return null;

  const clinic = db.clinics.find((c) => c.id === promo.clinicId);
  const list = promoTreatments(promo, db.treatments);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={t(promo.title)}
        className="animate-pop max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-card bg-white p-6 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={promoImage(promo)}
          alt=""
          className="-mx-6 -mt-6 mb-4 h-36 w-[calc(100%+3rem)] max-w-none object-cover sm:rounded-t-card"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-ink-sub">{t(clinic?.name ?? "")}</div>
            <h3 className="mt-1 text-lg font-bold">{t(promo.title)}</h3>
          </div>
          <span className="shrink-0 rounded-pill bg-hb-600 px-3 py-1 text-sm font-bold text-white">
            -{promo.discountPct}%
          </span>
        </div>
        <p className="mt-2 text-sm text-ink/75">{t(promo.description)}</p>
        <div className="mt-3 rounded-cell bg-hb-50 px-3 py-2 text-xs text-ink-sub">
          {t("promoOngoing")}
        </div>

        <div className="mt-5 text-sm font-semibold">{t("promoPick")}</div>
        <div className="mt-2 space-y-2">
          {list.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => onBook(x.id)}
              className="flex w-full items-center justify-between gap-3 rounded-cell bg-white p-3.5 text-left transition hairline hover:bg-hb-50"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{t(x.name)}</div>
                <div className="text-[11px] text-ink-sub">
                  {t(x.category)} · {x.durationMin}
                  {t("minutes")}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] text-ink-sub line-through">
                  ฿{x.price.toLocaleString()}
                </div>
                <div className="font-bold text-hb-600">
                  ฿{discounted(x.price, promo.discountPct).toLocaleString()}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-pill py-2.5 text-sm text-ink-sub hairline"
        >
          {t("close")}
        </button>
      </div>
    </div>,
    document.body,
  );
}

function CategoryIcon({ index }: { index: number }) {
  const paths = ["M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z", "M12 3v18 M3 12h18 M5 5l14 14 M19 5L5 19", "M4 5l8 15 8-15", "M5 16l7-11 7 11 M12 5v15", "M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z", "M5 19L19 5 M14 4l6 6 M4 14l6 6"];
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[index] || paths[0]} /></svg>;
}
