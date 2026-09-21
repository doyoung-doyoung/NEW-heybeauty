"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import { Badge, GlassCard, InkButton, GhostButton } from "@/components/ui/primitives";

const CATEGORIES = ["전체", "화이트닝", "V라인", "리프팅", "스킨부스터", "필러"];

// 사전 키는 영문이라 "전체"만 갈아끼우면 나머지는 한국어 그대로 붙여 쓴다.
const CATEGORY_KEY: Record<string, string> = { 전체: "All" };

export default function ClinicsView({
  initialCategory = "전체",
  onBook,
}: {
  initialCategory?: string;
  onBook: (clinicId: string, treatmentId: string) => void;
}) {
  const { t } = useT();
  const { db } = useDb();
  const [category, setCategory] = useState(initialCategory);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!db) return null;

  const isAll = category === "전체";
  const suffix = CATEGORY_KEY[category] ?? category;
  const categoryLabel = t(`cat${suffix}`);
  const categoryDesc = t(`catDesc${suffix}`);

  const matches = (clinicId: string) =>
    isAll ||
    db.treatments.some((x) => x.clinicId === clinicId && x.category === category);

  const clinics = db.clinics.filter((c) => matches(c.id));
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
                <div key={p.id} className="rounded-cell bg-hb-50 p-4 hairline">
                  <Badge tone="pink">{p.discountPct}%</Badge>
                  <div className="mt-2 text-sm font-semibold">{t(p.title)}</div>
                  <p className="mt-1 text-xs text-ink-sub">{t(p.description)}</p>
                  <p className="mt-2 text-[11px] text-ink-sub">{p.period}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

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
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <GhostButton
            key={c}
            active={c === category}
            onClick={() => setCategory(c)}
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
              {isAll ? "ALL" : categoryLabel.toUpperCase()}
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

      {clinics.length === 0 && (
        <GlassCard soft className="p-8 text-center text-sm text-ink-sub">
          {t("noClinicInCategory")}
        </GlassCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
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

                {promo && (
                  <div className="mt-3">
                    <Badge tone="pink">
                      {t(promo.title)} {promo.discountPct}%
                    </Badge>
                  </div>
                )}

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
    </div>
  );
}
