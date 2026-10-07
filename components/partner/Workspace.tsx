"use client";

import { useEffect, useState, useRef, type ReactNode, type DragEvent, type PointerEvent } from "react";
import { useDb } from "@/lib/db";
import { isLowStock } from "@/lib/stock";
import type { Booking } from "@/lib/types";

export type PartnerSection = "dashboard" | "today" | "ai" | "inbox" | "customers" | "bookings" | "charts" | "inventory" | "stats" | "sms" | "promo" | "reviews" | "users" | "clinic" | "notice" | "account";
const MENU: { id: PartnerSection; label: string; icon: string }[] = [
  { id: "dashboard", label: "대시보드", icon: "◫" },
  { id: "today", label: "오늘 현황", icon: "◷" },
  { id: "ai", label: "AI 입력", icon: "✧" },
  { id: "inbox", label: "통합 인박스", icon: "▤" },
  { id: "customers", label: "고객 관리", icon: "♙" },
  { id: "bookings", label: "예약 관리", icon: "▦" },
  { id: "charts", label: "전자차트", icon: "▧" },
  { id: "inventory", label: "재고", icon: "▣" },
  { id: "stats", label: "통계", icon: "▥" },
  { id: "sms", label: "SMS", icon: "✉" },
  { id: "promo", label: "AI 프로모션", icon: "☆" },
];
const ADMIN_MENU: typeof MENU = [
 { id: "dashboard", label: "대시보드", icon: "◫" }, { id: "bookings", label: "예약 관리", icon: "▦" },
 { id: "inventory", label: "전체 재고", icon: "▣" }, { id: "reviews", label: "후기 · 커미션", icon: "☆" },
 { id: "users", label: "유저 관리", icon: "♙" }, { id: "clinic", label: "클리닉 정보", icon: "▤" },
 { id: "notice", label: "공지 · 팝업", icon: "▧" }, { id: "account", label: "계정 · 비번", icon: "⚙" },
];
type CardSize = { width: number; height: number };
const defaultSize = (id: PartnerSection): CardSize => ({ width: id === "bookings" ? 4 : 2, height: id === "bookings" ? 600 : id === "today" ? 230 : id === "stats" ? 180 : 270 });
const INITIAL_CARDS: PartnerSection[] = ["bookings", "today", "customers", "inventory", "inbox", "stats", "ai", "promo", "sms", "charts"];
function move<T>(items: T[], from: T, to: T) { const next = items.filter(item => item !== from); next.splice(next.indexOf(to), 0, from); return next; }

export default function PartnerWorkspace({ section, onChange, clinicId, branchId, sessionControls, children, mode = "partner" }: { mode?: "partner" | "admin"; section: PartnerSection; onChange: (section: PartnerSection) => void; clinicId: string; branchId: string; sessionControls: ReactNode; children: ReactNode }) {
  const { db } = useDb();
  const menuDefinitions = mode === "admin" ? ADMIN_MENU : MENU;
  const availableCards = menuDefinitions.filter(item => item.id !== "dashboard");
  const initialCards: PartnerSection[] = mode === "admin" ? ["bookings", "inventory", "reviews", "users", "notice", "clinic"] : INITIAL_CARDS;
  const [selectedCard, setSelectedCard] = useState<PartnerSection | null>(null);
  const resize = useRef<{ id: PartnerSection; x: number; y: number; width: number; height: number; column: number; axis: "width" | "height" | "both" } | null>(null);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(menuDefinitions.map(item => item.id));
  const [cards, setCards] = useState(initialCards);
  const [sizes, setSizes] = useState<Partial<Record<PartnerSection, CardSize>>>({});
  const [drag, setDrag] = useState<{ kind: "menu" | "card"; id: PartnerSection } | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const preferenceKey = `hb-${mode}-layout-v1-${clinicId}-${branchId}`;
  useEffect(() => {
    let nextMenu = (mode === "admin" ? ADMIN_MENU : MENU).map(item => item.id), nextCards: PartnerSection[] = mode === "admin" ? ["bookings", "inventory", "reviews", "users", "notice", "clinic"] : INITIAL_CARDS;
    const available = (mode === "admin" ? ADMIN_MENU : MENU).filter(item => item.id !== "dashboard");
    setSizes({});
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || "null");
      const valid = (value: unknown, defaults: PartnerSection[]): value is PartnerSection[] => Array.isArray(value) && value.length === defaults.length && new Set(value).size === defaults.length && value.every(id => defaults.includes(id));
      if (saved && valid(saved.menu, nextMenu)) nextMenu = saved.menu;
      if (saved && Array.isArray(saved.cards) && new Set(saved.cards).size === saved.cards.length && saved.cards.every((id: PartnerSection) => available.some(item => item.id === id))) nextCards = saved.cards;
      if (mode === "partner" && saved && !saved.exampleWidgetsVersion) nextCards = [...nextCards, ...(["ai", "promo", "sms", "charts"] as PartnerSection[]).filter(id => !nextCards.includes(id))];
      const nextSizes: Partial<Record<PartnerSection, CardSize>> = {};
      for (const item of available) {
        const size = saved?.sizes?.[item.id];
        if (size && Number.isFinite(size.width) && Number.isFinite(size.height)) nextSizes[item.id] = { width: Math.max(item.id === "bookings" ? 3 : 2, Math.min(6, Math.round(size.width))), height: Math.max(180, Math.min(900, Math.round(size.height))) };
      }
      setSizes(nextSizes);
    } catch { /* Corrupt preferences use the default layout. */ }
    setMenu(nextMenu); setCards(nextCards); setLoadedKey(preferenceKey);
  }, [preferenceKey, mode]);
  useEffect(() => {
    if (loadedKey === preferenceKey) { try { localStorage.setItem(preferenceKey, JSON.stringify({ menu, cards, sizes, exampleWidgetsVersion: 1 })); } catch { /* Keep the layout usable if storage is unavailable. */ } }
  }, [menu, cards, sizes, loadedKey, preferenceKey]);
  if (!db) return null;
  const label = (id: PartnerSection) => menuDefinitions.find(item => item.id === id)!.label;
  const reposition = (kind: "menu" | "card", id: PartnerSection, offset: number) => {
    const items = kind === "menu" ? menu : cards;
    const index = items.indexOf(id), target = index + offset;
    if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]];
    (kind === "menu" ? setMenu : setCards)(next);
  };
  const dragProps = (kind: "menu" | "card", id: PartnerSection) => ({
    draggable: editing,
    onDragStart: (event: DragEvent) => { setDrag({ kind, id }); event.dataTransfer.setData("text/plain", id); event.dataTransfer.effectAllowed = "move"; },
    onDragEnd: () => setDrag(null),
    onDragOver: (event: DragEvent) => { if (editing && drag?.kind === kind) event.preventDefault(); },
    onDrop: (event: DragEvent) => { event.preventDefault(); if (drag?.kind === kind && drag.id !== id) (kind === "menu" ? setMenu : setCards)(move(kind === "menu" ? menu : cards, drag.id, id)); setDrag(null); },
  });
  const controls = (kind: "menu" | "card", id: PartnerSection) => editing && <span className="aw-order"><button aria-label={`${kind === "menu" ? "메뉴" : "카드"} ${label(id)} 앞쪽으로 이동`} onClick={() => reposition(kind, id, -1)}>↑</button><button aria-label={`${kind === "menu" ? "메뉴" : "카드"} ${label(id)} 뒤쪽으로 이동`} onClick={() => reposition(kind, id, 1)}>↓</button></span>;
  const bookings = db.bookings.filter(b => mode === "admin" || (b.clinicId === clinicId && b.branchId === branchId));
  const customers = db.customers.filter(c => mode === "admin" || (c.clinicId === clinicId && c.branchId === branchId));
  const inventory = db.inventory.filter(i => mode === "admin" || (i.clinicId === clinicId && i.branchId === branchId));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const upcoming = bookings.filter(b => b.status === "예약확정" && b.date >= today).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const unread = db.inbox.filter(t => t.clinicId === clinicId && t.branchId === branchId && t.unread).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
  const setSize = (id: PartnerSection, changes: Partial<CardSize>) => setSizes(current => ({ ...current, [id]: { ...defaultSize(id), ...current[id], ...changes } }));
  const placeCard = (id: PartnerSection) => {
    if (!selectedCard) { setSelectedCard(id); return; }
    if (selectedCard !== id) setCards(current => { const next = [...current]; const a = next.indexOf(selectedCard), b = next.indexOf(id); if (a >= 0 && b >= 0) [next[a], next[b]] = [next[b], next[a]]; return next; });
    setSelectedCard(null);
  };
  const resizeProps = (id: PartnerSection, axis: "width" | "height" | "both") => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault(); event.stopPropagation();
      const card = event.currentTarget.closest(".aw-card") as HTMLElement;
      const grid = card.parentElement!;
      const size = sizes[id] || defaultSize(id);
      resize.current = { id, x: event.clientX, y: event.clientY, ...size, column: (grid.getBoundingClientRect().width + 14) / 6, axis };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const start = resize.current; if (!start || start.id !== id) return;
      const next: Partial<CardSize> = {};
      if (start.axis !== "height") next.width = Math.max(id === "bookings" ? 3 : 2, Math.min(6, start.width + Math.round((event.clientX - start.x) / start.column)));
      if (start.axis !== "width") next.height = Math.max(180, Math.min(900, Math.round(start.height + event.clientY - start.y)));
      setSize(id, next);
    },
    onPointerUp: () => { resize.current = null; },
    onPointerCancel: () => { resize.current = null; },
    onLostPointerCapture: () => { resize.current = null; },
  });
  const toggleCard = (id: PartnerSection) => setCards(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const customerName = (id: string) => customers.find(c => c.id === id)?.name || db.users.find(u => u.id === id)?.name || id;
  return <div className={`aw-frame ${editing ? "aw-editing" : ""}`}>
    <aside className="aw-sidebar"><div className="aw-brand">Hey! <span>Beauty</span><small>{mode === "admin" ? "ADMIN WORKSPACE" : "PARTNER CRM"}</small></div>
      <nav className="aw-menu" aria-label="파트너 CRM 메뉴">{menu.map(id => <div className="aw-menu-row" key={id} {...dragProps("menu", id)}><button className={`aw-menu-link ${section === id ? "aw-active" : ""}`} onClick={() => onChange(id)}><span>{menuDefinitions.find(item => item.id === id)!.icon}</span>{label(id)}</button>{controls("menu", id)}</div>)}<button className={`aw-menu-link ${editing ? "aw-active" : ""}`} onClick={() => { onChange("dashboard"); setEditing(!editing); setSelectedCard(null); }}><span>⚙</span>{editing ? "배치 편집 완료" : "배치 편집"}</button></nav>
      <div className="aw-members"><small>접속 멤버 · 디자인 예시</small>{[["클리닉 마스터", true], ["지점 담당자", true], ["상담 담당자", false]].map(([name, online]) => <div className="aw-member" key={String(name)}><span className={`aw-avatar ${online ? "aw-online" : ""}`}>{String(name).slice(0, 1)}</span><div>{name}<small>{online ? "접속 중 · 예시" : "오프라인 · 예시"}</small></div></div>)}</div>
    </aside>
    <main className="aw-main"><header className="aw-heading"><div><small>{mode === "admin" ? "전체 클리닉 운영 관리" : `${db.clinics.find(c => c.id === clinicId)?.name} · ${db.branches.find(b => b.id === branchId)?.name}`}</small><h1>{label(section)}</h1></div><div className="aw-actions">{section !== "dashboard" && <button onClick={() => onChange("dashboard")}>← {mode === "admin" ? "어드민" : "CRM"} 홈으로</button>}{sessionControls}</div></header>
      {editing && <section className="aw-layout-manager" aria-label="대시보드 창 관리"><h2>대시보드 창 관리</h2><p>카드 제목 옆의 위치 선택을 누른 뒤 옮길 카드의 자리를 클릭하세요. 테두리의 오른쪽·아래쪽·모서리를 끌면 크기가 바뀝니다. 체크박스로 창을 추가하거나 숨길 수 있습니다. 이 브라우저에 자동 저장됩니다.</p><div>{availableCards.map(item => <label key={item.id}><input type="checkbox" checked={cards.includes(item.id)} onChange={() => toggleCard(item.id)} />{item.label}</label>)}</div></section>}
      {section === "dashboard" ? <><div className="aw-stats">{[["오늘 예약", bookings.filter(b => b.date === today && b.status !== "취소").length], ["등록 고객", customers.length], ["확정 예약", bookings.filter(b => b.status === "예약확정").length], ["재고 항목", inventory.length]].map(([title, value]) => <div key={title}><small>{title}</small><strong>{value}</strong></div>)}</div>
        <div className="aw-grid">{cards.map(id => <section key={id} className={`aw-card aw-card-${id} ${selectedCard === id ? "aw-placement-selected" : ""} ${editing && selectedCard && selectedCard !== id ? "aw-placement-target" : ""}`} onClick={event => { if (editing && selectedCard && selectedCard !== id && !(event.target as HTMLElement).closest("button, input, select, a")) placeCard(id); }} style={{ gridColumn: `span ${(sizes[id] || defaultSize(id)).width}`, gridRow: `span ${Math.ceil(((sizes[id] || defaultSize(id)).height + 14) / 15)}`, height: (sizes[id] || defaultSize(id)).height }}><header {...dragProps("card", id)}><h2>{label(id)}</h2><div>{editing && <button className="aw-place-button" aria-pressed={selectedCard === id} onClick={() => placeCard(id)}>{selectedCard === id ? "선택 취소" : selectedCard ? "여기로 이동" : "위치 선택"}</button>}<button className="aw-detail-link" onClick={() => onChange(id)}>상세 보기 →</button></div></header>
          {editing && <div className="aw-size-readout">가로 {Math.round((sizes[id] || defaultSize(id)).width / 6 * 100)}% · 높이 {(sizes[id] || defaultSize(id)).height}px</div>}
          <div className="aw-card-content">
          {id === "bookings" && <BookingCalendar compact clinicId={clinicId} branchId={branchId} allClinics={mode === "admin"} />}
          {id === "today" && <>{upcoming.slice(0, 5).map(b => <div className="aw-list-item" key={b.id}><div>{customerName(b.userId)}<small>{b.date} · {b.time}</small></div><span className="aw-tag">{b.status}</span></div>)}{!upcoming.length && <div className="aw-example"><small>예약 예시 · 실제 예약 없음</small><strong>김민지 · 레이저 토닝</strong><p>예시 시간 10:00 · 확정 예약</p></div>}</>}
          {id === "inventory" && <><table className="aw-table"><thead><tr><th>제품</th><th>수량</th></tr></thead><tbody>{inventory.slice(0, 4).map(i => <tr key={i.id}><td>{db.products.find(p => p.id === i.productId)?.name || i.productId}</td><td className={isLowStock(i) ? "aw-low-stock" : ""}>{i.qty}{isLowStock(i) && <small> 재고 부족</small>}</td></tr>)}</tbody></table></>}
          {id === "customers" && <>{customers.slice(0, 4).map(c => <div className="aw-list-item" key={c.id}><span>{c.name}</span><small>{c.phone}</small></div>)}</>}
          {id === "inbox" && <><div className="aw-unread-count">읽지 않은 대화 <strong>{unread.length}건</strong></div>{unread.length === 0 ? <p className="aw-empty">읽지 않은 메시지가 없습니다.</p> : unread.map(t => <div className="aw-list-item aw-unread-message" key={t.id}><div><strong>{t.customerName}</strong><small>{t.messages.filter(message => message.role === "user").at(-1)?.text || t.messages.at(-1)?.text || "메시지 없음"}</small></div><span className="aw-unread-badge">미읽음 · {t.channel}</span></div>)}</>}
          {id === "stats" && <><div className="aw-list-item"><span>방문 완료 예약</span><strong>{bookings.filter(b => b.status === "방문완료").length}건</strong></div><div className="aw-list-item"><span>취소 예약</span><strong>{bookings.filter(b => b.status === "취소").length}건</strong></div></>}
          {id === "charts" && <>{db.charts.filter(c => c.clinicId === clinicId && c.branchId === branchId).slice(0,3).map(c => <div className="aw-list-item" key={c.id}><div><strong>{customerName(c.customerId)}</strong><small>{c.visitDate} · {c.treatmentNames.join(", ")}</small><small>{c.comment}</small></div></div>)}{!db.charts.some(c => c.branchId === branchId) && <div className="aw-example"><small>예시 전자차트</small><strong>김민지 · 레이저 토닝</strong><p>피부 상태 확인 후 시술 진행 · 경과 관찰</p></div>}</>}
          {id === "ai" && <><div className="aw-ai-actions"><button onClick={() => onChange("ai")}>📷 카메라</button><button onClick={() => onChange("ai")}>🎙 마이크</button></div><div className="aw-example"><small>입력 예시</small><p>김민지 고객, 레이저 토닝 상담. 시술 후 관리 방법 안내.</p></div></>}
          {id === "sms" && <>{db.smsLogs.filter(log => log.clinicId === clinicId).slice(0,3).map(log => <div className="aw-list-item" key={log.id}><div><strong>{log.customerName} · {log.template}</strong><small>{log.text}</small></div></div>)}{!db.smsLogs.some(log => log.clinicId === clinicId) && <div className="aw-example"><small>문자 예시 · 미발송</small><strong>예약 안내</strong><p>고객님, 내일 예약하신 시술 일정을 안내드립니다. 방문 전 궁금한 점은 연락해주세요.</p></div>}</>}
          {id === "promo" && <>{db.promotions.filter(p => p.clinicId === clinicId).slice(0,2).map(p => <div className="aw-example" key={p.id}><small>프로모션 예시 · {p.discountPct}% 할인</small><strong>{p.title}</strong><p>{p.description}</p></div>)}{!db.promotions.some(p => p.clinicId === clinicId) && <div className="aw-example"><small>AI 프로모션 예시</small><strong>화이트닝 페스티벌</strong><p>레이저 토닝 패키지 20% 할인 · 상세 창에서 기존 생성 기능 사용</p></div>}</>}
          {id === "reviews" && <>{db.reviews.slice(0,3).map(r => <div className="aw-list-item" key={r.id}><div><strong>{r.rating}점 · {r.approved ? "승인" : "검토 대기"}</strong><small>{r.text}</small></div></div>)}</>}
          {id === "users" && <>{db.users.slice(0,4).map(u => <div className="aw-list-item" key={u.id}><span>{u.name}</span><small>{u.id}</small></div>)}</>}
          {id === "clinic" && <>{db.clinics.slice(0,3).map(c => <div className="aw-list-item" key={c.id}><div><strong>{c.name}</strong><small>{c.address}</small></div></div>)}</>}
          {id === "notice" && <>{db.popups.slice(0,2).map(p => <div className="aw-example" key={p.id}><small>{p.active ? "활성 팝업" : "비활성 팝업"}</small><strong>{p.title}</strong></div>)}</>}
          {id === "account" && <>{db.accounts.slice(0,3).map(a => <div className="aw-list-item" key={a.id}><span>{a.id}</span><small>기존 계정 관리에서 상세 확인</small></div>)}</>}
          </div>
          {editing && <><button className="aw-resize aw-resize-right" aria-label={`${label(id)} 가로 크기 조절`} {...resizeProps(id, "width")} /><button className="aw-resize aw-resize-bottom" aria-label={`${label(id)} 높이 조절`} {...resizeProps(id, "height")} /><button className="aw-resize aw-resize-corner" aria-label={`${label(id)} 크기 조절`} {...resizeProps(id, "both")}>↘</button></>}
        </section>)}</div>{cards.length === 0 && <p className="aw-empty">표시할 창이 없습니다. 왼쪽 배치 편집에서 창을 선택하세요.</p>}</> : <>{section === "bookings" && <div className="aw-card aw-reservation-calendar"><BookingCalendar clinicId={clinicId} branchId={branchId} allClinics={mode === "admin"} /></div>}<div className="aw-existing">{children}</div></>}
    </main>
  </div>;
}

function BookingCalendar({ compact = false, clinicId, branchId, allClinics = false }: { compact?: boolean; clinicId: string; branchId: string; allClinics?: boolean }) {
  const { db } = useDb();
  const [month, setMonth] = useState(() => (() => { const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).formatToParts(new Date()); return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`; })());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  if (!db) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const count = new Date(year, monthNumber, 0).getDate();
  const bookings = db.bookings.filter(b => b.date.startsWith(month) && (allClinics || (b.clinicId === clinicId && b.branchId === branchId)));
  function shift(offset: number) { const date = new Date(year, monthNumber - 1 + offset, 1); setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`); setSelectedDay(null); setSelected(null); }
  const visible = bookings.filter(b => !selectedDay || b.date === selectedDay).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return <div className={`aw-bookings ${compact ? "aw-compact" : ""}`}><div className="aw-calendar-toolbar"><button aria-label="이전 달" onClick={() => shift(-1)}>‹</button><strong>{year}년 {monthNumber}월</strong><button aria-label="다음 달" onClick={() => shift(1)}>›</button><span className="aw-calendar-scope">{allClinics ? "전체 클리닉" : db.branches.find(b => b.id === branchId)?.name}</span></div>
    <div className="aw-calendar">{["일", "월", "화", "수", "목", "금", "토"].map(d => <div className="aw-weekday" key={d}>{d}</div>)}{Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => { const day = `${month}-${String(i + 1).padStart(2, "0")}`; const daily = bookings.filter(b => b.date === day); return <button key={day} className={`aw-calendar-day ${selectedDay === day ? "aw-selected" : ""}`} onClick={() => { setSelectedDay(selectedDay === day ? null : day); setSelected(null); }} aria-label={`${day}, 예약 ${daily.length}건`}><span>{i + 1}</span>{daily.length > 0 && <small>예약 {daily.length}건</small>}</button>; })}</div>
    <div className="aw-booking-list"><h3>{selectedDay || "이번 달"} 예약 <span>{visible.length}건</span>{selectedDay && <button onClick={() => { setSelectedDay(null); setSelected(null); }}>전체 날짜</button>}</h3>{visible.length === 0 ? <p className="aw-empty">해당 날짜에 예약이 없습니다.</p> : visible.slice(0, compact ? 3 : visible.length).map(b => <button className="aw-booking-row" key={b.id} onClick={() => setSelected(b)}><span>{b.date.slice(5)}　{b.time}</span><span>{db.users.find(u => u.id === b.userId)?.name || db.customers.find(c => c.id === b.userId)?.name || b.userId}<small>{db.clinics.find(c => c.id === b.clinicId)?.name}</small></span><span className="aw-tag">{b.status}</span></button>)}</div>
    {selected && <section className="aw-booking-detail" aria-label="예약 상세"><div><h3>예약 상세 · {selected.id}</h3><button onClick={() => setSelected(null)}>닫기</button></div><dl>{[["예약자", db.users.find(u => u.id === selected.userId)?.name || db.customers.find(c => c.id === selected.userId)?.name || selected.userId], ["클리닉", db.clinics.find(c => c.id === selected.clinicId)?.name], ["시술", db.treatments.find(t => t.id === selected.treatmentId)?.name || selected.treatmentId], ["일시", `${selected.date} ${selected.time}`], ["상태", selected.status], ["예약금", `${selected.depositTHB.toLocaleString()} THB`]].map(([title, value]) => <div key={title}><dt>{title}</dt><dd>{value}</dd></div>)}</dl></section>}
  </div>;
}
