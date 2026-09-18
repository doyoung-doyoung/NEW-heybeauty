"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DemoDb } from "./types";
import { storage } from "./storage";
import { buildSeed, SEED_VERSION } from "./seed";

interface DbContextValue {
  db: DemoDb | null;
  update: (recipe: (draft: DemoDb) => void) => void;
  reset: () => void;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DemoDb | null>(null);
  const dbRef = useRef<DemoDb | null>(null);

  useEffect(() => {
    let alive = true;

    storage.load().then((loaded) => {
      if (!alive) return;
      const usable = loaded?.version === SEED_VERSION ? loaded : null;
      const next = usable ?? buildSeed();
      dbRef.current = next;
      setDb(next);
      if (!usable) storage.save(next);
    });

    const unsubscribe = storage.subscribe((incoming) => {
      dbRef.current = incoming;
      setDb(incoming);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback((recipe: (draft: DemoDb) => void) => {
    const current = dbRef.current;
    if (!current) return;
    const draft = structuredClone(current);
    recipe(draft);
    dbRef.current = draft;
    setDb(draft);
    storage.save(draft);
  }, []);

  const reset = useCallback(() => {
    const fresh = buildSeed();
    dbRef.current = fresh;
    setDb(fresh);
    storage.save(fresh);
  }, []);

  return (
    <DbContext.Provider value={{ db, update, reset }}>
      {children}
    </DbContext.Provider>
  );
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDb must be used inside DbProvider");
  return ctx;
}
