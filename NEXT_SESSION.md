# HeyBeauty MVP — 개발팀 인계 (2026-10-12)

데모 전 구간이 동작하는 상태입니다. main 기준 `4700236`, Vercel 운영 배포 완료.
**지금 바로 인계해서 작업 시작 가능합니다.**

---

## 1. 띄우기

```bash
npm install
npm run dev     # http://localhost:3000
```

- Node 20+, Next.js 15.5 (App Router, Turbopack), React 19, TypeScript, Tailwind v4.
- 환경변수 없이도 뜹니다. `/api/ocr`(사진 판독)만 `ANTHROPIC_API_KEY`가 필요하고
  Vercel Production에만 넣어 뒀습니다. 로컬에서는 그 기능만 안 됩니다.
- 검사: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
  **dev 서버를 켠 채로 `build`를 돌리지 마세요** (`.next` 충돌로 dev가 깨집니다).

---

## 2. 구조 (알아야 할 것만)

**라우트가 1개입니다.** `app/page.tsx` 하나뿐이고 상단 탭으로
홈 / 어드민 / 파트너 CRM / 회사소개를 갈아끼웁니다. `/partner` 같은 URL은 404입니다.

| 영역 | 파일 |
|---|---|
| 고객 홈 (클로드 앱 구조: 채팅 먼저, 메뉴는 ☰ 서랍) | `components/tabs/HomeTab.tsx`, `components/home/ChatView.tsx` |
| 예약 신청 흐름 | `components/home/BookingFlow.tsx` |
| 내 예약 / 후기 | `components/home/UserPanels.tsx` |
| 클리닉 탐색·지도·비교 | `components/home/ClinicsView.tsx`, `ClinicMap.tsx` |
| 파트너 CRM 사이드바 패널 | `components/partner/Panels.tsx` |
| 파트너 대시보드 위젯 | `components/partner/Workspace.tsx` |

**데이터는 전부 브라우저 안에 있습니다. 서버 DB가 없습니다.**

- `lib/seed.ts` — 클리닉 99곳, 고객, 예약, 재고를 난수 시드로 생성. `SEED_VERSION = 15`.
- `lib/db.tsx` — React Context. `useDb()` → `{ db, update, reset }`.
  `update(draft => { ... })`로 draft를 직접 고치면 localStorage(`heybeauty.db.v1`)에 자동 저장됩니다.
- `lib/migrate.ts` — 저장본과 새 시드를 합칩니다. 주의 두 가지:
  - **`SEED_VERSION`을 올리면 사용자가 데모 중 만든 데이터가 날아갑니다.** 꼭 필요할 때만.
  - **`C01-B1`(사얌 본점) 예약·차트는 매 로드마다 덮어씁니다.** 투자자 데모용 상시 지점이라
    그렇습니다. 여기서 바꾼 상태는 새로고침하면 되돌아갑니다 — 버그가 아닙니다.

**다국어** — ko / en / th / zh / ru.

- `lib/i18n.ts` — UI 문구. camelCase 키. `useT()` → `t("key")`, `tf("key", 값)`.
- `lib/i18n-content.ts` — 데이터 문구. **한국어 원문이 키입니다.** 없는 키는 한국어 그대로 나옵니다.
- 채팅 메시지는 `t(b.text)`로 렌더하므로, 새 문장은 `i18n-content.ts`에 넣어야 번역됩니다.

---

## 3. 최근에 끝낸 것

- **예약 흐름 (PR #20, 10/12)** — 연출이던 예약을 실제 상태 기계로 바꿨습니다.
  `예약요청 → 입금확인 → 예약확정 → 방문완료`, 어디서든 `취소`.
  단계·전이·버튼 문구·안내문이 **`lib/booking-flow.ts` 한 곳**에 있고 고객 화면과
  파트너 CRM이 같은 모듈을 봅니다. 여기만 고치면 양쪽이 같이 바뀝니다.
  상태가 바뀌면 `pushStatusNotice()`가 고객 대화창에 클리닉 메시지를 쌓습니다
  (`ChatThread.bookingId`로 연결) — 앱 안에서 이게 알림 역할입니다.
  고객은 내 예약에서 날짜·시간 변경과 취소가 됩니다. 확정된 예약을 옮기면
  `입금확인`으로 되돌아가 클리닉이 다시 승인합니다.
- **고객 홈 한 화면 맞춤 (PR #19)** — 폰에서 페이지와 메시지 목록이 따로 스크롤되던 문제.
  `app/globals.css`의 `@media (max-width:639px)` 블록에서 `.app-shell-home`에
  `height:100dvh`를 줘서 해결했습니다. `min-height`로는 안 됩니다
  (높이가 미확정이면 자식의 `h-full`이 `auto`로 떨어짐).
- 그 이전 이력은 `NOTES_LOG_2026-10-12.md`, `NOTES_LOG_2026-10-05.md` 참고.

---

## 4. 남은 작업

진행중 목록의 원본은 Supabase 프로젝트 `hdujouoaeqatrazrnlhn`의 `hb_notes` 테이블
(`done = false`)입니다. 2026-10-12 기준 7건:

### 바로 착수 가능 (1건)

**지도 두 손가락 확대** — `components/home/ClinicMap.tsx`.
지금은 핀치하면 지도가 아니라 화면 전체가 확대됩니다. 지도 영역에서만
`touch-action`을 잡고 자체 pan/zoom을 붙여야 합니다.
※ 아래 "진짜 지도 전환"을 먼저 하면 지도 라이브러리가 공짜로 해결해 주는 항목이라,
착수 전에 순서를 한 번 정하는 게 좋습니다.

### 외부 입력을 기다리는 것 (6건)

| 항목 | 막는 것 |
|---|---|
| 진짜 지도(OSM/구글맵) 전환 | 클리닉 99곳 실제 위도·경도. 지금 데이터는 동네 이름만 있음. 선택지 비교표는 `NOTES_LOG_2026-10-12.md` |
| 클리닉 실제 사진·의사·위치·상담 언어 등록 | 클리닉 실제 정보. 현재는 전부 생성 이미지 |
| LINE/Google 로그인, 서버 저장, 권한 분리 | 운영 계정·서버 DB 결정. 고객 화면에 어드민·파트너 메뉴가 그대로 보이는 것도 여기 묶임 |
| 예약 알림 SMS/LINE 발송 | 통신사 계약. 앱 안 대화창 알림까지는 구현됨 |
| 실제 AI 상담·추천 | 운영 방향 결정. 현재는 시나리오 상담 (`lib/scenario.ts`) |
| 실제 예약 가능 시간 | 클리닉 실제 영업시간·의사 일정 |

> **클리닉 5~10곳만 먼저 받아도** 진짜 지도와 실제 사진 흐름을 붙여 볼 수 있습니다.
> 좌표는 구글맵 주소에서 뽑으면 클리닉당 몇 분입니다. 99곳을 다 기다릴 필요 없습니다.

---

## 5. 작업 규칙

- **디자인 변경은 바로 main에 넣지 않습니다.** 브랜치 → PR → Vercel 미리보기 주소와
  폰 크기 스크린샷 확인 → 머지.
- **폰에서 직접 눌러 확인합니다.** 기준 375×812, 도영님은 아이폰 사파리로 봅니다.
- 노트를 완료 처리할 때는 문장을 항목별로 쪼개서 전부 반영된 것만 체크합니다.
- 표 폭 함정: `DataTable.tsx`에서 `<Th>`의 `w-*`는 `<Td>`의 `max-w-*`와 같이 줄여야 먹습니다.
- `app/globals.css`는 레이어 밖이라 Tailwind 유틸리티를 덮어씁니다. 스타일이 안 먹으면 여기부터 보세요.

---

## 6. 더 읽을 것

- `CLAUDE.md` — 세션 규칙 요약
- `HEYBEAUTY_SPEC.md` — 기능 명세 전문
- `IMAGE_TODO.md` — 이미지 생성·교체 현황
- `scripts/verify-clinic-discovery.cjs`, `scripts/verify-clinic-images.cjs` — 검증 스크립트
