"use client";
import { useState } from "react";
import { doctorImage } from "@/lib/images";
import type { Doctor } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function DoctorProfile({ doctor }: { doctor: Doctor }) {
  const { t } = useT();
  const [failed, setFailed] = useState<string | null>(null);
  const src = doctorImage(doctor);
  return <div className="flex flex-col items-center gap-2 text-center">
    {src && failed !== src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={t(doctor.name)} onError={() => setFailed(src)} className="size-16 rounded-full object-cover" loading="lazy" />
    ) : <span className="flex size-16 items-center justify-center rounded-full bg-hb-50 text-ink-sub"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg></span>}
    <span className="text-sm font-bold">{t(doctor.name)}</span>
    <span className="text-[11px] text-ink-sub">{t(doctor.title)} · {doctor.specialties.map(t).join(" · ")}</span>
  </div>;
}
