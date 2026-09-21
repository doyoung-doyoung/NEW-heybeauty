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
import type { CrmEntry, Gender } from "@/lib/types";

// 검토 화면의 "항목: 값" 줄들을 그대로 읽는다. 사용자가 고친 뒤 저장해도 고친 값이 들어간다.
function readFields(text: string) {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const at = line.indexOf(":");
    if (at <= 0) continue;
    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return out;
}

function genderFromName(name: string): Gender {
  if (/^(นางสาว|นาง|Miss|Mrs|Ms)\b\.?/i.test(name)) return "여";
  if (/^(นาย|Mr)\b\.?/i.test(name)) return "남";
  return "미입력";
}

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
interface SpeechErrorLike {
  error?: string;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: SpeechErrorLike) => void) | null;
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

// 음성 인식이 실패하는 이유는 여러 가지인데, 예전에는 전부 "마이크 권한이 없어"로만
// 보여줘서 무엇이 문제인지 알 수가 없었다. 원인별로 다른 안내를 준다.
function speechErrorMessage(code: string | undefined): {
  text: string;
  needsPermission: boolean;
} {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        text: "마이크 사용이 차단돼 있습니다. 아래 버튼을 눌러 권한을 허용해주세요.",
        needsPermission: true,
      };
    case "audio-capture":
      return {
        text: "마이크를 찾지 못했습니다. 기기에 마이크가 연결돼 있는지 확인해주세요.",
        needsPermission: false,
      };
    case "network":
      return {
        text: "음성 인식 서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해주세요.",
        needsPermission: false,
      };
    case "no-speech":
      return { text: "소리가 들리지 않았습니다. 다시 말씀해주세요.", needsPermission: false };
    case "aborted":
      return { text: "인식을 멈췄습니다.", needsPermission: false };
    default:
      return {
        text: `음성 인식에 실패했습니다${code ? ` (${code})` : ""}. 다시 시도하거나 아래에 직접 입력해주세요.`,
        needsPermission: false,
      };
  }
}

const SCREEN_CAPTURES = [
  {
    id: "CAP1",
    label: "클리닉 SNS 페이지 캡처",
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
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [needsMicPermission, setNeedsMicPermission] = useState(false);
  const recogRef = useRef<RecognitionLike | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 사용자가 "멈추기"를 누른 건지, 브라우저가 침묵 때문에 혼자 끊은 건지 구분한다.
  // 후자면 자동으로 다시 켜야 말이 끊기지 않는다.
  const wantListeningRef = useRef(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopVoice = useCallback(() => {
    wantListeningRef.current = false;
    recogRef.current?.stop();
    recogRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setListening(false);
    setInterim("");
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

  function runDemoVoice(reason: string) {
    setVoiceNote(reason);
    setListening(true);
    timerRef.current = setTimeout(() => {
      setListening(false);
      setTranscript(demoVoiceText().text);
    }, 2000);
  }

  // 실제 인식기를 띄운다. 이 함수 자체는 동기라서 버튼 클릭(사용자 제스처) 안에서
  // 바로 start()가 불린다. Safari는 제스처가 끊기면 start()를 거부하기 때문에
  // await를 앞에 두면 안 된다.
  function startRecognition() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      runDemoVoice("이 브라우저는 음성 인식을 지원하지 않습니다. 데모 문장으로 진행합니다.");
      return;
    }
    // https(또는 localhost)가 아니면 브라우저가 마이크 자체를 막아서 권한창도 안 뜬다.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setVoiceNote(
        "보안 연결(https)이 아니라 마이크를 쓸 수 없습니다. 배포 주소로 접속해주세요.",
      );
      setListening(false);
      return;
    }

    recogRef.current?.stop();
    const recog = new Ctor();
    recog.lang = "ko-KR";
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (e) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => prev + finalChunk.trim() + "\n");
        setVoiceNote(null);
      }
      setInterim(interimChunk);
    };
    recog.onerror = (e) => {
      const { text, needsPermission } = speechErrorMessage(e?.error);
      // 침묵은 오류가 아니다. 안내만 띄우고 계속 듣는다.
      if (e?.error === "no-speech") {
        setVoiceNote(text);
        return;
      }
      wantListeningRef.current = false;
      setNeedsMicPermission(needsPermission);
      setVoiceNote(text);
      setListening(false);
    };
    recog.onend = () => {
      setInterim("");
      // 크롬은 몇 초만 조용해도 혼자 끊는다. 사용자가 멈춘 게 아니면 다시 켠다.
      if (wantListeningRef.current) {
        try {
          recog.start();
          return;
        } catch {
          /* 이미 시작된 상태면 무시 */
        }
      }
      setListening(false);
    };
    recogRef.current = recog;
    try {
      recog.start();
      wantListeningRef.current = true;
      setNeedsMicPermission(false);
      setListening(true);
      setVoiceNote(null);
    } catch {
      wantListeningRef.current = false;
      setListening(false);
      setVoiceNote("음성 인식을 시작할 수 없습니다. 다시 시도해주세요.");
    }
  }

  // "마이크 권한 허용하기" 버튼용. getUserMedia는 브라우저 권한창을 확실히 띄운다.
  // SpeechRecognition.start()만으로는 권한창이 안 뜨는 기기가 있어서 이 길을 따로 뒀다.
  async function requestMicPermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceNote("이 브라우저에서는 마이크를 쓸 수 없습니다.");
      return;
    }
    setVoiceNote("마이크 권한을 요청하는 중입니다...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한만 받는 게 목적이라 마이크는 바로 놓아준다. 안 그러면 인식기가 못 잡는다.
      stream.getTracks().forEach((t) => t.stop());
      setNeedsMicPermission(false);
      startRecognition();
    } catch {
      setNeedsMicPermission(true);
      setVoiceNote(
        "마이크 권한이 거부됐습니다. 주소창 왼쪽 자물쇠(또는 설정 → 사이트 권한)에서 마이크를 허용으로 바꾼 뒤 다시 눌러주세요.",
      );
    }
  }

  function openVoice() {
    setStep("voice");
    setTranscript("");
    setInterim("");
    setVoiceNote(null);
    setNeedsMicPermission(false);
    startRecognition();
  }

  function finishVoice() {
    stopVoice();
    const spoken = (transcript + interim).trim();
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

  function pickPhoto(source: string, text: string, image: string) {
    setDraft({ kind: "사진", source, text, shot: image });
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
    const fields = readFields(draft.text);
    const now = new Date().toISOString();
    let sideEffect = "";

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

      if (fields["신분증 번호"] && fields["이름"]) {
        const name = fields["이름"];
        const existing = drft.customers.find(
          (c) => c.branchId === branchId && c.name === name,
        );
        if (existing) {
          existing.memo = `신분증 재확인 · ${fields["신분증 번호"]}`;
          sideEffect = `${name} 고객 정보 갱신`;
        } else {
          drft.customers.unshift({
            id: `CU-${Date.now()}`,
            clinicId,
            branchId,
            name,
            phone: fields["전화번호"] ?? "",
            birthday: fields["생년월일"] ?? "",
            gender: genderFromName(name),
            nationality: "태국",
            channel: "App",
            interests: [],
            doctorId: drft.doctors.find((d) => d.branchId === branchId)?.id ?? "",
            memo: `신분증 촬영 등록 · ${fields["신분증 번호"]}`,
            createdAt: now,
          });
          sideEffect = `${name} 고객 등록`;
        }
      }

      if (fields["제품명"] && fields["Lot번호"]) {
        const product = drft.products.find((p) => p.name === fields["제품명"]);
        const row =
          product &&
          drft.inventory.find(
            (i) => i.branchId === branchId && i.productId === product.id,
          );
        if (row) {
          row.qty += 1;
          row.lotNo = fields["Lot번호"];
          row.expiry = fields["유통기한"] || row.expiry;
          drft.stockLogs.unshift({
            id: `SL-IN-${Date.now()}`,
            inventoryItemId: row.id,
            type: "입고",
            qty: 1,
            reason: "제품 박스 촬영 입고",
            at: now,
            by: manager.trim(),
          });
          sideEffect = `${fields["제품명"]} 재고 1개 입고`;
        } else if (product) {
          drft.inventory.unshift({
            id: `IV-${Date.now()}`,
            clinicId,
            branchId,
            productId: product.id,
            qty: 1,
            distribution: fields["유통 형태"] === "병행수입" ? "병행수입" : "정식",
            volume: fields["용량"] ?? product.unit,
            expiry: fields["유통기한"] ?? "",
            supplier: "RAON Thailand",
            manager: manager.trim(),
            purchaseDate: now.slice(0, 10),
            purchasePrice: product.unitPriceTHB,
            salePrice: product.unitPriceTHB,
            lotNo: fields["Lot번호"],
            warnPct: 15,
          });
          sideEffect = `${fields["제품명"]} 재고 신규 등록`;
        }
      }

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
    if (used) toast(`저장되었습니다 · 재고 ${qty}개 차감`);
    else if (sideEffect) toast(`저장되었습니다 · ${sideEffect}`);
    else toast("저장 완료되었습니다");
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
            데모 이미지와 미리 준비된 인식 결과입니다
          </p>

          <div>
            <div className="mb-2 text-xs font-semibold text-ink-sub">제품 박스</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                        `/boxlabels/${label.id}.jpg`,
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
주소: ${card.address}
발급일: ${card.issued}
만료일: ${card.expiry}`,
                      `/idcards/${card.id}.jpg`,
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
                  onClick={() => pickPhoto(cap.label, cap.text, `/captures/${cap.id}.jpg`)}
                  className="lift rounded-cell bg-white/75 p-4 text-left text-sm font-medium hairline"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/captures/${cap.id}.jpg`} alt={cap.label} className="mb-3 max-h-64 w-full rounded-cell object-contain" />
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
            <p
              className={`mt-2 max-w-md text-center text-xs ${
                needsMicPermission ? "text-danger" : "text-ink-sub"
              }`}
            >
              {voiceNote}
            </p>
          )}
          {needsMicPermission && (
            <div className="mt-3">
              <InkButton arrow={false} onClick={requestMicPermission}>
                마이크 권한 허용하기
              </InkButton>
            </div>
          )}
        </div>

        <textarea
          value={transcript + interim}
          onChange={(e) => {
            setInterim("");
            setTranscript(e.target.value);
          }}
          rows={6}
          placeholder="인식된 내용이 여기에 쌓입니다. 직접 입력해도 됩니다."
          className="w-full resize-none rounded-cell bg-white px-4 py-3 text-sm leading-relaxed outline-none hairline placeholder:text-ink-sub"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <InkButton onClick={finishVoice}>정리하기</InkButton>
          {listening ? (
            <GhostButton onClick={stopVoice}>인식 멈추기</GhostButton>
          ) : (
            <GhostButton onClick={startRecognition}>다시 듣기</GhostButton>
          )}
          <GhostButton onClick={() => runDemoVoice("데모 문장을 불러옵니다.")}>
            데모 문장 넣기
          </GhostButton>
        </div>
      </GlassCard>
    );
  }

  if (step === "review" && draft) {
    const f = readFields(draft.text);
    const willCreate = [
      f["신분증 번호"] && f["이름"] ? `고객 "${f["이름"]}"` : null,
      f["제품명"] && f["Lot번호"] ? `재고 "${f["제품명"]}"` : null,
    ].filter(Boolean);

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

          {willCreate.length > 0 && (
            <p className="text-xs text-hb-600">
              저장하면 {willCreate.join(" · ")}가 이 지점에 자동 등록됩니다.
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
