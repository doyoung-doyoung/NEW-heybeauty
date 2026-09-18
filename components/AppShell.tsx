"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { LANGS, type LangCode } from "@/lib/i18n";
import HomeTab from "@/components/tabs/HomeTab";
import AdminTab from "@/components/tabs/AdminTab";
import PartnerTab from "@/components/tabs/PartnerTab";
import CompanyTab from "@/components/tabs/CompanyTab";
import NotePad from "@/components/ui/NotePad";

const TABS = [
  { id: "home", label: "홈" },
  { id: "admin", label: "어드민" },
  { id: "partner", label: "파트너 CRM" },
  { id: "company", label: "회사소개" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AppShell() {
  const { db } = useDb();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("home");
  const [lang, setLang] = useState<LangCode>("ko");

  if (!db) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-sub">
        데모 데이터를 불러오는 중...
      </div>
    );
  }

  const activeIndex = TABS.findIndex((t) => t.id === tab);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
      <header className="animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight">Hey!</span>
            <span className="text-2xl font-light text-ink-sub">Beauty</span>
          </div>

          {tab === "home" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    if (l.comingSoon) {
                      toast("Coming soon");
                      return;
                    }
                    setLang(l.code);
                  }}
                  className={`rounded-pill px-3 py-1.5 text-xs font-medium transition ${
                    lang === l.code
                      ? "bg-ink text-white"
                      : "bg-white/60 text-ink-sub hairline hover:bg-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="mt-4">
          <div className="glass flex gap-1 rounded-pill p-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex-1 whitespace-nowrap rounded-pill px-2 py-2.5 text-[13px] font-medium transition sm:px-3 sm:text-sm ${
                  tab === t.id ? "bg-ink text-white" : "text-ink hover:bg-white/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main key={tab} className="animate-rise mt-5">
        {tab === "home" && <HomeTab lang={lang} />}
        {tab === "admin" && <AdminTab />}
        {tab === "partner" && <PartnerTab />}
        {tab === "company" && <CompanyTab />}
      </main>

      <footer className="mt-10 text-center text-xs text-white/80">
        Hey! Beauty demo · RAON (Thailand) Co., Ltd. · 탭 {activeIndex + 1}/4
      </footer>

      <NotePad where={TABS[activeIndex].label} />
    </div>
  );
}
