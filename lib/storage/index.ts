import type { StorageAdapter } from "./adapter";
import { localAdapter } from "./local";

// Phase 2에서 이 줄만 supabaseAdapter로 바꾸면 이사 완료 (스펙 §2-4)
export const storage: StorageAdapter = localAdapter;

export type { StorageAdapter };
