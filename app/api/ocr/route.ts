import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// 어떤 사진이든 읽는다 — 제품 박스만이 아니라 신분증·송금 슬립·기존 CRM 화면 캡처·손글씨 메모·
// 영수증까지. 예전에는 박스 라벨 전용이라 다른 사진을 넣으면 칸이 전부 빈 채로 돌아왔다.
const SYSTEM_PROMPT = `너는 태국 뷰티 클리닉 직원이 찍어 올린 사진을 읽어 CRM 메모로 옮겨 적는 판독기다.
사진은 제품 박스 라벨, 태국 신분증, 은행 송금 슬립, 다른 프로그램 화면 캡처, 손글씨 메모, 영수증 등 무엇이든 될 수 있다.

규칙:
- 사진에 실제로 보이는 글자만 옮긴다. 추측해서 지어내지 않는다. 안 보이면 그 항목은 빼거나 값을 빈 문자열로 둔다.
- 종류는 사진이 무엇인지 한국어로 짧게 적는다. 예: 제품 박스, 신분증, 송금 슬립, 화면 캡처, 메모, 영수증, 기타.
- 항목은 사진 속 정보를 "이름: 값" 쌍으로 정리한다. 이름은 한국어로 쓴다(예: 제품명, 용량, Lot번호, 유통기한, 이름, 신분증 번호, 생년월일, 금액, 날짜, 보낸 사람, 받는 사람, 전화번호, 시술명).
- 값은 사진에 적힌 그대로 둔다. 태국어·영어는 번역하지 않고 그대로 옮긴다. 날짜는 알아볼 수 있으면 YYYY-MM-DD로 맞춘다.
- 제품 박스면 제품명·용량·Lot번호·유통기한을, 신분증이면 이름·신분증 번호·생년월일·주소·발급일·만료일을, 송금 슬립이면 금액·날짜·시간·보낸 사람·받는 사람·참조번호를 우선 찾는다.
- 요약에는 이 사진이 무엇이고 CRM에 무엇으로 남기면 되는지 한국어 한 문장으로 적는다.
- 글자가 거의 없는 사진이면 항목은 비우고 요약에 사진 내용을 한 문장으로 적는다.`;

// 구조화 출력 — 모델이 항상 이 모양의 JSON만 돌려준다.
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    종류: { type: "string" },
    항목: {
      type: "array",
      items: {
        type: "object",
        properties: { 이름: { type: "string" }, 값: { type: "string" } },
        required: ["이름", "값"],
        additionalProperties: false,
      },
    },
    요약: { type: "string" },
  },
  required: ["종류", "항목", "요약"],
  additionalProperties: false,
} as const;

type OcrResult = {
  kind: string;
  items: { label: string; value: string }[];
  summary: string;
};

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1] as MediaType, data: match[2] };
}

function toResult(text: string): OcrResult | null {
  try {
    const parsed = JSON.parse(text) as {
      종류?: unknown;
      항목?: unknown;
      요약?: unknown;
    };
    const items = Array.isArray(parsed.항목)
      ? parsed.항목
          .map((it) => {
            const row = it as { 이름?: unknown; 값?: unknown };
            return {
              label: typeof row.이름 === "string" ? row.이름.trim() : "",
              value: typeof row.값 === "string" ? row.값.trim() : "",
            };
          })
          .filter((it) => it.label && it.value)
      : [];
    return {
      kind: typeof parsed.종류 === "string" ? parsed.종류.trim() : "",
      items,
      summary: typeof parsed.요약 === "string" ? parsed.요약.trim() : "",
    };
  } catch {
    return null;
  }
}

async function readImage(apiKey: string, image: { mediaType: MediaType; data: string }) {
  const client = new Anthropic({ apiKey });
  try {
    const message = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4096,
      // 사진 한 장 옮겨 적기라 깊게 생각할 일이 아니다. 빠르고 싸게.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      // 안전 분류기가 드물게 거절하면 같은 요청을 다른 모델로 이어서 처리한다.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: image.mediaType, data: image.data },
            },
            { type: "text", text: "이 사진을 읽고 정리해줘." },
          ],
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ ok: false, reason: "refused" }, { status: 422 });
    }

    const text = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const result = toResult(text);
    if (!result || (result.items.length === 0 && !result.summary)) {
      return NextResponse.json({ ok: false, reason: "unreadable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[ocr]", err);
    const reason =
      err instanceof Anthropic.RateLimitError
        ? "rate_limit"
        : err instanceof Anthropic.APIError
          ? "api_error"
          : "unknown";
    return NextResponse.json({ ok: false, reason }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "no_api_key" }, { status: 503 });
  }

  let image: unknown;
  try {
    ({ image } = (await req.json()) as { image?: unknown });
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  if (typeof image !== "string" || image.length > 8_000_000) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const parsedImage = parseDataUrl(image);
  if (!parsedImage) {
    return NextResponse.json({ ok: false, reason: "bad_image" }, { status: 400 });
  }

  return readImage(apiKey, parsedImage);
}

/**
 * 배포된 사이트에서 판독이 실제로 도는지 확인하는 문.
 * - `/api/ocr` → API 키가 걸려 있는지만 알려 준다 (AI 호출 없음).
 * - `/api/ocr?sample=idcards/IDC1.jpg` → 사이트에 올려 둔 데모 사진 한 장을 실제로 읽어 본다.
 *   아무 주소나 못 읽게 데모 사진 폴더의 파일 이름만 받는다.
 */
export async function GET(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const url = new URL(req.url);
  const sample = url.searchParams.get("sample");
  if (!sample) {
    return NextResponse.json({ ok: true, hasKey: Boolean(apiKey) });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: "no_api_key" }, { status: 503 });
  }
  if (!/^(idcards|boxlabels|captures|slips)\/[A-Za-z0-9_-]+\.jpg$/.test(sample)) {
    return NextResponse.json({ ok: false, reason: "bad_sample" }, { status: 400 });
  }
  const res = await fetch(new URL(`/${sample}`, url.origin));
  if (!res.ok) {
    return NextResponse.json({ ok: false, reason: "sample_not_found" }, { status: 404 });
  }
  const data = Buffer.from(await res.arrayBuffer()).toString("base64");
  return readImage(apiKey, { mediaType: "image/jpeg", data });
}
