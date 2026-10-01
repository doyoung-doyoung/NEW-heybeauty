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

  let result: DemoDb;
  if (saved.version === SEED_VERSION) {
    result = saved;
  } else {
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

    result = merged as unknown as DemoDb;
  }

  // 투자자 데모 지점(사얌 본점 · C01-B1)의 예약·차트는 "오늘" 기준으로 만들어지므로,
  // 저장본에 그대로 얼려 두면 날마다 과거로 밀려난다. 그래서 이 지점만은 매번 새로
  // 그린 값으로 갈아 끼운다 — 그날 클릭해 바꾼 상태(방문완료 등)는 새로고침하면
  // 초기화되지만, 그 대신 언제 열어도 "이번 주" 예약처럼 보인다.
  return {
    ...result,
    bookings: [
      ...result.bookings.filter((b) => b.branchId !== "C01-B1"),
      ...fresh.bookings.filter((b) => b.branchId === "C01-B1"),
    ],
    charts: [
      ...result.charts.filter((c) => c.branchId !== "C01-B1"),
      ...fresh.charts.filter((c) => c.branchId === "C01-B1"),
    ],
  };
}
