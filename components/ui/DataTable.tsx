"use client";

import type { ReactNode } from "react";

/**
 * 목록을 표로 보여주는 조각들.
 *
 * 폰에서도 그냥 표를 쓴다. 한때는 좁은 화면에서 카드로 갈아끼웠는데, 카드는 한 줄이
 * 화면을 다 먹어서 한 번에 예닐곱 개밖에 못 본다. 999줄짜리 목록에서는 쓸모가 없다.
 * 대신 표를 **가로로 밀어서** 보게 하고, 첫 칸은 왼쪽에 고정해 어느 줄인지 놓치지 않게 했다.
 */

/**
 * 표를 감싸는 스크롤 상자.
 * `maxH`를 주면 그 높이에서 세로 스크롤이 생기고, 헤더가 위에 붙어 따라다닌다.
 * (999행짜리 후기코드 표를 그냥 펼치면 어드민 페이지가 끝없이 길어진다.)
 */
export function TableOnly({
  children,
  maxH,
}: {
  children: ReactNode;
  maxH?: string;
}) {
  // `rounded-cell`이 그냥 모양내기가 아니다. 둥근 모서리가 없으면 스크롤된 행이
  // 컨테이너 위쪽으로 비쳐 나와 헤더 위에 유령처럼 겹쳐 보인다(실제로 겪음).
  // 모서리를 굴리면 브라우저가 제대로 된 잘라내기 층을 만들어서 그 현상이 사라진다.
  return (
    <div className={`overflow-auto rounded-cell ${maxH ?? ""}`}>{children}</div>
  );
}

/**
 * `border-separate`를 쓴다. 기본값인 `border-collapse`에서는 테두리를 표가 가져가 버려서
 * `sticky` 헤더가 제대로 붙지 않고, 스크롤한 행이 헤더 뒤로 비쳐 보인다(실제로 겪음).
 * 대신 칸 사이 간격을 0으로 눌러 두고, 줄은 각 칸의 아래 테두리로 그린다.
 */
export function Table({
  children,
  minW,
}: {
  children: ReactNode;
  /** 좁은 화면에서 칸이 짜부라지지 않게 잡아주는 최소 폭. 이걸 넘으면 가로 스크롤이 생긴다. */
  minW?: string;
}) {
  return (
    <table
      className={`w-full border-separate border-spacing-0 text-sm ${minW ?? ""}`}
    >
      {children}
    </table>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="text-left text-xs text-ink-sub">{children}</tr>
    </thead>
  );
}

/**
 * 헤더 칸. `sticky`를 `thead`가 아니라 칸마다 건다 — 그래야 모든 브라우저에서 붙는다.
 * 배경을 불투명하게 깔아야 스크롤한 행이 헤더 글자와 포개지지 않는다.
 */
export function Th({
  children,
  align = "left",
  stick = false,
}: {
  children?: ReactNode;
  align?: "left" | "right";
  /** 첫 칸 전용. 가로로 밀어도 왼쪽에 남는다 — 아래 `Td`의 `stick` 설명 참고. */
  stick?: boolean;
}) {
  return (
    <th
      className={`sticky top-0 z-10 whitespace-nowrap border-b border-ink/15 bg-hb-50 px-2 py-2 font-semibold ${
        align === "right" ? "text-right" : ""
      } ${stick ? "left-0 z-20 border-r border-ink/10" : ""}`}
    >
      {children}
    </th>
  );
}

/**
 * 누를 수 있는 행. `onClick`을 주면 손가락 커서와 hover 배경이 붙는다.
 * `tone="danger"`는 재고 부족처럼 행 전체가 경고인 경우에 쓴다.
 */
export function Tr({
  children,
  onClick,
  tone,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "danger";
}) {
  return (
    <tr
      onClick={onClick}
      // 왼쪽에 고정되는 첫 칸은 **불투명**해야 한다. 안 그러면 밀려 들어온 뒷 칸이 비쳐 보인다.
      // 그런데 행마다 배경이 다르다(경고 행은 붉다). 그래서 행이 자기 색을 변수로 알려주고
      // 첫 칸이 그걸 받아 쓴다. `bg-danger/10`은 반투명이라 그대로 못 쓰고, 같은 색을
      // `hb-50` 위에 미리 섞은 값(#fae0e3)을 넣었다.
      style={
        {
          "--row-bg": tone === "danger" ? "#fae0e3" : "var(--color-hb-50)",
        } as React.CSSProperties
      }
      className={`${tone === "danger" ? "bg-danger/10" : ""} ${
        onClick ? "cursor-pointer transition hover:bg-white/70" : ""
      }`}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  muted = false,
  nums = false,
  stick = false,
  wrap = false,
  className = "",
}: {
  children?: ReactNode;
  align?: "left" | "right";
  /** 보조 정보라 흐리게 — 눈이 중요한 열에 먼저 가도록 */
  muted?: boolean;
  /** 숫자 열. 자릿수가 세로로 맞아야 비교가 된다 */
  nums?: boolean;
  /**
   * 줄바꿈을 허용한다. 후기 본문처럼 **끝까지 읽어야 뜻이 있는** 칸에만 켠다.
   * 한 줄로 두면 표가 화면 몇 개 폭으로 늘어나 버린다. 켤 때는 `max-w-*`를 같이 줘서
   * 그 칸이 다른 칸을 밀어내지 않게 한다.
   */
  wrap?: boolean;
  /**
   * 첫 칸(이름·제품명)에만 켠다. 가로로 밀어도 왼쪽에 남아 있는다.
   * 폰에서는 한 번에 두세 칸밖에 안 보이는데, 이게 없으면 오른쪽으로 미는 순간
   * "지금 보는 게 누구 줄이지?"를 알 수 없다.
   */
  stick?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-ink/10 px-2 py-2.5 ${
        wrap ? "align-top" : "whitespace-nowrap"
      } ${align === "right" ? "text-right" : ""} ${
        muted ? "text-ink-sub" : ""
      } ${nums ? "tabular-nums" : ""} ${
        stick
          ? "sticky left-0 z-[1] border-r border-ink/10 bg-[var(--row-bg)]"
          : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}
