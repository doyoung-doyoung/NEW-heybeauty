import type { Booking, Customer, OpdChart, Treatment } from "./types";

const cards: NonNullable<Customer["identityCard"]>[] = [
  { image: "/idcards/IDC1.jpg", type: "태국 ID 카드", number: "0-1234-56789-01-7", name: "Miss Narisa Prasit", localName: "นางสาว นาริสา ประสิทธิ์", birthday: "1994-03-12", address: "128/45 ถนนสาธิต แขวงตัวอย่าง เขตทดสอบ กรุงเทพมหานคร 10240", issuedAt: "2024-02-15", expiresAt: "2032-03-11" },
  { image: "/idcards/IDC2.jpg", type: "태국 ID 카드", number: "0-9876-54321-09-3", name: "Mr. Somchai Boonma", localName: "นาย สมชาย บุญมา", birthday: "1988-11-02", address: "76/9 ถนนจำลอง ตำบลตัวอย่าง อำเภอทดสอบ เชียงใหม่ 50200", issuedAt: "2025-08-08", expiresAt: "2033-11-01" },
];
const additions = [
  ["Miss Narisa Prasit", "태국", "여"], ["Mr. Somchai Boonma", "태국", "남"],
  ["김민지", "한국", "여"], ["Pimchanok S.", "태국", "여"], ["Chen Mei", "중국", "여"],
  ["Suthat P.", "태국", "남"], ["Nattaya K.", "태국", "여"], ["Wang Lin", "중국", "여"],
  ["Tanaka Yui", "일본", "여"], ["Anan J.", "태국", "남"],
  ["Siriporn J.", "태국", "여"], ["Araya W.", "태국", "여"], ["Anna K.", "러시아", "여"], ["Lina Chen", "중국", "여"],
] as const;
const portraitTiles: Record<number, number> = { 1: 0, 2: 6, 3: 8, 4: 2, 5: 4, 7: 1, 8: 7, 9: 3, 10: 9, 11: 5, 12: 12, 13: 13, 14: 10, 15: 11 };
const documentDetails: Record<number, { type: string; number: string; name: string; localName: string }> = {
  16: { type: "태국 ID 카드", number: "0-3579-24680-03-6", name: "Miss Siriporn Jirawat", localName: "นางสาว ศิริพร จิรวัฒน์" },
  17: { type: "태국 ID 카드", number: "0-2468-13579-02-8", name: "Miss Araya Wongchai", localName: "นางสาว อารยา วงศ์ชัย" },
  18: { type: "러시아 여권", number: "759204618", name: "ANNA KUZNETSOVA", localName: "Анна Кузнецова" },
  19: { type: "중국 여권", number: "EJ8264195", name: "CHEN LINA", localName: "陈丽娜" },
};

export function addSiamCustomers(customers: Customer[], bookings: Booking[], charts: OpdChart[], treatments: Treatment[], nextDay: string, createdAt: string) {
  additions.forEach(([name, nationality, gender], i) => {
    const n = i + 6;
    customers.push({ id: `C01-B1-CU${n}`, clinicId: "C01", branchId: "C01-B1", name, nationality, gender,
      phone: `080000${String(n).padStart(4, "0")}`, birthday: `199${i % 9}-0${i % 8 + 1}-12`,
      channel: (["LINE", "Meta", "App"] as const)[i % 3], interests: [["화이트닝"], ["스킨부스터"], ["리프팅"], ["V라인"]][i % 4],
      doctorId: `C01-B1-D${i % 2 + 1}`, memo: "상담 완료. 방문 시 피부 상태를 확인합니다.", createdAt,
    });
  });
  customers.filter(c => c.branchId === "C01-B1").forEach(c => {
    const n = Number(c.id.split("CU")[1]);
    if (n <= 5) c.nationality = "태국";
    if (n === 2) c.name = "핌차녹 라따나";
    if (n === 3) c.gender = "여";
    if (n === 4) c.name = "아라야 분마";
    c.lineId = `siam_glow_${String(n).padStart(3, "0")}`;
    c.sourceDetail = c.channel === "LINE" ? "LINE · 공식 계정 상담" : c.channel === "Meta" ? "Meta · Instagram 광고" : "헤이뷰티 · 앱 예약";
    if (n <= 15) c.portrait = { src: n === 6 ? "/customers/narisa-portrait.jpg" : "/customers/clinic-portraits.jpg", ...(n === 6 ? {} : { tile: portraitTiles[n] }), capturedAt: "2026-10-06" };
    if (n === 6 || n === 7) {
      const card = cards[n - 6];
      c.identityCard = card;
      c.localName = card.localName;
      c.birthday = card.birthday;
      c.address = card.address;
    }
    if (n >= 16) {
      const details = documentDetails[n];
      c.localName = details.localName;
      c.address = `${120 + n}/8 Sukhumvit Road, Khlong Toei, Bangkok 10110`;
      c.identityCard = { ...details, image: "", birthday: c.birthday, address: c.address,
        issuedAt: "2024-04-18", expiresAt: "2034-04-17" };
    }
  });
  // 상세·목록·통계가 같은 차트에서 방문 수와 결제 합계를 계산한다.
  customers.filter(c => c.branchId === "C01-B1").forEach(c => {
    const n = Number(c.id.split("CU")[1]);
    const existing = charts.filter(chart => chart.customerId === c.id).length;
    const target = 1 + n % 4;
    for (let i = existing; i < target; i++) {
      const treatment = treatments.find(t => t.id === `C01-T${(n + i) % 4 + 1}`)!;
      const date = new Date(`${nextDay}T12:00:00+07:00`);
      date.setUTCDate(date.getUTCDate() - (5 + i * 7 + n % 3));
      const visitDate = date.toISOString().slice(0, 10);
      charts.push({ id: `${c.id}-HISTORY${i + 1}`, customerId: c.id, clinicId: c.clinicId, branchId: c.branchId,
        visitDate, doctorId: c.doctorId, staffId: "C01-B1-S1", treatmentNames: [treatment.name],
        usedProducts: [], comment: ["시술 완료. 자외선 차단 및 보습 관리 안내.", "피부 상태 확인 후 시술 진행. 2주 후 경과 확인 안내.", "시술 후 홍조 경미. 냉찜질 및 사후 관리 안내.", "통증 호소 없음. 다음 시술까지 4주 간격 권장."][(n + i) % 4], paidAmount: treatment.price });
      if (visitDate < c.createdAt.slice(0, 10)) c.createdAt = `${visitDate}T03:00:00.000Z`;
    }
    const firstVisit = charts.filter(chart => chart.customerId === c.id).map(chart => chart.visitDate).sort()[0];
    if (firstVisit < c.createdAt.slice(0, 10)) c.createdAt = `${firstVisit}T03:00:00.000Z`;
  });
  for (let i = 0; i < 10; i++) {
    const n = i + 6;
    const customer = customers.find(c => c.id === `C01-B1-CU${n}`)!;
    bookings.push({ id: `C01-B1-DETAIL-BK${i + 1}`, userId: customer.id, clinicId: "C01", branchId: "C01-B1", treatmentId: `C01-T${i % 4 + 1}`, doctorId: customer.doctorId,
      date: nextDay, time: `${String(10 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`, depositTHB: 1000, slipImage: null, status: "예약확정", usedReviewCode: null, createdAt,
    });
  }
}
