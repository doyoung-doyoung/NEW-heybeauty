"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Badge, GhostButton, GlassCard, InkButton } from "@/components/ui/primitives";
import { LinkedNote, useLinkedNote } from "@/components/ui/LinkedNote";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import BookingCalendar from "./BookingCalendar";
import { bookingSlots, localDate, minutes, slotBooked } from "@/lib/booking-availability";
import {
  BOOKING_STEPS,
  STATUS_HINT,
  canReschedule,
  pushStatusNotice,
  statusTone,
  stepIndex,
} from "@/lib/booking-flow";
import type { Booking, BookingStatus } from "@/lib/types";

export function MyBookings() {
  const { t, tf } = useT();
  const { db } = useDb();
  if (!db) return null;

  const bookings = db.bookings.filter((b) => b.userId === "U1" || b.userId === "U2");

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold">{t("myBookings")}</h2>
      <div className="mt-4 space-y-3">
        {bookings.length === 0 && (
          <p className="text-sm text-ink-sub">{t("noBookings")}</p>
        )}
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </GlassCard>
  );
}

/** 지금 어느 단계까지 왔는지 한눈에. 취소된 예약에는 보여줄 단계가 없다. */
function BookingProgress({ status }: { status: BookingStatus }) {
  const { t } = useT();
  const at = stepIndex(status);
  return (
    <ol className="mt-3 flex items-center gap-1">
      {BOOKING_STEPS.map((step, i) => (
        <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span
            className={`h-1 w-full rounded-pill ${i <= at ? "bg-hb-600" : "bg-ink/10"}`}
          />
          <span
            className={`truncate text-[10px] ${i === at ? "font-bold text-hb-600" : "text-ink-sub"}`}
          >
            {t(step)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function BookingCard({ booking: b }: { booking: Booking }) {
  const { t, tf } = useT();
  const { db, update } = useDb();
  const toast = useToast();
  const [mode, setMode] = useState<"none" | "edit" | "cancel">("none");
  const [date, setDate] = useState(b.date);
  const [time, setTime] = useState(b.time);
  if (!db) return null;

  const clinic = db.clinics.find((c) => c.id === b.clinicId);
  const treatment = db.treatments.find((tr) => tr.id === b.treatmentId);
  const doctor = db.doctors.find((d) => d.id === b.doctorId);
  const branch = db.branches.find((br) => br.id === b.branchId);
  const code = db.reviewCodes.find((rc) => rc.bookingId === b.id);

  const duration = treatment?.durationMin ?? 30;
  const times = bookingSlots(branch?.hours ?? clinic?.hours ?? [], date, duration);
  const taken = (slot: string) => {
    const now = new Date();
    if (date === localDate(now) && minutes(slot) <= now.getHours() * 60 + now.getMinutes()) return true;
    // 자기 자신과는 겹쳐도 된다 — 지금 그 자리를 비우고 옮기는 중이니까.
    const others = db.bookings.filter((x) => x.id !== b.id);
    return slotBooked(others, date, slot, b.doctorId, duration, (id) => db.treatments.find((tr) => tr.id === id)?.durationMin ?? 30);
  };
  const changed = date !== b.date || time !== b.time;
  const canSave = changed && times.includes(time) && !taken(time);

  function saveChange() {
    update((draft) => {
      const row = draft.bookings.find((x) => x.id === b.id);
      if (!row) return;
      row.date = date;
      row.time = time;
      // 확정된 예약을 옮기면 클리닉이 다시 봐야 한다. 입금은 이미 확인됐으므로
      // 처음이 아니라 "입금확인"으로 돌아간다.
      if (row.status === "예약확정") {
        row.status = "입금확인";
        pushStatusNotice(draft, b.id, "입금확인");
      }
    });
    setMode("none");
    toast(t("changeSaved"));
  }

  function cancelBooking() {
    update((draft) => {
      const row = draft.bookings.find((x) => x.id === b.id);
      if (!row) return;
      row.status = "취소";
      pushStatusNotice(draft, b.id, "취소");
    });
    setMode("none");
    toast(t("cancelDone"));
  }

  return (
    <div className="rounded-cell bg-white/70 p-4 hairline">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">{clinic && t(clinic.name)}</div>
        <Badge tone={statusTone(b.status)}>{t(b.status)}</Badge>
      </div>
      <div className="mt-1 text-sm text-ink-sub">
        {treatment && t(treatment.name)} · {b.date} {b.time} ·{" "}
        {doctor && t(doctor.name)}
      </div>

      {b.status !== "취소" && <BookingProgress status={b.status} />}
      <p className="mt-2 text-xs text-hb-600">{t(STATUS_HINT[b.status])}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-sub">
        <span>{tf("depositPaid", b.depositTHB.toLocaleString())}</span>
        {code && (
          <Badge tone="pink">
            {t("reviewCode")} {code.code}
          </Badge>
        )}
      </div>

      {canReschedule(b.status) && (
        <div className="mt-3 flex flex-wrap gap-2">
          <GhostButton
            active={mode === "edit"}
            onClick={() => {
              setDate(b.date);
              setTime(b.time);
              setMode(mode === "edit" ? "none" : "edit");
            }}
            className="px-3 py-1.5 text-xs"
          >
            {t("changeBooking")}
          </GhostButton>
          <GhostButton
            active={mode === "cancel"}
            onClick={() => setMode(mode === "cancel" ? "none" : "cancel")}
            className="px-3 py-1.5 text-xs"
          >
            {t("cancelBooking")}
          </GhostButton>
        </div>
      )}

      {mode === "edit" && (
        <div className="animate-rise mt-3 space-y-3 rounded-cell bg-white/70 p-3 hairline">
          <div className="text-sm font-semibold">{t("newDateTime")}</div>
          <BookingCalendar
            value={date}
            onChange={(next) => {
              setDate(next);
              setTime("");
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            {times.map((slot) => (
              <GhostButton
                key={slot}
                disabled={taken(slot)}
                active={slot === time}
                onClick={() => setTime(slot)}
                className="px-2"
              >
                {slot}
              </GhostButton>
            ))}
          </div>
          {!times.length && (
            <p className="text-xs text-ink-sub">
              {t("선택한 날짜는 휴진일이거나 예약 가능한 시간이 없습니다.")}
            </p>
          )}
          <InkButton disabled={!canSave} onClick={saveChange} className="w-full py-3">
            {t("saveChange")}
          </InkButton>
        </div>
      )}

      {mode === "cancel" && (
        <div className="animate-rise mt-3 rounded-cell bg-white/70 p-3 hairline">
          <p className="text-xs leading-relaxed text-ink-sub">{t("cancelAsk")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <InkButton onClick={cancelBooking} className="px-4 py-2 text-sm">
              {t("cancelBooking")}
            </InkButton>
            <GhostButton onClick={() => setMode("none")} className="px-3 py-1.5 text-xs">
              {t("keepBooking")}
            </GhostButton>
          </div>
        </div>
      )}
    </div>
  );
}

export function WriteReview() {
  const { t, tf } = useT();
  const { db, update } = useDb();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // 후기를 쓰면 어드민 승인 대기열로 넘어가는데, 여기서는 그게 안 보인다.
  const { note, show: showLinked, dismiss } = useLinkedNote();
  // 내가 쓴 후기 목록은 눌러야 클리닉·발행코드 같은 상세정보가 펼쳐진다.
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  if (!db) return null;

  const matched = db.reviewCodes.find(
    (rc) => rc.code.toUpperCase() === code.trim().toUpperCase(),
  );
  const myReviews = db.reviews.filter((r) => r.userId === "U1" || r.userId === "U2");

  function submit() {
    if (!matched) {
      toast(t("checkCode"));
      return;
    }
    if (!text.trim()) {
      toast(t("writeSomething"));
      return;
    }
    update((draft) => {
      draft.reviews.unshift({
        id: `RV-${Date.now()}`,
        userId: "U1",
        clinicId: matched!.clinicId,
        code: matched!.code,
        rating,
        text: text.trim(),
        images,
        approved: false,
        blocked: false,
        pinned: false,
        createdAt: new Date().toISOString(),
      });
    });
    const clinicName = t(
      db!.clinics.find((c) => c.id === matched!.clinicId)?.name ?? "",
    );
    showLinked([
      t("reviewLinkedAdmin"),
      tf("reviewLinkedClinic", clinicName),
      tf("reviewLinkedCode", matched!.code),
    ]);
    setText("");
    setCode("");
    setImages([]);
    toast(t("reviewSubmitted"));
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold">{t("writeReview")}</h2>
        <p className="mt-1 text-sm text-ink-sub">
          {t("reviewIntro")}
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 text-sm font-semibold">{t("reviewCode")}</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("codeExample")}
              className="w-full rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
            {code && (
              <p className="mt-2 text-xs">
                {matched ? (
                  <span className="text-hb-600">
                    {t("confirmed")} ·{" "}
                    {t(db.clinics.find((c) => c.id === matched.clinicId)?.name ?? "")}
                  </span>
                ) : (
                  <span className="text-danger">{t("codeNotFound")}</span>
                )}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">{t("rating")}</div>
            {/* 별 1~5개짜리 버튼이라 한 줄에 402px가 필요하다. 폰 화면 안쪽은 295px뿐이라
                flex-wrap이 없으면 이 줄 하나가 페이지 전체를 옆으로 늘려버린다. */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <GhostButton key={n} active={n === rating} onClick={() => setRating(n)}>
                  {"★".repeat(n)}
                </GhostButton>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">{t("reviewBody")}</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={t("reviewPlaceholder")}
              className="w-full resize-none rounded-card bg-white/70 px-5 py-4 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
          </div>

          <PhotoPicker
            images={images}
            onChange={setImages}
            label={t("photoLabel")}
            hint={t("photoHint")}
          />

          <InkButton onClick={submit}>{t("submitReview")}</InkButton>

          {note && (
            <LinkedNote
              note={note}
              title={t("reviewLinkedTitle")}
              hint={t("reviewLinkedHint")}
              closeLabel={t("close")}
              onClose={dismiss}
            />
          )}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <h3 className="font-bold">{t("myReviews")}</h3>
        <div className="mt-3 space-y-2">
          {myReviews.map((r) => {
            const clinic = db.clinics.find((c) => c.id === r.clinicId);
            const expanded = expandedReviewId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setExpandedReviewId((cur) => (cur === r.id ? null : r.id))
                }
                className="block w-full rounded-cell bg-white/70 p-3 text-left transition duration-100 hairline hover:bg-white active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-semibold">
                    {clinic ? t(clinic.name) : t("clinicFallback")}
                  </span>
                  <Badge tone={r.approved ? "pink" : "neutral"}>
                    {t(
                      r.blocked
                        ? "reviewBlocked"
                        : r.approved
                          ? "reviewApproved"
                          : "reviewPending",
                    )}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-sm">{"★".repeat(r.rating)}</span>
                  {r.code && (
                    <Badge tone="pink">
                      {t("reviewCode")} {r.code}
                    </Badge>
                  )}
                </div>
                <p
                  className={`mt-2 text-sm text-ink/80 ${expanded ? "" : "line-clamp-2"}`}
                >
                  {t(r.text)}
                </p>

                {expanded && (
                  <div className="animate-pop mt-2 space-y-2">
                    <div className="text-[11px] text-ink-sub">
                      {r.createdAt.slice(0, 10)}
                    </div>
                    {r.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {r.images.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={`${r.id}-${i}`}
                            src={src}
                            alt=""
                            className="h-20 w-full rounded-cell object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <span className="mt-2 inline-block text-xs text-hb-600 underline">
                  {expanded ? t("close") : t("detail")}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
