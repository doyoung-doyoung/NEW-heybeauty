import type { DemoDb } from "./types";
import { buildSeed, SEED_VERSION } from "./seed";
import { LEGACY_SUPPLIERS, supplierOf } from "./distributors";

type Row = { id: string };

// 시드 버전이 올라가도 저장된 데모 데이터를 통째로 버리지 않고 새 시드와 합친다.
// 저장본을 통째로 앞에 두고, 새 시드에만 있는 id를 뒤에 붙인다.
// 저장본을 우선하는 이유: 같은 id라도 어드민에서 올린 후기 사진이나 고쳐 둔 LINE ID처럼
// 사용자가 바꾼 값이 들어 있다. 순서까지 그대로 두는 이유: 공지·팝업은 unshift로 쌓아서
// 맨 앞이 최신이라, 재정렬하면 사용자가 만든 항목이 맨 뒤로 밀린다.
// 앱 어디에도 행을 지우는 코드가 없으므로 이 합치기가 지운 행을 되살릴 일은 없다.
export function migrate(saved: DemoDb | null): DemoDb {
  const fresh = buildSeed();
  if (!saved || typeof saved.version !== "number") return fresh;

  let result: DemoDb;
  if (saved.version === SEED_VERSION) {
    result = saved;
  } else {
    const merged: Record<string, unknown> = { ...fresh, version: SEED_VERSION };

    for (const [key, freshRows] of Object.entries(fresh)) {
      const savedRows = (saved as unknown as Record<string, unknown>)[key];
      if (!Array.isArray(freshRows) || !Array.isArray(savedRows)) continue;

      const savedIds = new Set((savedRows as Row[]).map((r) => r.id));
      merged[key] = [
        ...(savedRows as Row[]),
        ...(freshRows as Row[]).filter((r) => !savedIds.has(r.id)),
      ];
    }

    result = merged as unknown as DemoDb;
  }

  if (saved.version < 10) refreshV10(result, fresh);
  // 새 사진·신분증 필드는 기존에 사용자가 입력한 값을 보존하면서 채운다.
  if (saved.version < 13) {
    const freshCustomers = new Map(fresh.customers.map(c => [c.id, c]));
    result = { ...result, customers: result.customers.map(c => {
      const seed = freshCustomers.get(c.id);
      if (!seed || c.branchId !== "C01-B1") return c;
      return { ...c, lineId: c.lineId ?? seed.lineId, sourceDetail: c.sourceDetail ?? seed.sourceDetail,
        portrait: c.portrait ?? seed.portrait, identityCard: c.identityCard ?? seed.identityCard,
        localName: c.localName ?? seed.localName, address: c.address ?? seed.address };
    }) };
  }
  if (saved.version < 15) {
    const freshCustomers = new Map(fresh.customers.map(c => [c.id, c]));
    result = { ...result, customers: result.customers.map(c => {
      const seed = freshCustomers.get(c.id);
      if (!seed || c.branchId !== "C01-B1") return c;
      return { ...c, name: seed.name, nationality: seed.nationality, gender: seed.gender,
        portrait: seed.portrait, localName: seed.localName ?? c.localName,
        identityCard: seed.identityCard ?? c.identityCard, createdAt: c.createdAt < seed.createdAt ? c.createdAt : seed.createdAt };
    }) };
  }

  // v12 이미지 연결을 v15에서도 복구한다. 이전 로컬 CRM 시드(v13~14)에도 적용한다.
  // C11~C99의 빈 이미지와 파일 없는 이전 시드 JPG 경로를 새 사진에 연결한다.
  // 기존 열 곳과 사용자가 등록한 이미지는 덮어쓰지 않는다.
  if (saved.version < 15) {
    const freshClinics = new Map(fresh.clinics.map((c) => [c.id, c]));
    result = {
      ...result,
      clinics: result.clinics.map((c) => {
        if (!/^C(?:1[1-9]|[2-9]\d)$/.test(c.id)) return c;
        if (c.image && c.image !== `/clinics/${c.id}.jpg`) return c;
        const image = freshClinics.get(c.id)?.image;
        return image ? { ...c, image } : c;
      }),
    };
  }

  // 투자자 데모 지점(사얌 본점 · C01-B1)의 예약·차트는 "오늘" 기준으로 만들어지므로,
  // 저장본에 그대로 얼려 두면 날마다 과거로 밀려난다. 그래서 이 지점만은 매번 새로
  // 그린 값으로 갈아 끼운다 — 그날 클릭해 바꾼 상태(방문완료 등)는 새로고침하면
  // 초기화되지만, 그 대신 언제 열어도 "이번 주" 예약처럼 보인다.
  return {
    ...result,
    bookings: [
      ...result.bookings.filter((b) => b.branchId !== "C01-B1"),
      ...fresh.bookings.filter((b) => b.branchId === "C01-B1"),
    ],
    charts: [
      ...result.charts.filter((c) => c.branchId !== "C01-B1"),
      ...fresh.charts.filter((c) => c.branchId === "C01-B1"),
    ],
  };
}

/**
 * v10(2026-10-01): 채움용 클리닉 30곳을 지방 도시로 옮기고, 팝업·SMS 문구에서 "9월"을 뺐다.
 * 위의 합치기는 저장본을 우선하니 그대로 두면 예전 이름·주소가 남는다.
 * 손으로 쓴 10곳(C01~C10)은 사용자가 고쳤을 수 있으니 건드리지 않고,
 * 채움용(C11~)의 이름·동네·주소·연락처만 새 시드 값으로 덮어쓴다.
 */
function refreshV10(db: DemoDb, fresh: DemoDb) {
  const isFiller = (clinicId: string) => Number(clinicId.slice(1)) > 10;

  const freshClinic = new Map(fresh.clinics.map((c) => [c.id, c]));
  db.clinics = db.clinics.map((c) => {
    const f = freshClinic.get(c.id);
    if (!f || !isFiller(c.id)) return c;
    return { ...c, name: f.name, district: f.district, address: f.address, phone: f.phone, lineId: f.lineId, intro: f.intro };
  });

  const freshBranch = new Map(fresh.branches.map((b) => [b.id, b]));
  db.branches = db.branches.map((b) => {
    const f = freshBranch.get(b.id);
    if (!f || !isFiller(b.clinicId)) return b;
    return { ...b, name: f.name, address: f.address, phone: f.phone };
  });

  const freshAccount = new Map(fresh.accounts.map((a) => [a.id, a]));
  db.accounts = db.accounts.map((a) => {
    const f = freshAccount.get(a.id);
    return f && a.kind === "clinic" && a.label !== f.label ? { ...a, label: f.label } : a;
  });

  // 시드가 만든 팝업만 새 광고 이미지·제목으로 바꾼다. 어드민에서 만든 팝업은 그대로.
  const freshPopup = fresh.popups.find((p) => p.id === "PP1");
  db.popups = db.popups.map((p) =>
    p.id === "PP1" && freshPopup ? { ...p, title: freshPopup.title, body: freshPopup.body, image: freshPopup.image } : p,
  );

  db.smsLogs = db.smsLogs.map((m) =>
    m.text.includes("9월 화이트닝") ? { ...m, text: m.text.replace("9월 화이트닝", "화이트닝") } : m,
  );

  db.inventory = db.inventory.map((i) =>
    LEGACY_SUPPLIERS.includes(i.supplier) ? { ...i, supplier: supplierOf(i.productId) } : i,
  );

  // 제품 목록은 시드가 정답이다(소모품 5종 추가). 어드민에서 추가한 제품은 뒤에 남긴다.
  const freshIds = new Set(fresh.products.map((p) => p.id));
  db.products = [...fresh.products, ...db.products.filter((p) => !freshIds.has(p.id))];
}
