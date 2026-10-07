"use client";
import { useState } from "react";
import { localDate } from "@/lib/booking-availability";
import { useT } from "@/lib/i18n";
export default function BookingCalendar({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const { t } = useT();
  const today = localDate(new Date());
  const [month, setMonth] = useState(() => new Date(`${value}T12:00:00`));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const previousAllowed = month.getFullYear() * 12 + month.getMonth() > new Date().getFullYear() * 12 + new Date().getMonth();
  return <div className="rounded-cell bg-white/80 p-3 hairline">
    <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => { setMonth(new Date()); onChange(today); }} className="min-h-11 px-2 text-xs">{t("오늘")}</button><button type="button" aria-label={t("이전 달")} disabled={!previousAllowed} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="size-11 disabled:opacity-25">‹</button><span className="text-sm font-bold">{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, "0")}</span><button type="button" aria-label={t("다음 달")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="size-11">›</button></div>
    <div className="grid grid-cols-7 gap-1 text-center">{["일", "월", "화", "수", "목", "금", "토"].map(day => <span key={day} className="pb-2 text-xs text-ink-sub">{t(day)}</span>)}{Array.from({ length: first.getDay() }, (_, i) => <span key={`empty-${i}`} />)}{Array.from({ length }, (_, i) => { const date = localDate(new Date(month.getFullYear(), month.getMonth(), i + 1)); return <button key={date} type="button" disabled={date < today} aria-label={date} aria-pressed={date === value} onClick={() => onChange(date)} className={`aspect-square rounded-full text-sm disabled:opacity-20 ${date === value ? "bg-ink font-bold text-white" : date === today ? "font-bold text-hb-600" : "hover:bg-hb-50"}`}>{i + 1}</button>; })}</div>
  </div>;
}
