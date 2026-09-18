"use client";

import { useDb } from "@/lib/db";
import { GlassCard, Badge } from "@/components/ui/primitives";

export default function CompanyTab() {
  const { db } = useDb();
  if (!db) return null;

  const branchCount = db.branches.length;
  const stats = [
    { label: "제휴 클리닉", value: `${db.clinics.length}곳` },
    { label: "운영 지점", value: `${branchCount}개` },
    { label: "관리 재고 품목", value: `${db.inventory.length}건` },
    { label: "등록 고객", value: `${db.customers.length}명` },
  ];

  const pillars = [
    {
      title: "소비자 — AI 상담부터 결제까지",
      body: "시술 고민을 채팅으로 물으면 AI가 시술을 비교 설명하고, 조건에 맞는 클리닉을 추천합니다. 날짜·의사 선택, 예약금 결제, 클리닉 실시간 채팅까지 한 흐름으로 이어집니다.",
    },
    {
      title: "클리닉 — 말하고 찍으면 입력 끝",
      body: "음성과 사진만으로 병원 정보, 고객 정보, 전자차트, 사용 제품이 자동 입력됩니다. 시술 후 사용 제품을 말하면 재고가 즉시 차감되고 부족분은 경고로 표시됩니다.",
    },
    {
      title: "RAON — 플랫폼과 유통을 동시에",
      body: "제휴 클리닉의 재고 흐름이 본사 어드민에 실시간 반영됩니다. 부족 제품은 곧바로 RAON 주문으로 연결되어, 플랫폼 수수료와 유통 매출이 함께 발생합니다.",
    },
  ];

  return (
    <div className="space-y-5">
      <GlassCard className="overflow-hidden p-7 sm:p-10">
        <Badge tone="pink">Investor Deck · Demo</Badge>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          태국 뷰티 클리닉을
          <br />
          <span className="text-ink-sub font-light">하나의 흐름으로</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink/80">
          Hey! Beauty는 소비자의 시술 고민을 AI 상담으로 받아 클리닉 예약·결제까지
          연결하고, 같은 데이터를 클리닉의 AI CRM과 재고관리로 이어주는 O2O
          플랫폼입니다. 상담 한 번이 예약이 되고, 시술 한 건이 재고 데이터가 됩니다.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-cell bg-white/60 p-4 hairline">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-ink-sub">{s.label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map((p, i) => (
          <GlassCard key={p.title} soft className="lift p-6">
            <div className="text-xs font-semibold text-hb-600">0{i + 1}</div>
            <h3 className="mt-2 text-lg font-bold leading-snug">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">{p.body}</p>
          </GlassCard>
        ))}
      </div>

      <div className="rounded-card bg-ink p-7 text-white sm:p-9">
        <h3 className="text-2xl font-bold">RAON (Thailand) Co., Ltd.</h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
          방콕에 기반을 둔 뷰티 의료기기·시술 제품 유통사입니다. 클리닉 현장에서
          확인한 재고·상담·예약의 비효율을 Hey! Beauty 플랫폼으로 해결하고 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/60">
          <span className="rounded-pill border border-white/20 px-3 py-1.5">O2O 플랫폼</span>
          <span className="rounded-pill border border-white/20 px-3 py-1.5">AI CRM</span>
          <span className="rounded-pill border border-white/20 px-3 py-1.5">재고·유통</span>
          <span className="rounded-pill border border-white/20 px-3 py-1.5">Bangkok, Thailand</span>
        </div>
      </div>
    </div>
  );
}
