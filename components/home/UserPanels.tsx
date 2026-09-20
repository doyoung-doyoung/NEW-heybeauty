"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { Badge, GhostButton, GlassCard, InkButton } from "@/components/ui/primitives";
import { PhotoPicker } from "@/components/ui/PhotoPicker";

export function MyBookings() {
  const { db } = useDb();
  if (!db) return null;

  const bookings = db.bookings.filter((b) => b.userId === "U1" || b.userId === "U2");

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold">내 예약</h2>
      <div className="mt-4 space-y-3">
        {bookings.length === 0 && (
          <p className="text-sm text-ink-sub">아직 예약이 없습니다.</p>
        )}
        {bookings.map((b) => {
          const clinic = db.clinics.find((c) => c.id === b.clinicId);
          const treatment = db.treatments.find((t) => t.id === b.treatmentId);
          const doctor = db.doctors.find((d) => d.id === b.doctorId);
          const code = db.reviewCodes.find((rc) => rc.bookingId === b.id);
          return (
            <div key={b.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{clinic?.name}</div>
                <Badge tone={b.status === "예약확정" ? "pink" : "neutral"}>
                  {b.status}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-ink-sub">
                {treatment?.name} · {b.date} {b.time} · {doctor?.name}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-sub">
                <span>예약금 ฿{b.depositTHB.toLocaleString()} 결제완료</span>
                {code && <Badge tone="pink">후기코드 {code.code}</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function WriteReview() {
  const { db, update } = useDb();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);

  if (!db) return null;

  const matched = db.reviewCodes.find(
    (rc) => rc.code.toUpperCase() === code.trim().toUpperCase(),
  );
  const myReviews = db.reviews.filter((r) => r.userId === "U1" || r.userId === "U2");

  function submit() {
    if (!matched) {
      toast("후기코드를 확인해주세요");
      return;
    }
    if (!text.trim()) {
      toast("후기 내용을 입력해주세요");
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
    setText("");
    setCode("");
    setImages([]);
    toast("후기가 등록되었습니다 · 어드민 승인 후 노출됩니다");
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold">후기 쓰기</h2>
        <p className="mt-1 text-sm text-ink-sub">
          방문 후 발행된 후기코드를 입력하면 후기를 작성할 수 있어요.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-2 text-sm font-semibold">후기코드</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: HB-7K2M"
              className="w-full rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
            {code && (
              <p className="mt-2 text-xs">
                {matched ? (
                  <span className="text-hb-600">
                    확인됨 · {db.clinics.find((c) => c.id === matched.clinicId)?.name}
                  </span>
                ) : (
                  <span className="text-danger">일치하는 후기코드가 없습니다</span>
                )}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">평점</div>
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
            <div className="mb-2 text-sm font-semibold">내용</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="시술 경험을 남겨주세요"
              className="w-full resize-none rounded-card bg-white/70 px-5 py-4 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
          </div>

          <PhotoPicker
            images={images}
            onChange={setImages}
            label="시술 사진 (최대 3장)"
            hint="사진을 선택하면 자동으로 크기를 줄여 저장합니다"
          />

          <InkButton onClick={submit}>후기 등록</InkButton>
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <h3 className="font-bold">내가 쓴 후기</h3>
        <div className="mt-3 space-y-2">
          {myReviews.map((r) => (
            <div key={r.id} className="rounded-cell bg-white/70 p-3 hairline">
              <div className="flex items-center justify-between">
                <span className="text-sm">{"★".repeat(r.rating)}</span>
                <Badge tone={r.approved ? "pink" : "neutral"}>
                  {r.blocked ? "차단됨" : r.approved ? "승인됨" : "승인 대기"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-ink/80">{r.text}</p>
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
