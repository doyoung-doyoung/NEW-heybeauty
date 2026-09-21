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

type View =
  | { name: "chat"; threadId: string | null }
  | { name: "clinics"; category: string }
  | { name: "booking"; clinicId: string; treatmentId: string }
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
  const [popupOpen, setPopupOpen] = useState(false);

  if (!db) return null;

  const popup = db.popups.find((p) => p.active);

  // 공지 팝업에서 "예약하기"를 누르면 곧장 예약 화면으로 보낸다.
  // 팝업에 클리닉이 지정돼 있지는 않아서 첫 번째 클리닉의 첫 시술을 쓴다.
  function bookFromPopup() {
    const clinic = db?.clinics[0];
    const treatment = db?.treatments.find((tr) => tr.clinicId === clinic?.id);
    setPopupOpen(false);
    if (clinic && treatment) {
      setView({ name: "booking", clinicId: clinic.id, treatmentId: treatment.id });
    } else {
      setView({ name: "clinics", category: "전체" });
    }
  }

  // 작은 화면에서는 가로로 늘어선 칩이라 글자 너비만 차지해야 한다. w-full을 주면
  // 칩 하나가 화면을 다 먹어 나머지가 밖으로 밀려난다. lg부터는 세로 사이드바라 그때만 꽉 채운다.
  const sideItem = (key: string, label: string, active: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`w-auto shrink-0 rounded-cell px-3 py-2.5 text-left text-sm transition lg:w-full ${
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
          {/* 배너에서는 이미지가 위아래로 잘린다. 눌러서 전체 이미지를 볼 수 있게 한다. */}
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="block w-full text-left"
          >
            {popup.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={popup.image} alt={popup.title} className="h-40 w-full object-cover" />
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
              className="shrink-0 rounded-pill border border-white/25 px-3 py-1.5 text-xs"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {/* <main>에 animate-rise(transform)가 걸려 있어서, 그 안에서 fixed를 쓰면
          화면이 아니라 main 박스를 기준으로 붙는다. body로 빼내야 화면 전체를 덮는다. */}
      {popup && popupOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          onClick={() => setPopupOpen(false)}
        >
          <div
            className="animate-pop max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-card bg-white"
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
              <div className="mt-1 text-lg font-bold">{t(popup.title)}</div>
              <p className="mt-2 text-sm text-ink/75">{t(popup.body)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <InkButton
                  arrow={false}
                  onClick={() => {
                    setPopupOpen(false);
                    setView({ name: "clinics", category: "전체" });
                  }}
                >
                  {t("clinics")}
                </InkButton>
                <InkButton arrow={false} onClick={bookFromPopup}>
                  {t("book")}
                </InkButton>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  className="rounded-pill px-4 py-2.5 text-sm text-ink-sub hairline"
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
              onClick={() => setView({ name: "chat", threadId: null })}
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
        </GlassCard>

        <div>
          {view.name === "chat" && (
            <GlassCard className="p-5">
              <ChatView
                threadId={view.threadId}
                onCta={(category) => setView({ name: "clinics", category })}
              />
            </GlassCard>
          )}

          {view.name === "clinics" && (
            <ClinicsView
              initialCategory={view.category}
              onBook={(clinicId, treatmentId) =>
                setView({ name: "booking", clinicId, treatmentId })
              }
            />
          )}

          {view.name === "booking" && (
            <BookingFlow
              clinicId={view.clinicId}
              treatmentId={view.treatmentId}
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
