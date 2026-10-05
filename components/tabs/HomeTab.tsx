"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { GlassCard, InkButton } from "@/components/ui/primitives";
import ChatView from "@/components/home/ChatView";
import ClinicsView, { MAP } from "@/components/home/ClinicsView";
import BookingFlow from "@/components/home/BookingFlow";
import ClinicChat from "@/components/home/ClinicChat";
import { MyBookings, WriteReview } from "@/components/home/UserPanels";
import type { ChatThread } from "@/lib/types";

type View =
  | { name: "chat"; threadId: string | null }
  | { name: "clinics"; category: string; openId?: string }
  | { name: "booking"; clinicId: string; treatmentId: string; promoId?: string }
  | { name: "clinicChat"; threadId: string }
  | { name: "mybookings" }
  | { name: "review" }
  | { name: "notice" };

// 공지 팝업은 홈에 처음 들어올 때 한 번만 자동으로 띄운다. 탭을 오가며 HomeTab이
// 다시 그려져도 또 뜨지 않게, 컴포넌트 밖(페이지가 열려 있는 동안 유지)에 기억한다.
let popupAutoShown = false;

export default function HomeTab() {
  const { t } = useT();
  const { db } = useDb();
  const toast = useToast();
    const [view, setView] = useState<View>({ name: "chat", threadId: null });
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 새 대화를 눌러도 threadId가 null 그대로면 ChatView의 초기화 효과가 다시 돌지 않는다.
  // 이 값을 key로 써서 아예 새로 마운트시킨다.
  const [chatNonce, setChatNonce] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  // 닫히는 180ms 동안에도 모달을 화면에 남겨 둬야 pop-out이 재생된다.
  // 뜬 경로 그대로 되짚어 사라지게 하려고 popupOpen과 따로 둔다.
  const [popupClosing, setPopupClosing] = useState(false);

  const hasActivePopup = Boolean(db?.popups.some((p) => p.active));
  useEffect(() => {
    if (hasActivePopup && !popupAutoShown) {
      popupAutoShown = true;
      setPopupOpen(true);
    }
  }, [hasActivePopup]);

  if (!db) return null;

  const popup = db.popups.find((p) => p.active);

  // 닫는 동작을 전부 이 한 곳으로 모은다 — 배경 클릭·닫기 버튼·다른 화면으로 넘어가는 버튼
  // 전부 같은 180ms 퇴장 애니메이션을 타야 뜰 때와 대칭이 된다. after는 애니메이션이
  // 끝나길 기다리지 않고 바로 실행한다 — 화면 전환은 즉시, 모달만 그 위에서 사라진다.
  function closePopupModal(after?: () => void) {
    setPopupClosing(true);
    after?.();
    setTimeout(() => {
      setPopupOpen(false);
      setPopupClosing(false);
    }, 180);
  }

  // 팝업이 가리키는 클리닉. 어드민에서 고른 곳, 안 골랐으면 사진 있는 첫 클리닉
  // (10/1 노트 "우선은 클리닉 이미지가 있는 곳으로").
  const popupClinic =
    db.clinics.find((c) => c.id === popup?.clinicId) ??
    db.clinics.find((c) => c.image) ??
    db.clinics[0];

  // 공지 팝업에서 "예약하기"를 누르면 곧장 그 클리닉의 예약 화면으로 보낸다.
  function bookFromPopup() {
    const clinic = popupClinic;
    const treatment = db?.treatments.find((tr) => tr.clinicId === clinic?.id);
    closePopupModal(() => {
      if (clinic && treatment) {
        setView({ name: "booking", clinicId: clinic.id, treatmentId: treatment.id });
      } else {
        setView({ name: "clinics", category: "전체" });
      }
    });
  }

  // 서랍 메뉴에서 고르면 화면을 바꾸고 서랍은 닫는다.
  function go(next: View) {
    setView(next);
    setDrawerOpen(false);
  }

  function newChat() {
    setChatNonce((n) => n + 1);
    go({ name: "chat", threadId: null });
  }

  const title =
    view.name === "clinics"
      ? view.category === MAP
        ? t("catMap")
        : t("clinics")
      : view.name === "mybookings"
        ? t("myBookings")
        : view.name === "review"
          ? t("writeReview")
          : view.name === "notice"
            ? t("notice")
            : "Hey! Beauty";

  const menu: { key: string; label: string; icon: React.ReactNode; active: boolean; to: View }[] = [
    { key: "clinics", label: t("clinics"), icon: <IconClinic />, active: view.name === "clinics" && view.category !== MAP, to: { name: "clinics", category: "전체" } },
    { key: "map", label: t("catMap"), icon: <IconMap />, active: view.name === "clinics" && view.category === MAP, to: { name: "clinics", category: MAP } },
    { key: "mybookings", label: t("myBookings"), icon: <IconCalendar />, active: view.name === "mybookings", to: { name: "mybookings" } },
    { key: "review", label: t("writeReview"), icon: <IconStar />, active: view.name === "review", to: { name: "review" } },
    { key: "notice", label: t("notice"), icon: <IconBell />, active: view.name === "notice", to: { name: "notice" } },
  ];

  return (
    <>
      {/* 클로드 앱처럼: 들어오면 AI 상담 채팅이 먼저, 나머지 메뉴는 왼쪽 위 ☰ 서랍 안에.
          높이를 화면에 맞춰 고정해야 입력창이 늘 맨 아래에 붙어 있다. */}
      <div className="glass relative flex h-[calc(100svh-12.5rem)] min-h-[30rem] flex-col overflow-hidden rounded-card">
        <div className="flex items-center gap-2 px-3 pt-3">
          <RoundIcon label="menu" onClick={() => setDrawerOpen(true)}>
            <IconMenu />
          </RoundIcon>
          <div className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-ink/80">
            {title}
          </div>
          <RoundIcon label={t("newChat")} onClick={newChat}>
            <IconCompose />
          </RoundIcon>
        </div>

        <div className="min-h-0 flex-1">
          {view.name === "chat" ? (
            <ChatView
              key={chatNonce}
              threadId={view.threadId}
              onCta={(category) => setView({ name: "clinics", category })}
            />
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain p-3">
              {view.name === "clinics" && (
                <ClinicsView
                  // 같은 화면 안에서 목록 ↔ 지도 ↔ 특정 클리닉으로 옮겨 갈 때 안쪽 상태를 새로 잡는다.
                  key={`${view.category}|${view.openId ?? ""}`}
                  initialCategory={view.category}
                  initialOpenId={view.openId ?? null}
                  onBook={(clinicId, treatmentId, promoId) =>
                    setView({ name: "booking", clinicId, treatmentId, promoId })
                  }
                />
              )}

              {view.name === "booking" && (
                <BookingFlow
                  clinicId={view.clinicId}
                  treatmentId={view.treatmentId}
                  promoId={view.promoId}
                  onBack={() => setView({ name: "clinics", category: "전체" })}
                  onOpenClinicChat={(threadId) =>
                    setView({ name: "clinicChat", threadId })
                  }
                />
              )}

              {view.name === "clinicChat" && (
                <ClinicChat
                  threadId={view.threadId}
                  onBack={() => setView({ name: "chat", threadId: null })}
                  onEnd={() => {
                    // "이전 대화"는 가장 최근에 주고받은 AI 상담 스레드다.
                    const prev = db.chats
                      .filter((c) => c.kind === "ai")
                      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
                    toast(t("chatEnded"));
                    setView({ name: "chat", threadId: prev?.id ?? null });
                  }}
                />
              )}

              {view.name === "mybookings" && <MyBookings />}
              {view.name === "review" && <WriteReview />}
              {view.name === "notice" && <NoticeList />}
            </div>
          )}
        </div>

        {drawerOpen && (
          <div className="absolute inset-0 z-30">
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setDrawerOpen(false)}
              className="animate-backdrop-in absolute inset-0 bg-ink/30"
            />
            <aside className="animate-drawer-in absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-[#fff7fa] shadow-float">
              <div className="flex items-baseline gap-1.5 px-5 pb-2 pt-5">
                <span className="text-xl font-extrabold tracking-tight">Hey!</span>
                <span className="text-xl font-light text-ink-sub">Beauty</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
                <ul className="space-y-0.5">
                  {menu.map((m) => (
                    <li key={m.key}>
                      <button
                        type="button"
                        onClick={() => go(m.to)}
                        className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[15px] transition active:scale-[0.98] ${
                          m.active ? "bg-ink/[0.07] font-semibold" : "hover:bg-ink/[0.04]"
                        }`}
                      >
                        <span className="text-ink/70">{m.icon}</span>
                        {m.label}
                      </button>
                    </li>
                  ))}
                </ul>

                <ChatHistory
                  activeId={
                    view.name === "chat" || view.name === "clinicChat" ? view.threadId : null
                  }
                  onOpen={(c) =>
                    go(
                      c.kind === "ai"
                        ? { name: "chat", threadId: c.id }
                        : { name: "clinicChat", threadId: c.id },
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-ink/10 p-3">
                <span className="flex size-10 items-center justify-center rounded-pill bg-hb-400/30 text-sm font-bold text-hb-600">
                  {t("도도").slice(0, 1)}
                </span>
                <button
                  type="button"
                  onClick={newChat}
                  className="flex items-center gap-1.5 rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97]"
                >
                  <span className="text-base leading-none">+</span>
                  {t("newChat")}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* <main>에 animate-rise(transform)가 걸려 있어서, 그 안에서 fixed를 쓰면
          화면이 아니라 main 박스를 기준으로 붙는다. body로 빼내야 화면 전체를 덮는다.
          홈에 들어오면 채팅 화면 위에 이 팝업이 먼저 뜬다. */}
      {popup && (popupOpen || popupClosing) && createPortal(
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 ${
            popupClosing ? "animate-backdrop-out" : "animate-backdrop-in"
          }`}
          onClick={() => closePopupModal()}
        >
          <div
            className={`max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-card bg-white ${
              popupClosing ? "animate-pop-out" : "animate-pop"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {popup.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={popup.image}
                alt={popup.title}
                className="max-h-[45vh] w-full rounded-t-card object-contain"
              />
            )}
            <div className="p-5">
              <div className="text-xs text-ink-sub">{t("noticePopup")}</div>
              <div className="mt-1 text-lg font-bold tracking-tight">{t(popup.title)}</div>
              <p className="mt-2 text-sm text-ink/75">{t(popup.body)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <InkButton
                  arrow={false}
                  onClick={() =>
                    closePopupModal(() =>
                      setView({ name: "clinics", category: "전체", openId: popupClinic?.id }),
                    )
                  }
                >
                  {t("clinics")}
                </InkButton>
                <InkButton arrow={false} onClick={bookFromPopup}>
                  {t("book")}
                </InkButton>
                <button
                  type="button"
                  onClick={() => closePopupModal()}
                  className="rounded-pill px-4 py-2.5 text-sm text-ink-sub hairline transition duration-100 active:scale-[0.97]"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function RoundIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-white/70 text-ink/80 hairline transition active:scale-[0.94]"
    >
      {children}
    </button>
  );
}

// 서랍·상단 아이콘. 선 두께를 맞춘 라인 아이콘이다.
const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IconMenu = () => (
  <svg {...iconProps}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
const IconCompose = () => (
  <svg {...iconProps}><path d="M12 20h8" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
const IconClinic = () => (
  <svg {...iconProps}><path d="M4 21V8l8-5 8 5v13" /><path d="M10 21v-5h4v5M12 8v4M10 10h4" /></svg>
);
const IconMap = () => (
  <svg {...iconProps}><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z" /><circle cx="12" cy="10" r="2.2" /></svg>
);
const IconCalendar = () => (
  <svg {...iconProps}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
const IconStar = () => (
  <svg {...iconProps}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" /></svg>
);
const IconBell = () => (
  <svg {...iconProps}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
);

function NoticeList() {
  const { t } = useT();
  const { db } = useDb();
  if (!db) return null;

  const notices = db.notices.filter((n) => n.target !== "클리닉");

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold tracking-tight">{t("notice")}</h2>
      <div className="mt-4 space-y-2">
        {notices.map((n) => (
          <div key={n.id} className="rounded-cell bg-white/70 p-4 hairline">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{t(n.title)}</span>
              <span className="text-[11px] text-ink-sub">{n.at.slice(0, 10)}</span>
            </div>
            <p className="mt-1.5 text-sm text-ink/75">{t(n.body)}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/**
 * 지난 대화 목록. AI 상담과 클리닉 채팅을 한 줄로 섞어 최근 것부터 보여 준다.
 * 누르면 그 대화가 이어서 열린다 — AI 상담은 채팅 화면, 클리닉 채팅은 클리닉 대화 화면.
 */
function ChatHistory({
  activeId,
  onOpen,
}: {
  activeId: string | null;
  onOpen: (c: ChatThread) => void;
}) {
  const { t, lang } = useT();
  const { db } = useDb();
  if (!db) return null;

  const chats = [...db.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const clinicName = (id: string | null) =>
    db.clinics.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="mt-4 border-t border-ink/10 pt-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs text-ink-sub">{t("myChats")}</span>
        <span className="text-[11px] text-ink-sub/70">{chats.length}</span>
      </div>
      {chats.length === 0 ? (
        <p className="px-1 py-2 text-xs text-ink-sub">{t("noChats")}</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto pr-0.5">
          {chats.map((c) => {
            const on = c.id === activeId;
            const last = c.messages[c.messages.length - 1];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpen(c)}
                  className={`w-full rounded-cell px-3 py-2 text-left transition ${
                    on ? "bg-ink text-white" : "hover:bg-white/70"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`shrink-0 rounded-pill px-1.5 py-px text-[10px] font-semibold ${
                        on
                          ? "bg-white/15 text-white"
                          : c.kind === "ai"
                            ? "bg-hb-400/25 text-hb-600"
                            : "bg-ink/8 text-ink-sub"
                      }`}
                    >
                      {c.kind === "ai" ? t("aiTag") : t("clinicTag")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {c.kind === "ai" ? t(c.title) : t(clinicName(c.clinicId))}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 flex items-center gap-2 text-[11px] ${
                      on ? "text-white/60" : "text-ink-sub"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{last ? t(last.text) : ""}</span>
                    <span className="shrink-0">
                      {new Date(c.updatedAt).toLocaleDateString(lang === "ko" ? "ko-KR" : lang, {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
