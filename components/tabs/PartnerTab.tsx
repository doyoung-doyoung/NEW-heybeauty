"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import {
  GhostButton,
  GlassCard,
  InkButton,
  SectionTitle,
} from "@/components/ui/primitives";
import AiInput from "@/components/partner/AiInput";
import {
  BookingPanel,
  ChartPanel,
  CustomerPanel,
  InboxPanel,
  InventoryPanel,
  PromoPanel,
  SmsPanel,
  StatsPanel,
} from "@/components/partner/Panels";

type Section =
  | "ai"
  | "inbox"
  | "customers"
  | "bookings"
  | "charts"
  | "inventory"
  | "stats"
  | "sms"
  | "promo";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "ai", label: "AI 입력" },
  { id: "inbox", label: "통합 인박스" },
  { id: "customers", label: "고객 관리" },
  { id: "bookings", label: "예약 확인" },
  { id: "charts", label: "전자차트" },
  { id: "inventory", label: "재고" },
  { id: "stats", label: "통계" },
  { id: "sms", label: "SMS" },
  { id: "promo", label: "AI 프로모션" },
];

interface Session {
  role: "마스터" | "지점";
  clinicId: string;
  branchId: string;
}

const inputClass =
  "w-full rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white";

export default function PartnerTab() {
  const { db } = useDb();
  const [session, setSession] = useState<Session | null>(null);
  const [section, setSection] = useState<Section>("ai");
  // 예약 확인에서 "고객 카드 열기"로 넘어올 때만 채워진다.
  const [focusCustomerId, setFocusCustomerId] = useState<string | null>(null);

  if (!db) return null;

  if (!session) {
    return <PartnerLogin onLogin={setSession} />;
  }

  const clinic = db.clinics.find((c) => c.id === session.clinicId);
  const branches = db.branches.filter((b) => b.clinicId === session.clinicId);
  const branch = branches.find((b) => b.id === session.branchId);

  return (
    <div className="space-y-4">
      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="text-xs text-ink-sub">{session.role} 로그인</div>
          <div className="font-bold">{clinic?.name}</div>
          <div className="text-xs text-ink-sub">{branch?.name}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {session.role === "마스터" && branches.length > 1 && (
            <select
              value={session.branchId}
              onChange={(e) =>
                setSession({ ...session, branchId: e.target.value })
              }
              className="rounded-pill bg-white/75 px-4 py-2 text-sm outline-none hairline"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <GhostButton onClick={() => setSession(null)}>로그아웃</GhostButton>
        </div>
      </GlassCard>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <GhostButton
            key={s.id}
            active={section === s.id}
            onClick={() => {
              setFocusCustomerId(null);
              setSection(s.id);
            }}
            className="shrink-0"
          >
            {s.label}
          </GhostButton>
        ))}
      </div>

      <div key={section} className="animate-rise">
        {section === "ai" && (
          <AiInput clinicId={session.clinicId} branchId={session.branchId} />
        )}
        {section === "inbox" && <InboxPanel branchId={session.branchId} />}
        {section === "customers" && (
          <CustomerPanel
            branchId={session.branchId}
            focusCustomerId={focusCustomerId}
          />
        )}
        {section === "bookings" && (
          <BookingPanel
            branchId={session.branchId}
            onOpenCustomer={(customerId) => {
              setFocusCustomerId(customerId);
              setSection("customers");
            }}
          />
        )}
        {section === "charts" && <ChartPanel branchId={session.branchId} />}
        {section === "inventory" && (
          <InventoryPanel branchId={session.branchId} />
        )}
        {section === "stats" && (
          <StatsPanel clinicId={session.clinicId} branchId={session.branchId} />
        )}
        {section === "sms" && (
          <SmsPanel clinicId={session.clinicId} branchId={session.branchId} />
        )}
        {section === "promo" && <PromoPanel clinicId={session.clinicId} />}
      </div>
    </div>
  );
}

function PartnerLogin({ onLogin }: { onLogin: (s: Session) => void }) {
  const { db } = useDb();
  const toast = useToast();
  const [role, setRole] = useState<"마스터" | "지점">("마스터");
  const [clinicId, setClinicId] = useState("C01");
  const [branchId, setBranchId] = useState("C01-B1");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  if (!db) return null;

  const branches = db.branches.filter((b) => b.clinicId === clinicId);
  const resolvedBranchId = branches.some((b) => b.id === branchId)
    ? branchId
    : (branches[0]?.id ?? "");

  function submit() {
    if (!loginId.trim() || !password.trim()) {
      toast("ID와 비밀번호를 입력해주세요");
      return;
    }
    onLogin({ role, clinicId, branchId: resolvedBranchId });
    toast(`${role} 계정으로 로그인했습니다`);
  }

  return (
    <GlassCard className="mx-auto max-w-lg p-8">
      <SectionTitle
        title="파트너 CRM 로그인"
        sub="데모용이라 ID와 비밀번호는 아무 값이나 입력하면 됩니다"
      />

      <div className="space-y-3">
        <div className="flex gap-2">
          <GhostButton
            active={role === "마스터"}
            onClick={() => setRole("마스터")}
            className="flex-1"
          >
            마스터
          </GhostButton>
          <GhostButton
            active={role === "지점"}
            onClick={() => setRole("지점")}
            className="flex-1"
          >
            지점
          </GhostButton>
        </div>

        <select
          value={clinicId}
          onChange={(e) => {
            setClinicId(e.target.value);
            const first = db?.branches.find(
              (b) => b.clinicId === e.target.value,
            );
            if (first) setBranchId(first.id);
          }}
          className={inputClass}
        >
          {db.clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {branches.length > 1 && (
          <select
            value={resolvedBranchId}
            onChange={(e) => setBranchId(e.target.value)}
            className={inputClass}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <input
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="ID"
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={inputClass}
        />

        <InkButton onClick={submit} className="w-full justify-center">
          로그인
        </InkButton>
      </div>
    </GlassCard>
  );
}
