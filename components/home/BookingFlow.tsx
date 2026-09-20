"use client";

import { useMemo, useState } from "react";
import { useDb } from "@/lib/db";
import { linkBookingToCustomer } from "@/lib/crm";
import { useToast } from "@/components/ui/Toast";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
} from "@/components/ui/primitives";
import { DEMO_SLIPS, PseudoQR, SlipImage } from "./DemoAssets";

const TIMES = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];
const DEPOSIT = 1000;
const USER_ID = "U1";

function nextDays(count: number) {
  const out: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push({
      value: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`,
    });
  }
  return out;
}

type Step = "select" | "qr" | "slip" | "done";

export default function BookingFlow({
  clinicId,
  treatmentId,
  onBack,
  onOpenClinicChat,
}: {
  clinicId: string;
  treatmentId: string;
  onBack: () => void;
  onOpenClinicChat: (threadId: string) => void;
}) {
  const { db, update } = useDb();
  const toast = useToast();
  const days = useMemo(() => nextDays(10), []);

  const [step, setStep] = useState<Step>("select");
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState(days[0].value);
  const [time, setTime] = useState(TIMES[0]);
  const [doctorId, setDoctorId] = useState("");
  const [slipId, setSlipId] = useState<string | null>(null);
  const [showSlipPicker, setShowSlipPicker] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [crmNotice, setCrmNotice] = useState<string | null>(null);

  if (!db) return null;

  const clinic = db.clinics.find((c) => c.id === clinicId);
  const treatment = db.treatments.find((t) => t.id === treatmentId);
  if (!clinic || !treatment) return null;

  const branches = db.branches.filter((b) => b.clinicId === clinicId);
  const activeBranchId = branchId || branches[0].id;
  const doctors = db.doctors.filter((d) => d.branchId === activeBranchId);
  const activeDoctorId = doctorId || doctors[0]?.id || "";
  const slip = DEMO_SLIPS.find((s) => s.id === slipId) ?? null;

  function confirmPayment() {
    const id = `BK-${Date.now()}`;
    const threadId = `CH-${Date.now()}`;
    const now = new Date().toISOString();
    const user = db!.users.find((u) => u.id === USER_ID);
    const customerName = `${user?.name ?? "앱 고객"} (헤이뷰티 앱)`;
    let crmLine = "";

    update((draft) => {
      draft.bookings.unshift({
        id,
        userId: USER_ID,
        clinicId,
        branchId: activeBranchId,
        treatmentId,
        doctorId: activeDoctorId,
        date,
        time,
        depositTHB: DEPOSIT,
        slipImage: slipId,
        status: "예약확정",
        usedReviewCode: null,
        createdAt: now,
        customerId: null,
      });

      // 예약만 만들고 끝내면 클리닉 CRM에는 고객이 없다. 같은 지점에 카드가 있으면
      // 이어붙이고 없으면 새로 만들어, 파트너 탭 "고객 관리"에서 바로 보이게 한다.
      const before = draft.customers.length;
      const customer = linkBookingToCustomer(draft, draft.bookings[0]);
      const branchName =
        draft.branches.find((b) => b.id === activeBranchId)?.name ?? "";
      crmLine =
        draft.customers.length > before
          ? `${branchName} 고객 카드가 새로 등록되었습니다`
          : `${branchName} 기존 고객 카드(${customer.name})에 예약이 추가되었습니다`;

      draft.chats.unshift({
        id: threadId,
        kind: "clinic",
        userId: USER_ID,
        clinicId,
        title: `${clinic!.name}과 대화 · 예약 관련`,
        updatedAt: now,
        messages: [
          {
            id: `${threadId}-M1`,
            role: "user",
            text: `${date} ${time} ${treatment!.name} 예약금 송금했습니다. 확인 부탁드려요`,
            at: now,
            attachment: slipId ?? undefined,
          },
          {
            id: `${threadId}-M2`,
            role: "clinic",
            text: `송금 확인되었습니다! ${date} ${time} 예약이 확정되었어요. 방문 10분 전에 도착해주시면 됩니다.`,
            at: now,
          },
        ],
      });

      draft.inbox.unshift({
        id: `IN-${Date.now()}`,
        clinicId,
        branchId: activeBranchId,
        channel: "App",
        customerName,
        unread: true,
        updatedAt: now,
        messages: [
          {
            id: `IN-${Date.now()}-M1`,
            role: "user",
            text: `${date} ${time} ${treatment!.name} 예약금 송금 완료했습니다`,
            at: now,
          },
        ],
      });
    });

    setBookingId(threadId);
    setCrmNotice(crmLine);
    setStep("done");
    toast("송금이 확인되었습니다");
  }

  return (
    <div className="space-y-4">
      <GhostButton onClick={onBack}>← 뒤로</GhostButton>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-ink-sub">{clinic.name}</div>
            <h2 className="text-xl font-bold">{treatment.name}</h2>
          </div>
          <div className="text-lg font-bold">฿{treatment.price.toLocaleString()}</div>
        </div>

        <div className="mt-4 flex gap-1.5">
          {(["select", "qr", "slip", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-pill transition ${
                ["select", "qr", "slip", "done"].indexOf(step) >= i
                  ? "bg-ink"
                  : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </GlassCard>

      {step === "select" && (
        <GlassCard soft className="animate-rise space-y-5 p-6">
          {branches.length > 1 && (
            <div>
              <div className="mb-2 text-sm font-semibold">지점</div>
              <div className="flex flex-wrap gap-2">
                {branches.map((b) => (
                  <GhostButton
                    key={b.id}
                    active={b.id === activeBranchId}
                    onClick={() => {
                      setBranchId(b.id);
                      setDoctorId("");
                    }}
                  >
                    {b.name}
                  </GhostButton>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-sm font-semibold">날짜</div>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <GhostButton
                  key={d.value}
                  active={d.value === date}
                  onClick={() => setDate(d.value)}
                >
                  {d.label}
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">시간</div>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <GhostButton key={t} active={t === time} onClick={() => setTime(t)}>
                  {t}
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">담당 의사</div>
            <div className="flex flex-wrap gap-2">
              {doctors.map((d) => (
                <GhostButton
                  key={d.id}
                  active={d.id === activeDoctorId}
                  onClick={() => setDoctorId(d.id)}
                >
                  {d.name}
                </GhostButton>
              ))}
            </div>
          </div>

          <div className="rounded-cell bg-white/70 p-4 text-xs leading-relaxed text-ink-sub hairline">
            예약금 ฿{DEPOSIT.toLocaleString()}은 시술 금액에서 차감됩니다. 방문 24시간
            전까지 취소 시 전액 환불되며, 이후 취소 또는 미방문 시 예약금은 환불되지
            않습니다.
          </div>

          <InkButton onClick={() => setStep("qr")}>
            예약금 ฿{DEPOSIT.toLocaleString()} 결제하기
          </InkButton>
        </GlassCard>
      )}

      {step === "qr" && (
        <GlassCard soft className="animate-rise p-6">
          <div className="text-center">
            <Badge tone="pink">PromptPay</Badge>
            <h3 className="mt-3 text-lg font-bold">
              QR을 스캔해 ฿{DEPOSIT.toLocaleString()}을 송금해주세요
            </h3>
            <p className="mt-1 text-xs text-ink-sub">
              {clinic.name} · {date} {time}
            </p>

            <div className="mx-auto mt-5 w-52 animate-pop overflow-hidden rounded-card bg-white p-4 shadow-float">
              <PseudoQR seed={`${clinicId}-${date}-${time}`} className="w-full" />
              <div className="mt-3 text-[11px] font-semibold tracking-wide text-ink-sub">
                DEMO QR · 실제 결제 아님
              </div>
            </div>

            <div className="mt-6">
              <InkButton onClick={() => setStep("slip")}>
                송금했어요 · 슬립 첨부하기
              </InkButton>
            </div>
          </div>
        </GlassCard>
      )}

      {step === "slip" && (
        <GlassCard soft className="animate-rise p-6">
          <h3 className="font-bold">{clinic.name}과의 채팅</h3>
          <p className="mt-1 text-xs text-ink-sub">
            송금 슬립을 첨부하면 클리닉이 확인합니다.
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-card bg-white/75 px-4 py-3 text-sm hairline">
                안녕하세요! 예약금 송금 후 슬립을 보내주시면 바로 확인해 드릴게요.
              </div>
            </div>

            {slip && (
              <div className="flex justify-end">
                <div className="w-52 animate-pop">
                  <SlipImage slip={slip} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <GhostButton onClick={() => setShowSlipPicker((v) => !v)}>
              이미지 첨부
            </GhostButton>
            {slip && <InkButton onClick={confirmPayment}>보내기</InkButton>}
          </div>

          {showSlipPicker && (
            <div className="mt-4 animate-rise rounded-card bg-white/70 p-4 hairline">
              <div className="mb-3 text-xs font-semibold text-ink-sub">
                저장된 이미지
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {DEMO_SLIPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSlipId(s.id);
                      setShowSlipPicker(false);
                    }}
                    className={`lift rounded-cell text-left transition ${
                      slipId === s.id ? "ring-2 ring-ink" : ""
                    }`}
                  >
                    <SlipImage slip={s} compact />
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {step === "done" && (
        <GlassCard soft className="animate-rise p-8 text-center">
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            className="mx-auto"
            fill="none"
            stroke="#353839"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="28" cy="28" r="25" stroke="rgba(28,28,28,0.15)" />
            <path
              d="M17 29l8 8 15-16"
              style={{
                strokeDasharray: 40,
                strokeDashoffset: 40,
                animation: "draw 0.7s ease-out 0.15s forwards",
              }}
            />
          </svg>
          <style>{`@keyframes draw { to { stroke-dashoffset: 0; } }`}</style>

          <h3 className="mt-4 text-xl font-bold">송금 확인 완료</h3>
          <p className="mt-2 text-sm text-ink-sub">
            {clinic.name} · {date} {time} · {treatment.name}
          </p>

          {crmNotice && (
            <p className="mx-auto mt-4 max-w-sm rounded-cell bg-white/70 px-4 py-3 text-xs leading-relaxed text-ink-sub hairline">
              클리닉 CRM 연동 · {crmNotice}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <InkButton onClick={() => bookingId && onOpenClinicChat(bookingId)}>
              클리닉과 채팅하기
            </InkButton>
            <GhostButton onClick={onBack}>홈으로</GhostButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
