"use client";

import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <div
      className={`${soft ? "glass-soft" : "glass"} rounded-card ${className}`}
    >
      {children}
    </div>
  );
}

export function InkButton({
  children,
  onClick,
  arrow = true,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  arrow?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center gap-3 rounded-pill bg-ink py-2 pl-5 pr-2 text-sm font-medium text-white transition hover:bg-ink-deep disabled:opacity-40 ${className}`}
    >
      <span>{children}</span>
      {arrow && (
        <span className="flex size-8 items-center justify-center rounded-pill bg-white text-ink transition-transform group-hover:translate-x-0.5">
          <ArrowRight />
        </span>
      )}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  active = false,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-pill px-4 py-2 text-sm transition disabled:opacity-40 ${
        active
          ? "bg-ink text-white"
          : "bg-white/70 text-ink hairline hover:bg-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * 상세 화면에서 목록으로 돌아가는 버튼.
 *
 * 카드 **위**가 아니라 **안쪽 오른쪽 아래**에 둔다. 상세를 다 읽고 나면 눈이 이미 아래쪽
 * 오른편에 가 있어서, 위로 올라가 뒤로가기를 찾는 것보다 그 자리에 있는 게 빠르다.
 */
export function BackToList({
  onClick,
  label = "목록으로",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <div className="mt-5 flex justify-end">
      <GhostButton onClick={onClick}>← {label}</GhostButton>
    </div>
  );
}

export function IconField({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-pill bg-white/70 p-1.5 pr-4 hairline">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-white text-ink-sub hairline">
        {icon}
      </span>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {sub && <p className="mt-1 text-sm text-ink-sub">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "pink" | "danger" | "ink";
}) {
  const tones = {
    neutral: "bg-white/80 text-ink-sub hairline",
    pink: "bg-hb-400/20 text-hb-600",
    danger: "bg-danger/12 text-danger",
    ink: "bg-ink text-white",
  };
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
