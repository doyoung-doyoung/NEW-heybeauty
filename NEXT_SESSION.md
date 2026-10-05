# HeyBeauty — 2026-10-05 인계 / 다음 작업

다음 작업 시작 시 이 문서와 CLAUDE.md를 먼저 읽습니다. 사용자는 10/5 수정 전후 사진을 확인하고 ‘응 진행해줘’로 PR #14 병합 및 진행을 승인했습니다. 이후 새로운 디자인은 기존 규칙대로 Preview와 폰 스크린샷을 먼저 보여주고 승인 후 병합합니다.

## 완료

- PR #13: 89개 생성 클리닉 이미지 추가와 연결 완료, main 병합 및 운영 배포 확인. 99개 전체 이미지 연결. 기존 C01~C10 /clinics/Cxx.jpg 유지. C11~C99 /images/heybeauty/clinics/clinic-xx.webp. Higgsfield 미사용, 시드 버전12. 89개 WebP 합계2,181,862바이트.
- PR #14: 검색·필터·찜·같은 시술 비교 및 모바일 크기 수정. 사용자 병합 승인됨.
- 기능 커밋5598133: 클리닉/지역/시술 검색, 시술 분류·도시·동네·시작가예산·평점 필터, 가격/평점 정렬, 찜 저장, 최대3곳 공통 시술 비교. KO/EN/TH/ZH/RU 지원.
- 모바일 커밋3ab5b6a: 320px 로그인 줄바꿈, 홈 강제480px 최소높이로 입력창 밀림, 인박스 답장 버튼 가로 넘침 수정. 카드 여백/회사소개 제목/QR폭/44px 터치 버튼/비교창 안전영역 개선.
- 찜은 localStorage heybeauty.clinic-favorites.v1, 같은 브라우저에서 유지. 계정별 서버 찜은 아직 구현하지 않음. 비교 가격은 동일 시술 기본 가격이며 프로모션 별도. 기능 데이터/시드 변경 없음.
- 빌드·타입 검사 통과. 린트 오류0, 기존 partner/Panels.tsx 이미지 경고3건.
- scripts/verify-clinic-discovery.cjs: 교차 필터·번역 검색·찜·정렬·미등록가격·배열보존·공통시술·3곳제한·손상 저장값 검증.
- scripts/verify-clinic-images.cjs: 99개 이미지 및 이전 시드 마이그레이션 검증.
- 인앱 브라우저 320×568/390×844/430×844에서 고객 메뉴, 어드민6개, 파트너10개, 회사소개 검증. 320px 상세/프로모션/예약선택/데모QR/3곳 비교 추가 확인. 모든 데이터행의 모든 편집 상태까지 전수 검증한 것은 아님.

## 링크 및 복구

- 저장소: https://github.com/doyoung-doyoung/NEW-heybeauty
- PR: https://github.com/doyoung-doyoung/NEW-heybeauty/pull/14
- 운영: https://heybeauty-mvp.vercel.app
- Preview: https://heybeauty-mvp-git-codex-clinic-discovery-doyoung-s-projects.vercel.app (Vercel 로그인 보호)
- 모바일 수정만 복구하려면 새 수정 브랜치에서 3ab5b6a를 revert. 검색·필터·찜·비교만 복구하려면5598133을 검토. reset/force-push로 공유 이력을 지우지 않음.
- 마지막 승인 커밋 기반 빌드 검증 완료. 최종 병합/운영 배포 결과는 아래 상태란 참조.

## 다음 작업 우선순위 — 아직 미구현

1. 실제 iPhone Safari에서 작은 화면, 주소창 높이 변화, 키보드 입력, 표 첫 열 고정과 지도 핀치 확인. Chromium 폰 크기 검사만으로 Safari 검증 완료라고 하지 않음.
2. 기존 미완료 노트: 태국 전체 지도 확대/축소가 안 됨. 방콕 지도와 함께 두 손가락·버튼 확대를 확인하고 수정. 구글맵 vs OpenStreetMap 비교표도 남음.
3. UI·UX 제안: 고객과 관리 탭 구분, 카드·지도 내용을 가리는 오른쪽 노트 버튼 이동/관리모드 전용, 클리닉 목록 소개 영역을 줄여 첫 카드 빨리 노출, 상세 예약 버튼 동선 통일, 관리 표의 필수열/전체열 선택, 작은 통계 금액 말줄임 개선. 제안만 했으며 아직 새 디자인 승인은 없음. 기존 표는 유지(카드 목록으로 일괄 교체하지 않음).
4. 사용자가 다음 구현 대상을 정하면 별도 브랜치 → 폰 크기 전후 사진 → Preview → 승인 → 병합. 색상/탭 전체 숨김 등 미정 선택은 임의로 확정하지 않음.

## 앱 노트 — 추후 필요 / MVP 현재 미사용

기존 /api/notes를 통해 다음5개를 저장했으며 done=false입니다. 미구현 기능을 완료 처리하지 않습니다.
- 실제 LINE/Google 로그인, 계정별 서버 데이터, 역할별 권한
- 실제 예약 가능 시간, 입금 확인/클리닉 승인/확정, 변경/취소/알림
- 고객용 모바일 메뉴/노트 노출/겹침과 이중 스크롤 정리
- 실제 시설 사진·의사·위치·상담언어·정보 확인, 생성 사진 예시 표시와 교체
- 실제 AI 상담·추천·클리닉 상담·예약 연결

Production API GET /api/notes로 기존 노트도 함께 확인합니다. 로컬 및 Preview는 서버환경 설정 부족으로 노트/사진판독 기능이 제한될 수 있으므로 UI 검증과 운영 API 확인을 구분합니다. 비밀키를 문서/로그에 저장하지 않습니다.

## 사용자에게 설명한 Vercel Toolbar

Preview 검토용 메뉴. Esc로 닫기, Comment로 화면 위치에 수정 의견, Inbox로 의견 확인. 앱 기능 자체가 아니며 개발도구 메뉴에서 설정 변경할 필요 없음.

## 산출물 경로 (현재 사용자 컴퓨터)

C:/Users/user/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/outputs
- clinic-discovery-report.md /mobile-ui-audit.md /mobile-audit-measurements.json
- mobile-before-after.html: 같은320×568 viewport에서 촬영한 실제 전후 비교
- compare-home.jpg /compare-company.jpg /compare-inbox.jpg
- before-*-320.jpg /after-*-320.jpg

현재 로컬 저장소: C:/Users/user/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/work/NEW-heybeauty
임시 모바일 수정 전 복사본: work/mobile-before (5598133). 작업 시 실제 저장소와 혼동하지 않습니다. 임시 서버는 모두 종료했습니다.

## 최종 상태

- PR #14 병합 완료: 2026-10-05 19:15 (Asia/Bangkok)
- 병합 커밋: f498c547590b28e9a217d365e2319e7ebf6b7109
- 인계 메모 커밋249d689도 병합에 포함. 기능5598133/모바일3ab5b6a 이력 유지.
- 운영 배포 상태는 GitHub main의 Vercel 체크와 운영 주소로 시작 시 재확인.
- 내일 첫 작업: 이 문서 읽기 → git 상태/운영 배포 확인 → 앱 진행중 노트 확인 → iPhone 실기기 확인 결과 또는 사용자 선택에 따라 지도/모바일 UX 작업 시작.
