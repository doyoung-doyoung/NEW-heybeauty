"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { isLowStock, LOW_STOCK_QTY } from "@/lib/stock";
import { TREATMENT_POOL } from "@/lib/seed";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { LinkedNote, useLinkedNote } from "@/components/ui/LinkedNote";
import type { AccountStatus, Hours, NoticeTarget } from "@/lib/types";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
  SectionTitle,
} from "@/components/ui/primitives";

type Section =
  | "inventory"
  | "reviews"
  | "users"
  | "clinic"
  | "notice"
  | "account";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "inventory", label: "전체 재고" },
  { id: "reviews", label: "후기 · 커미션" },
  { id: "users", label: "유저 관리" },
  { id: "clinic", label: "클리닉 정보" },
  { id: "notice", label: "공지 · 팝업" },
  { id: "account", label: "계정 · 비번" },
];

const inputClass =
  "w-full rounded-cell bg-white/75 px-3 py-2 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white";

const DEFAULT_HOURS: Hours[] = [
  { day: "월", open: "10:00", close: "20:00" },
  { day: "화", open: "10:00", close: "20:00" },
  { day: "수", open: "10:00", close: "20:00" },
  { day: "목", open: "10:00", close: "20:00" },
  { day: "금", open: "10:00", close: "21:00" },
  { day: "토", open: "11:00", close: "19:00" },
  { day: "일", open: "-", close: "-", closed: true },
];

export default function AdminTab() {
  const [section, setSection] = useState<Section>("inventory");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <GhostButton
            key={s.id}
            active={section === s.id}
            onClick={() => setSection(s.id)}
            className="shrink-0"
          >
            {s.label}
          </GhostButton>
        ))}
      </div>

      <div key={section} className="animate-rise">
        {section === "inventory" && <InventorySection />}
        {section === "reviews" && <ReviewSection />}
        {section === "users" && <UserSection />}
        {section === "clinic" && <ClinicSection />}
        {section === "notice" && <NoticeSection />}
        {section === "account" && <AccountSection />}
      </div>

      <DemoReset />
    </div>
  );
}

function InventorySection() {
  const { db } = useDb();
  const [onlyLow, setOnlyLow] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!db) return null;

  const rows = db.inventory.filter((i) => !onlyLow || isLowStock(i));
  const lowCount = db.inventory.filter(isLowStock).length;
  const open = openId ? db.inventory.find((i) => i.id === openId) : null;

  if (open) {
    const product = db.products.find((p) => p.id === open.productId);
    const clinic = db.clinics.find((c) => c.id === open.clinicId);
    const branch = db.branches.find((b) => b.id === open.branchId);
    const logs = db.stockLogs.filter((l) => l.inventoryItemId === open.id);
    const rows2: { label: string; value: string }[] = [
      { label: "제품명", value: product?.name ?? "-" },
      { label: "카테고리", value: product?.category ?? "-" },
      { label: "클리닉", value: clinic?.name ?? "-" },
      { label: "지점", value: branch?.name ?? "-" },
      { label: "현재 수량", value: `${open.qty}` },
      { label: "규격", value: open.volume },
      { label: "유통 구분", value: open.distribution },
      { label: "LOT 번호", value: open.lotNo },
      { label: "유효기간", value: open.expiry },
      { label: "공급처", value: open.supplier },
      { label: "담당자", value: open.manager },
      { label: "입고일", value: open.purchaseDate },
      { label: "매입가", value: `฿${open.purchasePrice.toLocaleString()}` },
      { label: "판매가", value: `฿${open.salePrice.toLocaleString()}` },
      {
        label: "본사 공급 단가",
        value: product ? `฿${product.unitPriceTHB.toLocaleString()} / ${product.unit}` : "-",
      },
      { label: "경고 기준", value: `잔여 ${LOW_STOCK_QTY}개 이하` },
    ];

    return (
      <div className="space-y-4">
        <GhostButton onClick={() => setOpenId(null)}>← 목록으로</GhostButton>

        <GlassCard className="p-6">
          <SectionTitle
            title={product?.name ?? "재고 상세"}
            sub={`${clinic?.name} · ${branch?.name}`}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {rows2.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-cell bg-white/70 px-4 py-3 text-sm hairline"
              >
                <span className="text-xs text-ink-sub">{r.label}</span>
                <span className="truncate font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard soft className="p-6">
          <SectionTitle title="입출고 기록" sub={`총 ${logs.length}건`} />
          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-sm text-ink-sub">기록이 없습니다.</p>
            )}
            {logs.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-cell bg-white/70 p-3 text-sm hairline"
              >
                <div className="min-w-0">
                  <Badge tone={l.type === "사용" ? "neutral" : "pink"}>
                    {l.type}
                  </Badge>
                  <span className="ml-2 text-xs text-ink-sub">{l.reason}</span>
                </div>
                <div className="text-xs text-ink-sub">
                  {l.type === "사용" ? "-" : "+"}
                  {l.qty} · {l.by} · {l.at.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="전체 재고 현황"
        sub={`제휴 클리닉 전 지점 · 총 ${db.inventory.length}건 · 잔여 ${LOW_STOCK_QTY}개 이하 ${lowCount}건 경고`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <GhostButton active={!onlyLow} onClick={() => setOnlyLow(false)}>
          전체
        </GhostButton>
        <GhostButton active={onlyLow} onClick={() => setOnlyLow(true)}>
          경고만 ({lowCount})
        </GhostButton>
      </div>

      <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {rows.map((item) => {
          const product = db.products.find((p) => p.id === item.productId);
          const branch = db.branches.find((b) => b.id === item.branchId);
          const clinic = db.clinics.find((c) => c.id === item.clinicId);
          const low = isLowStock(item);
          return (
            <div
              key={item.id}
              className={`rounded-cell p-4 hairline ${low ? "bg-danger/10" : "bg-white/70"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{product?.name}</div>
                  <div className="truncate text-xs text-ink-sub">
                    {clinic?.name} · {branch?.name} · {item.volume} ·{" "}
                    {item.distribution} · LOT {item.lotNo}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold tabular-nums ${low ? "animate-warn text-danger" : ""}`}
                  >
                    {item.qty}
                  </span>
                  {low && <Badge tone="danger">재고 부족</Badge>}
                  <GhostButton onClick={() => setOpenId(item.id)}>
                    상세 내용보기
                  </GhostButton>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-sub">
                <span>유효기간 {item.expiry}</span>
                <span>공급처 {item.supplier}</span>
                <span>담당 {item.manager}</span>
                <span>매입 ฿{item.purchasePrice.toLocaleString()}</span>
                <span>판매 ฿{item.salePrice.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function ReviewSection() {
  const { db, update } = useDb();
  const toast = useToast();
  // 승인 버튼 하나가 고객 앱 클리닉 상세의 후기 목록과 평점 줄을 같이 바꾼다.
  const { note, show: showLinked, dismiss } = useLinkedNote();
  if (!db) return null;

  function approve(reviewId: string) {
    update((draft) => {
      const review = draft.reviews.find((r) => r.id === reviewId);
      if (!review) return;
      review.approved = true;
      review.blocked = false;
    });
    const review = db!.reviews.find((r) => r.id === reviewId);
    const clinicName =
      db!.clinics.find((c) => c.id === review?.clinicId)?.name ?? "클리닉";
    showLinked(
      [
        `고객 앱 · ${clinicName} 상세 후기 목록에 노출`,
        `내 후기 · 작성자 화면에서 "승인됨"으로 표시`,
      ],
      reviewId,
    );
    toast("후기를 승인했습니다");
  }

  function block(reviewId: string) {
    update((draft) => {
      const review = draft.reviews.find((r) => r.id === reviewId);
      if (!review) return;
      review.blocked = true;
      review.approved = false;
    });
    const review = db!.reviews.find((r) => r.id === reviewId);
    const clinicName =
      db!.clinics.find((c) => c.id === review?.clinicId)?.name ?? "클리닉";
    showLinked(
      [
        `고객 앱 · ${clinicName} 상세 후기 목록에서 숨김`,
        `내 후기 · 작성자 화면에서 "차단됨"으로 표시`,
      ],
      reviewId,
    );
    toast("후기를 차단했습니다");
  }

  function setImages(reviewId: string, images: string[]) {
    update((draft) => {
      const review = draft.reviews.find((r) => r.id === reviewId);
      if (review) review.images = images;
    });
  }

  function issueCode(bookingId: string) {
    const booking = db?.bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    const code = `HB-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    update((draft) => {
      draft.reviewCodes.unshift({
        id: `RC-${Date.now()}`,
        code,
        ownerUserId: booking.userId,
        clinicId: booking.clinicId,
        bookingId: booking.id,
        issuedAt: new Date().toISOString(),
        usedByBookingIds: [],
      });
    });
    const user = db?.users.find((u) => u.id === booking.userId);
    showLinked(
      [
        `내 예약 · ${user?.name ?? "고객"}님 ${booking.id} 카드에 ${code} 배지 표시`,
        `후기 작성 · 이 코드로 후기를 쓸 수 있게 열림`,
        `커미션 정산 · 이 코드로 들어온 예약부터 집계 시작`,
      ],
      bookingId,
    );
    toast(`후기코드 ${code} 발행 완료`);
  }

  const visited = db.bookings.filter((b) => b.status === "방문완료");
  const totalCommission = db.commissions.reduce((s, c) => s + c.amountTHB, 0);

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <SectionTitle
          title="후기 승인"
          sub="승인된 후기만 앱에 노출됩니다 · 사진은 직접 추가할 수 있습니다"
        />
        <div className="space-y-2">
          {db.reviews.map((r) => {
            const clinic = db.clinics.find((c) => c.id === r.clinicId);
            return (
              <div key={r.id} className="rounded-cell bg-white/70 p-4 hairline">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{clinic?.name}</div>
                  <Badge
                    tone={r.blocked ? "danger" : r.approved ? "pink" : "neutral"}
                  >
                    {r.blocked ? "차단됨" : r.approved ? "승인됨" : "승인 대기"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-ink-sub">
                  {"★".repeat(r.rating)} · 후기코드 {r.code}
                </div>
                <p className="mt-2 text-sm text-ink/80">{r.text}</p>

                <div className="mt-3 rounded-cell bg-white/70 p-3 hairline">
                  <PhotoPicker
                    images={r.images}
                    onChange={(next) => setImages(r.id, next)}
                    label="후기 사진 (최대 3장)"
                    hint="지금은 비워두고 나중에 실제 사진으로 채워도 됩니다"
                  />
                </div>

                <div className="mt-3 flex gap-2">
                  <GhostButton onClick={() => approve(r.id)}>승인</GhostButton>
                  <GhostButton onClick={() => block(r.id)}>차단</GhostButton>
                </div>

                {note?.key === r.id && (
                  <LinkedNote
                    note={note}
                    title="고객 앱 쪽 후기 노출이 함께 바뀌었습니다"
                    onClose={dismiss}
                    className="mt-3"
                  />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle
          title="후기코드 발행"
          sub="방문완료 예약 건에 대해 후기코드를 발행합니다"
        />
        <div className="space-y-2">
          {visited.length === 0 && (
            <p className="text-sm text-ink-sub">방문완료 예약이 없습니다.</p>
          )}
          {visited.map((b) => {
            const clinic = db.clinics.find((c) => c.id === b.clinicId);
            const issued = db.reviewCodes.find((rc) => rc.bookingId === b.id);
            return (
              <div key={b.id} className="rounded-cell bg-white/70 p-4 hairline">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-semibold">{clinic?.name}</div>
                    <div className="text-xs text-ink-sub">
                      {b.date} {b.time} · {b.id}
                    </div>
                  </div>
                  {issued ? (
                    <Badge tone="pink">발행됨 {issued.code}</Badge>
                  ) : (
                    <GhostButton onClick={() => issueCode(b.id)}>
                      후기코드 발행
                    </GhostButton>
                  )}
                </div>

                {note?.key === b.id && (
                  <LinkedNote
                    note={note}
                    title="후기코드가 고객 화면으로 넘어갔습니다"
                    onClose={dismiss}
                    className="mt-3"
                  />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle
          title="커미션 정산"
          sub={`누적 ฿${totalCommission.toLocaleString()}`}
        />
        <div className="space-y-2">
          {db.commissions.map((c) => {
            const rc = db.reviewCodes.find((x) => x.id === c.reviewCodeId);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-cell bg-white/70 p-3 text-sm hairline"
              >
                <span>
                  {rc?.code} · 예약 {c.bookingId}
                </span>
                <span className="font-semibold">
                  ฿{c.amountTHB.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function UserSection() {
  const { db, update } = useDb();
  const toast = useToast();
  const [noticeFor, setNoticeFor] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  if (!db) return null;

  function toggleBlock(userId: string) {
    let blocked = false;
    update((draft) => {
      const user = draft.users.find((u) => u.id === userId);
      if (!user) return;
      user.blocked = !user.blocked;
      blocked = user.blocked;
      const account = draft.accounts.find(
        (a) => a.kind === "user" && a.id === `AC-${userId}`,
      );
      if (account) account.status = blocked ? "차단" : "사용가능";
    });
    toast(blocked ? "유저를 차단했습니다" : "차단을 해제했습니다");
  }

  function spent(userId: string) {
    return db!.bookings
      .filter((b) => b.userId === userId && b.status !== "취소")
      .reduce((sum, b) => {
        const treatment = db!.treatments.find((t) => t.id === b.treatmentId);
        return sum + (treatment?.price ?? 0);
      }, 0);
  }

  function sendNotice(userId: string) {
    const user = db!.users.find((u) => u.id === userId);
    if (!user) return;
    if (!title.trim() || !body.trim()) {
      toast("제목과 내용을 입력해주세요");
      return;
    }
    update((draft) => {
      draft.notices.unshift({
        id: `NT-${Date.now()}`,
        title: `[${user.name}님] ${title.trim()}`,
        body: body.trim(),
        target: "유저",
        at: new Date().toISOString(),
      });
    });
    setTitle("");
    setBody("");
    setNoticeFor(null);
    toast(`${user.name}님에게 공지를 보냈습니다`);
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="유저 관리"
        sub="공지는 유저 앱 홈 탭의 공지사항에 쌓입니다"
      />
      <div className="space-y-2">
        {db.users.map((u) => {
          const total = spent(u.id);
          const count = db.bookings.filter(
            (b) => b.userId === u.id && b.status !== "취소",
          ).length;
          return (
            <div key={u.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-ink-sub">
                    {u.lineId} · {u.phone}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={u.blocked ? "danger" : "neutral"}>
                    {u.blocked ? "차단됨" : "정상"}
                  </Badge>
                  <GhostButton
                    onClick={() =>
                      setNoticeFor(noticeFor === u.id ? null : u.id)
                    }
                  >
                    공지 보내기
                  </GhostButton>
                  <GhostButton onClick={() => toggleBlock(u.id)}>
                    {u.blocked ? "차단 해제" : "차단"}
                  </GhostButton>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-cell bg-hb-50 px-4 py-2.5 text-sm hairline">
                  <span className="text-xs text-ink-sub">총 구매금액</span>
                  <span className="font-bold tabular-nums">
                    ฿{total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-cell bg-white/70 px-4 py-2.5 text-sm hairline">
                  <span className="text-xs text-ink-sub">이용 건수</span>
                  <span className="font-semibold tabular-nums">{count}건</span>
                </div>
              </div>

              {noticeFor === u.id && (
                <div className="animate-rise mt-3 space-y-2 rounded-cell bg-white/70 p-3 hairline">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="공지 제목"
                    className={inputClass}
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    placeholder="공지 내용"
                    className={`${inputClass} resize-none`}
                  />
                  <InkButton arrow={false} onClick={() => sendNotice(u.id)}>
                    보내기
                  </InkButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

type ClinicField =
  | "name"
  | "district"
  | "address"
  | "phone"
  | "lineId"
  | "parking"
  | "intro";

const CLINIC_FIELDS: { key: Exclude<ClinicField, "intro">; label: string }[] = [
  { key: "name", label: "클리닉명" },
  { key: "district", label: "지역" },
  { key: "address", label: "주소" },
  { key: "phone", label: "전화번호" },
  { key: "lineId", label: "LINE ID" },
  { key: "parking", label: "주차 안내" },
];

function ClinicSection() {
  const { db, update } = useDb();
  const toast = useToast();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { note, show: showLinked, dismiss } = useLinkedNote();
  if (!db) return null;

  const clinic = clinicId ? db.clinics.find((c) => c.id === clinicId) : null;

  function setField(field: ClinicField, value: string) {
    update((draft) => {
      const target = draft.clinics.find((c) => c.id === clinicId);
      if (target) target[field] = value;
    });
  }

  if (adding) {
    return (
      <ClinicRegister
        onDone={(rows) => {
          setAdding(false);
          showLinked(rows);
        }}
        onCancel={() => setAdding(false)}
      />
    );
  }

  if (clinic) {
    const branches = db.branches.filter((b) => b.clinicId === clinic.id);
    return (
      <div className="space-y-4">
        <GhostButton onClick={() => setClinicId(null)}>← 목록으로</GhostButton>

        <GlassCard className="p-6">
          <SectionTitle
            title={`${clinic.name} 정보 수정`}
            sub="입력 즉시 저장되며 새로고침해도 유지됩니다"
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={clinic.hasBranches ? "pink" : "neutral"}>
              {clinic.hasBranches ? "지점 클리닉" : "일반 클리닉"}
            </Badge>
            <span className="text-xs text-ink-sub">
              지점 {branches.length}개 · ★ {clinic.rating} · 후기{" "}
              {clinic.reviewCount}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CLINIC_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
                  {f.label}
                </span>
                <input
                  value={clinic[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={inputClass}
                />
              </label>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              소개
            </span>
            <textarea
              value={clinic.intro}
              onChange={(e) => setField("intro", e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="mt-5">
            <InkButton onClick={() => toast("클리닉 정보를 저장했습니다")}>
              저장
            </InkButton>
          </div>
        </GlassCard>

        <GlassCard soft className="p-6">
          <SectionTitle title="지점 목록" />
          <div className="space-y-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="rounded-cell bg-white/70 p-4 text-sm hairline"
              >
                <div className="font-semibold">{b.name}</div>
                <div className="mt-1 text-xs text-ink-sub">
                  {b.address} · {b.phone}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  const normal = db.clinics.filter((c) => !c.hasBranches).length;
  const withBranches = db.clinics.length - normal;

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="보유 클리닉"
        sub={`총 ${db.clinics.length}곳 · 일반 ${normal} · 지점 ${withBranches}`}
      />

      <div className="mb-4">
        <InkButton onClick={() => setAdding(true)}>클리닉 등록하기</InkButton>
      </div>

      {note && (
        <LinkedNote
          note={note}
          title="등록 한 번으로 여러 곳이 함께 만들어졌습니다"
          hint={`${note.rows.length}곳이 동시에 채워졌습니다`}
          onClose={dismiss}
          className="mb-4"
        />
      )}

      <div className="space-y-2">
        {db.clinics.map((c) => {
          const branchCount = db.branches.filter(
            (b) => b.clinicId === c.id,
          ).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setClinicId(c.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-cell bg-white/70 p-4 text-left transition hairline hover:bg-white"
            >
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold">{c.name}</div>
                <div className="truncate text-xs text-ink-sub">
                  {c.district} · {c.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.hasBranches ? "pink" : "neutral"}>
                  {c.hasBranches ? `지점 ${branchCount}` : "일반"}
                </Badge>
                <span className="text-sm font-semibold">★ {c.rating}</span>
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

function ClinicRegister({
  onDone,
  onCancel,
}: {
  onDone: (linkedRows: string[]) => void;
  onCancel: () => void;
}) {
  const { db, update } = useDb();
  const toast = useToast();
  const [kind, setKind] = useState<"일반" | "지점">("일반");
  const [branchCount, setBranchCount] = useState(2);
  const [form, setForm] = useState({
    name: "",
    district: "",
    address: "",
    phone: "",
    lineId: "",
    parking: "발렛 가능",
    intro: "",
  });
  if (!db) return null;

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (!form.name.trim() || !form.district.trim()) {
      toast("클리닉명과 지역은 필수입니다");
      return;
    }
    const clinicId = `C-${Date.now().toString().slice(-6)}`;
    const hasBranches = kind === "지점";
    const count = hasBranches ? Math.max(2, branchCount) : 1;

    update((draft) => {
      draft.clinics.push({
        id: clinicId,
        name: form.name.trim(),
        hasBranches,
        district: form.district.trim(),
        address: form.address.trim() || `${form.district.trim()} 1`,
        phone: form.phone.trim() || "02-000-0000",
        lineId: form.lineId.trim() || `@${clinicId.toLowerCase()}`,
        parking: form.parking,
        hours: DEFAULT_HOURS,
        rating: 4.5,
        reviewCount: 0,
        intro: form.intro.trim() || `${form.district.trim()}의 신규 제휴 클리닉입니다.`,
        image: `/clinics/${clinicId}.jpg`,
      });

      for (let i = 0; i < count; i++) {
        draft.branches.push({
          id: `${clinicId}-B${i + 1}`,
          clinicId,
          name: hasBranches ? `${form.name.trim()} ${i + 1}호점` : form.name.trim(),
          address: form.address.trim() || `${form.district.trim()} ${i + 1}`,
          phone: form.phone.trim() || "02-000-0000",
          parking: form.parking,
          hours: DEFAULT_HOURS,
        });
      }

      // 시술을 같이 깔아주지 않으면 홈 탭 클리닉 카드에 보여줄 최저가가 없다.
      TREATMENT_POOL.forEach((tp, ti) => {
        draft.treatments.push({
          id: `${clinicId}-T${ti + 1}`,
          clinicId,
          name: tp.name,
          category: tp.category,
          price: tp.base,
          durationMin: tp.min,
          description: `${tp.name} — ${tp.category} 시술. 상담 후 개인별 프로토콜로 진행합니다.`,
        });
      });

      draft.accounts.push({
        id: `AC-${clinicId}`,
        kind: "clinic",
        label: `${form.name.trim()} 마스터 계정`,
        loginId: clinicId.toLowerCase(),
        password: `hb${Math.floor(1000 + Math.random() * 8999)}`,
        status: "사용가능",
      });
    });

    toast(`${form.name.trim()} 등록 완료 · 계정도 함께 생성되었습니다`);
    // 이 화면은 저장하자마자 목록으로 돌아가므로, 무엇이 생겼는지는 목록 쪽에서 보여준다.
    onDone([
      `홈 탭 클리닉 목록 · ${form.name.trim()} 카드 추가 (${form.district.trim()})`,
      hasBranches
        ? `지점 · ${count}개 지점 생성 (1호점 ~ ${count}호점)`
        : `지점 · 단일 지점 생성`,
      `시술 · 기본 ${TREATMENT_POOL.length}개 등록, 최저가가 카드에 표시됨`,
      `파트너 계정 · 아이디 ${clinicId.toLowerCase()} 로 로그인 가능`,
    ]);
  }

  return (
    <div className="space-y-4">
      <GhostButton onClick={onCancel}>← 목록으로</GhostButton>

      <GlassCard className="p-6">
        <SectionTitle
          title="클리닉 등록하기"
          sub="등록 즉시 홈 탭 클리닉 목록과 파트너 계정이 함께 생성됩니다"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <GhostButton active={kind === "일반"} onClick={() => setKind("일반")}>
            일반 클리닉
          </GhostButton>
          <GhostButton active={kind === "지점"} onClick={() => setKind("지점")}>
            지점 클리닉
          </GhostButton>
        </div>

        {kind === "지점" && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              지점 수
            </span>
            <input
              type="number"
              min={2}
              max={10}
              value={branchCount}
              onChange={(e) => setBranchCount(Number(e.target.value) || 2)}
              className={`${inputClass} w-32`}
            />
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "name", label: "클리닉명", ph: "예: 시암 글로우 클리닉" },
            { key: "district", label: "지역", ph: "예: Siam" },
            { key: "address", label: "주소", ph: "예: Rama I Rd. 991" },
            { key: "phone", label: "전화번호", ph: "예: 02-123-4567" },
            { key: "lineId", label: "LINE ID", ph: "예: @siamglow" },
            { key: "parking", label: "주차 안내", ph: "예: 발렛 가능" },
          ].map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
                {f.label}
              </span>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={(e) => set(f.key as keyof typeof form, e.target.value)}
                placeholder={f.ph}
                className={inputClass}
              />
            </label>
          ))}
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
            소개
          </span>
          <textarea
            value={form.intro}
            onChange={(e) => set("intro", e.target.value)}
            rows={3}
            placeholder="클리닉 소개 문구"
            className={`${inputClass} resize-none`}
          />
        </label>

        <div className="mt-5">
          <InkButton onClick={submit}>등록하기</InkButton>
        </div>
      </GlassCard>
    </div>
  );
}

const NOTICE_TARGETS: NoticeTarget[] = ["전체", "유저", "클리닉"];

const POPUP_PRESETS = [
  { src: "/popups/PP2.jpg", label: "시술" },
  { src: "/popups/PP1.jpg", label: "화장품" },
];

function NoticeSection() {
  const { db, update } = useDb();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [asPopup, setAsPopup] = useState(false);
  const [target, setTarget] = useState<NoticeTarget>("전체");
  const [images, setImages] = useState<string[]>([]);
  const { note, show: showLinked, dismiss } = useLinkedNote();
  if (!db) return null;

  function submit() {
    if (!title.trim() || !body.trim()) {
      toast("제목과 내용을 입력해주세요");
      return;
    }
    update((draft) => {
      if (asPopup) {
        draft.popups.forEach((p) => {
          p.active = false;
        });
        draft.popups.unshift({
          id: `PU-${Date.now()}`,
          title: title.trim(),
          body: body.trim(),
          image: images[0] ?? null,
          active: true,
        });
        return;
      }
      draft.notices.unshift({
        id: `NT-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        target,
        at: new Date().toISOString(),
      });
    });
    const hadActivePopup = db!.popups.some((p) => p.active);
    showLinked(
      asPopup
        ? [
            `홈 탭 · 접속하면 "${title.trim()}" 팝업이 맨 위에 뜸`,
            ...(hadActivePopup
              ? ["기존 팝업 · 한 번에 하나만 뜨므로 자동으로 내려감"]
              : []),
            images[0] ? "팝업 이미지 · 등록한 사진으로 표시" : "팝업 이미지 · 없음 (글자만 표시)",
          ]
        : [
            target === "클리닉"
              ? "파트너 공지 · 클리닉 담당자에게만 전달"
              : `홈 탭 공지 · "${title.trim()}" 목록 맨 위에 추가`,
            `전달 대상 · ${target}`,
          ],
    );
    setTitle("");
    setBody("");
    setImages([]);
    toast(asPopup ? "팝업을 등록했습니다" : "공지를 등록했습니다");
  }

  function togglePopup(popupId: string) {
    update((draft) => {
      const target2 = draft.popups.find((p) => p.id === popupId);
      if (!target2) return;
      const next = !target2.active;
      draft.popups.forEach((p) => {
        p.active = false;
      });
      target2.active = next;
    });
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <SectionTitle
          title="공지 · 팝업 등록"
          sub="공지는 대상별로 전달되고, 팝업은 홈 탭 맨 위에 이미지와 함께 노출됩니다"
        />
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className={inputClass}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="내용"
            className={`${inputClass} resize-none`}
          />
          <div className="flex gap-2">
            <GhostButton active={!asPopup} onClick={() => setAsPopup(false)}>
              공지
            </GhostButton>
            <GhostButton active={asPopup} onClick={() => setAsPopup(true)}>
              팝업
            </GhostButton>
          </div>

          {asPopup ? (
            <div className="space-y-3 rounded-cell bg-white/70 p-3 hairline">
              <div>
                <div className="mb-2 text-xs font-semibold text-ink-sub">
                  기본 이미지에서 고르기
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {POPUP_PRESETS.map((preset) => (
                    <button
                      key={preset.src}
                      type="button"
                      onClick={() =>
                        setImages(images[0] === preset.src ? [] : [preset.src])
                      }
                      className={`overflow-hidden rounded-cell text-left transition hairline ${
                        images[0] === preset.src
                          ? "ring-2 ring-ink"
                          : "bg-white/60 hover:bg-white"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="h-16 w-full object-cover"
                      />
                      <span className="block px-2 py-1 text-[11px] font-semibold">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <PhotoPicker
                images={images}
                onChange={setImages}
                max={1}
                label="직접 올리기 (1장)"
                hint="넣지 않으면 텍스트만 있는 팝업이 됩니다"
              />
            </div>
          ) : (
            <div>
              <div className="mb-2 text-xs font-semibold text-ink-sub">
                받는 대상
              </div>
              <div className="flex flex-wrap gap-2">
                {NOTICE_TARGETS.map((tg) => (
                  <GhostButton
                    key={tg}
                    active={target === tg}
                    onClick={() => setTarget(tg)}
                  >
                    {tg}
                  </GhostButton>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-ink-sub">
                유저 · 전체 → 홈 탭 공지사항 / 클리닉 · 전체 → 파트너 CRM 공지
              </p>
            </div>
          )}

          <InkButton onClick={submit}>등록</InkButton>

          {note && (
            <LinkedNote
              note={note}
              title="고객 화면에 바로 반영됐습니다"
              onClose={dismiss}
            />
          )}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="등록된 팝업" />
        <div className="space-y-2">
          {db.popups.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-cell bg-white/70 p-4 hairline"
            >
              <div className="flex min-w-0 items-center gap-3">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt=""
                    className="size-12 shrink-0 rounded-cell object-cover"
                  />
                )}
                <div className="min-w-0 text-sm">
                  <div className="font-semibold">{p.title}</div>
                  <div className="truncate text-xs text-ink-sub">{p.body}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={p.active ? "pink" : "neutral"}>
                  {p.active ? "노출중" : "숨김"}
                </Badge>
                <GhostButton onClick={() => togglePopup(p.id)}>
                  {p.active ? "내리기" : "노출"}
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="공지 목록" />
        <div className="space-y-2">
          {db.notices.map((n) => (
            <div key={n.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold">{n.title}</span>
                <Badge tone={n.target === "클리닉" ? "neutral" : "pink"}>
                  {n.target}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-sub">{n.body}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

const STATUSES: AccountStatus[] = ["사용가능", "홀드", "차단"];

function AccountSection() {
  const { db, update } = useDb();
  const toast = useToast();
  const [reveal, setReveal] = useState(false);
  const [kind, setKind] = useState<"clinic" | "user">("clinic");
  if (!db) return null;

  function setPassword(accountId: string, value: string) {
    update((draft) => {
      const account = draft.accounts.find((a) => a.id === accountId);
      if (account) account.password = value;
    });
  }

  function setStatus(accountId: string, status: AccountStatus) {
    update((draft) => {
      const account = draft.accounts.find((a) => a.id === accountId);
      if (!account) return;
      account.status = status;
      if (account.kind === "user") {
        const userId = account.id.replace("AC-", "");
        const user = draft.users.find((u) => u.id === userId);
        if (user) user.blocked = status === "차단";
      }
    });
    toast(`상태를 ${status}(으)로 변경했습니다`);
  }

  const rows = db.accounts.filter((a) => a.kind === kind);
  const clinicCount = db.accounts.filter((a) => a.kind === "clinic").length;
  const userCount = db.accounts.length - clinicCount;

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="계정 · 비밀번호 관리"
        sub="홀드는 로그인만 막고 데이터는 유지, 차단은 전면 사용 정지입니다"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <GhostButton active={kind === "clinic"} onClick={() => setKind("clinic")}>
          클리닉 ({clinicCount})
        </GhostButton>
        <GhostButton active={kind === "user"} onClick={() => setKind("user")}>
          유저 ({userCount})
        </GhostButton>
        <GhostButton active={reveal} onClick={() => setReveal(!reveal)}>
          {reveal ? "비밀번호 가리기" : "비밀번호 보기"}
        </GhostButton>
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {rows.map((a) => (
          <div key={a.id} className="rounded-cell bg-white/70 p-4 hairline">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold">{a.label}</div>
                <div className="text-xs text-ink-sub">{a.loginId}</div>
              </div>
              <input
                type={reveal ? "text" : "password"}
                value={a.password}
                onChange={(e) => setPassword(a.id, e.target.value)}
                className="w-40 rounded-cell bg-white px-3 py-2 text-sm outline-none hairline"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-sub">상태</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(a.id, s)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-medium transition ${
                    a.status === s
                      ? s === "차단"
                        ? "bg-danger text-white"
                        : s === "홀드"
                          ? "bg-hb-400 text-white"
                          : "bg-ink text-white"
                      : "bg-white text-ink-sub hairline hover:bg-hb-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <InkButton onClick={() => toast("계정 정보를 저장했습니다")}>
          저장
        </InkButton>
      </div>
    </GlassCard>
  );
}

function DemoReset() {
  const { reset } = useDb();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  return (
    <GlassCard
      soft
      className="flex flex-wrap items-center justify-between gap-3 p-5"
    >
      <div className="text-sm">
        <div className="font-semibold">데모 리셋</div>
        <div className="text-xs text-ink-sub">
          모든 수정 내역을 지우고 초기 데모 데이터로 되돌립니다
        </div>
      </div>
      {confirming ? (
        <div className="flex gap-2">
          <GhostButton onClick={() => setConfirming(false)}>취소</GhostButton>
          <button
            type="button"
            onClick={() => {
              reset();
              setConfirming(false);
              toast("초기 데모 데이터로 되돌렸습니다");
            }}
            className="rounded-pill bg-danger px-4 py-2 text-sm font-medium text-white transition hover:brightness-95"
          >
            정말 리셋
          </button>
        </div>
      ) : (
        <GhostButton onClick={() => setConfirming(true)}>리셋하기</GhostButton>
      )}
    </GlassCard>
  );
}
