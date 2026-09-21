"use client";

import { useMemo, useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
} from "@/components/ui/primitives";
import { DEMO_SLIPS, PseudoQR, SlipImage } from "./DemoAssets";

const TIMES = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];
const DEPOSIT = 1000;
const COMMISSION_PCT = 15;

function nextDays(count: number) {
  const out: { value: string; label: string; day: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push({
      value: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      day: ["일", "월", "화", "수", "목", "금", "토"][d.getDay()],
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
  const { t, tf } = useT();
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
  const [reviewCode, setReviewCode] = useState("");

  if (!db) return null;

  const clinic = db.clinics.find((c) => c.id === clinicId);
  const treatment = db.treatments.find((t) => t.id === treatmentId);
  if (!clinic || !treatment) return null;

  const branches = db.branches.filter((b) => b.clinicId === clinicId);
  const activeBranchId = branchId || branches[0].id;
  const doctors = db.doctors.filter((d) => d.branchId === activeBranchId);
  const activeDoctorId = doctorId || doctors[0]?.id || "";
  const slip = DEMO_SLIPS.find((s) => s.id === slipId) ?? null;

  const typedCode = reviewCode.trim().toUpperCase();
  const matchedCode =
    db.reviewCodes.find((rc) => rc.code.toUpperCase() === typedCode) ?? null;
  const codeOwner = matchedCode
    ? db.users.find((u) => u.id === matchedCode.ownerUserId)
    : null;
  // 코드를 준 후기가 어드민 승인을 통과해야 커미션이 붙는다.
  const codeApproved =
    !!matchedCode &&
    db.reviews.some(
      (r) => r.code.toUpperCase() === typedCode && r.approved && !r.blocked,
    );
  const codeUsable = codeApproved && matchedCode!.ownerUserId !== "U1";
  const commission = Math.round((DEPOSIT * COMMISSION_PCT) / 100);

  const codeNotice = !typedCode
    ? null
    : !matchedCode
      ? { ok: false, text: t("codeNotFound") }
      : matchedCode.ownerUserId === "U1"
        ? { ok: false, text: t("codeIsMine") }
        : !codeApproved
          ? { ok: false, text: t("codeNotApproved") }
          : {
              ok: true,
              text: `${t("confirmed")} · ${tf("codeOwnerEarns", t(codeOwner?.name ?? ""), commission.toLocaleString())}`,
            };

  function confirmPayment() {
    const id = `BK-${Date.now()}`;
    const threadId = `CH-${Date.now()}`;
    const now = new Date().toISOString();

    update((draft) => {
      draft.bookings.unshift({
        id,
        userId: "U1",
        clinicId,
        branchId: activeBranchId,
        treatmentId,
        doctorId: activeDoctorId,
        date,
        time,
        depositTHB: DEPOSIT,
        slipImage: slipId,
        status: "예약확정",
        usedReviewCode: codeUsable ? matchedCode!.code : null,
        createdAt: now,
      });

      if (codeUsable) {
        const rc = draft.reviewCodes.find((x) => x.id === matchedCode!.id);
        rc?.usedByBookingIds.push(id);
        draft.commissions.unshift({
          id: `CM-${Date.now()}`,
          reviewCodeId: matchedCode!.id,
          bookingId: id,
          amountTHB: commission,
          at: now,
        });
      }

      const me = draft.users.find((u) => u.id === "U1");
      const memo = `Hey! Beauty 앱 예약 · ${date} ${time} ${treatment!.name}`;
      const existing = draft.customers.find(
        (c) => c.branchId === activeBranchId && c.phone === me?.phone,
      );
      if (existing) {
        if (!existing.interests.includes(treatment!.category)) {
          existing.interests.push(treatment!.category);
        }
        existing.doctorId = activeDoctorId;
        existing.memo = memo;
      } else {
        draft.customers.unshift({
          id: `CU-${Date.now()}`,
          clinicId,
          branchId: activeBranchId,
          name: me?.name ?? "앱 고객",
          phone: me?.phone ?? "",
          birthday: "",
          gender: "미입력",
          nationality: "한국",
          channel: "App",
          interests: [treatment!.category],
          doctorId: activeDoctorId,
          memo,
          createdAt: now,
        });
      }

      draft.chats.unshift({
        id: threadId,
        kind: "clinic",
        userId: "U1",
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
        customerName: "도도 (Hey! Beauty 앱)",
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
    setStep("done");
    toast(
      codeUsable
        ? tf("codeApplied", matchedCode!.code)
        : t("transferConfirmed"),
    );
  }

  return (
    <div className="space-y-4">
      <GhostButton onClick={onBack}>← {t("goBack")}</GhostButton>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-ink-sub">{t(clinic.name)}</div>
            <h2 className="text-xl font-bold">{t(treatment.name)}</h2>
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
              <div className="mb-2 text-sm font-semibold">{t("branch")}</div>
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
                    {t(b.name)}
                  </GhostButton>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-sm font-semibold">{t("date")}</div>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <GhostButton
                  key={d.value}
                  active={d.value === date}
                  onClick={() => setDate(d.value)}
                >
                  {d.label} ({t(d.day)})
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">{t("time")}</div>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <GhostButton key={t} active={t === time} onClick={() => setTime(t)}>
                  {t}
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">{t("attendingDoctor")}</div>
            <div className="flex flex-wrap gap-2">
              {doctors.map((d) => (
                <GhostButton
                  key={d.id}
                  active={d.id === activeDoctorId}
                  onClick={() => setDoctorId(d.id)}
                >
                  {t(d.name)}
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">
              {t("reviewCode")}{" "}
              <span className="font-normal text-ink-sub">({t("optional")})</span>
            </div>
            <input
              value={reviewCode}
              onChange={(e) => setReviewCode(e.target.value)}
              placeholder={t("codeFromFriend")}
              className="w-full rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
            {codeNotice && (
              <p
                className={`mt-2 text-xs ${codeNotice.ok ? "text-hb-600" : "text-danger"}`}
              >
                {codeNotice.text}
              </p>
            )}
          </div>

          <div className="rounded-cell bg-white/70 p-4 text-xs leading-relaxed text-ink-sub hairline">
            {tf("depositNotice", DEPOSIT.toLocaleString())}
          </div>

          <InkButton onClick={() => setStep("qr")}>
            {tf("payDeposit", DEPOSIT.toLocaleString())}
          </InkButton>
        </GlassCard>
      )}

      {step === "qr" && (
        <GlassCard soft className="animate-rise p-6">
          <div className="text-center">
            <Badge tone="pink">PromptPay</Badge>
            <h3 className="mt-3 text-lg font-bold">
              {tf("scanQr", DEPOSIT.toLocaleString())}
            </h3>
            <p className="mt-1 text-xs text-ink-sub">
              {t(clinic.name)} · {date} {time}
            </p>

            <div className="mx-auto mt-5 w-52 animate-pop overflow-hidden rounded-card bg-white p-4 shadow-float">
              <PseudoQR seed={`${clinicId}-${date}-${time}`} className="w-full" />
              <div className="mt-3 text-[11px] font-semibold tracking-wide text-ink-sub">
                {t("demoQr")}
              </div>
            </div>

            <div className="mt-6">
              <InkButton onClick={() => setStep("slip")}>
                {t("sentAttachSlip")}
              </InkButton>
            </div>
          </div>
        </GlassCard>
      )}

      {step === "slip" && (
        <GlassCard soft className="animate-rise p-6">
          <h3 className="font-bold">{tf("chatWithClinicTitle", t(clinic.name))}</h3>
          <p className="mt-1 text-xs text-ink-sub">
            {t("slipHint")}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-card bg-white/75 px-4 py-3 text-sm hairline">
                {t("slipGreeting")}
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
              {t("attachImage")}
            </GhostButton>
            {slip && <InkButton onClick={confirmPayment}>{t("send")}</InkButton>}
          </div>

          {showSlipPicker && (
            <div className="mt-4 animate-rise rounded-card bg-white/70 p-4 hairline">
              <div className="mb-3 text-xs font-semibold text-ink-sub">
                {t("savedImages")}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    <SlipImage slip={s} />
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

          <h3 className="mt-4 text-xl font-bold">{t("transferDone")}</h3>
          <p className="mt-2 text-sm text-ink-sub">
            {t(clinic.name)} · {date} {time} · {t(treatment.name)}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <InkButton onClick={() => bookingId && onOpenClinicChat(bookingId)}>
              {t("chatWithClinic")}
            </InkButton>
            <GhostButton onClick={onBack}>{t("goHome")}</GhostButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
