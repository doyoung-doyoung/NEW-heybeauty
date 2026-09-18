"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { t, type LangCode } from "@/lib/i18n";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import { Badge, GlassCard, InkButton, GhostButton } from "@/components/ui/primitives";

const CATEGORIES = ["전체", "화이트닝", "V라인", "리프팅", "스킨부스터", "필러"];

const CATEGORY_KEY: Record<string, string> = {
  전체: "All",
  화이트닝: "화이트닝",
  V라인: "V라인",
  리프팅: "리프팅",
  스킨부스터: "스킨부스터",
  필러: "필러",
};

export default function ClinicsView({
  lang,
  initialCategory = "전체",
  onBook,
}: {
  lang: LangCode;
  initialCategory?: string;
  onBook: (clinicId: string, treatmentId: string) => void;
}) {
  const { db } = useDb();
  const [category, setCategory] = useState(initialCategory);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!db) return null;

  const isAll = category === "전체";
  const suffix = CATEGORY_KEY[category] ?? category;
  const categoryLabel = t(`cat${suffix}`, lang);
  const categoryDesc = t(`catDesc${suffix}`, lang);

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
        <GhostButton onClick={() => setOpenId(null)}>← {t("back", lang)}</GhostButton>

        <GlassCard className="overflow-hidden">
          <div className="h-48 w-full sm:h-60">
            <ClinicPhoto
              clinicId={open.id}
              name={open.name}
              district={open.district}
              src={open.image}
            />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">{open.name}</h2>
                <p className="mt-1 text-sm text-ink-sub">
                  {open.district} · {open.address}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">★ {open.rating}</div>
                <div className="text-xs text-ink-sub">
                  {open.reviewCount} {t("reviewCount", lang)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/75">{open.intro}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-cell bg-white/60 p-4 hairline">
                <div className="text-xs font-semibold text-ink-sub">
                  {t("hours", lang)}
                </div>
                <ul className="mt-2 space-y-0.5 text-sm">
                  {open.hours.map((h) => (
                    <li key={h.day} className="flex justify-between">
                      <span>{h.day}</span>
                      <span className={h.closed ? "text-ink-sub" : ""}>
                        {h.closed ? t("closedDay", lang) : `${h.open} - ${h.close}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <div className="rounded-cell bg-white/60 p-4 hairline">
                  <div className="text-xs font-semibold text-ink-sub">
                    {t("parking", lang)}
                  </div>
                  <div className="mt-1 text-sm">{open.parking}</div>
                </div>
                <div className="rounded-cell bg-white/60 p-4 hairline">
                  <div className="text-xs font-semibold text-ink-sub">
                    {t("contact", lang)}
                  </div>
                  <div className="mt-1 text-sm">
                    {open.phone} · LINE {open.lineId}
                  </div>
                </div>
                {branches.length > 1 && (
                  <div className="rounded-cell bg-white/60 p-4 hairline">
                    <div className="text-xs font-semibold text-ink-sub">
                      {t("branches", lang)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {branches.map((b) => (
                        <Badge key={b.id}>{b.name}</Badge>
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
            <h3 className="font-bold">{t("activePromos", lang)}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {promos.map((p) => (
                <div key={p.id} className="rounded-cell bg-hb-50 p-4 hairline">
                  <Badge tone="pink">{p.discountPct}%</Badge>
                  <div className="mt-2 text-sm font-semibold">{p.title}</div>
                  <p className="mt-1 text-xs text-ink-sub">{p.description}</p>
                  <p className="mt-2 text-[11px] text-ink-sub">{p.period}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard soft className="p-6">
          <h3 className="font-bold">{t("treatmentList", lang)}</h3>
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
                      <span className="font-semibold">{x.name}</span>
                      <Badge tone={hit ? "pink" : "neutral"}>{x.category}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-sub">
                      {x.durationMin}
                      {t("minutes", lang)} · {x.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap font-bold">
                      ฿{x.price.toLocaleString()}
                    </span>
                    <InkButton onClick={() => onBook(open.id, x.id)}>
                      {t("book", lang)}
                    </InkButton>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard soft className="p-6">
            <h3 className="font-bold">{t("doctors", lang)}</h3>
            <div className="mt-3 space-y-2">
              {doctors.slice(0, 6).map((d) => (
                <div key={d.id} className="rounded-cell bg-white/70 p-3 hairline">
                  <div className="text-sm font-semibold">{d.name}</div>
                  <div className="text-xs text-ink-sub">
                    {d.title} · {d.specialties.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard soft className="p-6">
            <h3 className="font-bold">{t("reviews", lang)}</h3>
            <div className="mt-3 space-y-2">
              {reviews.length === 0 && (
                <p className="text-sm text-ink-sub">{t("noReviews", lang)}</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="rounded-cell bg-white/70 p-3 hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{"★".repeat(r.rating)}</span>
                    {r.code && (
                      <Badge tone="pink">
                        {t("reviewCode", lang)} {r.code}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink/80">{r.text}</p>
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
            {t(`cat${CATEGORY_KEY[c] ?? c}`, lang)}
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
            <div className="text-xs text-ink-sub">{t("clinicCount", lang)}</div>
          </div>
        </div>
      </GlassCard>

      {clinics.length === 0 && (
        <GlassCard soft className="p-8 text-center text-sm text-ink-sub">
          {t("noClinicInCategory", lang)}
        </GlassCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {clinics.map((c) => {
          const pool = db.treatments.filter((x) => x.clinicId === c.id);
          const scoped = isAll
            ? pool
            : pool.filter((x) => x.category === category);
          const best = scoped.reduce((a, b) => (a.price <= b.price ? a : b));
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
                  name={c.name}
                  district={c.district}
                  src={c.image}
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{c.name}</div>
                    <div className="mt-1 text-xs text-ink-sub">
                      {c.district}
                      {c.hasBranches ? ` · ${t("branches", lang)} 3` : ""}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-semibold">
                    ★ {c.rating}
                  </div>
                </div>

                {promo && (
                  <div className="mt-3">
                    <Badge tone="pink">
                      {promo.title} {promo.discountPct}%
                    </Badge>
                  </div>
                )}

                <div className="mt-3 flex items-end justify-between gap-2 border-t border-ink/10 pt-3">
                  <div className="min-w-0">
                    <div className="text-[11px] text-ink-sub">
                      {isAll
                        ? `${t("treatments", lang)} ${scoped.length}`
                        : `${categoryLabel} ${t("fromPrice", lang)}`}
                    </div>
                    <div className="truncate text-sm font-medium">{best.name}</div>
                  </div>
                  <span className="whitespace-nowrap font-bold">
                    ฿{best.price.toLocaleString()}~
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
