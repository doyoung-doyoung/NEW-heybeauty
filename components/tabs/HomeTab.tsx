"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { GlassCard, InkButton } from "@/components/ui/primitives";
import ChatView from "@/components/home/ChatView";
import ClinicsView from "@/components/home/ClinicsView";
import BookingFlow from "@/components/home/BookingFlow";
import ClinicChat from "@/components/home/ClinicChat";
import { MyBookings, WriteReview } from "@/components/home/UserPanels";
import type { ChatThread } from "@/lib/types";

type View =
  | { name: "chat"; threadId: string | null }
  | { name: "clinics"; category: string }
  | { name: "booking"; clinicId: string; treatmentId: string; promoId?: string }
  | { name: "clinicChat"; threadId: string }
  | { name: "mybookings" }
  | { name: "review" }
  | { name: "notice" };

export default function HomeTab() {
  const { t, tf } = useT();
  const { db } = useDb();
  const toast = useToast();
  const [view, setView] = useState<View>({ name: "chat", threadId: null });
  const [loggedIn, setLoggedIn] = useState(false);
  const [popupClosed, setPopupClosed] = useState(false);
  // 새 대화를 눌러도 threadId가 null 그대로면 ChatView의 초기화 효과가 다시 돌지 않는다.
  // 이 값을 key로 써서 아예 새로 마운트시킨다.
  const [chatNonce, setChatNonce] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  // 닫히는 180ms 동안에도 모달을 화면에 남겨 둬야 pop-out이 재생된다.
  // 뜬 경로 그대로 되짚어 사라지게 하려고 popupOpen과 따로 둔다.
  const [popupClosing, setPopupClosing] = useState(false);

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

  // 공지 팝업에서 "예약하기"를 누르면 곧장 예약 화면으로 보낸다.
  // 팝업에 클리닉이 지정돼 있지는 않아서 첫 번째 클리닉의 첫 시술을 쓴다.
  function bookFromPopup() {
    const clinic = db?.clinics[0];
    const treatment = db?.treatments.find((tr) => tr.clinicId === clinic?.id);
    closePopupModal(() => {
      if (clinic && treatment) {
        setView({ name: "booking", clinicId: clinic.id, treatmentId: treatment.id });
      } else {
        setView({ name: "clinics", category: "전체" });
      }
    });
  }

  // 작은 화면에서는 가로로 늘어선 칩이라 글자 너비만 차지해야 한다. w-full을 주면
  // 칩 하나가 화면을 다 먹어 나머지가 밖으로 밀려난다. lg부터는 세로 사이드바라 그때만 꽉 채운다.
  const sideItem = (key: string, label: string, active: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`w-auto shrink-0 rounded-cell px-3 py-2.5 text-left text-sm transition duration-100 active:scale-[0.97] lg:w-full ${
        active ? "bg-ink text-white" : "hover:bg-white/70"
      }`}
    >
      <span className="truncate font-medium">{label}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      {popup && !popupClosed && (
        <div className="animate-rise overflow-hidden rounded-card bg-ink text-white">
          {/* 배너를 눌러도 크게 볼 수 있게 한다. */}
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="block w-full text-left"
          >
            {popup.image && (
              // 광고 이미지에 글씨가 들어 있어서 위아래를 자르면 안 된다. 비율(12:5) 그대로 보여 준다.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={popup.image} alt={popup.title} className="aspect-[12/5] w-full object-cover" />
            )}
          </button>
          <div className="flex items-start justify-between gap-4 p-5">
            <button
              type="button"
              onClick={() => setPopupOpen(true)}
              className="min-w-0 text-left"
            >
              <div className="text-xs text-white/60">{t("noticePopup")}</div>
              <div className="mt-1 font-bold">{t(popup.title)}</div>
              <p className="mt-1 text-sm text-white/75">{t(popup.body)}</p>
              <span className="mt-2 inline-block text-xs text-white/60 underline">
                {t("detail")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPopupClosed(true)}
              className="shrink-0 rounded-pill border border-white/25 px-3 py-1.5 text-xs transition duration-100 active:scale-[0.97]"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {/* <main>에 animate-rise(transform)가 걸려 있어서, 그 안에서 fixed를 쓰면
          화면이 아니라 main 박스를 기준으로 붙는다. body로 빼내야 화면 전체를 덮는다. */}
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
                    closePopupModal(() => setView({ name: "clinics", category: "전체" }))
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

      <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
        <GlassCard className="h-fit min-w-0 p-4">
          {loggedIn ? (
            <div className="mb-3 flex items-center gap-2 rounded-cell bg-white/70 p-3 hairline">
              <span className="flex size-8 items-center justify-center rounded-pill bg-hb-400/30 text-xs font-bold text-hb-600">
                {t("도도").slice(0, 1)}
              </span>
              <div className="text-sm">
                <div className="font-semibold">{tf("userGreeting", t("도도"))}</div>
                <div className="text-[11px] text-ink-sub">{t("lineLinked")}</div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoggedIn(true);
                toast(t("loginDone"));
              }}
              className="mb-3 w-full rounded-pill bg-[#06C755] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              {t("login")}
            </button>
          )}

          <div className="mb-3">
            <InkButton
              arrow={false}
              className="w-full justify-center"
              onClick={() => {
                setChatNonce((n) => n + 1);
                setView({ name: "chat", threadId: null });
              }}
            >
              {t("newChat")}
            </InkButton>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {sideItem("clinics", t("clinics"), view.name === "clinics", () =>
              setView({ name: "clinics", category: "전체" }),
            )}
            {sideItem("mybookings", t("myBookings"), view.name === "mybookings", () =>
              setView({ name: "mybookings" }),
            )}
            {sideItem("review", t("writeReview"), view.name === "review", () =>
              setView({ name: "review" }),
            )}
            {sideItem("notice", t("notice"), view.name === "notice", () =>
              setView({ name: "notice" }),
            )}
          </div>

          <ChatHistory
            activeId={
              view.name === "chat" || view.name === "clinicChat" ? view.threadId : null
            }
            onOpen={(c) =>
              setView(
                c.kind === "ai"
                  ? { name: "chat", threadId: c.id }
                  : { name: "clinicChat", threadId: c.id },
              )
            }
          />
        </GlassCard>

        <div>
          {view.name === "chat" && (
            <GlassCard className="p-5">
              <ChatView
                key={chatNonce}
                threadId={view.threadId}
                onCta={(category) => setView({ name: "clinics", category })}
              />
            </GlassCard>
          )}

          {view.name === "clinics" && (
            <ClinicsView
              initialCategory={view.category}
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
      </div>
    </div>
  );
}

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
        <span className="text-xs font-semibold text-ink-sub">{t("myChats")}</span>
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
