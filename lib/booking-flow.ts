import type { BookingStatus, DemoDb } from "./types";

// 예약 한 건이 지나가는 길. 고객 화면과 파트너 CRM이 같은 순서를 봐야 하므로
// 단계 목록은 여기 하나만 둔다. "취소"는 어느 단계에서든 빠져나가는 옆길이라 뺀다.
export const BOOKING_STEPS = ["예약요청", "입금확인", "예약확정", "방문완료"] as const;

export type BookingStep = (typeof BOOKING_STEPS)[number];

export function stepIndex(status: BookingStatus) {
  return BOOKING_STEPS.indexOf(status as BookingStep);
}

export function nextStatus(status: BookingStatus): BookingStatus | null {
  const at = stepIndex(status);
  if (at < 0 || at >= BOOKING_STEPS.length - 1) return null;
  return BOOKING_STEPS[at + 1];
}

export function canCancel(status: BookingStatus) {
  return status !== "방문완료" && status !== "취소";
}

/** 시술이 끝나기 전까지는 날짜·시간을 바꿀 수 있다. */
export function canReschedule(status: BookingStatus) {
  return canCancel(status);
}

export function statusTone(status: BookingStatus): "pink" | "neutral" | "danger" | "ink" {
  if (status === "취소") return "danger";
  if (status === "예약확정" || status === "방문완료") return "pink";
  return "neutral";
}

/** 파트너가 다음 단계 버튼에 쓸 말. 마지막 단계(방문완료)는 전자차트까지 만든다. */
export const NEXT_ACTION_LABEL: Record<BookingStep, string> = {
  예약요청: "입금 확인",
  입금확인: "예약 승인",
  예약확정: "방문완료 처리",
  방문완료: "",
};

/** 상태가 바뀌면 고객 대화창에 이 문장이 클리닉 메시지로 쌓인다(앱 안 알림). */
export const STATUS_NOTICE: Record<BookingStatus, string> = {
  예약요청: "예약 요청을 받았습니다. 송금 슬립을 확인하는 중이에요.",
  입금확인: "입금이 확인되었습니다. 담당 선생님 일정을 확인한 뒤 바로 승인해 드릴게요.",
  예약확정: "예약이 확정되었습니다. 방문 10분 전에 도착해 주세요.",
  방문완료: "방문해 주셔서 감사합니다. 후기를 남겨 주시면 다음 예약에 쓸 수 있는 코드를 드려요.",
  취소: "예약이 취소되었습니다. 예약금 환불은 영업일 기준 3일 안에 처리됩니다.",
};

/**
 * 예약 상태가 바뀐 걸 고객 대화창에 쌓는다 — 앱 안에서 이게 알림 역할을 한다.
 * useDb().update()의 draft 안에서 호출한다. 예약으로 시작되지 않은 대화는 건드리지 않는다.
 */
export function pushStatusNotice(draft: DemoDb, bookingId: string, status: BookingStatus) {
  const thread = draft.chats.find((c) => c.bookingId === bookingId);
  if (!thread) return;
  const at = new Date().toISOString();
  thread.messages.push({
    id: `${thread.id}-S${thread.messages.length + 1}`,
    role: "clinic",
    text: STATUS_NOTICE[status],
    at,
  });
  thread.updatedAt = at;
}

/** 고객 화면에서 지금 무엇을 기다리는 중인지 한 줄로 알려 준다. */
export const STATUS_HINT: Record<BookingStatus, string> = {
  예약요청: "클리닉이 송금 슬립을 확인하는 중이에요",
  입금확인: "입금 확인 완료 · 클리닉 승인을 기다리는 중이에요",
  예약확정: "예약이 확정되었어요. 방문 10분 전에 도착해 주세요",
  방문완료: "시술이 끝났어요. 후기를 남겨 보세요",
  취소: "취소된 예약이에요",
};
