import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `너는 태국 뷰티 클리닉에서 쓰는 화장품·시술 제품 박스 라벨 판독기다.
사진에 보이는 글자만 읽고 아래 JSON 형식으로만 답한다. 설명, 인사말, 코드블록 표시는 절대 붙이지 않는다.

{"제품명":"","용량":"","Lot번호":"","유통기한":"","유통형태":""}

규칙:
- 읽을 수 없거나 사진에 없는 항목은 빈 문자열("")로 둔다. 추측해서 지어내지 않는다.
- 유통기한은 YYYY-MM-DD 형태로 정규화한다. 연월만 보이면 YYYY-MM 으로 둔다.
- 용량은 숫자와 단위를 붙여 적는다. 예: 100ml, 2ml x 5
- 유통형태는 라벨에 정식 수입/병행 수입 표시가 있을 때만 적고, 없으면 빈 문자열로 둔다.`;

type OcrFields = {
  제품명: string;
  용량: string;
  Lot번호: string;
  유통기한: string;
  유통형태: string;
};

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

function extractJson(text: string): OcrFields | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const pick = (key: string) => (typeof parsed[key] === "string" ? (parsed[key] as string).trim() : "");
    return {
      제품명: pick("제품명"),
      용량: pick("용량"),
      Lot번호: pick("Lot번호"),
      유통기한: pick("유통기한"),
      유통형태: pick("유통형태"),
    };
  } catch {
    return null;
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

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: parsedImage.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: parsedImage.data,
              },
            },
            { type: "text", text: "이 제품 박스 라벨을 읽고 JSON으로만 답해줘." },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const fields = extractJson(text);
    if (!fields) {
      return NextResponse.json({ ok: false, reason: "unreadable" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, fields });
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
