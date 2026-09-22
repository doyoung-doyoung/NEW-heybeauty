/**
 * 커미션 정산의 **기초 데이터**.
 *
 * 왜 이런 게 따로 있나:
 * 데모 DB에는 예약이 두 건뿐이라 커미션도 한 건(฿150)밖에 안 생긴다. 한 줄짜리 장부로는
 * "후기코드가 돈을 만든다"는 이야기를 보여줄 수가 없다. 그래서 **이미 1년 가까이 굴러온
 * 것처럼** 보이는 과거 실적을 여기에 적어 둔다.
 *
 * 이 숫자들은 앱의 다른 동작과 **엮여 있지 않다.** 일부러 그렇게 뒀다 — 예약을 만들거나
 * 후기를 지운다고 과거 정산액이 흔들리면 그게 더 이상하다. 실제로 새로 발생한 커미션은
 * `db.commissions`에 쌓이고, 화면에서 **이 기초값 위에 더해서** 보여준다.
 *
 * 구성은 두 겹이다:
 *  1. `FEATURED` — 손으로 쓴 대표 후기 20건. 이름도 후기 본문도 진짜처럼 읽힌다.
 *     정산 상세에서 맨 위에 오는 큰손들이고, 전체 금액의 85%를 만든다.
 *  2. 나머지 979건 — `buildTail()`이 규칙으로 찍어 낸다. 대부분은 **발행만 되고 안 쓰인**
 *     코드다(클릭 0). 추천 코드라는 게 원래 그렇다. 셋 중 하나 정도만 예약으로 이어진다.
 *
 * 둘을 합쳐 999건, 합계는 정확히 ฿999,999다.
 * (아래 `BASELINE_TOTAL`이 실제 합과 어긋나면 개발 중에 바로 터진다.)
 */

export interface CommissionSeedRow {
  /** 후기코드. `db.reviewCodes`에도 같은 값으로 들어간다 — seed.ts가 이 배열을 읽어서 만든다. */
  code: string;
  clinicId: string;
  /** 후기를 써서 코드를 받은 고객. 데모 계정(U1~U4)이 아니라 이름만 있는 사람들이다. */
  reviewer: string;
  rating: number;
  /** 정산 상세에서 "무슨 후기였길래 돈이 됐나"를 보여주는 줄. */
  review: string;
  /** 이 코드를 타고 들어온 예약 건수. 0이면 아직 아무도 안 썼다는 뜻. */
  clicks: number;
  /** 그래서 발생한 커미션 총액(THB). 시술마다 예약금이 달라서 클릭당 단가가 일정하지 않다. */
  amountTHB: number;
  /** 0이면 이번 달. 차트를 오늘 기준으로 그려야 데모가 나중에 봐도 안 낡는다. */
  monthsAgo: number;
  /** 후기코드 발행일. 위와 같은 이유로 날짜가 아니라 "며칠 전"으로 적는다. */
  daysAgo: number;
}

/**
 * 여기서 만드는 후기코드 개수. 시드가 데모용으로 한 건(HB-7K2M)을 더 붙이므로
 * `db.reviewCodes`는 딱 999건이 된다.
 */
export const BASELINE_CODE_COUNT = 998;
/** 999건이 만들어 낸 커미션 총액. */
export const BASELINE_TOTAL = 999_999;

/** 대표 20건이 가져가는 몫. 나머지는 꼬리 979건이 나눠 갖는다. */
const FEATURED_TOTAL = 850_000;

/**
 * 손으로 쓴 대표 후기 20건 — 클리닉 열 곳에 두 건씩.
 * 금액은 클릭 수 × ฿142~190 선이다. 시술마다 예약금이 달라서 단가가 일정하지 않다.
 */
const FEATURED: CommissionSeedRow[] = [
  // C01 사얌 글로우 클리닉
  {
    code: "HB-4T9P",
    clinicId: "C01",
    reviewer: "나리사 쁘라싯",
    rating: 5,
    review: "레이저 토닝 5회차인데 화장 안 해도 될 만큼 톤이 올라왔어요. 예약 잡기도 편했습니다.",
    clicks: 312,
    amountTHB: 44345,
    monthsAgo: 2,
    daysAgo: 74,
  },
  {
    code: "HB-2M6C",
    clinicId: "C01",
    reviewer: "깜 분마",
    rating: 4,
    review: "스킨부스터 맞고 속당김이 사라졌어요. 다만 주말은 대기가 좀 있습니다.",
    clicks: 208,
    amountTHB: 29563,
    monthsAgo: 5,
    daysAgo: 163,
  },
  // C02 방콕 루미에르 클리닉
  {
    code: "HB-8K3W",
    clinicId: "C02",
    reviewer: "쏨차이 분마",
    rating: 5,
    review: "보톡스 라인 정리가 자연스러워서 티가 안 나요. 원장님이 용량을 꼼꼼히 잡아줍니다.",
    clicks: 245,
    amountTHB: 41786,
    monthsAgo: 2,
    daysAgo: 68,
  },
  {
    code: "HB-5J1D",
    clinicId: "C02",
    reviewer: "위라 탐마쿤",
    rating: 4,
    review: "필러 후 붓기가 3일 만에 빠졌어요. 사후 관리 연락을 먼저 주셔서 좋았습니다.",
    clicks: 190,
    amountTHB: 32405,
    monthsAgo: 4,
    daysAgo: 131,
  },
  // C03 아속 스킨랩
  {
    code: "HB-7Q4Z",
    clinicId: "C03",
    reviewer: "말리 라따나",
    rating: 5,
    review: "엑소좀 3회 패키지 끝냈는데 모공이 확실히 줄었어요. 가격도 투명하게 안내해줍니다.",
    clicks: 288,
    amountTHB: 45027,
    monthsAgo: 1,
    daysAgo: 38,
  },
  {
    code: "HB-3R8N",
    clinicId: "C03",
    reviewer: "노이 시리완",
    rating: 4,
    review: "화이트닝 주사 맞고 목까지 톤이 맞았어요. 주차가 조금 불편한 게 아쉽습니다.",
    clicks: 176,
    amountTHB: 27516,
    monthsAgo: 5,
    daysAgo: 158,
  },
  // C04 통러 뷰티하우스
  {
    code: "HB-9F2V",
    clinicId: "C04",
    reviewer: "부아 위칫",
    rating: 5,
    review: "울쎄라 받고 턱선이 살았어요. 통증 관리 꼼꼼히 해주셔서 생각보다 안 아팠습니다.",
    clicks: 260,
    amountTHB: 49272,
    monthsAgo: 1,
    daysAgo: 33,
  },
  {
    code: "HB-6B7L",
    clinicId: "C04",
    reviewer: "차리 퐁사왓",
    rating: 4,
    review: "리프팅 실 시술 후 2주쯤 지나니 자리를 잡네요. 상담이 길어서 믿음이 갔어요.",
    clicks: 145,
    amountTHB: 27479,
    monthsAgo: 5,
    daysAgo: 152,
  },
  // C05 프롬퐁 더마클리닉
  {
    code: "HB-1H5X",
    clinicId: "C05",
    reviewer: "쁘라니 찬타윗",
    rating: 5,
    review: "여드름 흉터 레이저 6회 끝. 사진으로 비교해주니까 효과가 눈에 보여서 좋았어요.",
    clicks: 402,
    amountTHB: 57135,
    monthsAgo: 0,
    daysAgo: 9,
  },
  {
    code: "HB-4W8G",
    clinicId: "C05",
    reviewer: "티라 분마",
    rating: 4,
    review: "물광주사 맞고 바로 다음 날 촬영 있었는데 자국 없이 잘 넘어갔습니다.",
    clicks: 233,
    amountTHB: 33116,
    monthsAgo: 4,
    daysAgo: 124,
  },
  // C06 실롬 라디언스
  {
    code: "HB-2C9K",
    clinicId: "C06",
    reviewer: "수니 라따나",
    rating: 5,
    review: "V라인 시술 상담부터 끝까지 한 분이 맡아주셔서 편했어요. 결과도 만족합니다.",
    clicks: 318,
    amountTHB: 52731,
    monthsAgo: 1,
    daysAgo: 41,
  },
  {
    code: "HB-7Y3T",
    clinicId: "C06",
    reviewer: "아난다 시리완",
    rating: 4,
    review: "색소 레이저 받고 잡티가 많이 옅어졌어요. 재방문 안내 문자가 도움이 됐습니다.",
    clicks: 202,
    amountTHB: 33495,
    monthsAgo: 3,
    daysAgo: 96,
  },
  // C07 아리 스킨스튜디오
  {
    code: "HB-5N1Q",
    clinicId: "C07",
    reviewer: "깐야라 위칫",
    rating: 5,
    review: "리쥬란 4회 받았는데 피부결이 정리됐어요. 예약 변경도 바로바로 받아줍니다.",
    clicks: 355,
    amountTHB: 53820,
    monthsAgo: 0,
    daysAgo: 6,
  },
  {
    code: "HB-8D6M",
    clinicId: "C07",
    reviewer: "펀 퐁사왓",
    rating: 4,
    review: "모공 관리 패키지 만족해요. 시술실이 조용해서 부담 없이 다녔습니다.",
    clicks: 219,
    amountTHB: 33202,
    monthsAgo: 3,
    daysAgo: 101,
  },
  // C08 에까마이 오라 클리닉
  {
    code: "HB-3V7R",
    clinicId: "C08",
    reviewer: "싸이 탐마쿤",
    rating: 5,
    review: "눈밑 지방 재배치 상담이 정말 솔직했어요. 무리한 시술을 권하지 않아서 신뢰가 갑니다.",
    clicks: 296,
    amountTHB: 53289,
    monthsAgo: 1,
    daysAgo: 45,
  },
  {
    code: "HB-6G2J",
    clinicId: "C08",
    reviewer: "나리사 분마",
    rating: 4,
    review: "스킨보톡스 후 유분이 확 줄었어요. 다음 시기까지 안내해주셔서 편합니다.",
    clicks: 181,
    amountTHB: 32586,
    monthsAgo: 4,
    daysAgo: 118,
  },
  // C09 라차다 퓨어덤
  {
    code: "HB-9L4S",
    clinicId: "C09",
    reviewer: "말리완 쁘라싯",
    rating: 5,
    review: "제모 6회 패키지 완료. 예약이 밀리지 않아서 계획대로 다 받을 수 있었어요.",
    clicks: 430,
    amountTHB: 63153,
    monthsAgo: 0,
    daysAgo: 4,
  },
  {
    code: "HB-1P8H",
    clinicId: "C09",
    reviewer: "쏨차이 라따나",
    rating: 4,
    review: "탄력 관리 받고 팔자 주름이 옅어졌어요. 가격 대비 만족합니다.",
    clicks: 265,
    amountTHB: 38920,
    monthsAgo: 2,
    daysAgo: 79,
  },
  // C10 차이나타운 벨르
  {
    code: "HB-4Z6B",
    clinicId: "C10",
    reviewer: "깐톤 시리완",
    rating: 5,
    review: "화이트닝 앰플 시술이 저한테 제일 잘 맞았어요. 중국어 상담이 되는 것도 큰 장점.",
    clicks: 388,
    amountTHB: 62500,
    monthsAgo: 0,
    daysAgo: 12,
  },
  {
    code: "HB-7X3F",
    clinicId: "C10",
    reviewer: "부아 찬타윗",
    rating: 4,
    review: "점 제거 깔끔하게 됐어요. 재생 테이프까지 챙겨주셔서 관리가 쉬웠습니다.",
    clicks: 240,
    amountTHB: 38660,
    monthsAgo: 3,
    daysAgo: 89,
  },
];

/* ------------------------------------------------------------------ *
 * 꼬리 979건 — 규칙으로 찍어 낸다
 * ------------------------------------------------------------------ */

/** 같은 씨앗이면 언제나 같은 결과. 데모 리셋해도 목록이 흔들리면 안 된다. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["나리사", "쏨차이", "깐야라", "아난다", "쁘라니", "위라", "수니", "티라", "말리", "차리", "펀", "부아", "노이", "깜", "싸이", "깐톤", "말리완", "쁘라윳", "니차", "아윳"];
const LAST = ["쁘라싯", "찬타윗", "분마", "시리완", "퐁사왓", "탐마쿤", "라따나", "위칫", "분송", "깜차이"];

/** 짧은 후기. 정산 상세에서 한 줄로 읽히는 길이만 쓴다. */
const SHORT_REVIEWS = [
  "상담이 꼼꼼해서 믿고 맡겼어요.",
  "예약 시간에 딱 맞춰 시작해서 좋았습니다.",
  "시술 후 관리 안내를 문자로 보내줘요.",
  "가격표가 벽에 붙어 있어서 마음이 편했어요.",
  "다운타임이 거의 없어서 다음 날 출근했어요.",
  "원장님이 무리한 시술을 권하지 않습니다.",
  "직원분들이 영어가 돼서 소통이 편했어요.",
  "주차가 편해서 차 가지고 다니기 좋아요.",
  "시술실이 조용하고 깨끗합니다.",
  "효과가 사진으로 비교돼서 눈에 보였어요.",
  "재방문 할인까지 챙겨주셔서 감사했어요.",
  "대기 시간이 거의 없었습니다.",
  "통증 관리를 잘해주셔서 참을 만했어요.",
  "패키지로 끊으니 회당 가격이 확 내려가요.",
  "상담만 받고 가도 눈치 주지 않아요.",
  "예약 변경이 앱으로 바로 됩니다.",
];

/** 꼬리로 찍어 내는 후기코드 수. 대표 20건과 합쳐 998건이 된다. */
const TAIL_TOTAL = 978;

/** 어드민에 들어 있는 클리닉 수. `lib/seed.ts`의 `CLINIC_COUNT`와 같은 값이다. */
const TAIL_CLINICS = 99;

/**
 * 978개를 클리닉 99곳에 나눈 몫.
 *
 * 예전에는 열 곳에만 뿌렸는데, 클리닉이 99곳이 되면서 클리닉별 정산 표가
 * 열 줄만 나오고 나머지 89곳은 "정산 0"이라 아예 안 보였다. 그러면 99곳을 만든 의미가 없다.
 *
 * 그렇다고 똑같이 10개씩 나누면 그것도 거짓말이다. 제휴란 게 원래 위쪽 몇 곳이
 * 대부분을 가져가고 나머지는 한두 건씩 있는 긴 꼬리다. 그래서 앞 열 곳(손으로 쓴
 * 대표 클리닉, 대표 후기 20건도 여기에 붙는다)에 40쯤, 나머지에 4~12쯤을 주고
 * 비율대로 978개에 맞춰 눌렀다. `% 13`, `% 9`는 그냥 들쭉날쭉하게 만드는 장치다 —
 * 똑같은 숫자가 줄줄이 있으면 표가 자동생성 티를 낸다.
 */
const TAIL_SHARE = (() => {
  const weights = Array.from({ length: TAIL_CLINICS }, (_, ci) =>
    ci < 10 ? 40 + ((ci * 7) % 13) : 4 + ((ci * 5) % 9),
  );
  const weightSum = weights.reduce((s, w) => s + w, 0);
  const share = weights.map((w) =>
    Math.max(1, Math.floor((w * TAIL_TOTAL) / weightSum)),
  );
  // 내림 때문에 몇 개가 남는다. 앞에서부터 한 개씩 얹어 총합을 정확히 맞춘다.
  let gap = TAIL_TOTAL - share.reduce((s, n) => s + n, 0);
  for (let i = 0; gap > 0; i = (i + 1) % TAIL_CLINICS, gap--) share[i]++;
  return share;
})();

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function buildTail(existing: Set<string>): CommissionSeedRow[] {
  const rand = rng(20260922);
  const between = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

  /** `HB-XXXX`. 이미 쓴 코드와 겹치면 다시 뽑는다. */
  function newCode(): string {
    for (;;) {
      let s = "HB-";
      for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(rand() * 32)];
      if (!existing.has(s)) {
        existing.add(s);
        return s;
      }
    }
  }

  const rows: CommissionSeedRow[] = [];
  TAIL_SHARE.forEach((count, ci) => {
    const clinicId = `C${String(ci + 1).padStart(2, "0")}`;
    for (let i = 0; i < count; i++) {
      // 추천 코드는 원래 대부분 안 쓰인다. 셋 중 하나쯤만 예약으로 이어진다고 봤다.
      const used = rand() < 0.33;
      const clicks = used ? between(1, 4) : 0;
      const daysAgo = between(2, 178);
      rows.push({
        code: newCode(),
        clinicId,
        reviewer: `${pick(FIRST)} ${pick(LAST)}`,
        rating: rand() < 0.55 ? 5 : rand() < 0.85 ? 4 : 3,
        review: pick(SHORT_REVIEWS),
        clicks,
        amountTHB: clicks * between(140, 210),
        monthsAgo: Math.min(5, Math.floor(daysAgo / 30)),
        daysAgo,
      });
    }
  });

  // 합계를 정확히 맞춘다. 규칙으로 찍은 금액은 목표보다 조금 넘치거나 모자라는데,
  // 비율로 눌러 준 뒤 남는 몇 백 바트는 제일 큰 줄 하나가 흡수한다. 티가 안 난다.
  const target = BASELINE_TOTAL - FEATURED_TOTAL;
  const raw = rows.reduce((s, r) => s + r.amountTHB, 0);
  rows.forEach((r) => {
    r.amountTHB = Math.round((r.amountTHB * target) / raw);
  });
  const gap = target - rows.reduce((s, r) => s + r.amountTHB, 0);
  let biggest = rows[0];
  for (const r of rows) if (r.amountTHB > biggest.amountTHB) biggest = r;
  biggest.amountTHB += gap;

  return rows;
}

/** 대표 20건 + 꼬리 978건 = 998건. 화면과 시드가 모두 이 배열 하나를 본다. */
export const COMMISSION_BASELINE: CommissionSeedRow[] = [
  ...FEATURED,
  ...buildTail(new Set(FEATURED.map((r) => r.code))),
];

/**
 * 적어 둔 값이 정말 앞뒤가 맞는지 모듈을 읽는 순간 확인한다.
 * 줄을 하나 고치다가 합계가 어긋나면 화면에 이상한 숫자가 조용히 박히는데,
 * 그걸 나중에 발견하는 것보다 지금 터지는 게 낫다.
 */
const featuredSum = FEATURED.reduce((s, r) => s + r.amountTHB, 0);
if (featuredSum !== FEATURED_TOTAL) {
  throw new Error(
    `대표 후기 20건 합계가 안 맞습니다: ${featuredSum} ≠ ${FEATURED_TOTAL}`,
  );
}
const sum = COMMISSION_BASELINE.reduce((s, r) => s + r.amountTHB, 0);
if (sum !== BASELINE_TOTAL) {
  throw new Error(`커미션 기초 데이터 합계가 안 맞습니다: ${sum} ≠ ${BASELINE_TOTAL}`);
}
if (COMMISSION_BASELINE.length !== BASELINE_CODE_COUNT) {
  throw new Error(
    `후기코드 개수가 안 맞습니다: ${COMMISSION_BASELINE.length} ≠ ${BASELINE_CODE_COUNT}`,
  );
}

/** 최근 `count`개월을 오늘 기준으로 만든다. 맨 뒤가 이번 달. */
export function recentMonths(count = 6): { monthsAgo: number; label: string }[] {
  const now = new Date();
  const out: { monthsAgo: number; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ monthsAgo: i, label: `${d.getMonth() + 1}월` });
  }
  return out;
}

/** `daysAgo`를 화면에 찍을 날짜 문자열(YYYY-MM-DD)로. */
export function dateFromDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
