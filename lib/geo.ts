// 지도로 보기에 쓰는 좌표. 지도는 실제 지도가 아니라 예시 그림이라 위경도 대신
// "그림 안에서 몇 % 위치인가"로 적는다 (x = 왼쪽에서, y = 위에서).
// 그림이 바뀌면 이 숫자만 다시 맞추면 된다.

/** 방콕 지도(maps/bangkok.jpg, 1168×880) 위 동네 위치 */
export const BKK_POS: Record<string, { x: number; y: number }> = {
  짜뚜짝: { x: 52, y: 13 },
  랏프라오: { x: 70, y: 13 },
  아리: { x: 50, y: 25 },
  라차다: { x: 73, y: 27 },
  후아이꽝: { x: 68, y: 34 },
  빅토리: { x: 46, y: 39 },
  사얌: { x: 50, y: 51 },
  아속: { x: 70, y: 52 },
  통러: { x: 82, y: 52 },
  프롬퐁: { x: 76, y: 58 },
  에까마이: { x: 87, y: 61 },
  차이나타운: { x: 31, y: 58 },
  실롬: { x: 50, y: 73 },
  사톤: { x: 44, y: 80 },
  프라카농: { x: 90, y: 71 },
  온눗: { x: 93, y: 79 },
  방나: { x: 86, y: 91 },
};

/**
 * 방콕 밖 지방 도시. 태국 지도(maps/thailand.jpg, 688×1024) 위 위치와
 * 시드 데이터가 쓰는 LINE 슬러그 · 지역번호를 함께 둔다.
 */
export const PROVINCES: { name: string; slug: string; area: string; x: number; y: number }[] = [
  { name: "치앙마이", slug: "chiangmai", area: "053", x: 31, y: 17 },
  { name: "치앙라이", slug: "chiangrai", area: "053", x: 39, y: 9 },
  { name: "핏사눌록", slug: "phitsanulok", area: "055", x: 43, y: 27 },
  { name: "우돈타니", slug: "udon", area: "042", x: 64, y: 21 },
  { name: "콘깬", slug: "khonkaen", area: "043", x: 63, y: 29 },
  { name: "코랏", slug: "korat", area: "044", x: 59, y: 39 },
  { name: "우본랏차타니", slug: "ubon", area: "045", x: 79, y: 37 },
  { name: "파타야", slug: "pattaya", area: "038", x: 55, y: 51 },
  { name: "후아힌", slug: "huahin", area: "032", x: 40, y: 58 },
  { name: "꼬사무이", slug: "samui", area: "077", x: 46, y: 71 },
  { name: "푸켓", slug: "phuket", area: "076", x: 25, y: 77 },
  { name: "끄라비", slug: "krabi", area: "075", x: 33, y: 77 },
  { name: "핫야이", slug: "hatyai", area: "074", x: 47, y: 89 },
];

/** 태국 지도 위 방콕 위치 */
export const BANGKOK_ON_TH = { x: 46, y: 46 };

export const PROVINCE_NAMES = new Set(PROVINCES.map((p) => p.name));

/** 동네(district)가 지방 도시면 그 이름, 아니면 "방콕" */
export function cityOf(district: string) {
  return PROVINCE_NAMES.has(district) ? district : "방콕";
}

/**
 * 같은 동네 클리닉 핀이 겹치지 않게 나선(황금각)으로 벌린다. 순서만으로 정해지니
 * 새로고침해도 같은 자리다. 결과는 그림 폭·높이에 대한 % 오프셋.
 * ratio = 그림 가로/세로 — 세로 %는 같은 거리라도 더 크게 줘야 원이 찌그러지지 않는다.
 */
export function spread(items: { id: string; group: string }[], ratio: number, step = 2.3) {
  const seen = new Map<string, number>();
  const out = new Map<string, { dx: number; dy: number }>();
  for (const it of items) {
    const k = seen.get(it.group) ?? 0;
    seen.set(it.group, k + 1);
    const r = k === 0 ? 0 : step * Math.sqrt(k);
    const a = k * 2.39996;
    out.set(it.id, { dx: r * Math.cos(a), dy: r * Math.sin(a) * ratio });
  }
  return out;
}

/**
 * 이웃 동네 핀끼리 닿으면 서로 밀어낸다(몇 번 반복하는 단순한 밀어내기).
 * base = 각 핀의 기준 위치(%), 결과는 기준 위치에서의 오프셋(%).
 */
export function relax(
  pts: { id: string; x: number; y: number }[],
  start: Map<string, { dx: number; dy: number }>,
  ratio: number,
  minDist = 2.3,
) {
  const p = pts.map((q) => {
    const o = start.get(q.id) ?? { dx: 0, dy: 0 };
    // 세로 %를 가로 % 단위로 바꿔서 거리를 잰다
    return { id: q.id, x: q.x + o.dx, y: (q.y + o.dy) / ratio, bx: q.x, by: q.y };
  });
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dx = p[j].x - p[i].x;
        const dy = p[j].y - p[i].y;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d >= minDist) continue;
        const push = (minDist - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        p[i].x -= ux * push;
        p[i].y -= uy * push;
        p[j].x += ux * push;
        p[j].y += uy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return new Map(p.map((q) => [q.id, { dx: q.x - q.bx, dy: q.y * ratio - q.by }]));
}
