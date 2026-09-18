import type { StorageAdapter } from "./adapter";
import type { DemoDb } from "@/lib/types";

const KEY = "heybeauty.db.v1";

export const localAdapter: StorageAdapter = {
  async load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DemoDb;
    } catch {
      return null;
    }
  },

  async save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  },

  async clear() {
    localStorage.removeItem(KEY);
  },

  subscribe(onChange) {
    const handler = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return;
      try {
        onChange(JSON.parse(e.newValue) as DemoDb);
      } catch {
        /* 다른 탭이 잘못된 값을 쓴 경우 무시 */
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
