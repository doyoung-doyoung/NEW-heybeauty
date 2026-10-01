import { asset } from "./assets";

/**
 * 어드민 → 전체 재고 → "유통업체 · 유통 제품" 표.
 *
 * 업체 이름은 2026-10-01에 웹에서 찾아 넣었다. check 값의 뜻:
 *  - "확인"  : 기사·클리닉 안내글에 "이 회사가 태국 수입사"라고 적힌 것을 찾음
 *  - "추정"  : 그 브랜드를 만든 회사의 태국 법인. 수입사라는 글은 아직 못 찾음
 *  - "제공"  : 도도가 직접 알려 준 정보
 *  - "미확인": 태국 공식 수입사를 못 찾음. 영업 쪽에서 확인 필요
 *
 * 가격은 시연용 공급 참고가다(ASCE+ 3,500฿과 올리지오 팁 2,500฿만 실제로 확인한 값).
 */
export type DistCheck = "확인" | "추정" | "제공" | "미확인";

export interface DistRow {
  id: string;
  product: string;
  /** db.products의 id. 있으면 그 사진을 쓴다 */
  productId?: string;
  image?: string;
  category: string;
  spec: string;
  distributor: string;
  distributorTh?: string;
  route: "정식" | "병행수입";
  priceTHB: number;
  check: DistCheck;
  note?: string;
}

export const DIST_ROWS: DistRow[] = [
  // 장비
  { id: "D01", product: "Oligio 본체", productId: "P22", category: "장비", spec: "본체 1대", distributor: "Wontech Asia", distributorTh: "วอนเทค เอเชีย", route: "정식", priceTHB: 480000, check: "확인", note: "원텍 태국 법인" },
  { id: "D02", product: "Oligio 팁", productId: "P22", category: "장비 소모품", spec: "시술 팁 1개", distributor: "MNB", route: "정식", priceTHB: 2500, check: "제공" },

  // 톡신
  { id: "D03", product: "Botox Cosmetic 100U", productId: "P10", category: "톡신", spec: "100U 바이알", distributor: "Allergan Aesthetics (AbbVie Thailand)", route: "정식", priceTHB: 7500, check: "추정" },
  { id: "D04", product: "Xeomin 100U", productId: "P11", category: "톡신", spec: "100U 바이알", distributor: "Merz Healthcare (Thailand)", distributorTh: "เมิร์ซ เฮลธ์แคร์ (ประเทศไทย)", route: "정식", priceTHB: 6400, check: "확인" },
  { id: "D05", product: "Botulax 100U", productId: "P12", category: "톡신", spec: "100U 바이알", distributor: "Cosma Medical", distributorTh: "คอสม่า เมดิคอล", route: "정식", priceTHB: 3200, check: "확인" },
  { id: "D06", product: "Dysport 500U", productId: "P13", category: "톡신", spec: "500U 바이알", distributor: "Galderma (Thailand)", distributorTh: "กัลเดอร์มา ประเทศไทย", route: "정식", priceTHB: 6900, check: "확인" },
  { id: "D07", product: "Nabota 100U", productId: "P14", category: "톡신", spec: "100U 바이알", distributor: "Mantana Marketing", distributorTh: "มัณฑนา มาร์เก็ตติ้ง", route: "정식", priceTHB: 3600, check: "확인" },
  { id: "D08", product: "Aestox 100U", productId: "P15", category: "톡신", spec: "100U 바이알", distributor: "Aestec Pharma", distributorTh: "เอสเทค ฟาร์มา", route: "정식", priceTHB: 2900, check: "확인" },

  // 필러
  { id: "D09", product: "Belotero Intense", productId: "P02", category: "필러", spec: "1ml 시린지", distributor: "Merz Healthcare (Thailand)", distributorTh: "เมิร์ซ เฮลธ์แคร์ (ประเทศไทย)", route: "정식", priceTHB: 6200, check: "확인" },
  { id: "D10", product: "Radiesse", productId: "P18", category: "바이오스티뮬레이터", spec: "1.5ml 시린지", distributor: "Merz Healthcare (Thailand)", distributorTh: "เมิร์ซ เฮลธ์แคร์ (ประเทศไทย)", route: "정식", priceTHB: 10400, check: "추정" },
  { id: "D11", product: "Restylane Lidocaine", productId: "P03", category: "필러", spec: "1ml 시린지", distributor: "Galderma (Thailand)", distributorTh: "กัลเดอร์มา ประเทศไทย", route: "정식", priceTHB: 7400, check: "추정" },
  { id: "D12", product: "Restylane Lyft", productId: "P06", category: "필러", spec: "1ml 시린지", distributor: "Galderma (Thailand)", distributorTh: "กัลเดอร์มา ประเทศไทย", route: "정식", priceTHB: 8200, check: "추정" },
  { id: "D13", product: "Restylane Skinboosters Vital", productId: "P05", category: "스킨부스터", spec: "1ml 시린지", distributor: "Galderma (Thailand)", distributorTh: "กัลเดอร์มา ประเทศไทย", route: "정식", priceTHB: 6800, check: "추정" },
  { id: "D14", product: "Juvederm Voluma", productId: "P08", category: "필러", spec: "1ml 시린지", distributor: "Allergan Aesthetics (AbbVie Thailand)", route: "정식", priceTHB: 9600, check: "추정" },
  { id: "D15", product: "Juvederm Ultra Plus XC", productId: "P09", category: "필러", spec: "1ml 시린지", distributor: "Allergan Aesthetics (AbbVie Thailand)", route: "정식", priceTHB: 8800, check: "추정" },
  { id: "D16", product: "Juvederm Volite", productId: "P07", category: "스킨부스터", spec: "1ml 시린지", distributor: "Allergan Aesthetics (AbbVie Thailand)", route: "정식", priceTHB: 7900, check: "추정" },
  { id: "D17", product: "Relife Definisse", productId: "P04", category: "필러", spec: "1ml 시린지", distributor: "A. Menarini (Thailand)", route: "정식", priceTHB: 5600, check: "추정", note: "Relife는 메나리니 그룹 회사" },
  { id: "D18", product: "Flore Max", productId: "P01", category: "필러", spec: "1ml 시린지", distributor: "확인 필요", route: "병행수입", priceTHB: 4800, check: "미확인" },
  { id: "D19", product: "Neauvia Hydro Deluxe", productId: "P21", category: "바이오스티뮬레이터", spec: "2.5ml 시린지", distributor: "확인 필요", route: "정식", priceTHB: 9700, check: "미확인" },

  // 스킨부스터 · 메조
  { id: "D20", product: "Rejuran", productId: "P16", category: "스킨부스터", spec: "2ml 시린지", distributor: "Rejuran Thailand", distributorTh: "รีจูรัน ประเทศไทย", route: "정식", priceTHB: 5400, check: "확인", note: "공식 계정 · 정품 인증 운영" },
  { id: "D21", product: "ASCE+ Exosome", productId: "P19", category: "스킨부스터", spec: "1 키트", distributor: "MC Supplymed", route: "정식", priceTHB: 3500, check: "확인", note: "판매가 ฿3,500 확인" },
  { id: "D22", product: "NCTF 135HA", productId: "P17", category: "메조", spec: "5ml 앰플", distributor: "확인 필요", route: "병행수입", priceTHB: 2600, check: "미확인" },
  { id: "D23", product: "MADE Collagen", productId: "P20", category: "메조", spec: "5ml 앰플", distributor: "확인 필요", route: "병행수입", priceTHB: 3100, check: "미확인" },

  // 클리닉 소모품 (태국 현지 제조사)
  { id: "D24", product: "니트릴 장갑 (파우더 프리)", productId: "S02", category: "소모품", spec: "M · 100매/박스", distributor: "Sri Trang Gloves (Thailand)", distributorTh: "ศรีตรังโกลฟส์ (ประเทศไทย)", route: "정식", priceTHB: 180, check: "추정", note: "태국 장갑 제조사" },
  { id: "D25", product: "멸균 거즈 3x3 인치", productId: "S03", category: "소모품", spec: "8겹 · 100매", distributor: "Thai Gauze", distributorTh: "ไทยก๊อส", route: "정식", priceTHB: 120, check: "추정", note: "태국 거즈·솜 제조사" },
  { id: "D26", product: "멸균 코튼볼", productId: "S01", category: "소모품", spec: "0.5g · 100개", distributor: "Thai Gauze", distributorTh: "ไทยก๊อส", route: "정식", priceTHB: 60, check: "추정" },
  { id: "D27", product: "알코올 스왑 70%", productId: "S04", category: "소모품", spec: "200매/박스", distributor: "Thai Gauze", distributorTh: "ไทยก๊อส", route: "정식", priceTHB: 150, check: "추정" },
  { id: "D28", product: "30G 일회용 니들", productId: "S05", category: "소모품", spec: "30G×13mm · 100개", distributor: "Nipro (Thailand)", distributorTh: "นิโปร (ประเทศไทย)", route: "정식", priceTHB: 350, check: "추정", note: "아유타야 공장 운영" },
];

/** 소모품 제품 (db.products에 덧붙인다) */
export const CONSUMABLE_PRODUCTS = [
  { id: "S01", name: "멸균 코튼볼", category: "소모품", image: asset("products/S01_cotton-balls.jpg"), unitPriceTHB: 60, unit: "100개 봉지" },
  { id: "S02", name: "니트릴 장갑", category: "소모품", image: asset("products/S02_nitrile-gloves.jpg"), unitPriceTHB: 180, unit: "100매 박스" },
  { id: "S03", name: "멸균 거즈", category: "소모품", image: asset("products/S03_sterile-gauze.jpg"), unitPriceTHB: 120, unit: "100매 박스" },
  { id: "S04", name: "알코올 스왑", category: "소모품", image: asset("products/S04_alcohol-pads.jpg"), unitPriceTHB: 150, unit: "200매 박스" },
  { id: "S05", name: "30G 니들", category: "소모품", image: asset("products/S05_30g-needles.jpg"), unitPriceTHB: 350, unit: "100개 박스" },
];

/**
 * 재고 표의 "공급처" 칸. 예전에는 가짜 업체 네 곳 중 하나를 골랐는데, 이제는 위 표의
 * 실제 유통업체를 쓴다. 수입사를 못 찾은 제품은 RAON Thailand가 들여오는 것으로 둔다.
 * fallback은 시드 난수 순서를 지키려고 받아만 두는 값이다(호출 쪽에서 pick()을 그대로 부른다).
 */
export function supplierOf(productId: string, fallback?: string) {
  const row = DIST_ROWS.find((r) => r.productId === productId && r.category !== "장비 소모품");
  if (!row) return fallback ?? "RAON Thailand";
  return row.check === "미확인" ? "RAON Thailand" : row.distributor;
}

/** 예전 시드가 쓰던 가짜 공급처. 저장된 데이터에서 이 값이면 실제 업체로 바꿔 준다. */
export const LEGACY_SUPPLIERS = ["RAON Thailand", "Bangkok Medi Supply", "Siam Aesthetic Dist.", "Global Derma Co."];
