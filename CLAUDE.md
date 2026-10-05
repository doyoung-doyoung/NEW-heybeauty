# HeyBeauty — 작업 메모

## 세션 시작 시
- 최근 기록: `NOTES_LOG_2026-10-05.md` — 맨 아래 "아직 남은 것"부터 읽는다 (아이폰 확인 2건 · 지도 비교표 · 미정 2건).
- 홈은 클로드 앱 구조다: 채팅 먼저, 메뉴는 ☰ 서랍(`components/tabs/HomeTab.tsx`), 채팅은 `components/home/ChatView.tsx`.
- 사진 판독은 `/api/ocr` (모델 `claude-opus-5-5`). 키는 Production에만 있다.
- 노트 위젯 내용은 Supabase 프로젝트 `hdujouoaeqatrazrnlhn`의 `hb_notes` 테이블에 있다
  (`done=false`가 진행중). 작업 전에 같이 확인한다.

## 디자인 변경 규칙
- 바로 main에 넣지 않는다. 브랜치에 올려 Vercel 미리보기 주소 + 폰 크기 스크린샷을 먼저 보여 주고, 승인받은 뒤 머지한다.

## 노트 완료 규칙
- 노트 문장을 항목별로 쪼개서("모든 표" → 표 하나하나) 전부 반영된 것만 완료(`done=true`)로 체크한다.
- 폰 크기 화면에서 직접 눌러 확인한다. 도영님은 아이폰으로 보므로 사파리 기준 동작도 확인한다.
