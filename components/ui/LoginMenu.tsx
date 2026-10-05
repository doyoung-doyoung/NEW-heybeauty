"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAuth, type LoginProvider } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

/**
 * 헤더 오른쪽(언어 버튼과 같은 줄) 로그인 버튼.
 * 누르면 LINE / Google 중 고르는 목록이 내려온다. MVP라 실제 OAuth는 없고,
 * 고른 쪽으로 로그인된 척만 한다 — 상태는 lib/auth.tsx로 홈 사이드바 카드와 공유한다.
 */
export default function LoginMenu({ className = "" }: { className?: string }) {
  const { t } = useT();
  const toast = useToast();
  const { loggedIn, provider, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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

  function pick(p: LoginProvider) {
    login(p);
    setOpen(false);
    toast(p === "line" ? t("loginDone") : t("loginDoneGoogle"));
  }

  function doLogout() {
    logout();
    setOpen(false);
    toast(t("logoutDone"));
  }

  return (
    <div ref={box} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-pill py-1.5 pl-2.5 pr-3 text-xs font-semibold transition ${
          loggedIn
            ? open
              ? "bg-white text-ink shadow-float"
              : "bg-white/60 text-ink hairline hover:bg-white"
            : open
              ? "bg-ink text-white"
              : "bg-ink/90 text-white hover:bg-ink"
        }`}
      >
        {loggedIn ? (
          <>
            <span className="flex size-5 items-center justify-center rounded-pill bg-hb-400/30 text-[10px] font-bold text-hb-600">
              {t("도도").slice(0, 1)}
            </span>
            {t("도도")}
          </>
        ) : (
          <>
            <UserIcon />
            {t("loginCta")}
          </>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("loginCta")}
          className="tabbar animate-pop absolute right-0 top-full z-40 mt-2 w-52 origin-top-right rounded-[20px] p-1.5"
        >
          {loggedIn ? (
            <>
              <li className="px-3 py-2 text-xs text-ink-sub">
                {provider === "line" ? t("lineLinked") : t("googleLinked")}
              </li>
              <li>
                <button
                  type="button"
                  onClick={doLogout}
                  className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-sm text-ink transition hover:bg-black/5"
                >
                  {t("logout")}
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pick("line")}
                  className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-black/5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-[#06C755] text-[10px] font-bold text-white">
                    L
                  </span>
                  {t("login")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pick("google")}
                  className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-black/5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-white text-[10px] font-bold hairline">
                    <GoogleIcon />
                  </span>
                  {t("loginWithGoogle")}
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="h-3 w-3">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
