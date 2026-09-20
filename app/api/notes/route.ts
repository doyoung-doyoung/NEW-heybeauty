import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLE = "hb_notes";

type Row = {
  id: string;
  text: string;
  screen: string;
  done: boolean;
  created_at: string;
};

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function toNote(row: Row) {
  const at = new Date(row.created_at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    id: row.id,
    text: row.text,
    where: row.screen,
    at: `${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`,
    done: row.done,
  };
}

function noDb() {
  return NextResponse.json({ ok: false, reason: "no_db" }, { status: 503 });
}

function failed(err: unknown) {
  console.error("[notes]", err);
  return NextResponse.json({ ok: false, reason: "db_error" }, { status: 502 });
}

export async function GET() {
  const db = client();
  if (!db) return noDb();

  const { data, error } = await db
    .from(TABLE)
    .select("id, text, screen, done, created_at")
    .order("created_at", { ascending: false });

  if (error) return failed(error);
  return NextResponse.json({ ok: true, notes: (data as Row[]).map(toNote) });
}

export async function POST(req: Request) {
  const db = client();
  if (!db) return noDb();

  let text: unknown;
  let screen: unknown;
  try {
    ({ text, screen } = (await req.json()) as { text?: unknown; screen?: unknown });
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const body = typeof text === "string" ? text.trim() : "";
  if (!body || body.length > 500) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { data, error } = await db
    .from(TABLE)
    .insert({ text: body, screen: typeof screen === "string" ? screen.slice(0, 40) : "" })
    .select("id, text, screen, done, created_at")
    .single();

  if (error) return failed(error);
  return NextResponse.json({ ok: true, note: toNote(data as Row) });
}

export async function PATCH(req: Request) {
  const db = client();
  if (!db) return noDb();

  let id: unknown;
  let done: unknown;
  try {
    ({ id, done } = (await req.json()) as { id?: unknown; done?: unknown });
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  if (typeof id !== "string" || typeof done !== "boolean") {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { error } = await db.from(TABLE).update({ done }).eq("id", id);
  if (error) return failed(error);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const db = client();
  if (!db) return noDb();

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { error } = await db.from(TABLE).delete().eq("id", id);
  if (error) return failed(error);
  return NextResponse.json({ ok: true });
}
