// 2026-10-02에 추가한 사진(프로모션 배너 · 시술 · 지점)을 데이터에 이어 준다.
// 사진 경로를 seed 데이터에 직접 넣지 않고 여기서 계산한다.
// 그래서 SEED_VERSION을 올리지 않아도, 이미 사이트를 열어 본 사람에게도 바로 보인다.
// 파일 위치: public/images/heybeauty/<폴더>/<이름>.webp

const BASE = "/images/heybeauty";
const pad = (n: number) => String(n).padStart(2, "0");
const banner = (n: number) => `${BASE}/banners/banner-${pad(n)}.webp`;

// 시술 이름 → 시술 사진 번호 (treatments/treatment-XX.webp)
// 01 보톡스 · 02 필러 · 03 스킨부스터 · 04 레이저토닝 · 05 HIFU · 06 RF리프팅 · 07 실리프팅 · 08 아쿠아필 · 09 엑소좀
const TREATMENT_BY_NAME: Record<string, string> = {
  "레이저 토닝": `${BASE}/treatments/treatment-04.webp`,
  "리쥬란 스킨부스터": `${BASE}/treatments/treatment-03.webp`,
  "엑소좀 스킨부스터": `${BASE}/treatments/treatment-09.webp`,
  물광주사: `${BASE}/treatments/treatment-08.webp`,
  "사각턱 보톡스": `${BASE}/treatments/treatment-01.webp`,
  "올리지오 RF 리프팅": `${BASE}/treatments/treatment-06.webp`,
  "턱 필러": `${BASE}/treatments/treatment-02.webp`,
  "글루타치온 IV": banner(20),
  "울쎄라 리프팅": `${BASE}/treatments/treatment-05.webp`,
};

// 어드민에서 새로 만든 시술처럼 이름이 목록에 없으면 분류로 고른다.
const TREATMENT_BY_CATEGORY: Record<string, string> = {
  화이트닝: `${BASE}/treatments/treatment-04.webp`,
  스킨부스터: `${BASE}/treatments/treatment-03.webp`,
  V라인: `${BASE}/treatments/treatment-01.webp`,
  리프팅: `${BASE}/treatments/treatment-05.webp`,
  필러: `${BASE}/treatments/treatment-02.webp`,
};

export function treatmentImage(t: { name: string; category: string }): string {
  return (
    TREATMENT_BY_NAME[t.name] ??
    TREATMENT_BY_CATEGORY[t.category] ??
    `${BASE}/treatments/treatment-03.webp`
  );
}

// 클리닉마다 프로모션이 3개(화이트닝 · V라인 · 웰컴)라서 종류별로 배너 10장씩 나눠 둔다.
// 클리닉 번호(C01~C10)마다 다른 배너가 나오게 한다.
const PROMO_BANNERS = {
  whitening: [3, 4, 5, 6, 15, 20, 16, 9, 17, 10],
  vline: [7, 8, 27, 12, 13, 14, 11, 26, 25, 2],
  welcome: [28, 29, 30, 1, 21, 18, 19, 22, 23, 24],
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function promoImage(p: { id: string; clinicId: string; title: string }): string {
  const clinicNo = Number(p.clinicId.replace(/\D/g, "")) || hash(p.clinicId);
  const idx = (clinicNo - 1 + 10) % 10;
  const title = p.title;
  if (/화이트닝|whitening|토닝/i.test(title)) return banner(PROMO_BANNERS.whitening[idx]);
  if (/V라인|보톡스|필러|리프팅/i.test(title)) return banner(PROMO_BANNERS.vline[idx]);
  if (/웰컴|첫 방문|welcome/i.test(title)) return banner(PROMO_BANNERS.welcome[idx]);
  return banner((hash(p.id) % 30) + 1);
}

// 지점이 있는 클리닉 3곳(C01~C03) × 3지점 = 9장
const BRANCH_IMAGE: Record<string, number> = {
  "C01-B1": 1, // 사얌 본점
  "C01-B2": 2, // 통러점
  "C01-B3": 3, // 아속점
  "C02-B1": 5, // 프롬퐁 본점
  "C02-B2": 6, // 실롬점
  "C02-B3": 8, // 라차다점
  "C03-B1": 7, // 아속 본점
  "C03-B2": 4, // 아리점
  "C03-B3": 9, // 에까마이점
};

export function branchImage(b: { id: string }): string | null {
  const n = BRANCH_IMAGE[b.id];
  return n ? `${BASE}/branches/branch-${pad(n)}.webp` : null;
}

// 사얌 클리닉 데모 의료진: 같은 이름은 지점이 달라도 같은 프로필을 사용한다.
// 실제 신원 매칭이 아니라 사용자가 승인한 데모 사진 배치다.
export function doctorImage(doctor: { image?: string; clinicId: string; name: string }): string | undefined {
  if (doctor.image) return doctor.image;
  if (doctor.clinicId !== "C86") return undefined;
  const profiles: Record<string, number> = { "나린 원장": 1, "쁘라윳 원장": 2, "깐야 원장": 3, "아난 원장": 4 };
  const photo = profiles[doctor.name];
  return photo ? `/images/doctors/doctor-${photo}.jpg` : undefined;
}
