"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { discounted, promoTreatments } from "@/lib/promo";
import type { Promotion } from "@/lib/types";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import ClinicMap from "@/components/home/ClinicMap";
import { Badge, GlassCard, InkButton, GhostButton } from "@/components/ui/primitives";

const MAP = "지도로 보기";
const CATEGORIES = ["전체", MAP, "화이트닝", "V라인", "리프팅", "스킨부스터", "필러"];

// 사전 키는 영문이라 "전체"·"지도로 보기"만 갈아끼우면 나머지는 한국어 그대로 붙여 쓴다.
const CATEGORY_KEY: Record<string, string> = { 전체: "All", [MAP]: "Map" };

export default function ClinicsView({
  initialCategory = "전체",
  onBook,
}: {
  initialCategory?: string;
  onBook: (clinicId: string, treatmentId: string, promoId?: string) => void;
}) {
  const { t } = useT();
  const { db } = useDb();
  const [category, setCategory] = useState(initialCategory);
  const [openId, setOpenId] = useState<string | null>(null);
  const [promoId, setPromoId] = useState<string | null>(null);

  if (!db) return null;

  // 지도로 보기는 시술 분류가 아니라 보는 방식이다. 거르는 기준은 "전체"와 같다.
  const isMap = category === MAP;
  const isAll = category === "전체" || isMap;
  const suffix = CATEGORY_KEY[category] ?? category;
  const categoryLabel = t(`cat${suffix}`);
  const categoryDesc = t(`catDesc${suffix}`);

  const matches = (clinicId: string) =>
    isAll ||
    db.treatments.some((x) => x.clinicId === clinicId && x.category === category);

  // 지금 보이는 카테고리 안에서 제일 싼 시술 가격. 시술이 없으면 정렬 맨 뒤로 밀려나게 무한대.
  const cheapestPrice = (clinicId: string) => {
    const pool = db.treatments.filter(
      (x) => x.clinicId === clinicId && (isAll || x.category === category),
    );
    return pool.length ? Math.min(...pool.map((x) => x.price)) : Infinity;
  };
  // 리스트 맨 위 카드에 "최저가" 배지를 붙이는데, 그 배지가 거짓말이 되면 안 되니까
  // 진짜로 제일 싼 클리닉이 맨 위로 오게 정렬한다.
  const clinics = db.clinics
    .filter((c) => matches(c.id))
    .sort((a, b) => cheapestPrice(a.id) - cheapestPrice(b.id));
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
      <div className="space-y-4">
        <GhostButton onClick={() => setOpenId(null)}>← {t("back")}</GhostButton>

        <GlassCard className="overflow-hidden">
          <div className="h-48 w-full sm:h-60">
            <ClinicPhoto
              clinicId={open.id}
              name={t(open.name)}
              district={t(open.district)}
              src={open.image}
            />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{t(open.name)}</h2>
                <p className="mt-1 text-sm text-ink-sub">
                  {t(open.district)} · {t(open.address)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">★ {open.rating}</div>
                <div className="text-xs text-ink-sub">
                  {open.reviewCount} {t("reviewCount")}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/75">{t(open.intro)}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {branches.map((b) => (
                        <Badge key={b.id}>{t(b.name)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {promos.length > 0 && (
          <GlassCard soft className="p-6">
            <h3 className="font-bold">{t("activePromos")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {promos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPromoId(p.id)}
                  className="lift group rounded-cell bg-hb-50 p-4 text-left transition duration-100 hairline active:scale-[0.97]"
                >
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

        <GlassCard soft className="p-6">
          <h3 className="font-bold">{t("treatmentList")}</h3>
          <div className="mt-3 space-y-2">
            {sorted.map((x) => {
              const hit = !isAll && x.category === category;
              return (
                <div
                  key={x.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-cell p-4 transition ${
                    hit
                      ? "bg-hb-50 ring-1 ring-hb-400/50"
                      : "bg-white/70 hairline"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t(x.name)}</span>
                      <Badge tone={hit ? "pink" : "neutral"}>{t(x.category)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-sub">
                      {x.durationMin}
                      {t("minutes")} · {t(x.description)}
                    </p>
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

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard soft className="p-6">
            <h3 className="font-bold">{t("doctors")}</h3>
            <div className="mt-3 space-y-2">
              {doctors.slice(0, 6).map((d) => (
                <div key={d.id} className="rounded-cell bg-white/70 p-3 hairline">
                  <div className="text-sm font-semibold">{t(d.name)}</div>
                  <div className="text-xs text-ink-sub">
                    {t(d.title)} · {d.specialties.map((sp) => t(sp)).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard soft className="p-6">
            <h3 className="font-bold">{t("reviews")}</h3>
            <div className="mt-3 space-y-2">
              {reviews.length === 0 && (
                <p className="text-sm text-ink-sub">{t("noReviews")}</p>
              )}
              {reviews.map((r) => (
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
    <div className="space-y-4">
      {/* 칩이 줄바꿈되면 두 번째 줄이 화면 아래로 밀려 안 보인다. 한 줄로 고정하고
          다 안 들어가면 옆으로 넘기게 한다 — HomeTab 사이드 탭과 같은 패턴. */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <GhostButton
            key={c}
            active={c === category}
            onClick={() => setCategory(c)}
            className="shrink-0 whitespace-nowrap"
          >
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
          {t("noClinicInCategory")}
        </GlassCard>
      )}

      {!isMap && (
      <div className="grid gap-4 sm:grid-cols-2">
        {clinics.map((c, idx) => {
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
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenId(c.id)}
              className="lift glass-soft overflow-hidden rounded-card text-left"
            >
              <div className="h-36 w-full">
                <ClinicPhoto
                  clinicId={c.id}
                  name={t(c.name)}
                  district={t(c.district)}
                  src={c.image}
                />
              </div>
              <div className="p-5">
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
                    ★ {c.rating}
                  </div>
                </div>

                {(idx === 0 && best) || promo ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {idx === 0 && best && (
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
        className="animate-pop max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-white p-6 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
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
