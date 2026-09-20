import type { Booking, Customer, DemoDb } from "./types";

/**
 * 홈 탭에서 만들어진 앱 예약을 파트너 CRM의 고객 카드에 붙인다.
 *
 * 같은 지점에 이미 카드가 있으면(앱 유저 ID나 전화번호가 같으면) 그 카드를 재사용해
 * 관심 시술만 늘리고, 없으면 새 카드를 만든다. 예약 직후라 생년월일·성별·국적은
 * 아직 모르는 값이라 "미확인"으로 두고, 방문 때 ID카드 OCR로 채우는 흐름이다.
 * 스펙 §4-1 "방문 전: 채팅에서 정보 추출 → 고객정보 자동입력(경로/관심시술/예약방문일/의사)".
 *
 * db를 제자리에서 고치고 booking.customerId까지 채운 뒤 고객 카드를 돌려준다.
 */
export function linkBookingToCustomer(
  db: DemoDb,
  booking: Booking,
): Customer {
  const user = db.users.find((u) => u.id === booking.userId);
  const treatment = db.treatments.find((t) => t.id === booking.treatmentId);
  const interest = treatment?.category ?? "";
  const phone = user?.phone ?? "";

  const existing = db.customers.find(
    (c) =>
      c.branchId === booking.branchId &&
      ((c.appUserId !== null && c.appUserId === booking.userId) ||
        (phone !== "" && c.phone === phone)),
  );

  if (existing) {
    // 클리닉이 이미 알던 고객이 앱으로 예약한 경우. 카드를 새로 만들지 않고 이어붙인다.
    if (!existing.appUserId) existing.appUserId = booking.userId;
    if (interest && !existing.interests.includes(interest)) {
      existing.interests.push(interest);
    }
    if (!existing.doctorId) existing.doctorId = booking.doctorId;
    booking.customerId = existing.id;
    return existing;
  }

  const customer: Customer = {
    id: `CU-${booking.id}`,
    clinicId: booking.clinicId,
    branchId: booking.branchId,
    name: user?.name ?? "앱 예약 고객",
    phone,
    birthday: "",
    gender: "미확인",
    nationality: "미확인",
    channel: "App",
    interests: interest ? [interest] : [],
    doctorId: booking.doctorId,
    memo: `헤이뷰티 앱 예약으로 자동 등록 · ${booking.date} ${booking.time} ${
      treatment?.name ?? "시술 미정"
    }`,
    createdAt: booking.createdAt || new Date().toISOString(),
    appUserId: booking.userId,
  };

  db.customers.unshift(customer);
  booking.customerId = customer.id;
  return customer;
}
