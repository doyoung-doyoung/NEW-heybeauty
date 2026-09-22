import type { InventoryItem } from "./types";

export const LOW_STOCK_QTY = 50;

export function isLowStock(item: InventoryItem): boolean {
  return item.qty <= LOW_STOCK_QTY;
}

export const RESTOCK_QTY = 100;

// 시술 한 건에 어떤 종류의 제품이 나가는지. 예약을 "방문완료"로 바꿀 때
// 전자차트를 만들면서 이 기준으로 지점 재고를 자동으로 깎는다.
//
// 제품 ID를 못 박지 않고 "제품 카테고리 우선순위"로 둔 이유:
// 지점마다 보유 제품이 네 종류뿐이라 특정 제품을 지정하면 대부분 빗나간다.
// 앞에 적힌 카테고리부터 찾아서 지점이 실제로 가진 제품을 쓴다.
const BY_TREATMENT: Record<string, string[]> = {
  "레이저 토닝": ["메조", "스킨부스터"],
  "리쥬란 스킨부스터": ["스킨부스터", "메조"],
  "엑소좀 스킨부스터": ["스킨부스터", "메조"],
  물광주사: ["스킨부스터", "메조"],
  "사각턱 보톡스": ["톡신"],
  "올리지오 RF 리프팅": ["바이오스티뮬레이터", "스킨부스터"],
  "턱 필러": ["필러"],
  "글루타치온 IV": ["메조", "스킨부스터"],
  "울쎄라 리프팅": ["바이오스티뮬레이터", "스킨부스터"],
};

// 어드민이 새로 만든 클리닉처럼 시술 이름을 모를 때 쓰는 기준.
const BY_CATEGORY: Record<string, string[]> = {
  화이트닝: ["메조", "스킨부스터"],
  스킨부스터: ["스킨부스터", "메조"],
  V라인: ["톡신"],
  리프팅: ["바이오스티뮬레이터", "스킨부스터"],
  필러: ["필러"],
};

export function categoriesForTreatment(
  name: string,
  category: string,
): string[] {
  return BY_TREATMENT[name] ?? BY_CATEGORY[category] ?? [];
}
