"use client";

import { useEffect, useRef, useState } from "react";

// 이 제품의 세일즈 포인트는 "한 곳에 입력하면 여러 곳이 같이 채워진다"는 것인데,
// 화면에 안 남으면 보는 사람은 그게 일어났는지 알 수가 없다.
// 그래서 무엇이 움직였는지 쪽지로 보여준다.
//
// 다만 계속 붙어 있으면 잔소리가 되고 다음 동작을 가린다. 읽을 시간만 주고 스스로 물러난다.
const READ_MS = 5000;
const FADE_MS = 600;

export interface LinkedNoteState {
  key: string;
  rows: string[];
  leaving: boolean;
}

export function useLinkedNote() {
  const [note, setNote] = useState<LinkedNoteState | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 화면을 떠난 뒤 타이머가 살아 있으면 다음에 뜬 쪽지를 대신 지운다.
  useEffect(() => clearTimers, []);

  // key는 "이 쪽지가 어느 줄에 붙은 것인지"다. 예약 목록처럼 행마다 쪽지가 뜰 수 있는
  // 화면에서, 먼저 뜬 쪽지의 타이머가 나중 쪽지를 지우는 걸 막는 열쇠로 쓴다.
  function show(rows: string[], key = "") {
    clearTimers();
    setNote({ key, rows, leaving: false });
    timers.current = [
      setTimeout(
        () =>
          setNote((cur) => (cur?.key === key ? { ...cur, leaving: true } : cur)),
        READ_MS,
      ),
      setTimeout(
        () => setNote((cur) => (cur?.key === key ? null : cur)),
        READ_MS + FADE_MS,
      ),
    ];
  }

  function dismiss() {
    clearTimers();
    setNote(null);
  }

  return { note, show, dismiss };
}

// onClose를 안 넘기면 닫기 버튼이 없는, 스스로 사라지지도 않는 쪽지가 된다.
// 예약 완료 화면처럼 그 쪽지 자체가 화면의 본문인 곳에 쓴다.
export function LinkedNote({
  note,
  title,
  hint,
  closeLabel = "닫기",
  onClose,
  className = "",
}: {
  note: { rows: string[]; leaving?: boolean };
  title: string;
  hint?: string;
  closeLabel?: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card bg-hb-400/15 p-4 text-left hairline ${
        note.leaving ? "animate-sink" : "animate-rise"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-bold">{title}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-pill px-2 py-0.5 text-xs text-ink-sub hairline"
          >
            {closeLabel}
          </button>
        )}
      </div>
      <ul className="mt-2 space-y-1">
        {note.rows.map((row) => (
          <li
            key={row}
            className="flex items-start gap-2 text-sm text-ink/80"
          >
            <span className="text-hb-600">→</span>
            <span className="min-w-0">{row}</span>
          </li>
        ))}
      </ul>
      {hint && <div className="mt-2 text-xs text-ink-sub">{hint}</div>}
    </div>
  );
}
