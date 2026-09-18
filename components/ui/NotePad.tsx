"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "heybeauty.notes.v1";

interface Note {
  id: string;
  text: string;
  where: string;
  at: string;
  done: boolean;
}

function load(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

export default function NotePad({ where }: { where: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNotes(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes, ready]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const todo = notes.filter((n) => !n.done).length;

  function add() {
    const body = text.trim();
    if (!body) return;
    const now = new Date();
    setNotes((prev) => [
      {
        id: `${now.getTime()}`,
        text: body,
        where,
        at: `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        done: false,
      },
      ...prev,
    ]);
    setText("");
  }

  async function copyAll() {
    const body = notes
      .map((n) => `- [${n.done ? "x" : " "}] (${n.where}) ${n.text}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="glass fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-pill px-4 py-3 text-sm font-medium text-ink transition hover:bg-white/80"
      >
        노트
        {todo > 0 && (
          <span className="rounded-pill bg-ink px-2 py-0.5 text-xs text-white">
            {todo}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop fixed bottom-20 right-5 z-40 flex max-h-[70dvh] w-[min(22rem,calc(100vw-2.5rem))] flex-col rounded-card bg-white p-4 shadow-lift hairline">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">수정할 부분 노트</div>
              <div className="text-xs text-ink-sub">{where} 화면에서 작성 중</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-pill px-3 py-1.5 text-xs text-ink-sub hover:bg-white/70"
            >
              닫기
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              placeholder="예: 예약 버튼이 너무 작다"
              className="w-full rounded-pill bg-surface px-4 py-2 text-sm outline-none hairline placeholder:text-ink-sub focus:bg-white"
            />
            <button
              type="button"
              onClick={add}
              className="shrink-0 rounded-pill bg-ink px-4 py-2 text-sm text-white transition hover:bg-ink-deep"
            >
              추가
            </button>
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {notes.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-sub">
                테스트하다 고칠 점이 보이면 여기 적어두세요
              </p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-2 rounded-cell bg-surface p-2.5 hairline"
              >
                <input
                  type="checkbox"
                  checked={note.done}
                  onChange={() =>
                    setNotes((prev) =>
                      prev.map((n) =>
                        n.id === note.id ? { ...n, done: !n.done } : n,
                      ),
                    )
                  }
                  className="mt-0.5 size-4 shrink-0 accent-ink"
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`break-words text-sm ${note.done ? "text-ink-sub line-through" : ""}`}
                  >
                    {note.text}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-sub">
                    {note.where} · {note.at}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotes((prev) => prev.filter((n) => n.id !== note.id))
                  }
                  className="shrink-0 rounded-pill px-2 py-1 text-xs text-ink-sub hover:bg-white"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {notes.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
              <button
                type="button"
                onClick={copyAll}
                className="rounded-pill bg-surface px-4 py-2 text-xs text-ink hairline transition hover:bg-white"
              >
                {copied ? "복사됨" : "전체 복사"}
              </button>
              <button
                type="button"
                onClick={() => setNotes((prev) => prev.filter((n) => !n.done))}
                className="rounded-pill px-3 py-2 text-xs text-ink-sub hover:bg-white/70"
              >
                완료한 것 지우기
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
