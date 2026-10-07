"use client";

import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type Scenario, turnAt } from "@/lib/scenario";
import { useDb } from "@/lib/db";
import { useT } from "@/lib/i18n";
import { SendArrowButton } from "@/components/ui/primitives";
import { ClinicPhoto } from "@/components/home/DemoAssets";
import { clinicStartingPrice } from "@/lib/clinic-discovery";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  text: string;
  followUps?: string[];
  cta?: string;
  category?: string;
  /** AI가 고른 추천 클리닉 */
  clinicIds?: string[];
  /** 실제 AI 답 — 사전 번역(t)을 거치지 않고 그대로 보여 준다 */
  ai?: boolean;
  /** AI 답의 주제 — 뷰티 / 범위 밖(되묻기·답함·그만) */
  topic?: string;
}

type AiReply =
  | { ok: true; answer: string; followUps: string[]; clinicIds: string[]; category: string; topic: string }
  | { ok: false; reason: string };

/** 홈 AI 상담 — 서버(/api/chat)가 실제 AI로 답한다. 실패하면 null → 기존 시나리오 대본으로 대신 답한다. */
async function askAi(history: Bubble[], lang: string): Promise<AiReply | null> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        // 서버가 이미 띄운 카드는 다시 안 띄우고, 범위 밖 답 횟수를 센다.
        messages: history.map((b) => ({
          role: b.role,
          text: b.text,
          clinicIds: b.clinicIds ?? [],
          topic: b.topic ?? null,
        })),
      }),
    });
    return (await res.json()) as AiReply;
  } catch {
    return null;
  }
}

const GENERIC_ANSWER =
  "질문 주신 내용은 상담 시 의료진 확인이 필요한 부분이 있습니다. 아래 추천 질문으로 먼저 시작해 보시거나, 바로 클리닉 상담을 연결해 드릴게요.";

export default function ChatView({
  threadId,
  onCta,
  onOpenClinic,
  onSaved,
}: {
  threadId: string | null;
  onCta: (category: string) => void;
  /** 추천 클리닉 카드를 누르면 그 클리닉 상세로 */
  onOpenClinic: (clinicId: string, category: string) => void;
  /** 대화가 저장될 때마다 그 스레드 id를 알려 준다 — "채팅으로 돌아가기"가 이 대화로 돌아온다. */
  onSaved?: (threadId: string) => void;
}) {
  const { t, tf, lang } = useT();
  const { db, update } = useDb();
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  // 키가 없는 미리보기 등에서 AI가 안 되면, 이 화면에서는 더 묻지 않고 대본으로 답한다.
  const aiOff = useRef(false);
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
        clinicIds: m.clinicIds,
        ai: m.ai,
        topic: m.topic,
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
        ...(b.clinicIds?.length ? { clinicIds: b.clinicIds } : {}),
        ...(b.ai ? { ai: true } : {}),
        ...(b.topic ? { topic: b.topic } : {}),
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

  async function ask(question: string, forced?: Scenario) {
    if (typing) return;
    const target =
      forced ?? scenario ?? SCENARIOS.find((s) => s.question === question) ?? null;

    const userBubble: Bubble = {
      id: `b-${Date.now()}`,
      role: "user",
      // 예시 질문 칩은 사전 키(한국어)라 화면 언어로 바꿔서 AI에 보낸다.
      text: t(question),
    };
    const withUser = [...bubbles, userBubble];
    setBubbles(withUser);
    setTyping(true);
    setInput("");

    const ai = aiOff.current ? null : await askAi(withUser, lang);
    let reply: Bubble;
    let title = withUser[0].text;
    if (ai?.ok) {
      reply = {
        id: `b-${Date.now()}-a`,
        role: "assistant",
        text: ai.answer,
        followUps: ai.followUps,
        clinicIds: ai.clinicIds,
        cta: ai.category === "전체" ? undefined : "chatSeeCategory",
        category: ai.category,
        ai: true,
        topic: ai.topic,
      };
    } else {
      // 키 없음(미리보기)·오류일 때는 예전 시나리오 대본으로 대신 답한다.
      if (ai && !ai.ok && ai.reason === "no_api_key") aiOff.current = true;
      title = target ? target.question : withUser[0].text;
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
    }
    const next = [...withUser, reply];
    setBubbles(next);
    setTyping(false);
    persist(next, title);
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
                {b.ai ? b.text : t(b.text)}
              </div>
            </div>

            {b.role === "assistant" && b.clinicIds && b.clinicIds.length > 0 && db && (
              <RecommendedClinics
                ids={b.clinicIds}
                category={b.category ?? "전체"}
                onOpen={onOpenClinic}
              />
            )}

            {b.role === "assistant" && (b.followUps || b.cta) && (
              <div className="mt-3 space-y-2">
                {b.followUps?.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    disabled={typing}
                    className="block w-full rounded-pill bg-white/60 px-4 py-2.5 text-left text-sm transition hairline hover:bg-white"
                  >
                    {b.ai ? q : t(q)}
                  </button>
                ))}
                {b.cta && (
                  <button
                    type="button"
                    onClick={() => onCta(b.category ?? "전체")}
                    className="flex w-full items-center justify-between gap-3 rounded-pill bg-hb-400/25 px-4 py-2.5 text-left text-sm font-medium text-hb-600 transition hover:bg-hb-400/40"
                  >
                    {b.cta === "chatSeeCategory" ? tf("chatSeeCategory", t(b.category ?? "전체")) : t(b.cta)}
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
            if (input.trim() && !typing) ask(input.trim());
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
            <span className="ml-auto">
              <SendArrowButton label={t("send")} disabled={!input.trim() || typing} />
            </span>
          </div>
        </form>
        <p className="mt-1.5 px-3 text-center text-[11px] leading-snug text-ink-sub/80">
          {t("aiNotice")}
        </p>
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

/** AI가 고른 추천 클리닉 — 작은 카드 가로 줄. 누르면 그 클리닉 상세로 간다. */
function RecommendedClinics({
  ids,
  category,
  onOpen,
}: {
  ids: string[];
  category: string;
  onOpen: (clinicId: string, category: string) => void;
}) {
  const { t, tf } = useT();
  const { db } = useDb();
  if (!db) return null;
  const clinics = ids
    .map((id) => db.clinics.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (!clinics.length) return null;
  return (
    <div className="mt-3">
      <div className="mb-1.5 px-1 text-xs font-semibold text-ink-sub">{t("aiRecommended")}</div>
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {clinics.map((c) => {
          const price = clinicStartingPrice(db.treatments, c.id, category);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id, category)}
              className="w-[168px] shrink-0 snap-start overflow-hidden rounded-card bg-white/80 text-left transition hairline active:scale-[0.98]"
            >
              <div className="h-20 w-full">
                <ClinicPhoto clinicId={c.id} name={t(c.name)} district={t(c.district)} src={c.image} />
              </div>
              <div className="p-2.5">
                <div className="truncate text-[13px] font-semibold">{t(c.name)}</div>
                <div className="mt-0.5 truncate text-[11px] text-ink-sub">
                  {t(c.district)} · ★{c.rating}
                </div>
                {Number.isFinite(price) && (
                  <div className="mt-1 text-[12px] font-semibold text-hb-600">
                    {tf("chatFromPrice", price.toLocaleString("en-US"))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
