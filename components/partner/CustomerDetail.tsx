"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Customer, DemoDb } from "@/lib/types";
import { Badge, GhostButton, GlassCard, InkButton, SectionTitle } from "@/components/ui/primitives";

export function CustomerPortrait({ customer, className = "" }: { customer: Customer; className?: string }) {
  const photo = customer.portrait;
  if (!photo) return <div className={`flex items-center justify-center bg-hb-50 text-ink-sub ${className}`}>사진 없음</div>;
  if (photo.tile !== undefined) {
    const col = photo.tile % 5;
    const row = Math.floor(photo.tile / 5);
    return <div role="img" aria-label={`${customer.name} 클리닉 촬영 사진`} className={`bg-no-repeat ${className}`} style={{ backgroundImage: `url(${photo.src})`, backgroundSize: "500% 300%", backgroundPosition: `${col * 25}% ${row * 50}%` }} />;
  }
  return <Image unoptimized width={720} height={720} src={photo.src} alt={`${customer.name} 클리닉 촬영 사진`} className={`object-cover ${className}`} />;
}

const channels = { LINE: "LINE", Meta: "Meta", App: "헤이뷰티" };

export default function CustomerDetail({ customer, db, onBack, onMemo, onSave }: {
  customer: Customer;
  db: DemoDb;
  onBack: () => void;
  onMemo: (value: string) => void;
  onSave: () => void;
}) {
  const [image, setImage] = useState<"portrait" | "identity" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (image && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [image]);
  const doctor = db.doctors.find(d => d.id === customer.doctorId);
  const branch = db.branches.find(b => b.id === customer.branchId);
  const charts = db.charts.filter(c => c.customerId === customer.id).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  const spent = charts.reduce((sum, chart) => sum + chart.paidAmount, 0);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const bookings = db.bookings.filter(b => b.userId === customer.id && b.status === "예약확정" && b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const id = customer.identityCard;
  const fields = [
    ["고객번호", customer.id], ["이름", customer.name], ["현지어 이름", customer.localName],
    ["전화번호", customer.phone], ["LINE ID", customer.lineId], ["생년월일", customer.birthday],
    ["성별", customer.gender], ["국가", customer.nationality], ["유입 루트", customer.sourceDetail || channels[customer.channel]],
    ["관심 시술", customer.interests.join(", ")], ["최근 방문", charts[0]?.visitDate || "방문 기록 없음"],
    ["담당 의사", doctor?.name], ["소속 지점", branch?.name], ["등록일", customer.createdAt.slice(0, 10)],
    ["주소", customer.address || id?.address],
  ];
  function rows(values: (string | undefined)[][]) {
    return <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">{values.map(([label, value]) => <div key={label} className={`${label?.includes("주소") ? "sm:col-span-2" : ""} min-w-0 border-b border-ink/10 py-3`}><dt className="mb-1 text-xs text-ink-sub">{label}</dt><dd className="break-words text-sm font-medium">{value || "미입력"}</dd></div>)}</dl>;
  }
  return <div className="space-y-4">
    <GlassCard className="p-5 sm:p-7">
      <div className="mb-4 flex justify-end"><button type="button" onClick={onBack} aria-label="뒤로 가기" className="flex size-10 items-center justify-center rounded-full bg-white/75 text-2xl hairline hover:bg-white">←</button></div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mb-1 text-xs text-ink-sub">고객 상세 정보</div><h2 className="text-2xl font-bold">{customer.name}</h2><div className="mt-2 flex flex-wrap gap-2"><Badge>{customer.nationality}</Badge><Badge tone="pink">{customer.gender}</Badge><Badge>{channels[customer.channel]}</Badge></div></div>
        <div className="flex gap-6"><div><div className="text-xs text-ink-sub">총 방문</div><div className="text-xl font-bold">{charts.length}회</div></div><div><div className="text-xs text-ink-sub">누적 결제</div><div className="text-xl font-bold tabular-nums">฿{spent.toLocaleString()}</div></div></div>
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div><button type="button" onClick={() => customer.portrait && setImage("portrait")} disabled={!customer.portrait} aria-label="고객 인물사진 확대" className="block w-full overflow-hidden rounded-[20px] bg-white/70 hairline"><CustomerPortrait customer={customer} className="aspect-square w-full" /></button><div className="mt-2 text-sm font-semibold">클리닉 촬영 사진</div><div className="text-xs text-ink-sub">{customer.portrait?.capturedAt || "등록된 사진이 없습니다"}</div>
          {id?.image && <div className="mt-5"><button type="button" onClick={() => setImage("identity")} aria-label="신분증 이미지 확대" className="block w-full overflow-hidden rounded-cell bg-white hairline"><Image unoptimized width={800} height={500} src={id.image} alt={`${id.name} 신분증`} className="aspect-[8/5] w-full object-contain" /></button><div className="mt-2 text-sm font-semibold">신분증 원본</div><div className="text-xs text-ink-sub">AI 입력 · ID 카드</div></div>}
        </div>
        <div className="min-w-0"><SectionTitle title="고객 기본 정보" />{rows(fields)}</div>
      </div>
    </GlassCard>
    <GlassCard className="p-5 sm:p-7"><SectionTitle title="신분증 상세 정보" />{id ? rows([["신분증 종류", id.type], ["신분증 번호", id.number], ["영문 이름", id.name], ["현지어 이름", id.localName], ["생년월일", id.birthday], ["발급일", id.issuedAt], ["만료일", id.expiresAt], ["주소", id.address]]) : <p className="text-sm text-ink-sub">등록된 신분증이 없습니다.</p>}</GlassCard>
    <GlassCard className="p-5 sm:p-7"><SectionTitle title="상담 메모" /><textarea aria-label="상담 메모" value={customer.memo} onChange={e => onMemo(e.target.value)} rows={3} className="w-full resize-none rounded-cell bg-white/75 px-4 py-3 text-sm hairline" /><div className="mt-4"><InkButton onClick={onSave}>저장</InkButton></div></GlassCard>
    <GlassCard soft className="p-5 sm:p-7"><SectionTitle title="예정 예약" sub={`${bookings.length}건`} /><div className="space-y-2">{bookings.length === 0 && <p className="text-sm text-ink-sub">예정된 예약이 없습니다.</p>}{bookings.map(b => <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-cell bg-white/70 p-4 hairline"><div><div className="font-semibold">{b.date} · {b.time}</div><div className="mt-1 text-sm text-ink-sub">{db.treatments.find(t => t.id === b.treatmentId)?.name} · {db.doctors.find(d => d.id === b.doctorId)?.name}</div></div><Badge tone="pink">{b.status}</Badge></div>)}</div></GlassCard>
    <GlassCard soft className="p-5 sm:p-7"><SectionTitle title="방문 기록" sub={`총 ${charts.length}건`} /><div className="space-y-2">{charts.length === 0 && <p className="text-sm text-ink-sub">방문 기록이 없습니다.</p>}{charts.map(chart => <div key={chart.id} className="rounded-cell bg-white/70 p-4 hairline"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{chart.visitDate}</span><span className="font-semibold">฿{chart.paidAmount.toLocaleString()}</span></div><div className="mt-2 flex flex-wrap gap-2">{chart.treatmentNames.map(t => <Badge key={t} tone="pink">{t}</Badge>)}</div><p className="mt-2 text-xs text-ink-sub">{db.doctors.find(d => d.id === chart.doctorId)?.name} · {chart.comment}</p></div>)}</div></GlassCard>
    {image && <dialog ref={dialog} className="m-auto w-[calc(100%-2.5rem)] max-w-xl rounded-card bg-white p-0 text-ink backdrop:bg-ink-deep/70" onCancel={() => setImage(null)} aria-label={image === "portrait" ? "고객 인물사진" : "신분증 원본"} onClick={() => setImage(null)}><div className="w-full max-w-xl rounded-card bg-white p-4" onClick={e => e.stopPropagation()}><div className="mb-3 flex justify-end"><GhostButton onClick={() => setImage(null)}>닫기</GhostButton></div>{image === "portrait" ? <CustomerPortrait customer={customer} className="aspect-square w-full rounded-cell" /> : id && <><Image unoptimized width={800} height={500} src={id.image} alt={`${id.name} 신분증 원본`} className="w-full rounded-cell" /></>}</div></dialog>}
  </div>;
}
