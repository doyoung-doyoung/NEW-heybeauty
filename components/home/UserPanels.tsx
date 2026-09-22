"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Badge, GhostButton, GlassCard, InkButton } from "@/components/ui/primitives";
import { LinkedNote, useLinkedNote } from "@/components/ui/LinkedNote";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

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
        {bookings.map((b) => {
          const clinic = db.clinics.find((c) => c.id === b.clinicId);
          const treatment = db.treatments.find((t) => t.id === b.treatmentId);
          const doctor = db.doctors.find((d) => d.id === b.doctorId);
          const code = db.reviewCodes.find((rc) => rc.bookingId === b.id);
          return (
            <div key={b.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{clinic && t(clinic.name)}</div>
                <Badge tone={b.status === "예약확정" ? "pink" : "neutral"}>
                  {t(b.status)}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-ink-sub">
                {treatment && t(treatment.name)} · {b.date} {b.time} ·{" "}
                {doctor && t(doctor.name)}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-sub">
                <span>{tf("depositPaid", b.depositTHB.toLocaleString())}</span>
                {code && (
                  <Badge tone="pink">
                    {t("reviewCode")} {code.code}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
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
          {myReviews.map((r) => (
            <div key={r.id} className="rounded-cell bg-white/70 p-3 hairline">
              <div className="flex items-center justify-between">
                <span className="text-sm">{"★".repeat(r.rating)}</span>
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
              <p className="mt-2 text-sm text-ink/80">{t(r.text)}</p>
              {r.images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
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
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
