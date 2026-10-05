"use client";

import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type Scenario, turnAt } from "@/lib/scenario";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";

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
  onSaved,
}: {
  threadId: string | null;
  onCta: (category: string) => void;
  /** 대화가 저장될 때마다 그 스레드 id를 알려 준다 — "채팅으로 돌아가기"가 이 대화로 돌아온다. */
  onSaved?: (threadId: string) => void;
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
    onSaved?.(id);
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

  // 클로드 앱처럼: 대화 전에는 화면 한가운데 인사말 하나, 입력창은 늘 맨 아래에 붙어 있다.
  // 부모(HomeTab)가 높이를 정해 주고, 여기서는 그 안을 꽉 채운다.
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
        {empty && (
          <div className="animate-rise flex h-full flex-col items-center justify-center text-center">
            <SparkMark />
            <h2 className="mt-4 text-[22px] font-semibold tracking-tight text-ink/85">
              {t("chatTitle")}
            </h2>
          </div>
        )}

        {!empty && bubbles.map((b) => (
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

      <div className="px-3 pb-3">
        {/* 대화 전에만 예시 질문을 입력창 바로 위에 칩으로 둔다 — 눌러서 바로 시작. */}
        {empty && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setScenario(s);
                  setTurnIndex(0);
                  ask(s.question, s);
                }}
                className="shrink-0 rounded-pill bg-white/70 px-3.5 py-2 text-left text-[13px] transition hairline active:scale-[0.97]"
              >
                <span className="mr-1.5 font-semibold text-hb-600">{t(s.category)}</span>
                {t(s.question)}
              </button>
            ))}
          </div>
        )}

        <form
          className="rounded-[26px] bg-white/90 p-2 shadow-float hairline"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) ask(input.trim());
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chatPlaceholder")}
            className="w-full bg-transparent px-3 pb-3 pt-2 text-[15px] outline-none placeholder:text-ink-sub"
          />
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-pill text-ink-sub hairline">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            <span className="rounded-pill px-3 py-2 text-xs font-medium text-ink-sub hairline">
              {t("aiTag")}
            </span>
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!input.trim()}
              className="ml-auto flex size-9 items-center justify-center rounded-pill bg-ink text-white transition disabled:bg-ink/25 active:scale-[0.95]"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * 홈 화면 한가운데 마크 — 헤이뷰티 HB 로고(10/5 도영님 3안: 검은 네모 없이 마크만, 사이트 핑크).
 * 투명 PNG를 마스크로 써서 색은 CSS로 칠한다. 색을 바꾸려면 backgroundColor만 바꾸면 된다.
 */
function SparkMark() {
  const mask = "url(/brand/logo-mark.png) center / contain no-repeat";
  return (
    <span
      role="img"
      aria-label="Hey! Beauty"
      className="block size-14"
      style={{ backgroundColor: "var(--color-hb-600)", WebkitMask: mask, mask }}
    />
  );
}
