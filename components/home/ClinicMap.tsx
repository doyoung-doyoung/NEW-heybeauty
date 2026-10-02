"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { asset } from "@/lib/assets";
import { BANGKOK_ON_TH, BKK_POS, PROVINCES, cityOf, relax, spread } from "@/lib/geo";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import { Badge, GhostButton, GlassCard, InkButton } from "@/components/ui/primitives";
import type { Clinic } from "@/lib/types";

/**
 * 클리닉 둘러보기 → "지도로 보기".
 * 지도는 진짜 지도가 아니라 예시 그림(Supabase Storage)이고, 핀 위치는 lib/geo.ts의
 * 동네 좌표(%)에 id별 작은 흔들림을 더해 찍는다.
 */
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.5;

export default function ClinicMap({ onOpen }: { onOpen: (clinicId: string) => void }) {
  const { t, tf } = useT();
  const { db } = useDb();
  const [view, setView] = useState<"bkk" | "th">("bkk");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  // 지도를 확대해서 볼 수 있게 — 안쪽 판 너비를 늘리고, 바깥 상자는 스크롤로 민다.
  const [zoom, setZoom] = useState(1);
  if (!db) return null;

  const bkk = db.clinics.filter((c) => cityOf(c.district) === "방콕" && BKK_POS[c.district]);
  const byCity = new Map<string, Clinic[]>();
  db.clinics.forEach((c) => {
    const k = cityOf(c.district);
    if (k === "방콕" && !BKK_POS[c.district]) return;
    byCity.set(k, [...(byCity.get(k) ?? []), c]);
  });

  // 같은 동네 핀은 해바라기 씨앗처럼 나선으로 벌려 놓는다. 흔들림만 주면 겹쳐서 못 누른다.
  const RATIO = 1168 / 880;
  const offsets = relax(
    bkk.map((c) => ({ id: c.id, ...BKK_POS[c.district] })),
    spread(bkk.map((c) => ({ id: c.id, group: c.district })), RATIO),
    RATIO,
  );

  const picked = pickedId ? db.clinics.find((c) => c.id === pickedId) : null;
  const cityList = city ? byCity.get(city) ?? [] : [];

  const cheapest = (clinicId: string) => {
    const pool = db.treatments.filter((x) => x.clinicId === clinicId);
    return pool.length ? pool.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton active={view === "bkk"} onClick={() => setView("bkk")}>
          {t("mapBangkok")} · {bkk.length}
        </GhostButton>
        <GhostButton active={view === "th"} onClick={() => setView("th")}>
          {t("mapThailand")} · {db.clinics.filter((c) => byCity.has(cityOf(c.district))).length}
        </GhostButton>
        <span className="ml-auto text-xs text-ink-sub">
          {view === "bkk" ? t("mapHint") : t("mapHintTh")}
        </span>
      </div>

      {view === "bkk" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <GlassCard className="h-fit overflow-hidden p-0">
            <div className="relative">
              {/* 확대 중엔 안쪽 판이 상자보다 커져서 가로·세로로 민다(= 돋보기로 보는 느낌).
                  바깥을 누르면 열려 있던 점 정보가 닫힌다. */}
              <div
                className="overflow-auto overscroll-contain"
                style={{ maxHeight: "34rem" }}
                onClick={() => setPickedId(null)}
              >
                <div
                  className="relative"
                  style={{ width: `${zoom * 100}%`, aspectRatio: "1168 / 880" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("maps/bangkok.jpg")}
                    alt={t("mapBangkok")}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {bkk.map((c) => {
                    const pos = BKK_POS[c.district];
                    const j = offsets.get(c.id) ?? { dx: 0, dy: 0 };
                    const on = c.id === pickedId;
                    const best = cheapest(c.id);
                    return (
                      // 핀과 그 밑 정보 카드를 같은 좌표에 둘 상자. 정보 카드 안에 "상세보기"
                      // 버튼이 있어서, 핀 자체를 button으로 두면 button 안에 button이 들어가
                      // 버린다(HTML에서 금지 — 실제로 하이드레이션 에러가 났다).
                      <div
                        key={c.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pos.x + j.dx}%`, top: `${pos.y + j.dy}%` }}
                      >
                        <button
                          type="button"
                          title={t(c.name)}
                          aria-label={t(c.name)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickedId(on ? null : c.id);
                          }}
                          className={`block rounded-full border-2 border-white shadow-md transition ${
                            on
                              ? "z-20 h-5 w-5 bg-ink ring-4 ring-ink/20"
                              : `z-10 h-3.5 w-3.5 hover:z-20 hover:scale-125 ${c.hasBranches ? "bg-hb-600" : "bg-pink-400"}`
                          }`}
                        />
                        {/* 점을 누르면 이름만 뜨던 자리를, 평점·최저가·상세보기까지 보이는
                            카드로 바꿔서 점 바로 밑에 띄운다. 확대해서 봐도 그 점 밑에 그대로 붙는다. */}
                        {on && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="animate-pop absolute left-1/2 top-full z-30 mt-2 w-48 -translate-x-1/2 rounded-cell bg-white p-3 text-left shadow-float hairline"
                          >
                            <div className="truncate text-sm font-bold text-ink">
                              {t(c.name)}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-ink-sub">
                              {t(c.district)}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[11px]">
                              <span className="font-semibold">★ {c.rating}</span>
                              {best && (
                                <span className="font-bold text-ink">
                                  ฿{best.price.toLocaleString()}~
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpen(c.id);
                              }}
                              className="mt-2 w-full rounded-pill bg-ink py-1.5 text-[11px] font-semibold text-white transition hover:bg-ink-deep"
                            >
                              {t("viewDetail")}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-pill bg-white/85 px-2.5 py-1 text-[11px] text-ink-sub hairline">
                {t("mapExample")}
              </span>

              {/* 확대/축소 버튼. 스크롤 상자 바깥(이 relative 기준)에 고정해서 밀어도 안 움직인다. */}
              <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-pill bg-white/90 p-1 shadow-float hairline">
                <button
                  type="button"
                  aria-label={t("mapZoomOut")}
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
                  className="flex size-7 items-center justify-center rounded-pill text-base font-bold text-ink transition hover:bg-black/5 disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-10 text-center text-[11px] font-semibold tabular-nums text-ink-sub">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  aria-label={t("mapZoomIn")}
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
                  className="flex size-7 items-center justify-center rounded-pill text-base font-bold text-ink transition hover:bg-black/5 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-3">
            {picked ? (
              <GlassCard className="overflow-hidden">
                <div className="h-32 w-full">
                  <ClinicPhoto clinicId={picked.id} name={t(picked.name)} district={t(picked.district)} src={picked.image} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-bold">{t(picked.name)}</div>
                      <div className="mt-0.5 text-xs text-ink-sub">{t(picked.address)}</div>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold">★ {picked.rating}</span>
                  </div>
                  {(() => {
                    const best = cheapest(picked.id);
                    return best ? (
                      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-sm">
                        <span className="truncate">{t(best.name)}</span>
                        <span className="font-bold">฿{best.price.toLocaleString()}~</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="mt-3">
                    <InkButton onClick={() => onOpen(picked.id)}>{t("viewDetail")}</InkButton>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard soft className="p-5 text-sm text-ink-sub">{t("mapHint")}</GlassCard>
            )}
            <GlassCard soft className="max-h-80 overflow-y-auto p-3">
              {bkk.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPickedId(c.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-cell px-3 py-2 text-left text-sm transition ${c.id === pickedId ? "bg-ink text-white" : "hover:bg-white/70"}`}
                >
                  <span className="truncate">{t(c.name)}</span>
                  <span className={`shrink-0 text-[11px] ${c.id === pickedId ? "text-white/70" : "text-ink-sub"}`}>{t(c.district)}</span>
                </button>
              ))}
            </GlassCard>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr]">
          <GlassCard className="h-fit overflow-hidden p-0">
            <div className="relative w-full" style={{ aspectRatio: "688 / 1024" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset("maps/thailand.jpg")}
                alt={t("mapThailand")}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded-pill bg-white/85 px-2.5 py-1 text-[11px] text-ink-sub hairline">
                {t("mapExample")}
              </span>
              {[{ name: "방콕", ...BANGKOK_ON_TH }, ...PROVINCES].map((p) => {
                const n = byCity.get(p.name)?.length ?? 0;
                if (!n) return null;
                const on = city === p.name;
                const big = p.name === "방콕";
                return (
                  <button
                    key={p.name}
                    type="button"
                    title={t(p.name)}
                    aria-label={t(p.name)}
                    onClick={() => setCity(p.name)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-md transition ${
                      big ? "h-8 w-8" : "h-6 w-6"
                    } ${on ? "z-20 scale-110 bg-ink text-white" : big ? "z-10 bg-hb-600 text-white hover:scale-110" : "z-10 bg-white text-hb-600 hover:scale-110"}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    {n}
                    {on && (
                      <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-pill bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
                        {t(p.name)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard soft className="h-fit p-5">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {[{ name: "방콕" }, ...PROVINCES]
                .filter((p) => byCity.has(p.name))
                .map((p) => (
                  <GhostButton key={p.name} active={city === p.name} onClick={() => setCity(p.name)}>
                    {t(p.name)} {byCity.get(p.name)?.length}
                  </GhostButton>
                ))}
            </div>
            {city ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{tf("mapClinicsIn", t(city), cityList.length)}</h3>
                  {city === "방콕" && (
                    <GhostButton onClick={() => setView("bkk")}>{t("mapBangkok")} →</GhostButton>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {cityList.map((c) => {
                    const best = cheapest(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onOpen(c.id)}
                        className="lift rounded-cell bg-white/75 p-3 text-left hairline"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{t(c.name)}</span>
                          <span className="shrink-0 text-xs">★ {c.rating}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-ink-sub">
                          <span className="truncate">{t(c.district)}</span>
                          {best && <Badge>฿{best.price.toLocaleString()}~</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-sub">{t("mapHintTh")}</p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
