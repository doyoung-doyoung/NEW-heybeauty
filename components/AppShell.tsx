"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { LangProvider, type LangCode } from "@/lib/i18n";
import HomeTab from "@/components/tabs/HomeTab";
import AdminTab from "@/components/tabs/AdminTab";
import PartnerTab from "@/components/tabs/PartnerTab";
import CompanyTab from "@/components/tabs/CompanyTab";
import NotePad from "@/components/ui/NotePad";
import DemoReset from "@/components/ui/DemoReset";
import IconTabBar from "@/components/ui/IconTabBar";
import LangMenu from "@/components/ui/LangMenu";
import LoginMenu from "@/components/ui/LoginMenu";

// 아이콘 그림은 public/tabs/ 에 넣는다 (IMAGE_TODO.md 참고).
// `-on` 파일이 없으면 IconTabBar가 평소 그림을 흐리게/선명하게 바꿔 쓴다.
const TABS = [
  { id: "home", label: "홈", icon: "/tabs/home.png", iconActive: "/tabs/home-on.png" },
  { id: "admin", label: "어드민", icon: "/tabs/admin.png", iconActive: "/tabs/admin-on.png" },
  { id: "partner", label: "파트너 CRM", icon: "/tabs/partner.png", iconActive: "/tabs/partner-on.png" },
  { id: "company", label: "회사소개", icon: "/tabs/company.png", iconActive: "/tabs/company-on.png" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AppShell() {
  const { db } = useDb();
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
      <header className="animate-rise relative z-30">
        {/* 언어·로그인은 유저가 쓰는 홈 화면에만 걸려 있어서, 지구 버튼·로그인 버튼도
            홈 탭에서만 보인다. 로그인은 그 줄의 맨 오른쪽에 둔다. */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl font-extrabold min-[360px]:text-2xl tracking-tight">Hey!</span>
            <span className="text-xl font-light min-[360px]:text-2xl text-ink-sub">Beauty</span>
          </div>
          {tab === "home" && <LangMenu lang={lang} onChange={setLang} />}
          {tab === "home" && <LoginMenu className="ml-auto" />}
        </div>

        {/* 탭 네 개가 판을 꽉 채우고, 데모 리셋은 그 **오른쪽 바깥**에 선다.
            시연 중엔 안 보이고, 필요하면 가로로 슬쩍 밀어서 꺼낸다. */}
        <nav className="mt-4">
          <IconTabBar
            tabs={TABS}
            active={tab}
            onChange={setTab}
            trailing={<DemoReset />}
          />
        </nav>
      </header>

      <main key={tab} className="animate-rise mt-5">
        {tab === "home" && (
          <LangProvider value={lang}>
            <HomeTab />
          </LangProvider>
        )}
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
