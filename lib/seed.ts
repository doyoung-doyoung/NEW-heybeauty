import type {
  Account,
  AppUser,
  Booking,
  Branch,
  ChatThread,
  Clinic,
  Commission,
  CrmEntry,
  Customer,
  DemoDb,
  Distribution,
  Doctor,
  Hours,
  InboxThread,
  InventoryItem,
  Notice,
  OpdChart,
  Popup,
  Product,
  Promotion,
  Review,
  ReviewCode,
  SmsLog,
  Staff,
  StockLog,
  Treatment,
} from "./types";
import { COMMISSION_BASELINE } from "./commission";

const BASE_DATE = new Date("2026-09-17T09:00:00+07:00");

// 스키마가 바뀌면 올린다. 저장된 데모 데이터가 이 값과 다르면 새 시드로 갈아끼운다.
export const SEED_VERSION = 7;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 데모 리셋이 항상 똑같은 데이터를 만들도록 buildSeed 시작 시 시드를 되감는다
let rand = rng(20260917);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

function shiftDays(days: number) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function dateOnly(days: number) {
  return shiftDays(days).slice(0, 10);
}

const PRODUCTS: Product[] = [
  { id: "P01", name: "Flore Max", category: "필러", image: "/products/P01_flore-max.png", unitPriceTHB: 4800, unit: "1ml 시린지" },
  { id: "P02", name: "Belotero Intense", category: "필러", image: "/products/P02_belotero-intense.png", unitPriceTHB: 6200, unit: "1ml 시린지" },
  { id: "P03", name: "Restylane Lidocaine", category: "필러", image: "/products/P03_restylane-lidocaine.png", unitPriceTHB: 7400, unit: "1ml 시린지" },
  { id: "P04", name: "Relife Definisse", category: "필러", image: "/products/P04_relife-definisse.png", unitPriceTHB: 5600, unit: "1ml 시린지" },
  { id: "P05", name: "Restylane Skinboosters Vital", category: "스킨부스터", image: "/products/P05_restylane-skinboosters-vital.png", unitPriceTHB: 6800, unit: "1ml 시린지" },
  { id: "P06", name: "Restylane Lyft", category: "필러", image: "/products/P06_restylane-lyft.png", unitPriceTHB: 8200, unit: "1ml 시린지" },
  { id: "P07", name: "Juvederm Volite", category: "스킨부스터", image: "/products/P07_juvederm-volite.png", unitPriceTHB: 7900, unit: "1ml 시린지" },
  { id: "P08", name: "Juvederm Voluma", category: "필러", image: "/products/P08_juvederm-voluma.png", unitPriceTHB: 9600, unit: "1ml 시린지" },
  { id: "P09", name: "Juvederm Ultra Plus XC", category: "필러", image: "/products/P09_juvederm-ultra-plus-xc.png", unitPriceTHB: 8800, unit: "1ml 시린지" },
  { id: "P10", name: "Botox Cosmetic 100U", category: "톡신", image: "/products/P10_botox-cosmetic-100u.png", unitPriceTHB: 7500, unit: "100U 바이알" },
  { id: "P11", name: "Xeomin 100U", category: "톡신", image: "/products/P11_xeomin-100u.png", unitPriceTHB: 6400, unit: "100U 바이알" },
  { id: "P12", name: "Botulax 100U", category: "톡신", image: "/products/P12_botulax-100u.png", unitPriceTHB: 3200, unit: "100U 바이알" },
  { id: "P13", name: "Dysport 500U", category: "톡신", image: "/products/P13_dysport-500u.png", unitPriceTHB: 6900, unit: "500U 바이알" },
  { id: "P14", name: "Nabota 100U", category: "톡신", image: "/products/P14_nabota-100u.png", unitPriceTHB: 3600, unit: "100U 바이알" },
  { id: "P15", name: "Aestox 100U", category: "톡신", image: "/products/P15_aestox-100u.png", unitPriceTHB: 2900, unit: "100U 바이알" },
  { id: "P16", name: "Rejuran", category: "스킨부스터", image: "/products/P16_rejuran.png", unitPriceTHB: 5400, unit: "2ml 시린지" },
  { id: "P17", name: "NCTF 140HA", category: "메조", image: "/products/P17_ncf-140h.png", unitPriceTHB: 2600, unit: "5ml 앰플" },
  { id: "P18", name: "Radiesse", category: "바이오스티뮬레이터", image: "/products/P18_radiesse.png", unitPriceTHB: 10400, unit: "1.5ml 시린지" },
  { id: "P19", name: "ASCE+ Exosome", category: "스킨부스터", image: "/products/P19_asce-plus-exosome.png", unitPriceTHB: 11800, unit: "1 키트" },
  { id: "P20", name: "MADE Collagen", category: "메조", image: "/products/P20_made-collagen.png", unitPriceTHB: 3100, unit: "5ml 앰플" },
  { id: "P21", name: "Neauvia Hydro Deluxe", category: "바이오스티뮬레이터", image: "/products/P21_neauvia-hydrodeluxe.png", unitPriceTHB: 9700, unit: "2.5ml 시린지" },
  { id: "P22", name: "Oligio RF Device", category: "장비", image: "/products/P22_oligio-rf-device.png", unitPriceTHB: 480000, unit: "본체 1대" },
];

// 어드민에서 새 클리닉을 등록할 때도 같은 목록으로 기본 시술을 깔아준다.
// 시술이 하나도 없는 클리닉은 홈 탭에서 보여줄 게 없다.
export const TREATMENT_POOL = [
  { name: "레이저 토닝", category: "화이트닝", base: 2500, min: 30 },
  { name: "리쥬란 스킨부스터", category: "스킨부스터", base: 8500, min: 45 },
  { name: "엑소좀 스킨부스터", category: "스킨부스터", base: 12000, min: 45 },
  { name: "물광주사", category: "화이트닝", base: 6500, min: 40 },
  { name: "사각턱 보톡스", category: "V라인", base: 5500, min: 20 },
  { name: "올리지오 RF 리프팅", category: "리프팅", base: 19000, min: 60 },
  { name: "턱 필러", category: "필러", base: 14000, min: 30 },
  { name: "글루타치온 IV", category: "화이트닝", base: 3200, min: 40 },
  { name: "울쎄라 리프팅", category: "리프팅", base: 28000, min: 70 },
] as const;

const CLINIC_DEFS = [
  { name: "사얌 글로우 클리닉", district: "사얌", branches: ["사얌 본점", "통러점", "아속점"] },
  { name: "방콕 루미에르 클리닉", district: "프롬퐁", branches: ["프롬퐁 본점", "실롬점", "라차다점"] },
  { name: "아속 스킨랩", district: "아속", branches: ["아속 본점", "아리점", "에까마이점"] },
  { name: "통러 뷰티하우스", district: "통러", branches: [] },
  { name: "프롬퐁 더마클리닉", district: "프롬퐁", branches: [] },
  { name: "실롬 라디언스", district: "실롬", branches: [] },
  { name: "아리 스킨스튜디오", district: "아리", branches: [] },
  { name: "에까마이 오라 클리닉", district: "에까마이", branches: [] },
  { name: "라차다 퓨어덤", district: "라차다", branches: [] },
  { name: "차이나타운 벨르", district: "차이나타운", branches: [] },
] as const;

// LINE 아이디는 실제로 로마자다. 동네 이름을 그대로 쓰면 영어 화면에 한글이 남는다.
const DISTRICT_SLUG: Record<string, string> = {
  사얌: "siam",
  프롬퐁: "phrompong",
  아속: "asok",
  통러: "thonglor",
  실롬: "silom",
  아리: "ari",
  에까마이: "ekkamai",
  라차다: "ratchada",
  차이나타운: "chinatown",
};

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
const DOCTOR_NAMES = ["나린", "쁘라윳", "깐야", "아난", "수니사", "위라왓", "말리완", "티라폰", "차이야", "펀사이"];
const STAFF_NAMES = ["쏨차이", "니차", "밧사꼰", "쁘라니", "아윳", "깐톤", "사이완", "피차야"];
const CUSTOMER_FIRST = ["나리사", "쏨차이", "깐야라", "아난다", "쁘라니", "위라", "수니", "티라", "말리", "차리", "펀", "부아", "노이", "깜", "싸이"];
const CUSTOMER_LAST = ["쁘라싯", "찬타윗", "분마", "시리완", "퐁사왓", "탐마쿤", "라따나", "위칫"];
const NATIONS = ["태국", "태국", "태국", "중국", "한국", "일본", "러시아"];
const CHANNELS = ["LINE", "Meta", "App"] as const;
const SUPPLIERS = ["RAON Thailand", "Bangkok Medi Supply", "Siam Aesthetic Dist.", "Global Derma Co."];

// 앱 유저 총원. 유저 관리·계정 표를 실제 서비스처럼 채우려고 늘렸다.
const APP_USER_COUNT = 99;
const LINE_SLUGS = ["nari", "som", "kan", "anan", "prani", "wira", "suni", "tira", "mali", "chari", "fern", "bua", "noi", "kam", "sai"];

// 입출고 기록 사유. 실제로 손으로 적는 말투를 흉내 냈다.
const STOCK_USE_REASONS = ["시술 사용", "예약 시술 차감", "원내 시술 사용", "체험 시술 사용", "리터치 사용"];
const STOCK_IN_REASONS = ["정기 발주 입고", "긴급 추가 입고", "본사 보충 입고", "프로모션 물량 입고", "반품 재입고"];
const STOCK_FIX_REASONS = ["실사 차이 조정", "파손 폐기", "유효기간 경과 폐기", "타 지점 이관", "입력 오류 정정"];

const SMS_TEXTS: Record<SmsLog["template"], (name: string) => string> = {
  생일: (name) =>
    `${name}님, 생일 축하드립니다! 이번 달 방문 시 시술 10% 할인 쿠폰을 드려요.`,
  재방문: (name) =>
    `${name}님, 지난 시술 후 4주가 지났습니다. 다음 회차 예약을 도와드릴까요?`,
  프로모션: (name) =>
    `${name}님, 9월 화이트닝 페스티벌 진행 중입니다. 레이저 토닝 3회 패키지 20% 할인!`,
};

function makeHours(offset: number): Hours[] {
  return DAYS.map((day, i) => ({
    day,
    open: i === 6 ? "11:00" : offset % 2 === 0 ? "10:00" : "10:30",
    close: i === 6 ? "18:00" : offset % 2 === 0 ? "20:00" : "21:00",
    closed: i === 6 && offset % 3 === 0,
  }));
}

export function buildSeed(): DemoDb {
  rand = rng(20260917);

  const clinics: Clinic[] = [];
  const branches: Branch[] = [];
  const doctors: Doctor[] = [];
  const staff: Staff[] = [];
  const treatments: Treatment[] = [];
  const promotions: Promotion[] = [];
  const inventory: InventoryItem[] = [];
  const stockLogs: StockLog[] = [];
  const customers: Customer[] = [];
  const charts: OpdChart[] = [];
  const inbox: InboxThread[] = [];
  const crmEntries: CrmEntry[] = [];
  const accounts: Account[] = [];
  const smsLogs: SmsLog[] = [];

  CLINIC_DEFS.forEach((def, ci) => {
    const clinicId = `C${String(ci + 1).padStart(2, "0")}`;
    const hasBranches = def.branches.length > 0;

    clinics.push({
      id: clinicId,
      name: def.name,
      hasBranches,
      district: def.district,
      address: `${def.district} 로드 ${between(10, 240)}, 방콕`,
      phone: `02-${between(200, 999)}-${between(1000, 9999)}`,
      lineId: `@${DISTRICT_SLUG[def.district]}${ci + 1}`,
      parking: pick(["발렛 가능", "건물 주차장 2시간 무료", "인근 유료 주차", "주차 불가 (BTS 도보 3분)"]),
      hours: makeHours(ci),
      rating: Number((4.1 + rand() * 0.8).toFixed(1)),
      reviewCount: between(48, 620),
      intro: `${def.district} 중심가에 위치한 ${def.name}. 화이트닝·V라인·리프팅 중심의 시술을 제공합니다.`,
      image: `/clinics/${clinicId}.jpg`,
    });

    accounts.push({
      id: `AC-${clinicId}`,
      kind: "clinic",
      label: `${def.name} 마스터 계정`,
      loginId: `master${ci + 1}`,
      password: `hb${1000 + ci}`,
      status: ci === 8 ? "홀드" : "사용가능",
    });

    const branchNames = hasBranches ? def.branches : ["본점"];
    branchNames.forEach((bname, bi) => {
      const branchId = `${clinicId}-B${bi + 1}`;
      branches.push({
        id: branchId,
        clinicId,
        name: bname,
        address: `${def.district} 소이 ${between(1, 60)}, 방콕`,
        phone: `02-${between(200, 999)}-${between(1000, 9999)}`,
        parking: pick(["발렛 가능", "건물 주차장 2시간 무료", "인근 유료 주차"]),
        hours: makeHours(ci + bi),
      });

      for (let d = 0; d < 2; d++) {
        doctors.push({
          id: `${branchId}-D${d + 1}`,
          clinicId,
          branchId,
          name: `${DOCTOR_NAMES[(ci * 2 + bi + d) % DOCTOR_NAMES.length]} 원장`,
          title: d === 0 ? "대표원장" : "진료원장",
          specialties: [pick(["화이트닝", "V라인", "리프팅", "스킨부스터"]), pick(["필러", "톡신", "레이저"])],
          employeeNo: `EMP${clinicId}${bi + 1}${d + 1}`,
        });
      }

      for (let s = 0; s < 2; s++) {
        staff.push({
          id: `${branchId}-S${s + 1}`,
          clinicId,
          branchId,
          name: STAFF_NAMES[(ci * 2 + bi + s) % STAFF_NAMES.length],
          role: s === 0 ? "간호사" : "코디네이터",
          employeeNo: `EMP${clinicId}${bi + 1}${s + 5}`,
        });
      }

      for (let iv = 0; iv < 4; iv++) {
        const product = PRODUCTS[(ci * 7 + bi * 3 + iv * 5) % PRODUCTS.length];
        const low = iv === 0 && (ci + bi) % 2 === 0;
        inventory.push({
          id: `${branchId}-IV${iv + 1}`,
          clinicId,
          branchId,
          productId: product.id,
          qty: low ? between(10, 48) : between(60, 3000),
          distribution: (rand() > 0.72 ? "병행수입" : "정식") as Distribution,
          volume: pick(["1ml", "2ml", "100U", "500U", "5ml", "10 vial"]),
          expiry: dateOnly(between(90, 720)),
          supplier: pick(SUPPLIERS),
          manager: STAFF_NAMES[(ci + bi + iv) % STAFF_NAMES.length],
          purchaseDate: dateOnly(-between(20, 300)),
          purchasePrice: between(900, 9000),
          salePrice: between(3000, 24000),
          lotNo: `LOT${between(10000, 99999)}`,
          warnPct: pick([10, 15, 20]),
        });
      }

      for (let cu = 0; cu < 5; cu++) {
        const customerId = `${branchId}-CU${cu + 1}`;
        customers.push({
          id: customerId,
          clinicId,
          branchId,
          name: `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_LAST)}`,
          phone: `08${between(10000000, 99999999)}`,
          birthday: `19${between(80, 99)}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
          gender: rand() > 0.22 ? "여" : "남",
          nationality: pick(NATIONS),
          channel: pick(CHANNELS),
          interests: [pick(["화이트닝", "V라인", "리프팅", "스킨부스터", "필러"])],
          doctorId: `${branchId}-D${between(1, 2)}`,
          memo: pick(["재방문 고객", "첫 방문 상담 완료", "프로모션 문의", "지인 소개", "온라인 유입"]),
          createdAt: shiftDays(-between(5, 400)),
        });

        if (cu < 2) {
          const usedProduct = PRODUCTS[(ci * 3 + cu * 4) % PRODUCTS.length];
          charts.push({
            id: `${customerId}-OPD1`,
            customerId,
            clinicId,
            branchId,
            visitDate: dateOnly(-between(1, 90)),
            doctorId: `${branchId}-D1`,
            staffId: `${branchId}-S1`,
            treatmentNames: [pick(TREATMENT_POOL).name],
            usedProducts: [{ productId: usedProduct.id, qty: between(1, 3) }],
            comment: pick([
              "시술 부위 홍조 경미, 2주 후 경과 관찰 예정",
              "통증 호소 없음, 마취크림 20분 적용",
              "다운타임 안내 완료, 재방문 4주 후 권장",
            ]),
            paidAmount: between(3000, 45000),
          });
        }
      }

      const inboxChannels: InboxThread["channel"][] = ["LINE", "Meta", "App"];
      inboxChannels.forEach((channel, ii) => {
        if (bi > 0 && ii > 0) return;
        const customerName = `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_LAST)}`;
        inbox.push({
          id: `${branchId}-IN${ii + 1}`,
          clinicId,
          branchId,
          channel,
          customerName,
          unread: ii === 0,
          updatedAt: shiftDays(-between(0, 6)),
          messages: [
            {
              id: `${branchId}-IN${ii + 1}-M1`,
              role: "user",
              text: pick([
                "안녕하세요, 레이저 토닝 가격 문의드려요",
                "이번 주 토요일 예약 가능한가요?",
                "보톡스 프로모션 아직 하나요?",
                "리쥬란 몇 회 받아야 효과 있나요?",
              ]),
              at: shiftDays(-between(1, 6)),
            },
            {
              id: `${branchId}-IN${ii + 1}-M2`,
              role: "clinic",
              text: "문의 감사합니다! 담당 상담사가 곧 안내드리겠습니다.",
              at: shiftDays(-between(0, 1)),
            },
          ],
        });
      });

      crmEntries.push({
        id: `${branchId}-CE1`,
        clinicId,
        branchId,
        kind: "음성",
        raw: "보톡스 나보타 두 바이알 사용했고 담당은 나린 원장, 간호사 쏨차이입니다",
        summary: "사용제품: Nabota 100U × 2 / 담당의: 나린 원장 / 간호사: 쏨차이",
        by: STAFF_NAMES[(ci + bi) % STAFF_NAMES.length],
        at: shiftDays(-between(1, 10)),
      });
      crmEntries.push({
        id: `${branchId}-CE2`,
        clinicId,
        branchId,
        kind: "사진",
        raw: "제품 박스 촬영 — Rejuran / 2ml / LOT 48211 / EXP 2027-03",
        summary: "신규 입고 등록: Rejuran 2ml, LOT 48211, 유통기한 2027-03",
        by: STAFF_NAMES[(ci + bi + 1) % STAFF_NAMES.length],
        at: shiftDays(-between(1, 20)),
      });

      const smsName = `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_LAST)}`;
      const smsTemplate = pick(["생일", "재방문", "프로모션"]) as SmsLog["template"];
      smsLogs.push({
        id: `${branchId}-SMS1`,
        clinicId,
        to: `08${between(10000000, 99999999)}`,
        customerName: smsName,
        template: smsTemplate,
        text: SMS_TEXTS[smsTemplate](smsName),
        at: shiftDays(-between(1, 25)),
      });
    });

    TREATMENT_POOL.forEach((t, ti) => {
      treatments.push({
        id: `${clinicId}-T${ti + 1}`,
        clinicId,
        name: t.name,
        category: t.category,
        price: Math.round((t.base * (0.85 + rand() * 0.4)) / 100) * 100,
        durationMin: t.min,
        description: `${t.name} — ${t.category} 시술. 상담 후 개인별 프로토콜로 진행합니다.`,
      });
    });

    const promoDefs = [
      { title: "화이트닝 3회 패키지", discountPct: 20, description: "레이저 토닝 + 물광주사 조합 패키지" },
      { title: "V라인 보톡스 프로모션", discountPct: 15, description: "사각턱 보톡스 + 턱 필러 동시 시술 할인" },
      { title: "첫 방문 웰컴 할인", discountPct: 10, description: "Hey! Beauty 첫 예약 고객 대상" },
    ];
    promoDefs.forEach((p, pi) => {
      promotions.push({
        id: `${clinicId}-PR${pi + 1}`,
        clinicId,
        title: p.title,
        description: p.description,
        discountPct: p.discountPct,
        period: `${dateOnly(-between(5, 20))} ~ ${dateOnly(between(20, 70))}`,
      });
    });
  });

  // 재고 한 칸마다 입출고 기록을 20건 안팎으로 쌓는다.
  // 한 줄("초기 재고 등록")만 있으면 상세 화면이 텅 비어서, 재고가 실제로 돌아간 것처럼 안 보인다.
  // 맨 아래가 최초 입고이고 위로 올라올수록 최근이다.
  inventory.forEach((item, i) => {
    stockLogs.push({
      id: `SL-${i + 1}-0`,
      inventoryItemId: item.id,
      type: "입고",
      qty: item.qty,
      reason: "초기 재고 등록",
      at: shiftDays(-between(200, 320)),
      by: item.manager,
    });

    const count = between(14, 22);
    for (let n = 1; n <= count; n++) {
      // 쓰는 일이 제일 잦고, 다시 채우는 입고가 그다음, 실사 조정은 가끔이다.
      const roll = rand();
      const type: StockLog["type"] =
        roll < 0.62 ? "사용" : roll < 0.9 ? "입고" : "조정";
      stockLogs.push({
        id: `SL-${i + 1}-${n}`,
        inventoryItemId: item.id,
        type,
        qty:
          type === "사용"
            ? between(1, 12)
            : type === "입고"
              ? between(20, 200)
              : between(1, 5),
        reason:
          type === "사용"
            ? pick(STOCK_USE_REASONS)
            : type === "입고"
              ? pick(STOCK_IN_REASONS)
              : pick(STOCK_FIX_REASONS),
        at: shiftDays(-between(1, 190)),
        by: STAFF_NAMES[(i + n) % STAFF_NAMES.length],
      });
    }
  });

  // 최신 기록이 위로 오게. 상세 화면은 이 순서를 그대로 쓴다.
  stockLogs.sort((a, b) => (a.at < b.at ? 1 : -1));

  const users: AppUser[] = [
    { id: "U1", name: "도도", lineId: "dodo_line", phone: "0812345678", blocked: false },
    { id: "U2", name: "나리사 쁘라싯", lineId: "narisa_l", phone: "0823456789", blocked: false },
    { id: "U3", name: "민지", lineId: "minji_k", phone: "0834567890", blocked: false },
    { id: "U4", name: "쏨차이 분마", lineId: "somchai_b", phone: "0845678901", blocked: true },
  ];

  // 위 네 명은 시연에서 실제로 예약을 만드는 계정이고, 나머지는 목록을 채우는 사람들이다.
  // 이쪽에는 가짜 예약을 만들지 않고 누적 실적 숫자만 들려 보낸다(`AppUser.seedSpentTHB` 주석 참고).
  for (let u = users.length; u < APP_USER_COUNT; u++) {
    const name = `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_LAST)}`;
    const visits = between(0, 14);
    users.push({
      id: `U${u + 1}`,
      name,
      lineId: `${pick(LINE_SLUGS)}_${between(100, 999)}`,
      phone: `08${between(10000000, 99999999)}`,
      // 100명 중 서넛쯤은 막혀 있어야 "차단" 상태가 표에서 죽은 기능처럼 안 보인다.
      blocked: rand() < 0.04,
      seedVisits: visits,
      seedSpentTHB: visits === 0 ? 0 : visits * between(2800, 26000),
    });
  }

  users.forEach((u, i) => {
    accounts.push({
      id: `AC-${u.id}`,
      kind: "user",
      label: `${u.name} 유저 계정`,
      loginId: u.lineId,
      password: `user${100 + i}`,
      status: u.blocked ? "차단" : "사용가능",
    });
  });

  const bookings: Booking[] = [
    {
      id: "BK1",
      userId: "U2",
      clinicId: "C01",
      branchId: "C01-B1",
      treatmentId: "C01-T1",
      doctorId: "C01-B1-D1",
      date: dateOnly(-14),
      time: "14:00",
      depositTHB: 1000,
      slipImage: null,
      status: "방문완료",
      usedReviewCode: null,
      createdAt: shiftDays(-18),
    },
    {
      id: "BK2",
      userId: "U3",
      clinicId: "C02",
      branchId: "C02-B1",
      treatmentId: "C02-T5",
      doctorId: "C02-B1-D1",
      date: dateOnly(3),
      time: "11:30",
      depositTHB: 1000,
      slipImage: null,
      status: "예약확정",
      usedReviewCode: "HB-7K2M",
      createdAt: shiftDays(-2),
    },
  ];

  const reviewCodes: ReviewCode[] = [
    {
      id: "RC1",
      code: "HB-7K2M",
      ownerUserId: "U2",
      clinicId: "C01",
      bookingId: "BK1",
      issuedAt: shiftDays(-13),
      usedByBookingIds: ["BK2"],
    },
    // 여기서부터는 과거 실적으로 깔아 둔 20개(`lib/commission.ts`).
    // 예약과 엮여 있지 않아서 `bookingId`가 비어 있다 — 발행 목록에 보여주기만 하는 코드들이다.
    ...COMMISSION_BASELINE.map((row, i) => ({
      id: `RC-B${i + 1}`,
      code: row.code,
      ownerUserId: "",
      ownerName: row.reviewer,
      clinicId: row.clinicId,
      bookingId: "",
      issuedAt: shiftDays(-row.daysAgo),
      usedByBookingIds: [],
    })),
  ];

  const reviews: Review[] = [
    {
      id: "RV1",
      userId: "U2",
      clinicId: "C01",
      code: "HB-7K2M",
      rating: 5,
      text: "레이저 토닝 3회 받았는데 톤이 확실히 밝아졌어요. 상담도 친절했습니다.",
      images: ["/reviews/RV1-1.jpg", "/reviews/RV1-2.jpg"],
      approved: true,
      blocked: false,
      createdAt: shiftDays(-12),
    },
    {
      id: "RV2",
      userId: "U3",
      clinicId: "C02",
      code: "",
      rating: 4,
      text: "보톡스 맞고 라인이 정리된 느낌이에요. 대기 시간이 조금 길었어요.",
      images: ["/reviews/RV2-1.jpg", "/reviews/RV2-2.jpg"],
      approved: false,
      blocked: false,
      createdAt: shiftDays(-4),
    },
  ];

  const commissions: Commission[] = [
    {
      id: "CM1",
      reviewCodeId: "RC1",
      bookingId: "BK2",
      amountTHB: 150,
      at: shiftDays(-2),
    },
  ];

  const chats: ChatThread[] = [
    {
      id: "CH1",
      kind: "ai",
      userId: "U1",
      clinicId: null,
      title: "얼굴 톤이 하얘지고 밝아지고 싶어요",
      updatedAt: shiftDays(-3),
      messages: [
        { id: "CH1-M1", role: "user", text: "얼굴 톤이 하얘지고 밝아지고 싶어요", at: shiftDays(-3) },
        {
          id: "CH1-M2",
          role: "assistant",
          text: "톤 개선은 크게 세 가지로 접근합니다. 레이저 토닝은 색소를 단계적으로 옅게 하고, 스킨부스터(리쥬란·엑소좀)는 피부결과 속건조를 개선해 광채를 만들며, 물광주사는 수분 채움으로 즉각적인 윤기를 줍니다.",
          at: shiftDays(-3),
        },
      ],
    },
    {
      id: "CH2",
      kind: "ai",
      userId: "U1",
      clinicId: null,
      title: "턱선이 갸름해지고 싶어요 (V라인)",
      updatedAt: shiftDays(-8),
      messages: [
        { id: "CH2-M1", role: "user", text: "턱선이 갸름해지고 싶어요 (V라인)", at: shiftDays(-8) },
        {
          id: "CH2-M2",
          role: "assistant",
          text: "사각턱 보톡스는 씹는 근육을 줄여 각진 라인을 완화하고, 올리지오 RF 리프팅은 처진 조직을 당겨 윤곽을 정리합니다. 볼륨이 부족해 턱이 짧아 보이는 경우에는 턱 필러가 효과적입니다.",
          at: shiftDays(-8),
        },
      ],
    },
    {
      id: "CH3",
      kind: "clinic",
      userId: "U1",
      clinicId: "C01",
      title: "사얌 글로우 클리닉과 대화 · 예약 관련",
      updatedAt: shiftDays(-1),
      messages: [
        { id: "CH3-M1", role: "user", text: "예약금 송금했습니다. 확인 부탁드려요", at: shiftDays(-1) },
        {
          id: "CH3-M2",
          role: "clinic",
          text: "송금 확인되었습니다! 예약이 확정되었어요. 방문 10분 전에 도착해주시면 됩니다.",
          at: shiftDays(-1),
        },
      ],
    },
  ];

  const notices: Notice[] = [
    { id: "N1", title: "쏭크란 연휴 운영 안내", body: "4월 13~15일은 일부 클리닉이 단축 운영합니다.", target: "전체", at: shiftDays(-6) },
    { id: "N2", title: "후기 커미션 정책 업데이트", body: "후기코드 사용 1건당 커미션이 150฿로 조정됩니다.", target: "클리닉", at: shiftDays(-20) },
    { id: "N3", title: "앱 예약금 결제 수단 추가", body: "PromptPay QR 외에 은행 이체 슬립 업로드가 가능합니다.", target: "유저", at: shiftDays(-2) },
  ];

  const popups: Popup[] = [
    { id: "PP1", title: "9월 화이트닝 페스티벌", body: "전국 제휴 클리닉 화이트닝 시술 최대 20% 할인", image: "/popups/PP2.jpg", active: true },
  ];

  return {
    version: SEED_VERSION,
    clinics,
    branches,
    doctors,
    staff,
    treatments,
    promotions,
    products: PRODUCTS,
    inventory,
    stockLogs,
    customers,
    charts,
    users,
    bookings,
    reviews,
    reviewCodes,
    commissions,
    chats,
    inbox,
    crmEntries,
    notices,
    popups,
    accounts,
    smsLogs,
  };
}
