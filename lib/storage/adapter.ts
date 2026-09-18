import type { DemoDb } from "@/lib/types";

export interface StorageAdapter {
  load(): Promise<DemoDb | null>;
  save(db: DemoDb): Promise<void>;
  clear(): Promise<void>;
  subscribe(onChange: (db: DemoDb) => void): () => void;
}
