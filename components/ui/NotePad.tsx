"use client";

import { useEffect, useRef, useState } from "react";

interface Note {
  id: string;
  text: string;
  where: string;
  /** 서버가 준 ISO 시각. 보는 사람 시간대로 표시한다. */
  at: string;
  done: boolean;
}

// 노트는 도도 · 개발용이라 손님이 못 열게 비밀번호로 잠근다(10/6 요청).
// 코드에 비밀번호 대신 SHA-256 값만 둔다. 화면을 가리는 가벼운 잠금이지 보안 장치는 아니다.
const NOTE_PASS_SHA256 = "3472adbbcb9677d1b45365d37d96d1c33217d745567577fd9bd5c2766a258320";
const UNLOCK_KEY = "heybeauty.notes-unlocked";

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readUnlocked() {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function formatAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NotePad({ where }: { where: string }) {
  const [open, setOpen] = useState(false);
  // 비밀번호를 한 번 맞히면 이 탭을 닫을 때까지 다시 묻지 않는다.
  const [unlocked, setUnlocked] = useState(false);
  const [askPass, setAskPass] = useState(false);
  const [pass, setPass] = useState("");
  const [passWrong, setPassWrong] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);
  // 완료된 노트를 지우지 않고 뒷 페이지에 남겨두기로 해서, 진행중/완료를 탭으로 나눠 본다.
  const [tab, setTab] = useState<"todo" | "done">("todo");
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

  useEffect(() => {
    setUnlocked(readUnlocked());
  }, []);

  function togglePanel() {
    if (open || askPass) {
      setOpen(false);
      setAskPass(false);
      return;
    }
    if (unlocked) setOpen(true);
    else {
      setPass("");
      setPassWrong(false);
      setAskPass(true);
    }
  }

  async function checkPass() {
    if ((await sha256(pass.trim())) !== NOTE_PASS_SHA256) {
      setPassWrong(true);
      setPass("");
      return;
    }
    try {
      sessionStorage.setItem(UNLOCK_KEY, "1");
    } catch {
      // 저장이 막힌 브라우저면 이번 화면에서만 열린 상태로 둔다.
    }
    setUnlocked(true);
    setAskPass(false);
    setOpen(true);
  }

  const todoNotes = notes.filter((n) => !n.done);
  const doneNotes = notes.filter((n) => n.done);
  const visible = tab === "todo" ? todoNotes : doneNotes;

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
      {/* 맨 오른쪽 아래 아주 작은 펜 아이콘. 손님 눈에 띄지 않게 글자·개수 표시 없이 둔다. */}
      <button
        type="button"
        aria-label="노트"
        onClick={togglePanel}
        className="fixed bottom-1.5 right-1.5 z-40 flex size-7 items-center justify-center rounded-pill bg-white/55 text-ink/60 shadow-float backdrop-blur transition hover:text-ink active:scale-[0.92]"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {askPass && (
        <form
          className="animate-pop fixed bottom-11 right-1.5 z-40 w-56 rounded-card bg-white p-4 shadow-lift hairline"
          onSubmit={(e) => {
            e.preventDefault();
            checkPass();
          }}
        >
          <div className="text-sm font-bold">노트 비밀번호</div>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setPassWrong(false);
            }}
            placeholder="비밀번호"
            className="mt-2 w-full rounded-pill bg-surface px-4 py-2 text-sm outline-none hairline"
          />
          {passWrong && <p className="mt-1.5 text-xs text-danger">비밀번호가 맞지 않습니다</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAskPass(false)}
              className="rounded-pill px-3 py-1.5 text-xs text-ink-sub"
            >
              닫기
            </button>
            <button type="submit" className="rounded-pill bg-ink px-4 py-1.5 text-xs font-semibold text-white">
              열기
            </button>
          </div>
        </form>
      )}

      {open && (
        <div className="animate-pop fixed bottom-11 right-1.5 z-40 flex max-h-[70dvh] w-[min(22rem,calc(100vw-2.5rem))] flex-col rounded-card bg-white p-4 shadow-lift hairline">
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

          {notes.length > 0 && (
            <div className="mt-3 flex gap-1.5 rounded-pill bg-surface p-1 text-xs hairline">
              <button
                type="button"
                onClick={() => setTab("todo")}
                className={`flex-1 rounded-pill py-1.5 font-medium transition ${
                  tab === "todo" ? "bg-white shadow-sm" : "text-ink-sub"
                }`}
              >
                진행중 {todoNotes.length}
              </button>
              <button
                type="button"
                onClick={() => setTab("done")}
                className={`flex-1 rounded-pill py-1.5 font-medium transition ${
                  tab === "done" ? "bg-white shadow-sm" : "text-ink-sub"
                }`}
              >
                완료 {doneNotes.length}
              </button>
            </div>
          )}

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {loading && (
              <p className="py-6 text-center text-xs text-ink-sub">불러오는 중…</p>
            )}
            {!loading && notes.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-sub">
                테스트하다 고칠 점이 보이면 여기 적어두세요
              </p>
            )}
            {!loading && notes.length > 0 && visible.length === 0 && (
              <p className="py-6 text-center text-xs text-ink-sub">
                {tab === "todo" ? "진행중인 노트가 없습니다" : "아직 완료한 노트가 없습니다"}
              </p>
            )}
            {visible.map((note) => (
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
                    {note.where} · {formatAt(note.at)}
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
