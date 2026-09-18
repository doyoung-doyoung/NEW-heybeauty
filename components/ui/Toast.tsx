"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext<((text: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);

  const show = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, text }]);
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
            className="animate-toast rounded-pill bg-ink px-5 py-3 text-sm text-white shadow-float"
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
