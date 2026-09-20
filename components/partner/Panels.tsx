"use client";

import { useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { isLowStock } from "@/lib/stock";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
  SectionTitle,
} from "@/components/ui/primitives";
import type { Channel } from "@/lib/types";

const inputClass =
  "w-full rounded-cell bg-white/75 px-3 py-2 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white";

// 자사 앱은 화면에 "헤이뷰티"로 보여준다. 데이터 값은 App 그대로 유지.
const CHANNEL_LABEL: Record<Channel, string> = {
  LINE: "LINE",
  Meta: "Meta",
  App: "헤이뷰티",
};

function ChannelIcon({ channel }: { channel: Channel }) {
  if (channel === "LINE") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#06C755] text-[9px] font-black text-white">
        L
      </span>
    );
  }
  if (channel === "Meta") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#0866FF] text-[9px] font-black text-white">
        f
      </span>
    );
  }
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-hb-600 text-[9px] font-black text-white">
      H
    </span>
  );
}

function ChannelTag({ channel }: { channel: Channel }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/80 px-2 py-1 text-xs font-medium text-ink-sub hairline">
      <ChannelIcon channel={channel} />
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

export function InboxPanel({ branchId }: { branchId: string }) {
  const { db, update } = useDb();
  const [filter, setFilter] = useState<Channel | "전체">("전체");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  if (!db) return null;

  const threads = db.inbox
    .filter((t) => t.branchId === branchId)
    .filter((t) => filter === "전체" || t.channel === filter);
  const open = db.inbox.find((t) => t.id === openId);

  function openThread(id: string) {
    setOpenId(id);
    update((draft) => {
      const t = draft.inbox.find((x) => x.id === id);
      if (t) t.unread = false;
    });
  }

  function send() {
    const text = reply.trim();
    if (!text || !openId) return;
    setReply("");
    update((draft) => {
      const t = draft.inbox.find((x) => x.id === openId);
      if (!t) return;
      const at = new Date().toISOString();
      t.messages.push({
        id: `${t.id}-M${t.messages.length + 1}`,
        role: "clinic",
        text,
        at,
      });
      t.updatedAt = at;

      const chat = draft.chats
        .filter((c) => c.kind === "clinic" && c.clinicId === t.clinicId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      if (t.channel === "App" && chat) {
        chat.messages.push({
          id: `${chat.id}-M${chat.messages.length + 1}`,
          role: "clinic",
          text,
          at,
        });
        chat.updatedAt = at;
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <GlassCard soft className="h-fit min-w-0 p-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["전체", "LINE", "Meta", "App"] as const).map((c) => (
            <GhostButton
              key={c}
              active={filter === c}
              onClick={() => setFilter(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {c !== "전체" && <ChannelIcon channel={c} />}
              {c === "전체" ? "전체" : CHANNEL_LABEL[c]}
            </GhostButton>
          ))}
        </div>
        <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openThread(t.id)}
              className={`w-full rounded-cell px-3 py-2.5 text-left transition ${
                openId === t.id ? "bg-ink text-white" : "hover:bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {t.customerName}
                </span>
                {t.unread && (
                  <span className="size-2 shrink-0 rounded-pill bg-danger" />
                )}
              </div>
              <div
                className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${openId === t.id ? "text-white/60" : "text-ink-sub"}`}
              >
                <ChannelIcon channel={t.channel} />
                <span className="truncate">
                  {t.messages[t.messages.length - 1]?.text ?? ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="flex min-h-[26rem] min-w-0 flex-col p-5">
        {!open ? (
          <p className="m-auto text-sm text-ink-sub">
            왼쪽에서 문의를 선택하세요.
          </p>
        ) : (
          <>
            <div className="border-b border-ink/10 pb-3">
              <div className="font-bold">{open.customerName}</div>
              <div className="mt-1">
                <ChannelTag channel={open.channel} />
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4 pr-1">
              {open.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "clinic" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-card px-4 py-3 text-sm leading-relaxed ${
                      m.role === "clinic"
                        ? "bg-ink text-white"
                        : "bg-white/75 text-ink hairline"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form
              className="flex items-center gap-2 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="답장을 입력하세요"
                className="flex-1 rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
              />
              <InkButton onClick={send}>보내기</InkButton>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}

export function CustomerPanel({ branchId }: { branchId: string }) {
  const { db, update } = useDb();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [nation, setNation] = useState("전체");
  const [gender, setGender] = useState<"전체" | "여" | "남">("전체");
  const [channel, setChannel] = useState<Channel | "전체">("전체");
  const [openId, setOpenId] = useState<string | null>(null);
  if (!db) return null;

  const all = db.customers.filter((c) => c.branchId === branchId);
  const nations = ["전체", ...Array.from(new Set(all.map((c) => c.nationality)))];

  const customers = all
    .filter(
      (c) =>
        !query.trim() ||
        c.name.includes(query.trim()) ||
        c.phone.includes(query.trim()),
    )
    .filter((c) => nation === "전체" || c.nationality === nation)
    .filter((c) => gender === "전체" || c.gender === gender)
    .filter((c) => channel === "전체" || c.channel === channel);

  const open = openId ? all.find((c) => c.id === openId) : null;

  if (open) {
    const doctor = db.doctors.find((d) => d.id === open.doctorId);
    const charts = db.charts.filter((x) => x.customerId === open.id);
    const spent = charts.reduce((s, x) => s + x.paidAmount, 0);
    const rows: { label: string; value: string }[] = [
      { label: "전화번호", value: open.phone },
      { label: "생년월일", value: open.birthday },
      { label: "성별", value: open.gender },
      { label: "국가", value: open.nationality },
      { label: "유입 경로", value: CHANNEL_LABEL[open.channel] },
      { label: "담당 의사", value: doctor?.name ?? "-" },
      { label: "관심 시술", value: open.interests.join(", ") },
      { label: "등록일", value: open.createdAt.slice(0, 10) },
    ];

    return (
      <div className="space-y-4">
        <GhostButton onClick={() => setOpenId(null)}>← 목록으로</GhostButton>

        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{open.name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ChannelTag channel={open.channel} />
                <Badge>{open.nationality}</Badge>
                <Badge tone="pink">{open.gender}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-ink-sub">누적 결제</div>
              <div className="text-2xl font-bold tabular-nums">
                ฿{spent.toLocaleString()}
              </div>
              <div className="text-xs text-ink-sub">방문 {charts.length}회</div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-cell bg-white/70 px-4 py-3 text-sm hairline"
              >
                <span className="text-xs text-ink-sub">{r.label}</span>
                <span className="truncate font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              메모
            </span>
            <textarea
              value={open.memo}
              onChange={(e) => {
                const value = e.target.value;
                update((draft) => {
                  const target = draft.customers.find((x) => x.id === open.id);
                  if (target) target.memo = value;
                });
              }}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="mt-5">
            <InkButton onClick={() => toast("고객 정보를 저장했습니다")}>
              저장
            </InkButton>
          </div>
        </GlassCard>

        <GlassCard soft className="p-6">
          <SectionTitle title="방문 기록" sub={`총 ${charts.length}건`} />
          <div className="space-y-2">
            {charts.length === 0 && (
              <p className="text-sm text-ink-sub">방문 기록이 없습니다.</p>
            )}
            {charts.map((x) => (
              <div key={x.id} className="rounded-cell bg-white/70 p-4 hairline">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{x.visitDate}</span>
                  <span className="text-sm font-semibold">
                    ฿{x.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {x.treatmentNames.map((t) => (
                    <Badge key={t} tone="pink">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-sub">{x.comment}</p>
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
        title="고객 관리"
        sub={`${all.length}명 중 ${customers.length}명 표시 · 고객을 누르면 상세 정보가 열립니다`}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="이름 또는 전화번호 검색"
        className={`${inputClass} mb-3`}
      />

      <div className="mb-4 space-y-2">
        <FilterRow label="국가">
          {nations.map((n) => (
            <GhostButton
              key={n}
              active={nation === n}
              onClick={() => setNation(n)}
              className="px-3 py-1.5 text-xs"
            >
              {n}
            </GhostButton>
          ))}
        </FilterRow>
        <FilterRow label="성별">
          {(["전체", "여", "남"] as const).map((g) => (
            <GhostButton
              key={g}
              active={gender === g}
              onClick={() => setGender(g)}
              className="px-3 py-1.5 text-xs"
            >
              {g}
            </GhostButton>
          ))}
        </FilterRow>
        <FilterRow label="경로">
          {(["전체", "LINE", "Meta", "App"] as const).map((ch) => (
            <GhostButton
              key={ch}
              active={channel === ch}
              onClick={() => setChannel(ch)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              {ch !== "전체" && <ChannelIcon channel={ch} />}
              {ch === "전체" ? "전체" : CHANNEL_LABEL[ch]}
            </GhostButton>
          ))}
        </FilterRow>
      </div>

      <div className="max-h-[30rem] space-y-2 overflow-y-auto pr-1">
        {customers.length === 0 && (
          <p className="text-sm text-ink-sub">조건에 맞는 고객이 없습니다.</p>
        )}
        {customers.map((c) => {
          const doctor = db.doctors.find((d) => d.id === c.doctorId);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenId(c.id)}
              className="w-full rounded-cell bg-white/70 p-4 text-left transition hairline hover:bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{c.name}</div>
                <div className="flex items-center gap-1.5">
                  <ChannelTag channel={c.channel} />
                  <Badge>{c.nationality}</Badge>
                  <Badge tone="pink">{c.gender}</Badge>
                </div>
              </div>
              <div className="mt-1 truncate text-xs text-ink-sub">
                {c.phone} · {c.birthday} · 관심 {c.interests.join(", ")} · 담당{" "}
                {doctor?.name}
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-10 shrink-0 text-[11px] font-semibold text-ink-sub">
        {label}
      </span>
      {children}
    </div>
  );
}

export function BookingPanel({ branchId }: { branchId: string }) {
  const { db, update } = useDb();
  const toast = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: "", time: "", doctorId: "" });
  if (!db) return null;

  const bookings = db.bookings.filter((b) => b.branchId === branchId);
  const doctors = db.doctors.filter((d) => d.branchId === branchId);

  function setStatus(id: string, status: "예약확정" | "방문완료" | "취소") {
    update((draft) => {
      const b = draft.bookings.find((x) => x.id === id);
      if (b) b.status = status;
    });
    toast(`예약 상태를 ${status}(으)로 변경했습니다`);
  }

  function startEdit(id: string) {
    const b = db!.bookings.find((x) => x.id === id);
    if (!b) return;
    setForm({ date: b.date, time: b.time, doctorId: b.doctorId });
    setEditId(id);
  }

  function saveEdit() {
    if (!editId) return;
    update((draft) => {
      const b = draft.bookings.find((x) => x.id === editId);
      if (!b) return;
      b.date = form.date;
      b.time = form.time;
      b.doctorId = form.doctorId;
    });
    setEditId(null);
    toast("예약 정보를 수정했습니다");
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle title="예약 확인" sub={`총 ${bookings.length}건`} />
      <div className="space-y-2">
        {bookings.length === 0 && (
          <p className="text-sm text-ink-sub">이 지점의 예약이 없습니다.</p>
        )}
        {bookings.map((b) => {
          const treatment = db.treatments.find((t) => t.id === b.treatmentId);
          const doctor = db.doctors.find((d) => d.id === b.doctorId);
          const user = db.users.find((u) => u.id === b.userId);
          return (
            <div key={b.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{user?.name ?? b.userId}</div>
                <Badge tone={b.status === "취소" ? "danger" : "pink"}>
                  {b.status}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-ink-sub">
                {treatment?.name} · {b.date} {b.time} · {doctor?.name} · 예약금 ฿
                {b.depositTHB.toLocaleString()}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["예약확정", "방문완료", "취소"] as const).map((s) => (
                  <GhostButton
                    key={s}
                    active={b.status === s}
                    onClick={() => setStatus(b.id, s)}
                    className="px-3 py-1.5 text-xs"
                  >
                    {s}
                  </GhostButton>
                ))}
                <GhostButton
                  active={editId === b.id}
                  onClick={() => (editId === b.id ? setEditId(null) : startEdit(b.id))}
                  className="px-3 py-1.5 text-xs"
                >
                  수정
                </GhostButton>
              </div>

              {editId === b.id && (
                <div className="animate-rise mt-3 grid gap-2 rounded-cell bg-white/70 p-3 hairline sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-ink-sub">
                      날짜
                    </span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-ink-sub">
                      시간
                    </span>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) =>
                        setForm({ ...form, time: e.target.value })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold text-ink-sub">
                      담당 의사
                    </span>
                    <select
                      value={form.doctorId}
                      onChange={(e) =>
                        setForm({ ...form, doctorId: e.target.value })
                      }
                      className={inputClass}
                    >
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-3">
                    <InkButton arrow={false} onClick={saveEdit}>
                      수정 저장
                    </InkButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function ChartPanel({ branchId }: { branchId: string }) {
  const { db } = useDb();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!db) return null;

  const charts = db.charts.filter((c) => c.branchId === branchId);
  const open = openId ? charts.find((c) => c.id === openId) : null;

  if (open) {
    const customer = db.customers.find((x) => x.id === open.customerId);
    const doctor = db.doctors.find((d) => d.id === open.doctorId);
    const staff = db.staff.find((s) => s.id === open.staffId);
    const clinic = db.clinics.find((c) => c.id === open.clinicId);
    const branch = db.branches.find((b) => b.id === open.branchId);
    const rows: { label: string; value: string }[] = [
      { label: "차트번호", value: open.id },
      { label: "고객명", value: customer?.name ?? "-" },
      { label: "전화번호", value: customer?.phone ?? "-" },
      { label: "생년월일", value: customer?.birthday ?? "-" },
      { label: "성별", value: customer?.gender ?? "-" },
      { label: "국가", value: customer?.nationality ?? "-" },
      { label: "방문일", value: open.visitDate },
      { label: "담당 의사", value: doctor?.name ?? "-" },
      { label: "담당 직원", value: staff?.name ?? "-" },
      { label: "결제 금액", value: `฿${open.paidAmount.toLocaleString()}` },
    ];

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={() => setOpenId(null)}>← 목록으로</GhostButton>
          <GhostButton onClick={() => window.print()}>프린트</GhostButton>
          <GhostButton
            onClick={() => toast("PDF 다운로드를 시작합니다 (데모)")}
          >
            PDF 다운로드
          </GhostButton>
        </div>

        <GlassCard className="p-6">
          <SectionTitle
            title="전자차트 상세"
            sub={`${clinic?.name} · ${branch?.name}`}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-cell bg-white/70 px-4 py-3 text-sm hairline"
              >
                <span className="text-xs text-ink-sub">{r.label}</span>
                <span className="truncate font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-ink-sub">시술</div>
            <div className="flex flex-wrap gap-1.5">
              {open.treatmentNames.map((t) => (
                <Badge key={t} tone="pink">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-ink-sub">
              사용 제품
            </div>
            <div className="space-y-1.5">
              {open.usedProducts.map((u) => {
                const p = db.products.find((x) => x.id === u.productId);
                return (
                  <div
                    key={u.productId}
                    className="flex items-center justify-between rounded-cell bg-white/70 px-4 py-2.5 text-sm hairline"
                  >
                    <span>{p?.name ?? u.productId}</span>
                    <span className="font-semibold tabular-nums">{u.qty}개</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-ink-sub">
              의사 소견
            </div>
            <p className="rounded-cell bg-white/70 p-4 text-sm leading-relaxed hairline">
              {open.comment}
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <SectionTitle
        title="전자차트 (OPD)"
        sub="차트를 누르면 상세 내용과 프린트 · PDF 버튼이 열립니다"
      />
      <div className="space-y-2">
        {charts.map((c) => {
          const customer = db.customers.find((x) => x.id === c.customerId);
          const doctor = db.doctors.find((d) => d.id === c.doctorId);
          const staff = db.staff.find((s) => s.id === c.staffId);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenId(c.id)}
              className="w-full rounded-cell bg-white/70 p-4 text-left transition hairline hover:bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{customer?.name}</div>
                <span className="text-sm font-semibold">
                  ฿{c.paidAmount.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-sub">
                {c.visitDate} · {doctor?.name} · {staff?.name}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.treatmentNames.map((t) => (
                  <Badge key={t} tone="pink">
                    {t}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function InventoryPanel({ branchId }: { branchId: string }) {
  const { db, update } = useDb();
  const toast = useToast();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  if (!db) return null;

  const items = db.inventory.filter((i) => i.branchId === branchId);
  const logs = db.stockLogs.filter((l) =>
    items.some((i) => i.id === l.inventoryItemId),
  );
  const ownedProductIds = new Set(items.map((i) => i.productId));
  const newProducts = db.products.filter((p) => !ownedProductIds.has(p.id));

  function adjust(id: string, delta: number, type: "입고" | "사용") {
    update((draft) => {
      const item = draft.inventory.find((i) => i.id === id);
      if (!item) return;
      item.qty = Math.max(0, item.qty + delta);
      draft.stockLogs.unshift({
        id: `SL-${Date.now()}`,
        inventoryItemId: id,
        type,
        qty: Math.abs(delta),
        reason: type === "입고" ? "지점 발주" : "시술 사용",
        at: new Date().toISOString(),
        by: "지점 담당자",
      });
    });
    toast(type === "입고" ? "입고 처리" : "1개 사용 처리");
  }

  if (buyingId) {
    return (
      <PurchaseView
        branchId={branchId}
        initialProductId={buyingId}
        onBack={() => setBuyingId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <SectionTitle
          title="재고 관리"
          sub="잔여 50개 이하는 빨간색으로 표시되고 구매 알림이 뜹니다"
        />
        <div className="space-y-2">
          {items.map((item) => {
            const product = db.products.find((p) => p.id === item.productId);
            const low = isLowStock(item);
            return (
              <div
                key={item.id}
                className={`rounded-cell p-4 hairline ${low ? "bg-danger/10" : "bg-white/70"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {product?.name}
                    </div>
                    <div className="truncate text-xs text-ink-sub">
                      {item.volume} · {item.distribution} · LOT {item.lotNo} ·
                      유효기간 {item.expiry}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold tabular-nums ${low ? "animate-warn text-danger" : ""}`}
                    >
                      {item.qty}
                    </span>
                    <GhostButton
                      onClick={() => adjust(item.id, -1, "사용")}
                      className="px-3 py-1.5 text-xs"
                    >
                      사용 -1
                    </GhostButton>
                    <GhostButton
                      onClick={() => setBuyingId(item.productId)}
                      className="px-3 py-1.5 text-xs"
                    >
                      구매하기
                    </GhostButton>
                  </div>
                </div>
                {low && (
                  <p className="mt-2 text-xs text-danger">
                    설정 재고율 {item.warnPct}% 도달 · 공급처 {item.supplier}{" "}
                    프로모션 진행 중입니다. 지금 구매하면 유리합니다.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden bg-gradient-to-br from-hb-50/80 to-hb-200/50 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Badge tone="pink">본사 공급가</Badge>
            <h3 className="mt-2 text-xl font-bold">지금 구매 가능한 제품</h3>
            <p className="mt-1 text-sm text-ink/70">
              이 지점에 없는 제품도 본사 계약 단가로 바로 주문할 수 있습니다.
            </p>
          </div>
          <InkButton
            onClick={() =>
              setBuyingId(newProducts[0]?.id ?? db.products[0]?.id ?? null)
            }
          >
            바로 구매하러 가기
          </InkButton>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {newProducts.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setBuyingId(p.id)}
              className="lift rounded-cell bg-white/80 p-4 text-left hairline"
            >
              <div className="text-xs text-ink-sub">{p.category}</div>
              <div className="mt-1 truncate font-semibold">{p.name}</div>
              <div className="mt-2 text-sm font-bold">
                ฿{p.unitPriceTHB.toLocaleString()}
                <span className="ml-1 text-[11px] font-normal text-ink-sub">
                  / {p.unit}
                </span>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="입출고 기록" />
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {logs.length === 0 && (
            <p className="text-sm text-ink-sub">기록이 없습니다.</p>
          )}
          {logs.map((l) => {
            const item = db.inventory.find((i) => i.id === l.inventoryItemId);
            const product = db.products.find((p) => p.id === item?.productId);
            return (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-cell bg-white/70 px-3 py-2 text-xs hairline"
              >
                <span className="truncate">
                  {product?.name} · {l.reason} · {l.by}
                </span>
                <Badge tone={l.type === "입고" ? "pink" : "neutral"}>
                  {l.type} {l.qty}
                </Badge>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function PurchaseView({
  branchId,
  initialProductId,
  onBack,
}: {
  branchId: string;
  initialProductId: string;
  onBack: () => void;
}) {
  const { db } = useDb();
  const [productId, setProductId] = useState(initialProductId);
  const [qty, setQty] = useState(10);
  const [done, setDone] = useState<{ name: string; qty: number; total: number } | null>(
    null,
  );
  if (!db) return null;

  const product = db.products.find((p) => p.id === productId) ?? db.products[0];
  const items = db.inventory.filter((i) => i.branchId === branchId);
  const ownedProductIds = new Set(items.map((i) => i.productId));
  const owned = items.find((i) => i.productId === product.id);
  const recommend = db.products
    .filter((p) => p.id !== product.id && !ownedProductIds.has(p.id))
    .slice(0, 6);
  const total = product.unitPriceTHB * Math.max(1, qty);

  if (done) {
    return (
      <div className="space-y-4">
        <GlassCard className="animate-pop p-8 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-pill bg-hb-400/20 text-hb-600">
            <CheckIcon />
          </span>
          <h2 className="mt-4 text-2xl font-bold">주문이 완료되었습니다</h2>
          <p className="mt-2 text-sm text-ink-sub">이메일을 확인해주세요.</p>

          <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
            {[
              { label: "제품", value: done.name },
              { label: "수량", value: `${done.qty}개` },
              { label: "결제 예정 금액", value: `฿${done.total.toLocaleString()}` },
              { label: "주문번호", value: `PO-${Date.now().toString().slice(-8)}` },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-cell bg-white/70 px-4 py-3 text-sm hairline"
              >
                <span className="text-xs text-ink-sub">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <InkButton onClick={onBack}>재고 관리로 돌아가기</InkButton>
            <GhostButton onClick={() => setDone(null)}>추가 주문하기</GhostButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GhostButton onClick={onBack}>← 재고 관리로</GhostButton>

      <GlassCard className="p-6">
        <SectionTitle
          title="제품 구매"
          sub="본사 계약 단가로 주문합니다. 주문 후 확인 메일이 발송됩니다."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              제품명
            </span>
            <select
              value={product.id}
              onChange={(e) => setProductId(e.target.value)}
              className={inputClass}
            >
              {db.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              개당 가격
            </span>
            <div className={`${inputClass} flex items-center justify-between`}>
              <span className="font-semibold">
                ฿{product.unitPriceTHB.toLocaleString()}
              </span>
              <span className="text-xs text-ink-sub">/ {product.unit}</span>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              수량
            </span>
            <input
              type="number"
              min={1}
              max={999}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className={inputClass}
            />
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-sub">
              현재 지점 재고
            </span>
            <div className={`${inputClass} flex items-center justify-between`}>
              <span className="font-semibold">
                {owned ? `${owned.qty}개` : "미보유"}
              </span>
              {owned && isLowStock(owned) && <Badge tone="danger">부족</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-cell bg-hb-50 p-5 hairline">
          <div>
            <div className="text-xs text-ink-sub">결제 예정 금액</div>
            <div className="text-2xl font-bold tabular-nums">
              ฿{total.toLocaleString()}
            </div>
          </div>
          <InkButton
            onClick={() =>
              setDone({ name: product.name, qty, total })
            }
          >
            구매하기
          </InkButton>
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle
          title="이런 제품은 어떠세요"
          sub="이 지점에 아직 없는 제품입니다"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {recommend.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProductId(p.id);
                setQty(10);
              }}
              className="lift rounded-cell bg-white/80 p-4 text-left hairline"
            >
              <div className="text-xs text-ink-sub">{p.category}</div>
              <div className="mt-1 truncate font-semibold">{p.name}</div>
              <div className="mt-2 text-sm font-bold">
                ฿{p.unitPriceTHB.toLocaleString()}
                <span className="ml-1 text-[11px] font-normal text-ink-sub">
                  / {p.unit}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-hb-600">선택하기</div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function StatsPanel({
  clinicId,
  branchId,
}: {
  clinicId: string;
  branchId: string;
}) {
  const { db } = useDb();
  if (!db) return null;

  const customers = db.customers.filter((c) => c.branchId === branchId);
  const charts = db.charts.filter((c) => c.branchId === branchId);
  const items = db.inventory.filter((i) => i.branchId === branchId);
  const revenue = charts.reduce((s, c) => s + c.paidAmount, 0);

  const byChannel = (["LINE", "Meta", "App"] as Channel[]).map((ch) => ({
    label: ch,
    value: customers.filter((c) => c.channel === ch).length,
  }));

  const byTreatment = db.treatments
    .filter((t) => t.clinicId === clinicId)
    .map((t) => ({
      label: t.name,
      value: charts.filter((c) => c.treatmentNames.includes(t.name)).length,
    }))
    .filter((r) => r.value > 0);

  const byStock = items.map((i) => ({
    label: db.products.find((p) => p.id === i.productId)?.name ?? i.productId,
    value: i.qty,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "누적 매출", value: `฿${revenue.toLocaleString()}` },
          { label: "등록 고객", value: `${customers.length}명` },
          { label: "차트 기록", value: `${charts.length}건` },
        ].map((s) => (
          <GlassCard key={s.label} className="p-5">
            <div className="text-xs text-ink-sub">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <SectionTitle title="경로별 유입" />
        <BarChart rows={byChannel} unit="명" />
      </GlassCard>

      <GlassCard className="p-6">
        <SectionTitle title="시술별 건수" />
        {byTreatment.length === 0 ? (
          <p className="text-sm text-ink-sub">차트 기록이 없습니다.</p>
        ) : (
          <BarChart rows={byTreatment} unit="건" />
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <SectionTitle title="재고 잔량" />
        <BarChart rows={byStock} unit="개" />
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="직원별 인센티브" />
        <Badge>Coming soon</Badge>
      </GlassCard>
    </div>
  );
}

function BarChart({
  rows,
  unit,
}: {
  rows: { label: string; value: number }[];
  unit: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-ink-sub">
            {r.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-pill bg-white/60">
            <div
              className="h-full rounded-pill bg-hb-600 transition-[width] duration-700"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs tabular-nums">
            {r.value.toLocaleString()}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

const SMS_TEMPLATES = {
  생일: (name: string) =>
    `${name}님, 생일 축하드립니다! 이번 달 방문 시 시술 10% 할인 쿠폰을 드려요.`,
  재방문: (name: string) =>
    `${name}님, 지난 시술 후 4주가 지났습니다. 다음 회차 예약을 도와드릴까요?`,
  프로모션: (name: string) =>
    `${name}님, 9월 화이트닝 페스티벌 진행 중입니다. 레이저 토닝 3회 패키지 20% 할인!`,
} as const;

export function SmsPanel({
  clinicId,
  branchId,
}: {
  clinicId: string;
  branchId: string;
}) {
  const { db, update } = useDb();
  const toast = useToast();
  const [template, setTemplate] =
    useState<keyof typeof SMS_TEMPLATES>("프로모션");
  const [customerId, setCustomerId] = useState("");
  if (!db) return null;

  const customers = db.customers.filter((c) => c.branchId === branchId);
  const selected =
    customers.find((c) => c.id === customerId) ?? customers[0] ?? null;
  const preview = selected ? SMS_TEMPLATES[template](selected.name) : "";
  const logs = db.smsLogs.filter((l) => l.clinicId === clinicId);

  function send() {
    if (!selected) return;
    update((draft) => {
      draft.smsLogs.unshift({
        id: `SMS-${Date.now()}`,
        clinicId,
        to: selected.phone,
        customerName: selected.name,
        template,
        text: preview,
        at: new Date().toISOString(),
      });
    });
    toast("SMS를 발송했습니다 (데모)");
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <SectionTitle title="SMS 전송" sub="실제로 발송되지 않는 데모입니다" />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SMS_TEMPLATES) as (keyof typeof SMS_TEMPLATES)[]).map(
              (k) => (
                <GhostButton
                  key={k}
                  active={template === k}
                  onClick={() => setTemplate(k)}
                >
                  {k}
                </GhostButton>
              ),
            )}
          </div>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setCustomerId(e.target.value)}
            className={inputClass}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </select>
          <div className="rounded-cell bg-white/75 p-4 text-sm leading-relaxed hairline">
            {preview}
          </div>
          <InkButton onClick={send}>전송</InkButton>
        </div>
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="발송 기록" />
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {logs.map((l) => (
            <div
              key={l.id}
              className="rounded-cell bg-white/70 px-3 py-2 text-xs hairline"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {l.customerName} · {l.to}
                </span>
                <Badge tone="pink">{l.template}</Badge>
              </div>
              <p className="mt-1 text-ink-sub">{l.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

const PROMO_IDEAS = [
  {
    title: "쏭크란 이후 진정 케어 패키지",
    reason:
      "4월 쏭크란 직후 자외선 손상 상담이 평소 대비 2.4배 증가했습니다. 스킨부스터 + 진정 관리 묶음을 제안합니다.",
    discount: 18,
  },
  {
    title: "우기 대비 모공·피지 집중 관리",
    reason:
      "6~9월 습도 상승 구간에 모공 문의가 늘고 재방문 주기가 짧아집니다. 3회권으로 묶으면 객단가가 올라갑니다.",
    discount: 15,
  },
  {
    title: "연말 웨딩 시즌 V라인 얼리버드",
    reason:
      "11~12월 V라인 예약이 집중됩니다. 9월에 미리 판매하면 비수기 매출을 앞당길 수 있습니다.",
    discount: 20,
  },
];

export function PromoPanel({ clinicId }: { clinicId: string }) {
  const { db, update } = useDb();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  // 한 장씩 넘겨 보는 카드형과, 세 개를 한눈에 비교하는 목록형을 오갈 수 있게 한다.
  const [mode, setMode] = useState<"card" | "list">("card");
  if (!db) return null;

  const idea = PROMO_IDEAS[index];
  const promotions = db.promotions.filter((p) => p.clinicId === clinicId);
  const adoptedTitles = new Set(promotions.map((p) => p.title));

  function adopt(target: (typeof PROMO_IDEAS)[number]) {
    update((draft) => {
      draft.promotions.unshift({
        id: `PR-${Date.now()}`,
        clinicId,
        title: target.title,
        description: target.reason,
        discountPct: target.discount,
        period: "2026-09-17 ~ 2026-12-31",
      });
    });
    toast("프로모션을 등록했습니다");
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <SectionTitle
          title="AI 프로모션 제안"
          sub="구매 패턴과 시즌 데이터를 바탕으로 제안합니다"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <GhostButton active={mode === "card"} onClick={() => setMode("card")}>
            카드로 보기
          </GhostButton>
          <GhostButton active={mode === "list"} onClick={() => setMode("list")}>
            목록으로 보기 ({PROMO_IDEAS.length})
          </GhostButton>
        </div>

        {mode === "card" ? (
          <div className="animate-pop rounded-card bg-white/75 p-5 hairline">
            <Badge tone="pink">{idea.discount}% 할인 제안</Badge>
            <div className="mt-2 text-lg font-bold">{idea.title}</div>
            <p className="mt-2 text-sm text-ink-sub">{idea.reason}</p>

            <div className="mt-4 flex h-32 items-center justify-center overflow-hidden rounded-cell bg-gradient-to-br from-hb-200 to-hb-600">
              <div className="relative text-center text-white">
                <div className="absolute inset-0 animate-shimmer bg-white/20" />
                <div className="relative text-sm font-semibold">{idea.title}</div>
                <div className="relative text-3xl font-black">
                  {idea.discount}% OFF
                </div>
                <div className="relative text-[10px] tracking-widest">
                  DEMO IMAGE
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <InkButton onClick={() => adopt(idea)}>이 제안 등록</InkButton>
              <GhostButton
                onClick={() => setIndex((index + 1) % PROMO_IDEAS.length)}
              >
                다른 제안 보기 ({index + 1}/{PROMO_IDEAS.length})
              </GhostButton>
            </div>
          </div>
        ) : (
          <div className="animate-pop space-y-2">
            {PROMO_IDEAS.map((it, i) => {
              const already = adoptedTitles.has(it.title);
              return (
                <div
                  key={it.title}
                  className="rounded-cell bg-white/75 p-4 hairline"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 font-semibold">{it.title}</span>
                    <Badge tone={already ? "neutral" : "pink"}>
                      {already ? "등록됨" : `${it.discount}% 할인`}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-sub">{it.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <GhostButton
                      onClick={() => {
                        setIndex(i);
                        setMode("card");
                      }}
                    >
                      자세히 보기
                    </GhostButton>
                    {!already && (
                      <GhostButton onClick={() => adopt(it)}>등록</GhostButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard soft className="p-6">
        <SectionTitle title="진행 중 프로모션" />
        <div className="space-y-2">
          {promotions.map((p) => (
            <div key={p.id} className="rounded-cell bg-white/70 p-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{p.title}</span>
                <Badge tone="pink">{p.discountPct}% 할인</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-sub">{p.description}</p>
              <p className="mt-1 text-[11px] text-ink-sub">{p.period}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
