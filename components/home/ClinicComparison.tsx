"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Clinic, Treatment } from "@/lib/types";
import { commonTreatmentNames } from "@/lib/clinic-discovery";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { ClinicPhoto } from "./DemoAssets";

export default function ClinicComparison({ clinics, treatments, onClear, onRemove, onOpen }: {
  clinics: Clinic[]; treatments: Treatment[]; onClear: () => void;
  onRemove: (id: string) => void; onOpen: (id: string) => void;
}) {
  const { t, tf } = useT();
  const [visible, setVisible] = useState(false);
  if (!clinics.length) return null;
  return createPortal(<>
    <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-card bg-white p-3 shadow-xl hairline">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{tf("clinicCompareCount", clinics.length)}</span>
        <button type="button" onClick={onClear} className="p-2 text-xs text-ink-sub underline">{t("clinicClearComparison")}</button>
      </div>
      <div className="mb-2 flex gap-1.5">
        {clinics.map(c => <button key={c.id} type="button" onClick={() => onRemove(c.id)} aria-label={`${t(c.name)} ${t("clinicCompareRemove")}`} className="min-w-0 flex-1 truncate rounded-pill bg-hb-50 px-2 py-2 text-xs">{t(c.name)} ×</button>)}
      </div>
      <button type="button" disabled={clinics.length < 2} onClick={() => setVisible(true)} className="min-h-11 w-full rounded-pill bg-ink px-3 text-sm font-semibold text-white disabled:bg-ink/30">
        {t(clinics.length < 2 ? "clinicCompareNeedTwo" : "clinicCompare")}
      </button>
    </div>
    {visible && <ComparisonSheet clinics={clinics} treatments={treatments} onClose={() => setVisible(false)} onOpen={id => { setVisible(false); onOpen(id); }} />}
  </>, document.body);
}

function ComparisonSheet({ clinics, treatments, onClose, onOpen }: {
  clinics: Clinic[]; treatments: Treatment[]; onClose: () => void; onOpen: (id: string) => void;
}) {
  const { t } = useT();
  const { loggedIn } = useAuth();
  const names = commonTreatmentNames(clinics, treatments);
  const [selected, setSelected] = useState(names[0] ?? "");
  const name = names.includes(selected) ? selected : names[0] ?? "";
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), select, [tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); }
      if (e.key !== "Tab") return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  const values = clinics.map(c => treatments.find(x => x.clinicId === c.id && x.name === name));
  const row = (label: string, cells: string[]) => <div className="grid border-t border-ink/10 py-3" style={{ gridTemplateColumns: `60px repeat(${clinics.length}, minmax(0, 1fr))` }}>
    <div className="pr-1 text-[11px] text-ink-sub">{label}</div>{cells.map((cell, i) => <div key={clinics[i].id} className="break-words px-1 text-center text-xs font-medium">{cell}</div>)}
  </div>;
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 sm:items-center sm:p-4" onClick={onClose}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={t("clinicCompare")} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-card bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-card sm:p-6" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2"><h2 className="text-xl font-bold">{t("clinicCompare")}</h2><button type="button" onClick={onClose} className="min-h-11 px-3 text-sm">{t("close")} ×</button></div>
      <p className="mb-4 text-xs text-ink-sub">{t("clinicComparePriceNote")}</p>
      {names.length ? <label className="mb-4 block text-xs font-semibold">{t("clinicCompareTreatment")}<select value={name} onChange={e => setSelected(e.target.value)} className="mt-2 w-full rounded-cell bg-hb-50 p-3 text-base hairline">{names.map(n => <option key={n} value={n}>{t(n)}</option>)}</select></label> : <p className="mb-4 rounded-cell bg-hb-50 p-3 text-sm">{t("clinicNoSharedTreatment")}</p>}
      <div className="grid gap-1 pb-3" style={{ gridTemplateColumns: `60px repeat(${clinics.length}, minmax(0, 1fr))` }}>
        <div />{clinics.map(c => <div key={c.id} className="min-w-0 text-center"><div className="mb-2 h-20 overflow-hidden rounded-cell"><ClinicPhoto clinicId={c.id} name={t(c.name)} district={t(c.district)} src={c.image} /></div><div className="break-words text-xs font-bold">{t(c.name)}</div></div>)}
      </div>
      {row(t("location"), clinics.map(c => t(c.district)))}
      {row(t("price"), values.map(v => v ? `฿${v.price.toLocaleString()}` : "—"))}
      {row(t("clinicDuration"), values.map(v => v ? `${v.durationMin} ${t("minutes")}` : "—"))}
      {loggedIn && row(t("clinicRating"), clinics.map(c => `★ ${c.rating} (${c.reviewCount})`))}
      {row(t("parking"), clinics.map(c => t(c.parking)))}
      <div className="grid gap-1 border-t border-ink/10 pt-3" style={{ gridTemplateColumns: `60px repeat(${clinics.length}, minmax(0, 1fr))` }}><div />{clinics.map(c => <button key={c.id} type="button" onClick={() => onOpen(c.id)} aria-label={`${t(c.name)} ${t("viewDetail")}`} className="min-h-11 rounded-cell bg-ink px-1 text-xs text-white">{t("viewDetail")}</button>)}</div>
    </div>
  </div>;
}
