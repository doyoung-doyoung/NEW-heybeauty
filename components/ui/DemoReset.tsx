"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDb } from "@/lib/db";
import { useToast } from "@/components/ui/Toast";

/**
 * 데모 리셋 — 되돌릴 수 없는 버튼이라 두 겹으로 막아 뒀다.
 *
 * 1) 버튼 자체가 탭 줄 **오른쪽 바깥**에 있다. 가로로 밀어야 나온다.
 *    시연 중에 손이 미끄러져서 눌리는 일이 없고, 화면에 "리셋"이라는 글자가
 *    떠 있지 않아 보는 사람 눈에도 안 띈다.
 * 2) 눌러도 바로 지우지 않고, **무엇이 사라지고 무엇이 돌아오는지** 적은 창을
 *    먼저 띄운다. 거기서 한 번 더 눌러야 실행된다.
 */
export default function DemoReset() {
  const { reset } = useDb();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="데모 리셋"
        className="whitespace-nowrap rounded-pill px-3 py-2.5 text-[13px] font-medium text-ink-sub transition hover:bg-white/60 hover:text-danger sm:text-sm"
      >
        데모 리셋
      </button>

      {open && <ResetDialog onClose={() => setOpen(false)} onConfirm={() => {
        reset();
        setOpen(false);
        toast("초기 데모 데이터로 되돌렸습니다");
      }} />}
    </>
  );
}

/** 지워지는 것 / 돌아오는 것을 나란히 보여 주는 설명 창. */
function ResetDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  // 헤더에 animate-rise(transform)가 걸려 있어서 그 안에서 fixed를 쓰면
  // 화면이 아니라 헤더 박스를 기준으로 붙는다. body로 빼내야 전체를 덮는다.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="animate-pop max-h-[88vh] w-full max-w-md overflow-y-auto rounded-card bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-danger">되돌릴 수 없습니다</div>
        <h2 className="mt-1 text-lg font-bold">데모 데이터를 처음으로</h2>
        <p className="mt-2 text-sm text-ink-sub">
          이 브라우저에 저장된 데모 데이터를 지우고, 배포될 때와 똑같은 상태로
          다시 만듭니다. 서버에는 아무 영향이 없고 이 기기에서만 일어납니다.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* 지워지는 쪽만 붉게. 두 칸이 같은 분홍이면 어느 쪽이 위험한지 안 읽힌다. */}
          <div className="rounded-cell bg-danger/12 p-4 ring-1 ring-danger/25">
            <div className="text-xs font-semibold text-danger">사라집니다</div>
            <ul className="mt-2 space-y-1 text-[13px] text-ink/80">
              <li>· 새로 넣은 예약 · 고객 · 전자차트</li>
              <li>· 재고 입출고와 조정 기록</li>
              <li>· 승인/차단한 후기, 발행한 후기코드</li>
              <li>· 올린 사진과 노트에 적은 메모</li>
            </ul>
          </div>
          {/* 창 바탕이 흰색이라 이쪽은 아주 옅은 분홍으로 깔아야 칸으로 보인다. */}
          <div className="rounded-cell bg-hb-50 p-4">
            <div className="text-xs font-semibold text-hb-600">돌아옵니다</div>
            <ul className="mt-2 space-y-1 text-[13px] text-ink/80">
              <li>· 클리닉 10곳과 기본 재고</li>
              <li>· 시연용 예약 · 후기 · 채팅</li>
              <li>· 커미션 기초 실적 ฿999,999</li>
              <li>· 공지 · 팝업 · 계정 초기값</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill px-4 py-2.5 text-sm text-ink-sub hairline"
          >
            그만두기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-pill bg-danger px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
          >
            지우고 처음으로
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
