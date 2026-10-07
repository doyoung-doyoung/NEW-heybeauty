import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { buildSeed, TREATMENT_POOL } from "@/lib/seed";
import { cityOf } from "@/lib/geo";

export const runtime = "nodejs";
export const maxDuration = 60;

// 홈 AI 상담. 시나리오 대본 대신 실제 AI가 답하고, 대화에 맞는 클리닉을 골라 카드로 띄운다.
// 클리닉·시술·가격은 시드(앱 첫 화면과 같은 99곳)에서 만들어 시스템 프롬프트에 넣는다.
// 어드민에서 바꾼 가격은 아직 반영되지 않는다 — 서버 DB가 생기면 거기서 읽도록 바꾼다.

const CHAT_CATEGORIES = ["전체", "화이트닝", "V라인", "리프팅", "스킨부스터", "필러"] as const;

// beauty: 뷰티 상담 / offtopic_ask: "뷰티 전문이에요, 그래도 답할까요?" / offtopic_answer: 범위 밖 질문에 답함
// offtopic_limit: 범위 밖 답이 2번을 넘음 — 답은 하되 끝에 "대신 뷰티 정보를 알아볼까요?"를 붙인다
const TOPICS = ["beauty", "offtopic_ask", "offtopic_answer", "offtopic_limit"] as const;
const OFFTOPIC_LIMIT = 2;

const LANG_NAMES: Record<string, string> = {
  ko: "한국어",
  en: "English",
  th: "ภาษาไทย (태국어)",
  zh: "中文 (중국어 간체)",
  ru: "Русский (러시아어)",
  ar: "العربية (아랍어)",
};

const MAX_TURNS = 16; // 최근 메시지만 보낸다 — 대화가 길어져도 요금이 끝없이 늘지 않게.
const MAX_TEXT = 1000;

// 시드는 고정 난수라 매번 같은 목록이 나온다. 서버가 떠 있는 동안 한 번만 만든다.
// 목록 글자가 매번 똑같아야 프롬프트 캐시가 맞는다 — 날짜처럼 바뀌는 값은 넣지 않는다.
let catalogCache: { text: string; ids: Set<string> } | null = null;

function catalog() {
  if (catalogCache) return catalogCache;
  const db = buildSeed();
  // 99곳이 같은 시술 목록을 쓴다 → 시술 이름은 머리줄에 한 번만 적고, 클리닉 줄에는 가격만 같은 순서로 적는다.
  // 시술 이름을 줄마다 반복하면 프롬프트가 두 배 넘게 길어져 질문마다 요금이 더 나간다.
  const header = TREATMENT_POOL.map((t, i) => `${i + 1}.${t.name}(${t.category})`).join(" ");
  const lines = db.clinics.map((c) => {
    const own = db.treatments.filter((t) => t.clinicId === c.id);
    const prices = TREATMENT_POOL.map((p) => {
      const hit = own.find((t) => t.name === p.name);
      return hit ? String(hit.price) : "-";
    }).join("/");
    // 목록 밖 시술(어드민에서 추가한 것)은 이름과 함께 따로 적는다.
    const extra = own
      .filter((t) => !TREATMENT_POOL.some((p) => p.name === t.name))
      .map((t) => `${t.name}(${t.category}) ${t.price}`)
      .join(", ");
    const promos = db.promotions
      .filter((p) => p.clinicId === c.id)
      .map((p) => `${p.title} ${p.discountPct}%`)
      .join(", ");
    return [
      c.id,
      c.name,
      `${c.district}·${cityOf(c.district)}`,
      `★${c.rating}(${c.reviewCount})`,
      prices,
      extra ? `기타: ${extra}` : "",
      promos ? `프로모션: ${promos}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  });
  catalogCache = {
    text: `가격 칸 순서(태국 바트, "-"는 그 시술 없음): ${header}\n${lines.join("\n")}`,
    ids: new Set(db.clinics.map((c) => c.id)),
  };
  return catalogCache;
}

const RULES = `너는 Hey! Beauty 앱의 AI 뷰티 상담사다. Hey! Beauty는 태국(주로 방콕)의 피부·미용 클리닉을 찾아 비교하고 예약하는 앱이다.
사용자는 관광객이거나 태국에 사는 외국인·태국인이며, 휴대폰으로 짧게 묻는다.

할 일:
- 시술(화이트닝, V라인, 리프팅, 스킨부스터, 필러 등)이 무엇이고 어떻게 다른지, 보통 몇 회·몇 주 간격인지, 다운타임·주의사항이 어떤지 일반적인 정보를 알기 쉽게 설명한다.
- 사용자의 고민·예산·지역에 맞는 클리닉을 아래 [클리닉 목록]에서만 골라 추천한다. 목록에 없는 클리닉·시술·가격·프로모션은 절대 지어내지 않는다.
- 가격은 목록의 가격(태국 바트, ฿)을 그대로 쓰고, "기본 가격이며 실제 금액은 상담 후 확정"이라는 점을 필요할 때 짧게 덧붙인다.

의료 답변 범위 (반드시 지킨다):
- 진단하지 않는다. "~일 가능성이 높다", "이 병이다" 같은 판단, 사진·증상만 보고 원인을 단정하는 말을 하지 않는다.
- 약 처방, 약 용량, 복용 중인 약과 시술의 병용 가능 여부를 판단하지 않는다.
- 효과·안전을 보장하지 않는다("무조건", "부작용 없음" 같은 말 금지). 개인마다 다르다고 말한다.
- 임신·수유 중, 피부 질환, 켈로이드, 알레르기, 지병, 복용 중인 약, 최근 시술 이력, 미성년자 같은 의학적 판단이 필요한 질문에는 일반 정보만 짧게 주고 "클리닉 의료진 상담에서 확인해야 한다"며 상담 연결로 넘긴다.
- 시술 후 심한 통증·부기·열·고름·시야 이상·호흡 곤란 같은 증상을 말하면 즉시 시술 클리닉이나 가까운 병원(응급 시 태국 1669)으로 연락하라고 먼저 안내한다. 이때는 클리닉 추천을 하지 않는다.

뷰티와 관계없는 질문 (날씨, 여행, 맛집, 공부, 코딩 등):
- 처음에는 바로 답하지 않고 "저는 뷰티 전문 AI예요. 그래도 답해 드릴까요?"처럼 한두 문장으로 되묻는다. topic은 "offtopic_ask". followUps 첫 번째는 "네, 답해 주세요" 같은 수락 문장, 나머지는 뷰티 질문.
- 사용자가 그래도 답해 달라고 하면 아는 범위에서 짧고 정확하게 답한다. 모르거나 최신 정보(실시간 날씨·환율·뉴스 등)가 필요하면 확인할 수 없다고 솔직히 말한다. topic은 "offtopic_answer". 답 끝에 뷰티 이야기로 자연스럽게 이어 주는 한 줄을 붙여도 좋다.
- [범위 밖 답변 횟수]가 2 이상이면, 이번 질문에도 짧게 답은 해 주되 답 끝에 줄을 바꿔 "이 이상은 더 도와드리기 어려워요. 대신 뷰티 정보를 알아볼까요?"(사용자 언어로)를 붙인다. 이때는 되묻지 않고 바로 답한다. topic은 "offtopic_limit". followUps는 뷰티 질문만.
- 범위 밖 대화에서는 clinicIds를 비우고 category는 "전체".
- 뷰티 질문은 topic "beauty". 의료 응급·이상 증상은 위 의료 규칙이 우선이다.

답 쓰는 법:
- 반드시 사용자가 쓴 언어로 답한다. 언어를 알기 어려우면 [앱 언어]로 답한다. 시술명·클리닉명도 그 언어로 자연스럽게 쓰되, 클리닉명은 목록 표기를 괄호로 함께 적어도 된다.
- 폰 화면용으로 짧게: 3~8줄. 목록은 "· "로 시작하는 줄로 쓴다. 마크다운 굵게(**)·표·제목(#)은 쓰지 않는다.
- clinicIds: 추천 클리닉 카드로 띄울 id(예: C01) 0~3개. 대부분의 답에서는 빈 배열이다. 카드는 이럴 때만 띄운다:
  · 사용자가 클리닉 추천·어디서 받을지·가격 비교·예약을 직접 물었을 때
  · 시술 설명이 끝나고 고민·예산·지역이 정해져서 클리닉을 고를 단계가 됐을 때
  시술 설명, 다운타임, 관리법, 주의사항 같은 답에는 카드를 띄우지 않는다. 대화에서 이미 카드로 보여 준 클리닉(어시스턴트 메시지의 [추천 카드] 표시)은 사용자가 다시 보여 달라고 하지 않는 한 다시 넣지 않는다. 카드로 띄운 클리닉은 답 본문에서도 언급한다.
- category: 대화의 시술 분류. 화이트닝, V라인, 리프팅, 스킨부스터, 필러 중 하나, 정하기 어려우면 "전체".
- followUps: 사용자가 이어서 누를 만한 짧은 질문 2~3개, 사용자의 언어로, 사용자 입장의 문장으로.
- 사진 속 얼굴·피부를 직접 볼 수 없으므로 "사진을 보면" 같은 말은 하지 않는다.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    followUps: { type: "array", items: { type: "string" } },
    clinicIds: { type: "array", items: { type: "string" } },
    category: { type: "string", enum: [...CHAT_CATEGORIES] },
    topic: { type: "string", enum: [...TOPICS] },
  },
  required: ["answer", "followUps", "clinicIds", "category", "topic"],
  additionalProperties: false,
} as const;

type InMessage = {
  role: "user" | "assistant";
  text: string;
  clinicIds: string[];
  topic: string | null;
};

function readMessages(raw: unknown): InMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const list = raw
    .slice(-60)
    .map((m): InMessage | null => {
      const row = m as { role?: unknown; text?: unknown; clinicIds?: unknown; topic?: unknown };
      if ((row.role !== "user" && row.role !== "assistant") || typeof row.text !== "string") return null;
      const text = row.text.trim().slice(0, MAX_TEXT);
      if (!text) return null;
      const clinicIds = Array.isArray(row.clinicIds)
        ? row.clinicIds.filter((id): id is string => typeof id === "string").slice(0, 3)
        : [];
      const topic = typeof row.topic === "string" && (TOPICS as readonly string[]).includes(row.topic) ? row.topic : null;
      return { role: row.role, text, clinicIds, topic };
    })
    .filter((m): m is InMessage => m !== null);
  // API는 user로 시작해야 한다.
  while (list.length && list[0].role !== "user") list.shift();
  if (!list.length || list[list.length - 1].role !== "user") return null;
  return list;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "no_api_key" }, { status: 503 });
  }

  let body: { messages?: unknown; lang?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const messages = readMessages(body.messages);
  if (!messages) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  const lang = typeof body.lang === "string" && LANG_NAMES[body.lang] ? body.lang : "ko";
  const { text: clinicList, ids } = catalog();
  // 범위 밖 답 횟수와 이미 보여 준 카드는 잘라 내기 전 전체 대화에서 센다.
  const offtopicCount = messages.filter((m) => m.topic === "offtopic_answer").length;
  const shownIds = new Set(messages.flatMap((m) => m.clinicIds));
  const recent = messages.slice(-MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      // 채팅은 빨리 답하는 게 중요하다. 클리닉 고르기 정도는 low로 충분.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        // 규칙 + 클리닉 목록은 매번 같다 → 캐시해서 두 번째 질문부터 입력 요금을 크게 줄인다.
        {
          type: "text",
          text: `${RULES}\n\n[클리닉 목록] (id | 이름 | 동네·도시 | 평점(후기 수) | 시술 기본 가격 | 프로모션)\n${clinicList}`,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `[앱 언어] ${LANG_NAMES[lang]}\n[범위 밖 답변 횟수] ${offtopicCount} (최대 ${OFFTOPIC_LIMIT})`,
        },
      ],
      messages: recent.map((m) => ({
        role: m.role,
        // 어떤 클리닉을 이미 카드로 보여 줬는지 AI가 알 수 있게 표시해 둔다.
        content: m.clinicIds.length ? `${m.text}\n[추천 카드: ${m.clinicIds.join(", ")}]` : m.text,
      })),
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ ok: false, reason: "refused" }, { status: 422 });
    }

    const text = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    let parsed: { answer?: unknown; followUps?: unknown; clinicIds?: unknown; category?: unknown; topic?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, reason: "unreadable" }, { status: 502 });
    }
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!answer) {
      return NextResponse.json({ ok: false, reason: "unreadable" }, { status: 502 });
    }
    const strings = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
    return NextResponse.json({
      ok: true,
      answer,
      followUps: strings(parsed.followUps).slice(0, 3),
      // 목록에 없는 id, 이 대화에서 이미 카드로 보여 준 id는 버린다 — 같은 카드가 매번 달리지 않게.
      clinicIds: [...new Set(strings(parsed.clinicIds))]
        .filter((id) => ids.has(id) && !shownIds.has(id))
        .slice(0, 3),
      topic: typeof parsed.topic === "string" && (TOPICS as readonly string[]).includes(parsed.topic) ? parsed.topic : "beauty",
      category:
        typeof parsed.category === "string" && (CHAT_CATEGORIES as readonly string[]).includes(parsed.category)
          ? parsed.category
          : "전체",
    });
  } catch (err) {
    console.error("[chat]", err);
    const reason =
      err instanceof Anthropic.RateLimitError
        ? "rate_limit"
        : err instanceof Anthropic.APIError
          ? "api_error"
          : "unknown";
    return NextResponse.json({ ok: false, reason }, { status: 502 });
  }
}

/** 배포된 사이트에 키가 걸려 있는지만 확인 (AI 호출 없음). */
export async function GET() {
  return NextResponse.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
}
