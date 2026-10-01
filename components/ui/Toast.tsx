"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext<((text: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; leaving: boolean }[]>([]);

  // 뜬 경로(아래→제자리) 그대로 되짚어 사라지게 한다 — 타임아웃이 끝나자마자 뚝 끊기지 않도록,
  // 실제로 배열에서 지우기 180ms 전에 먼저 leaving만 켜서 toast-out을 재생시킨다.
  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text, leaving: false }]);
    setTimeout(() => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, leaving: true } : i)));
    }, 2220);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`${item.leaving ? "animate-toast-out" : "animate-toast"} rounded-pill bg-ink px-5 py-3 text-sm text-white shadow-float`}
          >
            {item.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
