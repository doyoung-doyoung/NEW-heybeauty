"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 아이콘 위 · 글자 아래로 서는 탭 줄. 하얀 알약 판 위에 칸이 똑같이 나뉜다.
 *
 * 아이콘은 그림 파일을 그대로 쓴다 — `icon`(평소)과 `iconActive`(골랐을 때).
 * `iconActive`가 없으면 같은 그림을 쓰고, 안 고른 칸만 흐리게 눌러 둔다.
 * 파일이 아직 없으면 점선 네모가 자리를 지켜서, 그림이 오기 전에도
 * 줄 높이와 간격이 완성본과 똑같이 보인다.
 */
export type IconTab<Id extends string> = {
  id: Id;
  label: string;
  icon: string;
  iconActive?: string;
};

export default function IconTabBar<Id extends string>({
  tabs,
  active,
  onChange,
  trailing,
}: {
  tabs: readonly IconTab<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  /** 판 오른쪽 바깥에 숨겨 두는 것 — 가로로 밀어야 나온다. */
  trailing?: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[28px] bg-white/90 p-1.5 shadow-float [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-stretch">
        <div role="tablist" className="flex w-full shrink-0">
          {tabs.map((t) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange(t.id)}
                className="group flex flex-1 flex-col items-center gap-1.5 rounded-[22px] px-1 pb-2 pt-2.5 transition active:scale-95"
              >
                <TabIcon
                  src={on ? (t.iconActive ?? t.icon) : t.icon}
                  dim={!on && !t.iconActive}
                />
                <span
                  className={`whitespace-nowrap text-[12px] leading-none transition sm:text-[13px] ${
                    on
                      ? "font-bold text-tab-active"
                      : "font-medium text-ink-sub group-hover:text-ink"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        {trailing && (
          <div className="flex shrink-0 items-center pl-1 pr-1.5">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}

function TabIcon({ src, dim }: { src: string; dim: boolean }) {
  // 실패한 주소를 기억해 둔다 — 탭을 바꿔 src가 달라지면 다시 시도한다.
  const [failed, setFailed] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);

  // 서버에서 그린 <img>는 React가 붙기 전에 이미 실패했을 수 있다 —
  // 그땐 onError가 안 불리니, 붙자마자 한 번 직접 확인한다.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(src);
  }, [src]);

  if (failed === src) {
    return (
      <span
        aria-hidden
        className="h-7 w-7 rounded-lg border border-dashed border-ink-sub/40"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 작은 아이콘이라 최적화가 필요 없다
    <img
      ref={ref}
      src={src}
      alt=""
      aria-hidden
      width={28}
      height={28}
      onError={() => setFailed(src)}
      className={`h-7 w-7 object-contain transition ${
        dim ? "opacity-45 group-hover:opacity-70" : ""
      }`}
    />
  );
}
