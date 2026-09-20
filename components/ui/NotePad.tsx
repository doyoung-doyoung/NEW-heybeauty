"use client";

import { useEffect, useRef, useState } from "react";

interface Note {
  id: string;
  text: string;
  where: string;
  at: string;
  done: boolean;
}

export default function NotePad({ where }: { where: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/notes", { cache: "no-store" });
      const body = (await res.json()) as { ok: boolean; notes?: Note[] };
      if (!body.ok || !body.notes) throw new Error("load failed");
      setNotes(body.notes);
      setBroken(false);
    } catch {
      setBroken(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const todo = notes.filter((n) => !n.done).length;

  async function add() {
    const body = text.trim();
    if (!body) return;
    setText("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body, screen: where }),
      });
      const json = (await res.json()) as { ok: boolean; note?: Note };
      if (!json.ok || !json.note) throw new Error("save failed");
      setNotes((prev) => [json.note as Note, ...prev]);
      setBroken(false);
    } catch {
      setText(body);
      setBroken(true);
    }
  }

  async function toggle(note: Note) {
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, done: !n.done } : n)),
    );
    try {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, done: !note.done }),
      });
      if (!res.ok) throw new Error("patch failed");
    } catch {
      setBroken(true);
      refresh();
    }
  }

  async function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setBroken(true);
      refresh();
    }
  }

  async function clearDone() {
    const targets = notes.filter((n) => n.done);
    setNotes((prev) => prev.filter((n) => !n.done));
    try {
      await Promise.all(
        targets.map((n) =>
          fetch(`/api/notes?id=${encodeURIComponent(n.id)}`, { method: "DELETE" }),
        ),
      );
    } catch {
      setBroken(true);
    }
    refresh();
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
              <div className="text-xs text-ink-sub">
                {broken ? "저장 서버에 연결되지 않았습니다" : `${where} 화면에서 작성 중`}
              </div>
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
            {loading && (
              <p className="py-6 text-center text-xs text-ink-sub">불러오는 중…</p>
            )}
            {!loading && notes.length === 0 && (
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
                  onChange={() => toggle(note)}
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
                  onClick={() => remove(note.id)}
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
                onClick={clearDone}
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
