import type { DemoDb } from "./types";
import { buildSeed, SEED_VERSION } from "./seed";

type Row = { id: string };

// 시드 버전이 올라가도 저장된 데모 데이터를 통째로 버리지 않고 새 시드와 합친다.
// 저장본을 통째로 앞에 두고, 새 시드에만 있는 id를 뒤에 붙인다.
// 저장본을 우선하는 이유: 같은 id라도 어드민에서 올린 후기 사진이나 고쳐 둔 LINE ID처럼
// 사용자가 바꾼 값이 들어 있다. 순서까지 그대로 두는 이유: 공지·팝업은 unshift로 쌓아서
// 맨 앞이 최신이라, 재정렬하면 사용자가 만든 항목이 맨 뒤로 밀린다.
// 앱 어디에도 행을 지우는 코드가 없으므로 이 합치기가 지운 행을 되살릴 일은 없다.
export function migrate(saved: DemoDb | null): DemoDb {
  const fresh = buildSeed();
  if (!saved || typeof saved.version !== "number") return fresh;
  if (saved.version === SEED_VERSION) return saved;

  const merged: Record<string, unknown> = { ...fresh, version: SEED_VERSION };

  for (const [key, freshRows] of Object.entries(fresh)) {
    const savedRows = (saved as unknown as Record<string, unknown>)[key];
    if (!Array.isArray(freshRows) || !Array.isArray(savedRows)) continue;

    const savedIds = new Set((savedRows as Row[]).map((r) => r.id));
    merged[key] = [
      ...(savedRows as Row[]),
      ...(freshRows as Row[]).filter((r) => !savedIds.has(r.id)),
    ];
  }

  return merged as unknown as DemoDb;
}
