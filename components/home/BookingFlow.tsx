"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { LinkedNote } from "@/components/ui/LinkedNote";
import { useT } from "@/lib/i18n";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
} from "@/components/ui/primitives";
import { DEMO_SLIPS, PseudoQR, SlipImage } from "./DemoAssets";
import BookingCalendar from "./BookingCalendar";
import DoctorProfile from "./DoctorProfile";
import { bookingSlots, localDate, minutes, slotBooked } from "@/lib/booking-availability";
import { discounted } from "@/lib/promo";

const DEPOSIT = 1000;
const COMMISSION_PCT = 15;

type Step = "select" | "confirm" | "qr" | "slip" | "done";

export default function BookingFlow({
  clinicId,
  treatmentId,
  promoId,
  onBack,
  onOpenClinicChat,
}: {
  clinicId: string;
  treatmentId: string;
  /** 프로모션 카드에서 들어왔으면 그 프로모션. 윗단에 할인가가 뜨고 예약에도 적힌다. */
  promoId?: string;
  onBack: () => void;
  onOpenClinicChat: (threadId: string) => void;
}) {
  const { t, tf } = useT();
  const { db, update } = useDb();
  const toast = useToast();

  const [step, setStep] = useState<Step>("select");
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState(() => localDate(new Date()));
  const [time, setTime] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [slipId, setSlipId] = useState<string | null>(null);
  const [showSlipPicker, setShowSlipPicker] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [reviewCode, setReviewCode] = useState("");
  const [linked, setLinked] = useState<{
    newCustomer: boolean;
    commissionTo: string | null;
  } | null>(null);

  if (!db) return null;

  const clinic = db.clinics.find((c) => c.id === clinicId);
  const treatment = db.treatments.find((t) => t.id === treatmentId);
  if (!clinic || !treatment) return null;
  const promo = promoId ? db.promotions.find((p) => p.id === promoId) : undefined;

  const branches = db.branches.filter((b) => b.clinicId === clinicId);
  const activeBranchId = branchId || branches[0]?.id || "";
  const doctors = db.doctors.filter((d) => d.branchId === activeBranchId);
  const activeDoctorId = doctorId || doctors[0]?.id || "";
  const activeDoctor = doctors.find(d => d.id === activeDoctorId);
  const branch = branches.find(b => b.id === activeBranchId);
  const times = bookingSlots(branch?.hours ?? clinic.hours, date, treatment.durationMin);
  const unavailable = (slot: string) => {
    const now = new Date();
    return (date === localDate(now) && minutes(slot) <= now.getHours() * 60 + now.getMinutes()) || slotBooked(db.bookings, date, slot, activeDoctorId, treatment.durationMin, id => db.treatments.find(tr => tr.id === id)?.durationMin ?? 30);
  };
  const selectionValid = Boolean(activeDoctor && date >= localDate(new Date()) && times.includes(time) && !unavailable(time));
  const validateSelection = () => {
    if (selectionValid) return true;
    toast(t("선택한 시간을 예약할 수 없습니다. 날짜와 시간을 다시 선택해주세요."));
    setTime("");
    setStep("select");
    return false;
  };
  const slip = DEMO_SLIPS.find((s) => s.id === slipId) ?? null;

  const typedCode = reviewCode.trim().toUpperCase();
  const matchedCode =
    db.reviewCodes.find((rc) => rc.code.toUpperCase() === typedCode) ?? null;
  // 과거 실적으로 깔아 둔 코드는 주인이 데모 계정이 아니라서 `users`에서 안 나온다.
  // 그럴 땐 코드가 들고 다니는 이름을 쓴다(`ReviewCode.ownerName`).
  const codeOwnerName = matchedCode
    ? (db.users.find((u) => u.id === matchedCode.ownerUserId)?.name ??
      matchedCode.ownerName ??
      "")
    : "";
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
              text: `${t("confirmed")} · ${tf("codeOwnerEarns", t(codeOwnerName), commission.toLocaleString())}`,
            };

  const me = db.users.find((u) => u.id === "U1");

  function confirmPayment() {
    if (!validateSelection()) return;
    const id = `BK-${Date.now()}`;
    const threadId = `CH-${Date.now()}`;
    const now = new Date().toISOString();
    const isNewCustomer = !db!.customers.some(
      (c) => c.branchId === activeBranchId && c.phone === me?.phone,
    );

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
        ...(promo ? { promoId: promo.id } : {}),
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
    setLinked({
      newCustomer: isNewCustomer,
      commissionTo: codeUsable ? codeOwnerName : null,
    });
    setStep("done");
    toast(
      codeUsable
        ? tf("codeApplied", matchedCode!.code)
        : t("transferConfirmed"),
    );
  }

  const linkedRows = !linked
    ? []
    : [
        tf("crmLinkedBooking", date, time),
        linked.newCustomer
          ? tf("crmLinkedCustomerNew", t(me?.name ?? ""))
          : tf("crmLinkedCustomerUpdate", t(me?.name ?? "")),
        t("crmLinkedInbox"),
        ...(linked.commissionTo
          ? [
              tf(
                "crmLinkedCommission",
                t(linked.commissionTo),
                commission.toLocaleString(),
              ),
            ]
          : []),
      ];

  return (
    <div className="space-y-4">
      <GhostButton onClick={onBack}>← {t("goBack")}</GhostButton>

      <GlassCard className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs text-ink-sub">{t(clinic.name)}</div>
            <h2 className="text-xl font-bold">{t(treatment.name)}</h2>
          </div>
          {promo ? (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Badge tone="pink">
                  {t("promoApplied")} -{promo.discountPct}%
                </Badge>
                <span className="text-xs text-ink-sub line-through">
                  ฿{treatment.price.toLocaleString()}
                </span>
              </div>
              <div className="text-lg font-bold text-hb-600">
                ฿{discounted(treatment.price, promo.discountPct).toLocaleString()}
              </div>
              <div className="text-[11px] text-ink-sub">{t(promo.title)}</div>
            </div>
          ) : (
            <div className="text-lg font-bold">฿{treatment.price.toLocaleString()}</div>
          )}
        </div>

        <div className="mt-4 flex gap-1.5">
          {(["select", "confirm", "qr", "slip", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-pill transition ${
                ["select", "confirm", "qr", "slip", "done"].indexOf(step) >= i
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
                      setTime("");
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
            <BookingCalendar value={date} onChange={value => { setDate(value); setTime(""); }} />
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">{t("attendingDoctor")}</div>
            <div className="grid grid-cols-2 gap-2">
              {doctors.map(d => <button type="button" key={d.id} aria-pressed={d.id === activeDoctorId} onClick={() => { setDoctorId(d.id); setTime(""); }} className={`rounded-cell p-3 transition ${d.id === activeDoctorId ? "bg-hb-200 ring-2 ring-hb-600" : "bg-white/70 hairline"}`}><DoctorProfile doctor={d} /></button>)}
            </div>
            {!doctors.length && <p className="text-sm text-ink-sub">{t("예약 가능한 의료진이 없습니다.")}</p>}
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">{t("time")}</div>
            <div className="grid grid-cols-3 gap-2">
              {times.map(slot => <GhostButton key={slot} disabled={unavailable(slot) || !activeDoctor} active={slot === time} onClick={() => setTime(slot)} className="px-2">{slot}</GhostButton>)}
            </div>
            <p className="mt-2 text-xs text-ink-sub">{t(times.length ? "30분 단위 · 회색 시간은 예약할 수 없습니다." : "선택한 날짜는 휴진일이거나 예약 가능한 시간이 없습니다.")}</p>
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

          <InkButton disabled={!selectionValid} onClick={() => { if (validateSelection()) setStep("confirm"); }}>
            {t("방문 일정 확인")}
          </InkButton>
        </GlassCard>
      )}

      {step === "confirm" && (
        <GlassCard soft className="animate-rise space-y-5 p-5">
          <h3 className="text-xl font-bold">{t(clinic.name)} {t("방문이 맞으신가요?")}</h3>
          <p className="text-sm text-ink-sub">{t("방문 일정을 다시 한 번 확인해주세요.")}</p>
          <div className="rounded-cell bg-hb-50 p-4 hairline">
            <div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-xs text-ink-sub">{t("date")}</span><p className="font-bold">{date}</p></div><div><span className="text-xs text-ink-sub">{t("time")}</span><p className="font-bold">{time}</p></div></div>
            <p className="mt-4 text-sm font-bold">{t("희망 시술")} · {t(treatment.name)}</p>
            <p className="mt-2 text-xs text-ink-sub">{t(branch?.name ?? "")}</p>
            {activeDoctor && <div className="mt-4"><DoctorProfile doctor={activeDoctor} /></div>}
          </div>
          <p className="text-sm leading-relaxed text-ink-sub">{t("당일취소 및 노쇼는 병원뿐만 아니라 다른 고객님께도 피해가 될 수 있으므로 신중한 예약 부탁드립니다.")}</p>
          <div className="flex gap-2"><GhostButton onClick={() => setStep("select")} className="flex-1">{t("다시 선택")}</GhostButton><InkButton arrow={false} disabled={!selectionValid} onClick={() => { if (validateSelection()) setStep("qr"); }} className="flex-1 justify-center pr-5">{t("확인")}</InkButton></div>
        </GlassCard>
      )}

      {step === "qr" && (
        <GlassCard soft className="animate-rise p-6">
          <div className="text-center">
            <GhostButton onClick={() => setStep("confirm")}>← {t("방문 일정 확인")}</GhostButton>
            <div className="mt-3"><Badge tone="pink">PromptPay</Badge></div>
            <h3 className="mt-3 text-lg font-bold">
              {tf("scanQr", DEPOSIT.toLocaleString())}
            </h3>
            <p className="mt-1 text-xs text-ink-sub">
              {t(clinic.name)} · {date} {time}
            </p>

            <div className="mx-auto mt-5 w-52 max-w-full animate-pop overflow-hidden rounded-card bg-white p-4 shadow-float">
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
                {t("빠른 답변을 드리겠습니다.")}
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

          {/* 이 쪽지는 완료 화면의 본문이라 스스로 사라지면 안 된다. 닫기도 없다. */}
          <LinkedNote
            note={{ rows: linkedRows }}
            title={tf("crmLinkedTitle", t(clinic.name))}
            hint={tf("crmLinkedHint", String(linkedRows.length))}
            className="mt-6"
          />

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
