"use client";

import { useEffect, useRef, useState } from "react";
import { useDb } from "@/lib/db";
import { GhostButton, GlassCard, InkButton } from "@/components/ui/primitives";
import { DEMO_SLIPS, SlipImage } from "./DemoAssets";

const AUTO_REPLIES = [
  "확인했습니다! 담당 실장이 예약 내용을 다시 한번 확인해 드릴게요.",
  "네, 방문 당일 접수 데스크에서 성함 말씀해주시면 바로 안내됩니다.",
  "해당 시술은 당일 시술 전 의료진 상담이 함께 진행됩니다.",
  "변경이 필요하시면 방문 24시간 전까지 말씀해주세요. 도와드리겠습니다.",
];

export default function ClinicChat({
  threadId,
  onBack,
  onEnd,
}: {
  threadId: string;
  onBack: () => void;
  onEnd: () => void;
}) {
  const { db, update } = useDb();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = db?.chats.find((c) => c.id === threadId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread?.messages.length, typing]);

  if (!db || !thread) return null;
  const clinic = db.clinics.find((c) => c.id === thread.clinicId);

  function send() {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toISOString();
    setInput("");

    update((draft) => {
      const t = draft.chats.find((c) => c.id === threadId);
      if (!t) return;
      t.messages.push({ id: `${threadId}-M${t.messages.length + 1}`, role: "user", text, at: now });
      t.updatedAt = now;

      const inboxThread = draft.inbox.find(
        (i) => i.clinicId === t.clinicId && i.channel === "App",
      );
      if (inboxThread) {
        inboxThread.messages.push({
          id: `${inboxThread.id}-M${inboxThread.messages.length + 1}`,
          role: "user",
          text,
          at: now,
        });
        inboxThread.unread = true;
        inboxThread.updatedAt = now;
      }
    });

    setTyping(true);
    setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const at = new Date().toISOString();
      update((draft) => {
        const t = draft.chats.find((c) => c.id === threadId);
        if (!t) return;
        t.messages.push({
          id: `${threadId}-M${t.messages.length + 1}`,
          role: "clinic",
          text: reply,
          at,
        });
        t.updatedAt = at;
      });
      setTyping(false);
    }, 900);
  }

  return (
    <div className="space-y-4">
      <GhostButton onClick={onBack}>← 뒤로</GhostButton>

      <GlassCard className="flex h-[calc(100dvh-18rem)] min-h-[26rem] flex-col p-5">
        <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
          <div className="min-w-0">
            <div className="truncate font-bold">{clinic?.name ?? "클리닉"}</div>
            <div className="text-xs text-ink-sub">보통 5분 내 답변</div>
          </div>
          {/* 클리닉 상담이 끝나면 원래 보던 AI 대화로 돌아간다. */}
          <button
            type="button"
            onClick={onEnd}
            className="shrink-0 rounded-pill px-3 py-1.5 text-xs text-ink-sub transition hairline hover:bg-white/70"
          >
            종료하기
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-4 pr-1">
          {thread.messages.map((m) => {
            const slip = m.attachment
              ? DEMO_SLIPS.find((s) => s.id === m.attachment)
              : null;
            return (
              <div
                key={m.id}
                className={`animate-pop flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[85%] space-y-2">
                  {slip && (
                    <div className="w-48">
                      <SlipImage slip={slip} compact />
                    </div>
                  )}
                  <div
                    className={`rounded-card px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-ink text-white"
                        : "bg-white/75 text-ink hairline"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-card bg-white/75 px-4 py-4 hairline">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-pill bg-ink-sub"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-center gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="flex-1 rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
          />
          <InkButton onClick={send}>보내기</InkButton>
        </form>
      </GlassCard>
    </div>
  );
}
