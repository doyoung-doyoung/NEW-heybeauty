# 만들어야 할 이미지 목록

Hey! Beauty 데모에 넣을 사진 정리. 만든 뒤 아래 "저장 위치"에 넣으면 코드에 연결된다.
(2026-09-20 코드 전체 대조 완료 — 이 문서의 프롬프트는 다른 이미지 생성 AI에 그대로 복붙해서 쓰면 된다)

## 한눈에 보기

| # | 무엇 | 남은 장수 | 크기 (px) | 저장 위치 | 코드 |
|---|---|---|---|---|---|
| A | 클리닉 사진 C08~C10 | **3장** | 1200 × 675 (16:9 가로) | `public/clinics/` | **연결됨 · 파일만 넣으면 끝** |
| B | 송금 슬립 (PromptPay) | **3장** | 600 × 900 (2:3 세로) | `public/slips/` | 코드 수정 필요 (내가 해줄 수 있음) |
| C | 태국 신분증 데모 | **2장** | 800 × 500 (1.6:1 가로) | `public/idcards/` | 코드 수정 필요 |
| D | 제품 박스 촬영 샘플 | **3장** | 800 × 800 (정사각) | `public/boxlabels/` | 코드 수정 필요 |
| E | 화면 캡처 샘플 | **3장** | 800 × 1200 (2:3 세로) | `public/captures/` | 코드 수정 필요 |
| F | 공유용 썸네일(OG) | **1장** | 1200 × 630 | `public/` | 코드 수정 필요 (3줄) |

**이미 끝난 것 (건드릴 필요 없음)**

| 무엇 | 장수 | 위치 |
|---|---|---|
| 후기 사진 | 4장 (RV1-1·2, RV2-1·2) | `public/reviews/` |
| 팝업 이미지 | 2장 (PP1, PP2) | `public/popups/` |
| 클리닉 사진 C01~C07 | 7장 | `public/clinics/` |
| 제품 박스 카탈로그 | 22장 (P01~P22) | `public/products/` |

> **우선순위:** A(3장)만 넣어도 화면은 완성된 것처럼 보인다.
> B~E는 지금 CSS로 그린 가짜 카드가 떠 있고 그것도 꽤 그럴듯해서 급하지 않다.
> F는 투자자에게 링크를 보낼 때 카톡·라인 미리보기에 뜨는 그림이라, 배포 직전에 하면 된다.

---

## 0. 모든 이미지에 공통으로 넣을 규칙

### 브랜드 톤 (Hey! Beauty)

- **한 줄 요약:** 방콕의 고급 뷰티 클리닉. 핑크 글래스모피즘. 밝고, 깨끗하고, 비싸 보이게.
- **색** (실제 코드값)
  - 배경 핑크 `#FDF2F5` → `#F5B8C4` → `#D97C93` (연 → 진)
  - 포인트 핑크 `#F09AAE`
  - 글자/선 먹색 `#353839`, 보조 `#495057`
  - 흰 카드 `#FFFFFF` / `#F6F6F6`
- **분위기 단어:** soft blush pink, warm cream, rose gold, white marble, glass, natural daylight,
  minimal, airy, premium, clean — **차갑고 병원스러운 형광등 느낌은 피할 것.**
- **참고 폰트 느낌:** Pretendard (한국어 고딕). 이미지 안에는 글씨를 안 넣는 게 원칙.

### 어떤 이미지든 반드시 지킬 것

1. **사람 얼굴 금지** — 초상권. 손, 뒷모습, 어깨 아래는 괜찮다.
2. **실제 브랜드·로고·간판 글씨 금지** — 상표 문제. 가상 이름만.
3. **화면에서 위아래가 잘린다** — 중요한 피사체는 **상하좌우 한가운데**에.
4. **글씨 넣지 말 것** (B·C·D·E는 예외 — 대신 전부 가짜 정보 + `DEMO` 워터마크)
5. **jpg**, 한 장 **500KB 이하**, 파일명에 한글·띄어쓰기 금지.
   (배경이 투명해야 하는 것만 png)

### 생성 후 규격 맞추기 (맥 기본 명령)

```bash
# 예: 1344×752로 나온 그림을 1200×675로
sips -s format jpeg -s formatOptions 82 -z 675 1207 입력.png --out C08.jpg
sips -c 675 1200 C08.jpg          # 가운데 기준으로 잘라냄

# 용량 확인 (500KB 넘으면 formatOptions를 70~75로 낮춰 다시)
ls -lh C08.jpg
```

---

## A. 클리닉 사진 C08 · C09 · C10 — 3장 (가장 급함)

- **크기:** 1200 × 675 (16:9)
- **저장:** `public/clinics/C08.jpg`, `C09.jpg`, `C10.jpg`
- **파일명 그대로, 확장자 반드시 `.jpg`** — `lib/seed.ts`가 이 이름으로 찾는다. 코드 수정 불필요.
- **화면에 뜨는 크기:** 목록 카드 높이 **144px**, 상세 화면 **192px**(큰 화면 240px)
  → 가로로 납작하게 잘리니 **간판·인테리어 포인트는 한가운데**.

이미 만든 7장과 겹치지 않게 (C01 로즈골드 리셉션 / C02 크림 대리석 / C03 올화이트 랩 /
C04 원목+유리 외관 / C05 오크 상담실 / C06 고층 시티뷰 / C07 아치 도어 우드).

| 파일 | 클리닉 | 동네 | 콘셉트 |
|---|---|---|---|
| `C08.jpg` | 에까마이 오라 클리닉 | 에까마이 | 모던 로프트 — 노출 콘크리트 + 블랙 스틸 + 핑크 네온 사인(글씨 없는 선 모양) |
| `C09.jpg` | 라차다 퓨어덤 | 라차다 | 넓은 대기실 — 베이지 벨벳 소파 여러 개, 큰 창, 화분 |
| `C10.jpg` | 차이나타운 벨르 | 차이나타운 | 오래된 샵하우스 개조 — 아치 창문, 테라조 바닥, 따뜻한 황동 조명 |

### 복붙용 프롬프트 (영어)

> **C08**
> `Interior photo of a modern loft-style beauty clinic reception in Bangkok. Exposed concrete walls, black steel frames, soft blush pink accent lighting, a pale pink neon strip shaped as a simple curved line (no letters, no text). Polished concrete floor, one large monstera plant, warm daylight from a tall window. Editorial interior photography, 16:9, centered composition, no people, no faces, no text, no signage, no logos. Keep the main subject dead center because the top and bottom will be cropped.`

> **C09**
> `Interior photo of a spacious, bright waiting lounge in an upscale Bangkok skin clinic. Several beige velvet sofas, round marble side tables, floor-to-ceiling windows with sheer curtains, large green plants, warm cream and soft pink palette, natural daylight. Editorial interior photography, 16:9, centered composition, no people, no faces, no text, no signage, no logos. Keep the main subject dead center because the top and bottom will be cropped.`

> **C10**
> `Interior photo of a beauty clinic built inside a renovated old Chinatown shophouse in Bangkok. Tall arched windows, terrazzo floor, warm brass pendant lights, white plaster walls with soft pink accents, vintage-meets-modern minimal furniture, warm afternoon light. Editorial interior photography, 16:9, centered composition, no people, no faces, no text, no signage, no logos. Keep the main subject dead center because the top and bottom will be cropped.`

### 넣은 뒤 확인

```bash
# 세 장이 서로 다른 그림인지 (예전에 배열 인덱스 밀려서 같은 사진이 들어간 적 있음)
shasum public/clinics/*.jpg | awk '{print $1}' | sort -u | wc -l   # 10 이 나와야 정상
```

---

## B. 송금 슬립 3장 — PromptPay 이체 완료 화면

- **크기:** 600 × 900 (2:3 세로) · **저장:** `public/slips/SLIP1.jpg` ~ `SLIP3.jpg`
- **화면에 뜨는 크기:** 채팅 말풍선 안 **가로 208px**, 슬립 고르는 칸은 3칸 그리드
- **지금 상태:** `components/home/DemoAssets.tsx`의 `SlipImage`가 CSS로 그린 가짜 영수증.
  진짜 사진으로 바꾸려면 그 컴포넌트를 `<img>`로 바꿔야 한다 → **말해주면 내가 수정한다.**

**반드시:** 실제 은행(SCB·Kasikorn·Bangkok Bank 등) 로고·색·UI를 따라 하지 말 것.
가상 은행 **"HeyBank"** / **"DemoPay"**, 금액은 **฿1,000.00**, 큼직한 `DEMO` 워터마크.

| 파일 | 은행 | 받는 곳 | 참조번호 |
|---|---|---|---|
| `SLIP1.jpg` | HeyBank | SIAM GLOW CLINIC | HB2609170001 |
| `SLIP2.jpg` | HeyBank | BANGKOK LUMIERE | HB2609170002 |
| `SLIP3.jpg` | DemoPay Wallet | ASOKE SKINLAB | DP2609170003 |

> `Vertical mobile banking transfer-success screenshot, fictional bank named "HeyBank", clean minimal white UI with soft pink accent (#F09AAE) and dark grey text. Large green check mark at top, amount "฿ 1,000.00" in bold, rows reading From "DODO J.", To "SIAM GLOW CLINIC", Ref "HB2609170001", Date "17 Sep 2026 10:24". A large light-grey diagonal watermark reading "DEMO" across the middle. Flat UI illustration, 2:3 portrait, no real bank logos or brand names, no photorealistic bank branding.`
>
> (SLIP2·SLIP3는 받는 곳·참조번호·은행 이름만 위 표대로 바꿔서 같은 프롬프트로)

---

## C. 태국 신분증 데모 2장

- **크기:** 800 × 500 (신용카드 비율) · **저장:** `public/idcards/IDC1.jpg`, `IDC2.jpg`
- **어디서 쓰나:** 파트너 CRM → AI 입력 → 사진 찍기 → "데모 샘플 · ID 카드"
  (방문 고객 신분증을 찍으면 고객정보가 자동 입력되는 시연)
- **지금 상태:** `DemoAssets.tsx`의 `IdCardImage`가 CSS로 그린 카드. 교체 시 코드 수정 필요.

**반드시:** 실제 태국 정부 신분증 디자인·국장·홀로그램·보안요소를 흉내 내지 말 것.
한눈에 **샘플**로 보이게 — 큼직한 `DEMO / SAMPLE - NOT A REAL ID` 문구, 사진 칸은 회색 실루엣,
번호는 전부 0. (이미지 AI가 "신분증"이라고 거절하면 *"fictional membership card mockup"*으로 바꿔 부르면 통과한다)

| 파일 | 이름 | 태국어 | 번호 | 생년월일 |
|---|---|---|---|---|
| `IDC1.jpg` | NARISA PRASIT | นาริสา ประสิทธิ์ | 0-0000-00000-00-0 | 1994-03-12 |
| `IDC2.jpg` | SOMCHAI BOONMA | สมชาย บุญมา | 0-0000-00000-11-0 | 1988-11-02 |

> `Flat mockup of a fictional sample ID card for a software demo, clearly fake. Light pink-to-white gradient background, rounded corners, grey silhouette placeholder where a photo would be, printed lines: "DEMO ID CARD", name "NARISA PRASIT", Thai name "นาริสา ประสิทธิ์", "ID 0-0000-00000-00-0", "DOB 1994-03-12". Bold light-grey diagonal watermark "DEMO - NOT A REAL ID" across the card. Minimal flat vector illustration, 1.6:1, no government emblems, no holograms, no security features, not resembling any real national identity document.`

---

## D. 제품 박스 촬영 샘플 3장

- **크기:** 800 × 800 (정사각) · **저장:** `public/boxlabels/BOX1.jpg` ~ `BOX3.jpg`
- **어디서 쓰나:** 파트너 CRM → AI 입력 → 사진 찍기 → "데모 샘플 · 제품 박스"
  (재고 담당자가 **책상 위 박스를 폰으로 찍은** 느낌이어야 한다. `public/products/`의
  깔끔한 카탈로그 컷 22장과는 성격이 다르다 — 그건 흰 배경 제품샷, 이건 현장 사진)
- **지금 상태:** `DemoAssets.tsx`의 `BoxLabelImage`가 CSS로 그린 라벨. 교체 시 코드 수정 필요.

**반드시:** 실제 제품 브랜드 로고·패키지 디자인을 그대로 따라 하지 말 것.
글씨는 **라벨 부분만** 또렷하게 (OCR로 읽는 시연이라 이 글자가 핵심).

| 파일 | 라벨에 들어갈 글자 |
|---|---|
| `BOX1.jpg` | `Rejuran` / `VOL 2ml` / `LOT48211` / `EXP 2027-03` |
| `BOX2.jpg` | `Nabota 100U` / `VOL 100U` / `LOT77120` / `EXP 2027-08` |
| `BOX3.jpg` | `Juvederm Volite` / `VOL 1ml` / `LOT30945` / `EXP 2028-01` |

> `Top-down photo of a small white medical product box lying on a light wood clinic desk, shot casually with a phone, soft natural daylight, slight shadow. The box has a plain minimal white label with small crisp printed text: "Rejuran", "VOL 2ml", "LOT48211", "EXP 2027-03", plus a small barcode. Generic unbranded packaging, no real company logo, no brand design. A faint light-grey "DEMO" watermark in a corner. Square 1:1, box centered and filling most of the frame, label fully readable, no people, no faces.`

---

## E. 화면 캡처 샘플 3장 (선택)

- **크기:** 800 × 1200 (폰 스크린샷 비율) · **저장:** `public/captures/CAP1.jpg` ~ `CAP3.jpg`
- **어디서 쓰나:** 파트너 CRM → AI 입력 → 사진 찍기 → "캡처 화면"
  (클리닉이 **쓰던 페이스북·기존 CRM·LINE 대화를 캡처해서 넘기면** 정보가 옮겨지는 시연)
- **지금 상태:** 이미지 없이 **글자 버튼 3개**만 있다. 이미지를 넣으려면 코드 수정 필요.

**반드시:** 페이스북·LINE의 **실제 UI·로고·색을 그대로 베끼지 말 것.**
"그 비슷한 일반적인 SNS/메신저 화면"으로.

| 파일 | 내용 | 화면에 보일 글자 |
|---|---|---|
| `CAP1.jpg` | 클리닉 SNS 페이지 캡처 | 사얌 글로우 클리닉 / 월-토 10:00-20:00, 일 휴무 / Siam Demo Rd. 00, Bangkok / 02-327-1719 / 건물 주차장 2시간 무료 |
| `CAP2.jpg` | 기존 CRM 시술 목록 | 레이저 토닝 30분 ฿2,200 / 리쥬란 스킨부스터 45분 ฿9,800 / 물광주사 40분 ฿8,000 / 사각턱 보톡스 20분 ฿4,800 |
| `CAP3.jpg` | 메신저 상담 대화 | 화이트닝(레이저 토닝) 문의, 9/22 오후 희망, 나린 원장 희망 — 초록 말풍선 대화 |

> `Vertical phone screenshot mockup of a generic social page for a beauty clinic, plain light UI, no real platform branding. Header shows "사얌 글로우 클리닉", below it lines: "월-토 10:00-20:00 / 일 휴무", "Siam Demo Rd. 00, Bangkok", "02-327-1719", "건물 주차장 2시간 무료". Clean flat UI illustration, soft pink and grey palette, small "DEMO" watermark, 2:3 portrait, Korean text rendered accurately, no logos of real companies.`

⚠️ 한글이 들어가는 이미지는 AI가 글자를 자주 망가뜨린다. **글자가 깨지면 차라리 지금처럼
글자 버튼만 두는 게 낫다** — 이 항목은 우선순위 가장 낮음.

---

## F. 공유용 썸네일 (OG 이미지) — 1장, 배포 직전

- **크기:** 1200 × 630 · **저장:** `public/og.jpg`
- **어디서 쓰나:** 데모 링크를 카톡·라인·슬랙에 붙였을 때 뜨는 미리보기 그림.
  지금은 설정이 없어서 **아무 그림도 안 뜬다.** `app/layout.tsx`에 3줄 추가하면 연결된다.
- 여기엔 **글씨를 넣어도 된다** (유일한 예외). 다만 `Hey! Beauty` 정도만 크게.

> `Wide 1200x630 title card for a beauty-tech demo. Soft blush pink gradient background (#FDF2F5 to #D97C93) with a glassmorphism card floating in the center, subtle white blur and thin light border. Large clean sans-serif wordmark "Hey! Beauty" in dark charcoal (#353839) centered on the card, one small line beneath it. Minimal, premium, lots of empty space, no photos, no people, no extra text.`

---

## 만든 다음에 할 일

1. 파일을 위 표의 **저장 위치**에 그 **파일명 그대로** 넣는다.
2. **A(클리닉)는 여기서 끝.** 새로고침하면 바로 보인다.
3. **B·C·D·E·F는 코드 한 번 손봐야 한다** — 파일 넣고 "이미지 넣었어, 연결해줘" 하면 내가 붙인다.
4. GitHub에 올리면 1분 뒤 배포 사이트에 자동 반영.

### 주의 — 데이터 버전 (`SEED_VERSION`)

데모 데이터는 브라우저에 저장돼 있고, `lib/seed.ts`의 `SEED_VERSION` 숫자가 바뀔 때만 새로
불러온다. **`lib/seed.ts`의 데이터 내용을 고쳤다면 이 숫자도 같이 올려야 한다.**
(후기·팝업 경로 연결로 2 → 3, 팝업 기본 이미지 교체로 3 → 4,
예약 → 고객 카드 연결로 4 → 5. **클리닉 사진은 코드를 안 건드리니 올릴 필요 없다.**)

## 파일 형식 참고

- **사진은 `.jpg`**, 로고처럼 배경이 투명해야 하면 `.png`
- 한 장 **500KB 이하** 권장 (너무 크면 폰에서 느리게 뜸)
- 파일명에 한글·띄어쓰기 금지
