"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
export default function MembershipPrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const { t } = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  if (!open) return null;
  return createPortal(<dialog ref={dialog} onCancel={onClose} onClose={onClose} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-card bg-white p-6 text-ink backdrop:bg-ink/60">
    <h2 className="text-xl font-bold">{t("회원가입 / 로그인")}</h2>
    <p className="mt-2 text-sm text-ink-sub">{t("회원가입 후 실제 환자 후기와 평점을 확인하세요.")}</p>
    <p className="mt-2 text-xs text-ink-sub">{t("현재 MVP에서는 데모 로그인으로 연결됩니다.")}</p>
    <div className="mt-5 space-y-2">{(["line", "google"] as const).map(provider => <button key={provider} onClick={() => { login(provider); onClose(); }} className="min-h-11 w-full rounded-pill bg-ink px-4 text-sm font-semibold text-white">{provider === "line" ? "LINE" : "Google"} {t("계속하기")}</button>)}<button onClick={onClose} className="min-h-11 w-full text-sm">{t("close")}</button></div>
  </dialog>, document.body);
}
