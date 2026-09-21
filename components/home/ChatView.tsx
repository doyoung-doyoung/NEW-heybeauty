"use client";

import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type Scenario, turnAt } from "@/lib/scenario";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { InkButton } from "@/components/ui/primitives";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  text: string;
  followUps?: string[];
  cta?: string;
  category?: string;
}

const GENERIC_ANSWER =
  "질문 주신 내용은 상담 시 의료진 확인이 필요한 부분이 있습니다. 아래 추천 질문으로 먼저 시작해 보시거나, 바로 클리닉 상담을 연결해 드릴게요.";

export default function ChatView({
  threadId,
  onCta,
}: {
  threadId: string | null;
  onCta: (category: string) => void;
}) {
  const { t } = useT();
  const { db, update } = useDb();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const savedThreadId = useRef<string | null>(null);

  // db는 매 저장마다 새 객체라 의존성에 넣으면 진행 중인 대화가 초기화된다
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    const current = dbRef.current;
    if (!threadId || !current) {
      setBubbles([]);
      setScenario(null);
      setTurnIndex(0);
      savedThreadId.current = null;
      return;
    }
    const thread = current.chats.find((c) => c.id === threadId);
    if (!thread) return;
    savedThreadId.current = threadId;
    setBubbles(
      thread.messages.map((m) => ({
        id: m.id,
        role: m.role === "clinic" ? "assistant" : m.role,
        text: m.text,
      })),
    );
    const matched = SCENARIOS.find((s) => s.question === thread.title) ?? null;
    setScenario(matched);
    setTurnIndex(matched ? 1 : 0);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, typing]);

  function persist(next: Bubble[], title: string) {
    const id = savedThreadId.current ?? `CH-${Date.now()}`;
    savedThreadId.current = id;
    update((draft) => {
      const messages = next.map((b, i) => ({
        id: `${id}-M${i + 1}`,
        role: b.role,
        text: b.text,
        at: new Date().toISOString(),
      }));
      const existing = draft.chats.find((c) => c.id === id);
      if (existing) {
        existing.messages = messages;
        existing.updatedAt = new Date().toISOString();
        return;
      }
      draft.chats.unshift({
        id,
        kind: "ai",
        userId: "U1",
        clinicId: null,
        title,
        messages,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  function ask(question: string, forced?: Scenario) {
    const target =
      forced ?? scenario ?? SCENARIOS.find((s) => s.question === question) ?? null;

    const userBubble: Bubble = {
      id: `b-${Date.now()}`,
      role: "user",
      text: question,
    };
    const withUser = [...bubbles, userBubble];
    setBubbles(withUser);
    setTyping(true);
    setInput("");

    setTimeout(() => {
      let reply: Bubble;
      if (target) {
        const turn = turnAt(target, turnIndex);
        reply = {
          id: `b-${Date.now()}-a`,
          role: "assistant",
          text: turn.answer,
          followUps: turn.followUps,
          cta: turn.cta,
          category: target.category,
        };
        setScenario(target);
        setTurnIndex((i) => Math.min(i + 1, target.turns.length - 1));
      } else {
        reply = {
          id: `b-${Date.now()}-a`,
          role: "assistant",
          text: GENERIC_ANSWER,
          followUps: SCENARIOS.map((s) => s.question),
          cta: "클리닉을 추천받아 볼까요?",
          category: "전체",
        };
      }
      const next = [...withUser, reply];
      setBubbles(next);
      setTyping(false);
      persist(next, target ? target.question : question);
    }, 700);
  }

  const empty = bubbles.length === 0;

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[28rem] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {empty && (
          <div className="animate-rise pt-6">
            <h2 className="text-2xl font-bold leading-snug">
              {t("chatTitle")}
            </h2>
            <p className="mt-2 text-sm text-ink-sub">
              {t("chatSubtitle")}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setScenario(s);
                    setTurnIndex(0);
                    ask(s.question, s);
                  }}
                  className="lift rounded-card bg-white/70 p-5 text-left hairline"
                >
                  <div className="text-xs font-semibold text-hb-600">
                    {t(s.category)}
                  </div>
                  <div className="mt-2 font-semibold leading-snug">
                    {t(s.question)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {bubbles.map((b) => (
          <div key={b.id} className="animate-pop">
            <div
              className={
                b.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-card px-4 py-3 text-sm leading-relaxed ${
                  b.role === "user"
                    ? "bg-ink text-white"
                    : "bg-white/75 text-ink hairline"
                }`}
              >
                {t(b.text)}
              </div>
            </div>

            {b.role === "assistant" && (b.followUps || b.cta) && (
              <div className="mt-3 space-y-2">
                {b.followUps?.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="block w-full rounded-pill bg-white/60 px-4 py-2.5 text-left text-sm transition hairline hover:bg-white"
                  >
                    {t(q)}
                  </button>
                ))}
                {b.cta && (
                  <button
                    type="button"
                    onClick={() => onCta(b.category ?? "전체")}
                    className="flex w-full items-center justify-between gap-3 rounded-pill bg-hb-400/25 px-4 py-2.5 text-left text-sm font-medium text-hb-600 transition hover:bg-hb-400/40"
                  >
                    {t(b.cta)}
                    <span className="shrink-0 text-xs">{t("bookShort")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

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
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) ask(input.trim());
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          className="flex-1 rounded-pill bg-white/70 px-5 py-3 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
        />
        <InkButton onClick={() => input.trim() && ask(input.trim())}>
          {t("send")}
        </InkButton>
      </form>
    </div>
  );
}
