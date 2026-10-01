"use client";

import { useEffect, useRef, useState } from "react";
import { LANGS, type LangCode } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

/**
 * 로고 옆 지구 버튼. 누르면 나라별 언어가 목록으로 내려온다.
 * 바깥을 누르거나 Esc를 누르면 닫힌다. 준비 중인 언어는 고르면 안내만 띄운다.
 */
export default function LangMenu({
  lang,
  onChange,
}: {
  lang: LangCode;
  onChange: (code: LangCode) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label="언어 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-pill py-1.5 pl-2 pr-2.5 text-xs font-semibold text-ink transition ${
          open ? "bg-white shadow-float" : "bg-white/60 hairline hover:bg-white"
        }`}
      >
        <GlobeIcon />
        {current?.label}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="언어"
          className="tabbar animate-pop absolute left-0 top-full z-40 mt-2 w-44 origin-top-left rounded-[20px] p-1.5"
        >
          {LANGS.map((l) => {
            const on = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    if (l.comingSoon) {
                      toast("Coming soon");
                      return;
                    }
                    onChange(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-sm transition ${
                    on ? "bg-ink text-white" : "text-ink hover:bg-black/5"
                  } ${l.comingSoon ? "opacity-50" : ""}`}
                >
                  <span
                    className={`w-6 text-[11px] font-semibold ${on ? "text-white/70" : "text-ink-sub"}`}
                  >
                    {l.label}
                  </span>
                  <span className="flex-1 font-medium">{l.name}</span>
                  {on && <CheckIcon />}
                  {l.comingSoon && (
                    <span className="text-[10px] text-ink-sub">준비 중</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
