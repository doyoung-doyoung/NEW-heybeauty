"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";
import {
  Badge,
  GhostButton,
  GlassCard,
  InkButton,
  SectionTitle,
} from "@/components/ui/primitives";
import {
  BoxLabelImage,
  DEMO_BOX_LABELS,
  DEMO_ID_CARDS,
  IdCardImage,
} from "@/components/home/DemoAssets";
import type { CrmEntry } from "@/lib/types";

type Kind = "음성" | "사진" | "텍스트";
type Step = "home" | "camera" | "voice" | "review";

interface OcrFields {
  제품명: string;
  용량: string;
  Lot번호: string;
  유통기한: string;
  유통형태: string;
}
type OcrResponse = { ok: true; fields: OcrFields } | { ok: false; reason: string };

interface Draft {
  kind: Kind;
  source: string;
  text: string;
  shot?: string;
  usedInventoryId?: string;
  usedQty?: number;
}

// 브라우저 표준 타입이 아직 lib.dom에 없어서 필요한 부분만 좁게 선언한다.
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultLike };
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SCREEN_CAPTURES = [
  {
    id: "CAP1",
    label: "페이스북 페이지 캡처",
    text: `클리닉명: 사얌 글로우 클리닉
영업시간: 월-토 10:00-20:00 / 일 휴무
주소: Siam Demo Rd. 00, Bangkok
전화: 02-327-1719
주차: 건물 주차장 2시간 무료`,
  },
  {
    id: "CAP2",
    label: "기존 CRM 시술 목록 캡처",
    text: `레이저 토닝 / 30분 / ฿2,200
리쥬란 스킨부스터 / 45분 / ฿9,800
물광주사 / 40분 / ฿8,000
사각턱 보톡스 / 20분 / ฿4,800`,
  },
  {
    id: "CAP3",
    label: "LINE 상담 대화 캡처",
    text: `유입 경로: LINE
관심 시술: 화이트닝 (레이저 토닝)
희망 방문일: 2026-09-22 오후
담당 희망 의사: 나린 원장`,
  },
];

export default function AiInput({
  clinicId,
  branchId,
}: {
  clinicId: string;
  branchId: string;
}) {
  const { db, update } = useDb();
  const toast = useToast();
  const [step, setStep] = useState<Step>("home");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [manager, setManager] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [shot, setShot] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const recogRef = useRef<RecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopVoice = useCallback(() => {
    recogRef.current?.stop();
    recogRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => {
    if (step !== "camera") {
      stopCamera();
      return;
    }
    let cancelled = false;
    setCamError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => {
        if (!cancelled)
          setCamError("카메라를 열 수 없습니다. 아래 데모 샘플로 진행해주세요.");
      });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [step, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopVoice();
    };
  }, [stopCamera, stopVoice]);

  if (!db) return null;

  const entries = db.crmEntries.filter((e) => e.branchId === branchId);
  const branchInventory = db.inventory.filter((i) => i.branchId === branchId);
  const staff = db.staff.filter((s) => s.branchId === branchId);

  function demoVoiceText() {
    const item = branchInventory[0];
    const product = db?.products.find((p) => p.id === item?.productId);
    const doctor = db?.doctors.find((d) => d.branchId === branchId);
    return {
      text: `방문 후 기록
고객: 나리사 쁘라싯
시술: 레이저 토닝 1회
담당 의사: ${doctor?.name ?? "나린 원장"}
결제: ฿2,200 (프로모션 10% 적용)
의사 소견: 색소 반응 양호, 3주 뒤 재방문 권유
사용 제품: ${product?.name ?? "소모품"} 2개`,
      usedInventoryId: item?.id,
      usedQty: 2,
    };
  }

  function openVoice() {
    setStep("voice");
    setTranscript("");
    setVoiceNote(null);

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setVoiceNote(
        "이 브라우저는 음성 인식을 지원하지 않습니다. 데모 문장으로 진행합니다.",
      );
      setListening(true);
      timerRef.current = setTimeout(() => {
        setListening(false);
        const demo = demoVoiceText();
        setTranscript(demo.text);
      }, 3000);
      return;
    }

    const recog = new Ctor();
    recog.lang = "ko-KR";
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (e) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        chunk += e.results[i][0].transcript;
      }
      setTranscript((prev) => (e.results[e.resultIndex].isFinal ? prev + chunk + "\n" : prev));
      if (!e.results[e.resultIndex].isFinal) setVoiceNote(chunk);
    };
    recog.onerror = () => {
      setVoiceNote("마이크 권한이 없어 데모 문장으로 진행합니다.");
      setListening(false);
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    try {
      recog.start();
      setListening(true);
    } catch {
      setVoiceNote("음성 인식을 시작할 수 없습니다. 데모 문장으로 진행합니다.");
    }
  }

  function finishVoice() {
    stopVoice();
    const spoken = transcript.trim();
    if (spoken) {
      setDraft({ kind: "음성", source: "실시간 음성 인식", text: spoken });
    } else {
      const demo = demoVoiceText();
      setDraft({
        kind: "음성",
        source: "음성 입력 (데모 문장)",
        text: demo.text,
        usedInventoryId: demo.usedInventoryId,
        usedQty: demo.usedQty,
      });
    }
    setStep("review");
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast("카메라 화면이 아직 준비되지 않았습니다");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.72));
    stopCamera();
  }

  async function useShot() {
    const image = shot;
    if (!image) return;
    setReading(true);
    let source = "직접 촬영 · AI 판독";
    let fields: OcrFields | null = null;
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const json: OcrResponse = await res.json();
      if (json.ok) fields = json.fields;
    } catch {
      fields = null;
    }
    if (!fields) {
      source = "직접 촬영 · 판독 실패(양식만 채움)";
      toast("사진에서 글자를 읽지 못했습니다. 직접 입력해주세요");
    }
    setDraft({
      kind: "사진",
      source,
      text: `촬영 사진에서 읽은 내용
제품명: ${fields?.제품명 ?? ""}
용량: ${fields?.용량 ?? ""}
Lot번호: ${fields?.Lot번호 ?? ""}
유통기한: ${fields?.유통기한 ?? ""}
유통 형태: ${fields?.유통형태 || "정식"}`,
      shot: image,
    });
    setReading(false);
    setShot(null);
    setStep("review");
  }

  function pickPhoto(source: string, text: string) {
    setDraft({ kind: "사진", source, text });
    setShot(null);
    setStep("review");
  }

  function save() {
    if (!draft) return;
    if (!manager.trim() || !employeeNo.trim()) {
      toast("담당자 이름과 사원번호를 입력해주세요");
      return;
    }
    const summary = draft.text.split("\n")[0].slice(0, 40);
    update((drft) => {
      const entry: CrmEntry = {
        id: `CRM-${Date.now()}`,
        clinicId,
        branchId,
        kind: draft.kind,
        raw: draft.text,
        summary: `${draft.source} · ${summary}`,
        by: `${manager.trim()} (${employeeNo.trim()})`,
        at: new Date().toISOString(),
      };
      drft.crmEntries.unshift(entry);

      if (draft.usedInventoryId && draft.usedQty) {
        const item = drft.inventory.find((i) => i.id === draft.usedInventoryId);
        if (item) {
          item.qty = Math.max(0, item.qty - draft.usedQty);
          drft.stockLogs.unshift({
            id: `SL-${Date.now()}`,
            inventoryItemId: item.id,
            type: "사용",
            qty: draft.usedQty,
            reason: "OPD 음성 기록",
            at: new Date().toISOString(),
            by: manager.trim(),
          });
        }
      }
    });
    const used = draft.usedInventoryId;
    const qty = draft.usedQty;
    setDraft(null);
    setStep("home");
    toast(used ? `저장되었습니다 · 재고 ${qty}개 차감` : "저장 완료되었습니다");
  }

  if (step === "camera") {
    return (
      <GlassCard className="min-w-0 p-6">
        <div className="mb-4">
          <GhostButton onClick={() => setStep("home")}>← 뒤로</GhostButton>
        </div>
        <SectionTitle
          title="사진 찍기"
          sub="제품 박스 · 신분증 · 기존 CRM 화면을 촬영하면 내용을 정리합니다"
        />

        <div className="overflow-hidden rounded-card bg-ink">
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="촬영 결과" className="max-h-80 w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="max-h-80 w-full object-contain"
            />
          )}
        </div>

        {camError && (
          <p className="mt-3 text-sm text-danger">{camError}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {shot ? (
            <>
              <InkButton onClick={useShot} disabled={reading}>
                {reading ? "AI가 읽는 중..." : "이 사진으로 입력하기"}
              </InkButton>
              <GhostButton onClick={() => setShot(null)} disabled={reading}>
                다시 찍기
              </GhostButton>
            </>
          ) : (
            <InkButton arrow={false} onClick={capture}>
              촬영
            </InkButton>
          )}
        </div>

        <div className="mt-6 space-y-5 border-t border-ink/10 pt-5">
          <p className="text-xs text-ink-sub">
            데모 샘플 — 실제 사진은 나중에 교체할 수 있습니다
          </p>

          <div>
            <div className="mb-2 text-xs font-semibold text-ink-sub">제품 박스</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {DEMO_BOX_LABELS.map((label) => {
                const match = branchInventory.find((i) => {
                  const p = db.products.find((x) => x.id === i.productId);
                  return p?.name === label.productName;
                });
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() =>
                      pickPhoto(
                        "제품 박스 사진 OCR",
                        `제품명: ${label.productName}
용량: ${label.volume}
Lot번호: ${label.lot}
유통기한: ${label.expiry}
유통 형태: 정식`,
                      )
                    }
                    className="lift text-left"
                  >
                    <BoxLabelImage label={label} />
                    <div className="mt-1 text-[10px] text-ink-sub">
                      {match ? "재고 매칭됨" : "신규 등록"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-ink-sub">ID 카드</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DEMO_ID_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    pickPhoto(
                      "ID카드 OCR",
                      `이름: ${card.name}
태국어 이름: ${card.nameTh}
신분증 번호: ${card.idNo}
생년월일: ${card.birth}
주소: ${card.address}`,
                    )
                  }
                  className="lift text-left"
                >
                  <IdCardImage card={card} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-ink-sub">캡처 화면</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {SCREEN_CAPTURES.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => pickPhoto(cap.label, cap.text)}
                  className="lift rounded-cell bg-white/75 p-4 text-left text-sm font-medium hairline"
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (step === "voice") {
    return (
      <GlassCard className="min-w-0 p-6">
        <div className="mb-4">
          <GhostButton
            onClick={() => {
              stopVoice();
              setStep("home");
            }}
          >
            ← 뒤로
          </GhostButton>
        </div>
        <SectionTitle
          title="말하기"
          sub="말하는 내용을 실시간으로 받아 적고, 끝나면 정리된 텍스트로 넘어갑니다"
        />

        <div className="flex flex-col items-center py-8">
          <span className="relative flex size-20 items-center justify-center rounded-pill bg-ink text-white">
            {listening && (
              <span className="animate-pulse-ring absolute inset-0 rounded-pill border border-ink" />
            )}
            <MicIcon />
          </span>
          <p className="mt-4 text-sm text-ink-sub">
            {listening ? "듣고 있어요..." : "인식을 멈췄습니다"}
          </p>
          {voiceNote && (
            <p className="mt-2 max-w-md text-center text-xs text-ink-sub">
              {voiceNote}
            </p>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="인식된 내용이 여기에 쌓입니다"
          className="w-full resize-none rounded-cell bg-white px-4 py-3 text-sm leading-relaxed outline-none hairline placeholder:text-ink-sub"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <InkButton onClick={finishVoice}>정리하기</InkButton>
          {listening ? (
            <GhostButton onClick={stopVoice}>인식 멈추기</GhostButton>
          ) : (
            <GhostButton onClick={openVoice}>다시 듣기</GhostButton>
          )}
        </div>
      </GlassCard>
    );
  }

  if (step === "review" && draft) {
    return (
      <GlassCard className="min-w-0 p-6">
        <div className="mb-4">
          <GhostButton
            onClick={() => {
              setDraft(null);
              setStep("home");
            }}
          >
            ← 뒤로
          </GhostButton>
        </div>
        <SectionTitle
          title="확인 후 저장"
          sub="AI가 정리한 내용입니다. 고치고 담당자를 입력한 뒤 저장하세요."
        />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="ink">{draft.kind}</Badge>
            <span className="text-xs text-ink-sub">{draft.source}</span>
          </div>

          {draft.shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.shot}
              alt="촬영 사진"
              className="max-h-48 w-full rounded-cell object-contain"
            />
          )}

          <div className="rounded-card bg-white/75 p-2 hairline">
            <textarea
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              rows={9}
              className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none"
            />

            <div className="border-t border-ink/10 px-1 pt-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex w-full items-center justify-between rounded-cell px-2 py-1.5 text-left text-[11px] font-semibold text-ink-sub transition hover:bg-white"
              >
                <span>이전 입력 기록 {entries.length}건 불러오기</span>
                <span>{showHistory ? "닫기" : "열기"}</span>
              </button>

              {showHistory && (
                <div className="animate-rise mt-1 max-h-48 space-y-1 overflow-y-auto">
                  {entries.length === 0 && (
                    <p className="px-2 py-1 text-xs text-ink-sub">
                      기록이 없습니다.
                    </p>
                  )}
                  {entries.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setDraft({
                          kind: e.kind,
                          source: "기록 불러오기",
                          text: e.raw,
                        });
                        setShowHistory(false);
                      }}
                      className="w-full rounded-cell px-2 py-2 text-left text-xs transition hover:bg-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge tone={e.kind === "음성" ? "pink" : "neutral"}>
                          {e.kind}
                        </Badge>
                        <span className="truncate font-medium">{e.summary}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-ink-sub">
                        {e.by} · {e.at.slice(0, 10)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {draft.usedInventoryId && (
            <p className="text-xs text-hb-600">
              저장 시 사용 제품 {draft.usedQty}개가 재고에서 자동 차감됩니다.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              list="crm-staff"
              placeholder="담당자 이름"
              className="rounded-cell bg-white px-3 py-2 text-sm outline-none hairline placeholder:text-ink-sub"
            />
            <input
              value={employeeNo}
              onChange={(e) => setEmployeeNo(e.target.value)}
              placeholder="사원번호"
              className="rounded-cell bg-white px-3 py-2 text-sm outline-none hairline placeholder:text-ink-sub"
            />
            <datalist id="crm-staff">
              {staff.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div className="flex gap-2">
            <InkButton onClick={save}>확인 후 저장</InkButton>
            <GhostButton
              onClick={() => {
                setDraft(null);
                setStep("home");
              }}
            >
              취소
            </GhostButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="min-w-0 p-6">
      <SectionTitle
        title="AI 정보 입력"
        sub="사진을 찍거나 말하면 AI가 텍스트로 정리합니다. 확인 후 수정하고 저장하세요."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <BigAction
          title="사진 찍기"
          desc="제품 박스 · 신분증 · 화면 캡처를 촬영해서 내용 추출"
          icon={<CameraIcon />}
          onClick={() => {
            setShot(null);
            setStep("camera");
          }}
        />
        <BigAction
          title="말하기"
          desc="시술 내용을 말하면 그대로 받아 적고 요약"
          icon={<MicIcon big />}
          onClick={openVoice}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setDraft({ kind: "텍스트", source: "직접 입력", text: "" });
          setStep("review");
        }}
        className="mt-3 w-full rounded-cell bg-white/60 py-3 text-sm font-medium text-ink-sub transition hairline hover:bg-white"
      >
        직접 타이핑해서 입력하기
      </button>

      <div className="mt-6 border-t border-ink/10 pt-5">
        <div className="mb-2 text-xs font-semibold text-ink-sub">
          최근 입력 기록 {entries.length}건
        </div>
        <div className="space-y-1">
          {entries.length === 0 && (
            <p className="text-xs text-ink-sub">기록이 없습니다.</p>
          )}
          {entries.slice(0, 4).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setDraft({ kind: e.kind, source: "기록 불러오기", text: e.raw });
                setStep("review");
              }}
              className="flex w-full items-center gap-2 rounded-cell px-3 py-2 text-left text-xs transition hover:bg-white/70"
            >
              <Badge tone={e.kind === "음성" ? "pink" : "neutral"}>{e.kind}</Badge>
              <span className="min-w-0 flex-1 truncate font-medium">
                {e.summary}
              </span>
              <span className="shrink-0 text-[10px] text-ink-sub">
                {e.at.slice(5, 10)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function BigAction({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lift flex min-h-44 flex-col items-center justify-center gap-3 rounded-card bg-gradient-to-br from-hb-50/80 to-hb-200/50 p-6 text-center hairline"
    >
      <span className="flex size-16 items-center justify-center rounded-pill bg-ink text-white">
        {icon}
      </span>
      <span className="text-lg font-bold">{title}</span>
      <span className="max-w-56 text-xs text-ink-sub">{desc}</span>
    </button>
  );
}

function CameraIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  );
}

function MicIcon({ big = false }: { big?: boolean }) {
  const size = big ? 26 : 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9a5.5 5.5 0 0 0 11 0M10 14.5V17" />
    </svg>
  );
}
