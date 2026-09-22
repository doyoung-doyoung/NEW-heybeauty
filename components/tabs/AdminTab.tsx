"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { isLowStock, LOW_STOCK_QTY } from "@/lib/stock";
import { TREATMENT_POOL } from "@/lib/seed";
import {
  BASELINE_TOTAL,
  COMMISSION_BASELINE,
  dateFromDaysAgo,
  recentMonths,
} from "@/lib/commission";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { LinkedNote, useLinkedNote } from "@/components/ui/LinkedNote";
import {
  Table,
  TableOnly,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/ui/DataTable";
import type { AccountStatus, Hours, NoticeTarget } from "@/lib/types";
import {
  BackToList,
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
    </div>
  );
}

function InventorySection() {
  const { db } = useDb();
  const [onlyLow, setOnlyLow] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openLogId, setOpenLogId] = useState<string | null>(null);
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

    const openLog = openLogId ? logs.find((l) => l.id === openLogId) : null;

    return (
      <div className="space-y-4">
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
          <BackToList onClick={() => setOpenId(null)} label="재고 목록으로" />
        </GlassCard>

        <GlassCard soft className="p-6">
          {/* 기록 하나를 고르면 같은 카드 안에서 표가 상세로 바뀐다. 화면을 갈아엎지 않으니
              "어느 제품 얘기였지"를 다시 찾을 필요가 없다. */}
          {openLog ? (
            <>
              <SectionTitle
                title={`${openLog.type} ${openLog.qty}${openLog.type === "사용" ? "개 차감" : "개"}`}
                sub={openLog.at.slice(0, 10)}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: "구분", value: openLog.type },
                  {
                    label: "수량",
                    value: `${openLog.type === "사용" ? "-" : "+"}${openLog.qty}`,
                  },
                  { label: "사유", value: openLog.reason },
                  { label: "처리자", value: openLog.by },
                  { label: "일시", value: openLog.at.slice(0, 16).replace("T", " ") },
                  { label: "대상 재고", value: `${product?.name ?? "-"} · ${openLog.id}` },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between gap-3 rounded-cell bg-white/70 px-4 py-3 text-sm hairline"
                  >
                    <span className="text-xs text-ink-sub">{r.label}</span>
                    <span className="truncate font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
              <BackToList onClick={() => setOpenLogId(null)} />
            </>
          ) : (
            <>
              <SectionTitle
                title="입출고 기록"
                sub={`총 ${logs.length}건 · 줄을 누르면 상세가 열립니다`}
              />
              <TableOnly maxH="max-h-[24rem]">
                <Table minW="min-w-[34rem]">
                  <Thead>
                    <Th stick>일자</Th>
                    <Th>구분</Th>
                    <Th align="right">수량</Th>
                    <Th>사유</Th>
                    <Th>처리자</Th>
                  </Thead>
                  <tbody>
                    {logs.map((l) => (
                      <Tr key={l.id} onClick={() => setOpenLogId(l.id)}>
                        <Td stick nums className="font-medium">
                          {l.at.slice(0, 10)}
                        </Td>
                        <Td>
                          <Badge tone={l.type === "사용" ? "neutral" : "pink"}>
                            {l.type}
                          </Badge>
                        </Td>
                        <Td
                          align="right"
                          nums
                          className={`font-semibold ${l.type === "사용" ? "text-danger" : ""}`}
                        >
                          {l.type === "사용" ? "-" : "+"}
                          {l.qty}
                        </Td>
                        <Td muted>{l.reason}</Td>
                        <Td muted>{l.by}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableOnly>
              {logs.length === 0 && (
                <p className="mt-3 text-sm text-ink-sub">기록이 없습니다.</p>
              )}
            </>
          )}
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

      {/* 넓은 화면: 표. 64건을 위아래로 훑으며 지점끼리 비교할 수 있어야 한다. */}
      <TableOnly maxH="max-h-[32rem]">
        <Table minW="min-w-[56rem]">
          <Thead>
            <Th stick>제품</Th>
            <Th>클리닉 · 지점</Th>
            <Th align="right">잔여</Th>
            <Th>유효기간</Th>
            <Th>LOT</Th>
            <Th>공급처</Th>
            <Th>담당</Th>
            <Th align="right">매입</Th>
            <Th align="right">판매</Th>
            <Th />
          </Thead>
          <tbody>
            {rows.map((item) => {
              const product = db.products.find((p) => p.id === item.productId);
              const branch = db.branches.find((b) => b.id === item.branchId);
              const clinic = db.clinics.find((c) => c.id === item.clinicId);
              const low = isLowStock(item);
              return (
                <Tr
                  key={item.id}
                  tone={low ? "danger" : undefined}
                  onClick={() => {
                    setOpenId(item.id);
                    setOpenLogId(null);
                  }}
                >
                  {/* 폭을 좁혀 두는 건 폰 때문이다. 제품명이 길면 고정된 첫 칸이 화면의
                      3분의 2를 먹어서 정작 볼 숫자가 안 보인다. 넓은 화면에선 풀어 준다. */}
                  <Td
                    stick
                    className="max-w-[9rem] truncate font-medium lg:max-w-none"
                  >
                    {product?.name}
                  </Td>
                  <Td muted>
                    {clinic?.name} · {branch?.name}
                  </Td>
                  <Td align="right" nums>
                    <span className={`font-bold ${low ? "text-danger" : ""}`}>
                      {item.qty}
                    </span>
                    {low && (
                      <span className="ml-1 text-[10px] font-medium text-danger">
                        부족
                      </span>
                    )}
                  </Td>
                  <Td muted nums>
                    {item.expiry}
                  </Td>
                  <Td muted>{item.lotNo}</Td>
                  <Td muted>{item.supplier}</Td>
                  <Td muted>{item.manager}</Td>
                  <Td align="right" muted nums>
                    ฿{item.purchasePrice.toLocaleString()}
                  </Td>
                  <Td align="right" nums>
                    ฿{item.salePrice.toLocaleString()}
                  </Td>
                  <Td align="right">
                    <span className="whitespace-nowrap rounded-pill px-2.5 py-1 text-xs text-ink-sub hairline">
                      상세
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableOnly>

    </GlassCard>
  );
}

/** 후기 한 건이 지금까지 만들어 낸 돈. 과거 실적 한 줄 + 이번 데모에서 더해진 금액. */
type Settlement = {
  code: string;
  clinicId: string;
  reviewer: string;
  rating: number;
  review: string;
  /** 이 코드를 타고 들어온 예약 수 */
  clicks: number;
  /** 총 발생액 */
  amountTHB: number;
  /** 그중 이번 데모에서 새로 더해진 금액. 0이면 과거 실적 그대로다. */
  addedTHB: number;
  monthsAgo: number;
};

/** `at`이 몇 달 전인지. 0이면 이번 달. */
function monthsAgoOf(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  return (
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  );
}

/**
 * 과거 실적(`lib/commission.ts`)을 깔고, 그 위에 `db.commissions`를 **더한다.**
 * 같은 후기코드로 새 예약이 들어오면 그 줄의 클릭 수와 금액이 올라가고,
 * 기초에 없던 코드(데모 중에 발행한 것)는 새 줄로 맨 앞에 붙는다.
 */
function buildSettlements(db: NonNullable<ReturnType<typeof useDb>["db"]>) {
  const byCode = new Map<string, Settlement>();

  for (const row of COMMISSION_BASELINE) {
    byCode.set(row.code, {
      code: row.code,
      clinicId: row.clinicId,
      reviewer: row.reviewer,
      rating: row.rating,
      review: row.review,
      clicks: row.clicks,
      amountTHB: row.amountTHB,
      addedTHB: 0,
      monthsAgo: row.monthsAgo,
    });
  }

  for (const c of db.commissions) {
    const rc = db.reviewCodes.find((x) => x.id === c.reviewCodeId);
    if (!rc) continue;
    const hit = byCode.get(rc.code);
    if (hit) {
      hit.clicks += 1;
      hit.amountTHB += c.amountTHB;
      hit.addedTHB += c.amountTHB;
      continue;
    }
    const review = db.reviews.find((r) => r.code === rc.code);
    const owner = db.users.find((u) => u.id === rc.ownerUserId);
    byCode.set(rc.code, {
      code: rc.code,
      clinicId: rc.clinicId,
      reviewer: owner?.name ?? rc.ownerName ?? "-",
      rating: review?.rating ?? 0,
      review: review?.text ?? "후기 내용이 아직 없습니다",
      clicks: 1,
      amountTHB: c.amountTHB,
      addedTHB: c.amountTHB,
      monthsAgo: monthsAgoOf(c.at),
    });
  }

  // 새로 더해진 줄이 위로 오게. 그다음은 금액 큰 순.
  return [...byCode.values()].sort(
    (a, b) => b.addedTHB - a.addedTHB || b.amountTHB - a.amountTHB,
  );
}

function ReviewSection() {
  const { db, update } = useDb();
  const [openClinic, setOpenClinic] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<number | null>(null);
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

  const settlements = buildSettlements(db);
  const addedTotal = db.commissions.reduce((s, c) => s + c.amountTHB, 0);
  const totalCommission = BASELINE_TOTAL + addedTotal;

  // 월별 막대. 과거 실적은 `monthsAgo`를, 새로 생긴 건은 날짜에서 계산한 달을 쓴다.
  const months = recentMonths(6).map((m) => {
    const rows = settlements.filter((s) => s.monthsAgo === m.monthsAgo);
    return {
      ...m,
      amount: rows.reduce((s, r) => s + r.amountTHB, 0),
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
    };
  });

  // 클리닉별 합계. 정산액이 큰 곳이 위로.
  const byClinic = db.clinics
    .map((c) => {
      const rows = settlements.filter((s) => s.clinicId === c.id);
      return {
        clinic: c,
        codes: rows.length,
        clicks: rows.reduce((s, r) => s + r.clicks, 0),
        amount: rows.reduce((s, r) => s + r.amountTHB, 0),
        added: rows.reduce((s, r) => s + r.addedTHB, 0),
      };
    })
    .filter((r) => r.codes > 0)
    .sort((a, b) => b.amount - a.amount);

  const detail = openClinic
    ? settlements.filter((s) => s.clinicId === openClinic)
    : [];
  const detailClinic = db.clinics.find((c) => c.id === openClinic);

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
          title="발행된 후기코드"
          sub={`총 ${db.reviewCodes.length}건 · 시술을 받은 고객에게만 발행됩니다`}
        />
        <CodeTable />
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle
          title="커미션 정산"
          sub="후기코드를 타고 들어온 예약에서 발생한 금액입니다"
        />

        {/* 누적액을 크게 한 번. 그 밑에 "기초 + 이번에 더해진 것"으로 쪼개 보여준다 —
            데모 중에 예약을 하나 넣으면 이 줄이 바로 올라가는 걸 보여주려는 것이다. */}
        <div className="mb-5 rounded-cell bg-white/70 p-5 hairline">
          <div className="text-xs text-ink-sub">누적 정산액</div>
          <div className="mt-1 text-3xl font-extrabold tabular-nums">
            ฿{totalCommission.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-ink-sub tabular-nums">
            기존 실적 ฿{BASELINE_TOTAL.toLocaleString()}
            {addedTotal > 0 && (
              <span className="ml-1 font-semibold text-hb-600">
                + 신규 ฿{addedTotal.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <MonthChart
          months={months}
          openMonth={openMonth}
          onPick={(m) => setOpenMonth(openMonth === m ? null : m)}
        />

        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold">
            클리닉별 정산
            <span className="ml-2 text-xs font-normal text-ink-sub">
              줄을 누르면 후기 한 건씩 뜯어봅니다
            </span>
          </div>
          <TableOnly maxH="max-h-[26rem]">
            <Table minW="min-w-[34rem]">
              <Thead>
                <Th stick>클리닉</Th>
                <Th align="right">후기코드</Th>
                <Th align="right">클릭</Th>
                <Th align="right">정산액</Th>
                <Th align="right">신규</Th>
              </Thead>
              <tbody>
                {byClinic.map((r) => (
                  <Tr
                    key={r.clinic.id}
                    onClick={() =>
                      setOpenClinic(openClinic === r.clinic.id ? null : r.clinic.id)
                    }
                  >
                    <Td
                      stick
                      className={`max-w-[10rem] truncate lg:max-w-none ${
                        openClinic === r.clinic.id ? "font-bold" : "font-medium"
                      }`}
                    >
                      {r.clinic.name}
                    </Td>
                    <Td align="right" muted nums>
                      {r.codes}
                    </Td>
                    <Td align="right" muted nums>
                      {r.clicks.toLocaleString()}
                    </Td>
                    <Td align="right" nums className="font-semibold">
                      ฿{r.amount.toLocaleString()}
                    </Td>
                    <Td align="right" nums>
                      {r.added > 0 ? (
                        <span className="font-semibold text-hb-600">
                          +฿{r.added.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-ink-sub">–</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableOnly>
        </div>

        {detailClinic && (
          <div className="animate-rise mt-5 rounded-cell bg-white/70 p-5 hairline">
            <SectionTitle
              title={detailClinic.name}
              sub={`후기 ${detail.length}건 · 고객 후기 한 건이 얼마를 만들었는지`}
            />
            {/* 후기 본문만 `wrap`을 켠다. 한 줄로 두면 표가 화면 몇 개 폭으로 늘어난다. */}
            <TableOnly maxH="max-h-[32rem]">
              <Table minW="min-w-[52rem]">
                <Thead>
                  <Th stick>후기자</Th>
                  <Th>별점</Th>
                  <Th>후기코드</Th>
                  <Th>후기 내용</Th>
                  <Th align="right">예약</Th>
                  <Th align="right">건당 평균</Th>
                  <Th align="right">정산액</Th>
                </Thead>
                <tbody>
                  {detail.map((s) => (
                    <Tr key={s.code}>
                      <Td stick className="font-medium">
                        {s.reviewer}
                      </Td>
                      <Td muted>{"★".repeat(s.rating)}</Td>
                      <Td muted nums>
                        {s.code}
                      </Td>
                      <Td wrap muted className="max-w-[20rem] text-ink/80">
                        {s.review}
                      </Td>
                      <Td align="right" nums muted>
                        {s.clicks.toLocaleString()}건
                      </Td>
                      {/* 안 쓰인 코드는 클릭이 0이라 나누면 NaN이 된다. 그럴 땐 줄표. */}
                      <Td align="right" nums muted>
                        {s.clicks > 0
                          ? `฿${Math.round(s.amountTHB / s.clicks).toLocaleString()}`
                          : "–"}
                      </Td>
                      <Td align="right" nums className="font-semibold">
                        ฿{s.amountTHB.toLocaleString()}
                        {s.addedTHB > 0 && (
                          <span className="ml-1 text-xs font-semibold text-hb-600">
                            (+{s.addedTHB.toLocaleString()})
                          </span>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableOnly>

            <BackToList onClick={() => setOpenClinic(null)} label="정산 표로" />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/**
 * 월별 발생액 기둥 차트. 기둥을 누르면 그 달의 금액과 클릭 수가 위에 뜬다.
 * 폰에서는 기둥 폭이 45px밖에 안 돼서 금액을 항상 띄울 수가 없다 — 그래서 눌러서 보는 방식이다.
 */
function MonthChart({
  months,
  openMonth,
  onPick,
}: {
  months: { monthsAgo: number; label: string; amount: number; clicks: number }[];
  openMonth: number | null;
  onPick: (monthsAgo: number) => void;
}) {
  const max = Math.max(1, ...months.map((m) => m.amount));
  const picked = months.find((m) => m.monthsAgo === openMonth);

  return (
    <div className="rounded-cell bg-white/70 p-5 hairline">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">월별 발생액</span>
        <span className="text-xs text-ink-sub tabular-nums">
          {picked
            ? `${picked.label} · 클릭 ${picked.clicks.toLocaleString()}건 · ฿${picked.amount.toLocaleString()}`
            : "기둥을 누르면 그 달 금액이 보입니다"}
        </span>
      </div>

      <div className="mt-4 flex h-40 items-end gap-2">
        {months.map((m) => {
          const on = m.monthsAgo === openMonth;
          return (
            <button
              key={m.monthsAgo}
              type="button"
              onClick={() => onPick(m.monthsAgo)}
              className="flex h-full flex-1 cursor-pointer flex-col justify-end gap-1.5"
            >
              <span
                className={`rounded-cell transition-[height,background-color] duration-700 ${
                  on ? "bg-ink" : "bg-hb-400 hover:bg-hb-600"
                }`}
                style={{ height: `${Math.max(4, (m.amount / max) * 100)}%` }}
              />
              <span
                className={`text-[11px] ${on ? "font-bold" : "text-ink-sub"}`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 발행된 후기코드 전체 목록. 과거 실적으로 깔아 둔 20건과 데모 중 발행한 것이 함께 나온다. */
function CodeTable() {
  const { db } = useDb();
  if (!db) return null;

  const baseline = new Map(COMMISSION_BASELINE.map((r) => [r.code, r]));

  const rows = db.reviewCodes.map((rc) => {
    const base = baseline.get(rc.code);
    const live = db.commissions.filter((c) => c.reviewCodeId === rc.id);
    const owner = db.users.find((u) => u.id === rc.ownerUserId);
    return {
      code: rc.code,
      clinic: db.clinics.find((c) => c.id === rc.clinicId)?.name ?? "-",
      owner: owner?.name ?? rc.ownerName ?? "-",
      issuedAt: base ? dateFromDaysAgo(base.daysAgo) : rc.issuedAt.slice(0, 10),
      clicks: (base?.clicks ?? 0) + rc.usedByBookingIds.length,
      amount:
        (base?.amountTHB ?? 0) + live.reduce((s, c) => s + c.amountTHB, 0),
    };
  });

  return (
    <TableOnly maxH="max-h-[26rem]">
      <Table minW="min-w-[40rem]">
        <Thead>
          <Th stick>코드</Th>
          <Th>클리닉</Th>
          <Th>발행 고객</Th>
          <Th>발행일</Th>
          <Th align="right">클릭</Th>
          <Th align="right">발생 커미션</Th>
        </Thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.code}>
              <Td stick className="font-medium">
                {r.code}
              </Td>
              <Td muted className="max-w-[10rem] truncate lg:max-w-none">
                {r.clinic}
              </Td>
              <Td muted>{r.owner}</Td>
              <Td muted nums>
                {r.issuedAt}
              </Td>
              <Td align="right" muted nums>
                {r.clicks.toLocaleString()}
              </Td>
              <Td align="right" nums className="font-semibold">
                ฿{r.amount.toLocaleString()}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableOnly>
  );
}

function UserSection() {
  const { db, update } = useDb();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
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

  /**
   * 누적 구매금액. 실제 예약이 붙어 있는 계정은 예약을 더해서 내고, 표를 채우려고
   * 만든 시연용 계정은 `seedSpentTHB`에 들어 있는 숫자를 그대로 쓴다.
   * (가짜 유저 95명에게 가짜 예약까지 만들면 파트너 예약확인 화면이 흔들린다.)
   */
  function spent(userId: string) {
    const user = db!.users.find((u) => u.id === userId);
    const fromBookings = db!.bookings
      .filter((b) => b.userId === userId && b.status !== "취소")
      .reduce((sum, b) => {
        const treatment = db!.treatments.find((t) => t.id === b.treatmentId);
        return sum + (treatment?.price ?? 0);
      }, 0);
    return fromBookings || (user?.seedSpentTHB ?? 0);
  }

  function visits(userId: string) {
    const user = db!.users.find((u) => u.id === userId);
    const fromBookings = db!.bookings.filter(
      (b) => b.userId === userId && b.status !== "취소",
    ).length;
    return fromBookings || (user?.seedVisits ?? 0);
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

  const openUser = openId ? db.users.find((u) => u.id === openId) : null;

  if (openUser) {
    const total = spent(openUser.id);
    const count = visits(openUser.id);
    return (
      <GlassCard className="p-6">
        <SectionTitle
          title={openUser.name}
          sub={`${openUser.lineId} · ${openUser.phone}`}
        />

        <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="flex items-center justify-between rounded-cell bg-white/70 px-4 py-2.5 text-sm hairline">
            <span className="text-xs text-ink-sub">계정 상태</span>
            <Badge tone={openUser.blocked ? "danger" : "neutral"}>
              {openUser.blocked ? "차단됨" : "정상"}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-cell bg-white/70 px-4 py-2.5 text-sm hairline">
            <span className="text-xs text-ink-sub">유저 ID</span>
            <span className="font-semibold tabular-nums">{openUser.id}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <GhostButton
            active={noticeFor === openUser.id}
            onClick={() =>
              setNoticeFor(noticeFor === openUser.id ? null : openUser.id)
            }
          >
            공지 보내기
          </GhostButton>
          <GhostButton onClick={() => toggleBlock(openUser.id)}>
            {openUser.blocked ? "차단 해제" : "차단"}
          </GhostButton>
        </div>

        {noticeFor === openUser.id && (
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
            <InkButton arrow={false} onClick={() => sendNotice(openUser.id)}>
              보내기
            </InkButton>
          </div>
        )}

        <BackToList onClick={() => setOpenId(null)} label="유저 목록으로" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="유저 관리"
        sub={`총 ${db.users.length}명 · 줄을 누르면 상세와 공지 보내기가 열립니다`}
      />
      <TableOnly maxH="max-h-[34rem]">
        <Table minW="min-w-[40rem]">
          <Thead>
            <Th stick>이름</Th>
            <Th>LINE ID</Th>
            <Th>전화</Th>
            <Th align="right">총 구매금액</Th>
            <Th align="right">이용</Th>
            <Th>상태</Th>
          </Thead>
          <tbody>
            {db.users.map((u) => (
              <Tr
                key={u.id}
                onClick={() => {
                  setOpenId(u.id);
                  setNoticeFor(null);
                }}
                tone={u.blocked ? "danger" : undefined}
              >
                <Td stick className="font-medium">
                  {u.name}
                </Td>
                <Td muted>{u.lineId}</Td>
                <Td muted nums>
                  {u.phone}
                </Td>
                <Td align="right" nums className="font-semibold">
                  ฿{spent(u.id).toLocaleString()}
                </Td>
                <Td align="right" nums muted>
                  {visits(u.id)}건
                </Td>
                <Td>
                  <Badge tone={u.blocked ? "danger" : "neutral"}>
                    {u.blocked ? "차단됨" : "정상"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableOnly>
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
          <SectionTitle title="지점 목록" sub={`총 ${branches.length}곳`} />
          {branches.length === 0 ? (
            <p className="text-sm text-ink-sub">등록된 지점이 없습니다.</p>
          ) : (
            <TableOnly>
              <Table minW="min-w-[30rem]">
                <Thead>
                  <Th stick>지점명</Th>
                  <Th>주소</Th>
                  <Th>전화</Th>
                </Thead>
                <tbody>
                  {branches.map((b) => (
                    <Tr key={b.id}>
                      <Td stick className="font-medium">
                        {b.name}
                      </Td>
                      <Td muted>{b.address}</Td>
                      <Td muted nums>
                        {b.phone}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableOnly>
          )}

          <BackToList onClick={() => setClinicId(null)} label="클리닉 목록으로" />
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

      <TableOnly>
        <Table minW="min-w-[42rem]">
          <Thead>
            <Th stick>클리닉</Th>
            <Th>지역</Th>
            <Th>전화</Th>
            <Th>구분</Th>
            <Th align="right">평점</Th>
            <Th align="right">후기</Th>
          </Thead>
          <tbody>
            {db.clinics.map((c) => {
              const branchCount = db.branches.filter(
                (b) => b.clinicId === c.id,
              ).length;
              return (
                <Tr key={c.id} onClick={() => setClinicId(c.id)}>
                  <Td stick className="font-medium">
                    {c.name}
                  </Td>
                  <Td muted>{c.district}</Td>
                  <Td muted nums>
                    {c.phone}
                  </Td>
                  <Td>
                    <Badge tone={c.hasBranches ? "pink" : "neutral"}>
                      {c.hasBranches ? `지점 ${branchCount}` : "일반"}
                    </Badge>
                  </Td>
                  <Td align="right" nums className="font-semibold">
                    ★ {c.rating}
                  </Td>
                  <Td align="right" nums muted>
                    {c.reviewCount}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableOnly>
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

      <TableOnly maxH="max-h-[30rem]">
        <Table minW="min-w-[44rem]">
          <Thead>
            <Th stick>계정</Th>
            <Th>로그인 ID</Th>
            <Th>비밀번호</Th>
            <Th>상태</Th>
          </Thead>
          <tbody>
            {rows.map((a) => (
              <Tr key={a.id} tone={a.status === "차단" ? "danger" : undefined}>
                {/*
                 * "○○ 마스터 계정"에서 뒤쪽 두 글자를 떼고 이름만 보여준다.
                 * 줄마다 똑같이 붙는 말이라 읽을 게 없는데, 첫 칸은 폰에서 왼쪽에
                 * 고정되기 때문에 그 폭만큼 화면을 계속 먹는다. 실제로 293px짜리
                 * 스크롤 창에서 237px을 가져가 비밀번호 칸까지 밀어 버렸다.
                 * 클리닉/유저 구분은 위 필터 버튼이 이미 말해 주고 있다.
                 */}
                <Td stick className="font-medium">
                  <span className="block max-w-[11rem] truncate" title={a.label}>
                    {a.label.replace(/\s*(마스터|유저) 계정$/, "")}
                  </span>
                </Td>
                <Td muted>{a.loginId}</Td>
                <Td>
                  <input
                    type={reveal ? "text" : "password"}
                    value={a.password}
                    onChange={(e) => setPassword(a.id, e.target.value)}
                    className="w-32 rounded-cell bg-white px-3 py-1.5 text-sm outline-none hairline"
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(a.id, s)}
                        className={`rounded-pill px-2.5 py-1 text-xs font-medium transition ${
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
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableOnly>

      <div className="mt-5">
        <InkButton onClick={() => toast("계정 정보를 저장했습니다")}>
          저장
        </InkButton>
      </div>
    </GlassCard>
  );
}

/*
 * 데모 리셋은 여기 있었는데 `components/ui/DemoReset.tsx`로 옮겼다.
 * 어드민 탭 맨 아래에 두면 시연 중에 화면에 잡혀서, 탭 줄 오른쪽 바깥으로 보냈다.
 */
