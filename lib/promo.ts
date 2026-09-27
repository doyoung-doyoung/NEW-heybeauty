import type { Promotion, Treatment } from "@/lib/types";

/**
 * 프로모션이 어느 시술에 걸리는지. 프로모션 데이터에 시술 id가 따로 없어서
 * 제목에 든 카테고리 이름으로 고른다 — "화이트닝 3회 패키지"면 화이트닝 시술만.
 * 카테고리가 안 보이는 프로모션(첫 방문 할인 등)은 그 클리닉 시술 전부에 걸린다.
 */
export function promoTreatments(promo: Promotion, treatments: Treatment[]): Treatment[] {
  const own = treatments.filter((t) => t.clinicId === promo.clinicId);
  const hit = own.filter((t) => promo.title.includes(t.category));
  return hit.length > 0 ? hit : own;
}

export function discounted(price: number, pct: number): number {
  return Math.round((price * (100 - pct)) / 100 / 100) * 100;
}
