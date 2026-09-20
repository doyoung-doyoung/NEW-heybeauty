export type LangCode = "ko" | "en" | "th" | "zh" | "ru" | "ar";

export const LANGS: { code: LangCode; label: string; comingSoon?: boolean }[] = [
  { code: "ko", label: "KO" },
  { code: "en", label: "EN" },
  { code: "th", label: "TH" },
  { code: "zh", label: "ZH" },
  { code: "ru", label: "RU" },
  { code: "ar", label: "AR", comingSoon: true },
];

type Entry = Partial<Record<LangCode, string>>;

// KO가 기준값. AR은 준비 중이라 전환되지 않고 KO로 떨어진다.
const DICT: Record<string, Entry> = {
  aiChat: { ko: "AI 채팅", en: "AI Chat", th: "แชท AI", zh: "AI 聊天", ru: "AI-чат" },
  clinics: { ko: "클리닉 둘러보기", en: "Browse Clinics", th: "ดูคลินิก", zh: "浏览诊所", ru: "Клиники" },
  myBookings: { ko: "내 예약", en: "My Bookings", th: "การจองของฉัน", zh: "我的预约", ru: "Мои записи" },
  writeReview: { ko: "후기 쓰기", en: "Write a Review", th: "เขียนรีวิว", zh: "写评价", ru: "Оставить отзыв" },
  newChat: { ko: "새 대화", en: "New Chat", th: "แชทใหม่", zh: "新对话", ru: "Новый чат" },
  book: { ko: "예약하기", en: "Book Now", th: "จองเลย", zh: "立即预约", ru: "Записаться" },
  price: { ko: "가격", en: "Price", th: "ราคา", zh: "价格", ru: "Цена" },
  promotion: { ko: "프로모션", en: "Promotion", th: "โปรโมชั่น", zh: "促销", ru: "Акция" },
  location: { ko: "위치", en: "Location", th: "ที่ตั้ง", zh: "位置", ru: "Адрес" },
  reviews: { ko: "후기", en: "Reviews", th: "รีวิว", zh: "评价", ru: "Отзывы" },
  doctors: { ko: "의료진", en: "Doctors", th: "แพทย์", zh: "医生", ru: "Врачи" },
  hours: { ko: "영업시간", en: "Hours", th: "เวลาทำการ", zh: "营业时间", ru: "Часы работы" },
  parking: { ko: "주차", en: "Parking", th: "ที่จอดรถ", zh: "停车", ru: "Парковка" },
  treatments: { ko: "시술", en: "Treatments", th: "หัตถการ", zh: "项目", ru: "Процедуры" },
  deposit: { ko: "예약금", en: "Deposit", th: "มัดจำ", zh: "定金", ru: "Депозит" },
  date: { ko: "날짜", en: "Date", th: "วันที่", zh: "日期", ru: "Дата" },
  time: { ko: "시간", en: "Time", th: "เวลา", zh: "时间", ru: "Время" },
  doctor: { ko: "의사", en: "Doctor", th: "แพทย์", zh: "医生", ru: "Врач" },
  send: { ko: "보내기", en: "Send", th: "ส่ง", zh: "发送", ru: "Отправить" },

  login: { ko: "LINE으로 로그인", en: "Log in with LINE", th: "เข้าสู่ระบบด้วย LINE", zh: "使用 LINE 登录", ru: "Войти через LINE" },
  loginDone: { ko: "LINE 계정으로 로그인했습니다", en: "Logged in with LINE", th: "เข้าสู่ระบบด้วย LINE แล้ว", zh: "已使用 LINE 登录", ru: "Вы вошли через LINE" },
  lineLinked: { ko: "LINE 연결됨", en: "LINE connected", th: "เชื่อมต่อ LINE แล้ว", zh: "已连接 LINE", ru: "LINE подключён" },
  notice: { ko: "공지사항", en: "Notices", th: "ประกาศ", zh: "公告", ru: "Объявления" },
  noticePopup: { ko: "공지 팝업", en: "Notice", th: "ประกาศ", zh: "公告", ru: "Объявление" },
  close: { ko: "닫기", en: "Close", th: "ปิด", zh: "关闭", ru: "Закрыть" },
  back: { ko: "목록으로", en: "Back to list", th: "กลับไปที่รายการ", zh: "返回列表", ru: "К списку" },
  all: { ko: "전체", en: "All", th: "ทั้งหมด", zh: "全部", ru: "Все" },
  branches: { ko: "지점", en: "Branches", th: "สาขา", zh: "分店", ru: "Филиалы" },
  contact: { ko: "연락처", en: "Contact", th: "ติดต่อ", zh: "联系方式", ru: "Контакты" },
  closedDay: { ko: "휴무", en: "Closed", th: "ปิด", zh: "休息", ru: "Выходной" },
  activePromos: { ko: "진행 중 프로모션", en: "Ongoing Promotions", th: "โปรโมชั่นที่กำลังดำเนินอยู่", zh: "进行中的促销", ru: "Текущие акции" },
  treatmentList: { ko: "시술 목록", en: "Treatment List", th: "รายการหัตถการ", zh: "项目列表", ru: "Список процедур" },
  noReviews: { ko: "아직 승인된 후기가 없습니다.", en: "No approved reviews yet.", th: "ยังไม่มีรีวิวที่อนุมัติ", zh: "暂无已审核的评价。", ru: "Пока нет одобренных отзывов." },
  reviewCount: { ko: "후기", en: "reviews", th: "รีวิว", zh: "条评价", ru: "отзывов" },
  reviewCode: { ko: "후기코드", en: "Review code", th: "โค้ดรีวิว", zh: "评价码", ru: "Код отзыва" },
  minutes: { ko: "분", en: "min", th: "นาที", zh: "分钟", ru: "мин" },
  clinicCount: { ko: "클리닉", en: "clinics", th: "คลินิก", zh: "家诊所", ru: "клиник" },
  fromPrice: { ko: "최저가", en: "From", th: "เริ่มต้น", zh: "起价", ru: "от" },
  noClinicInCategory: { ko: "이 카테고리의 클리닉이 없습니다.", en: "No clinics in this category.", th: "ไม่มีคลินิกในหมวดนี้", zh: "该分类下没有诊所。", ru: "Нет клиник в этой категории." },
  preparingTreatments: { ko: "시술 준비 중", en: "Treatments coming soon", th: "กำลังเตรียมหัตถการ", zh: "项目准备中", ru: "Процедуры готовятся" },

  catAll: { ko: "전체", en: "All", th: "ทั้งหมด", zh: "全部", ru: "Все" },
  "cat화이트닝": { ko: "화이트닝", en: "Whitening", th: "ไวท์เทนนิ่ง", zh: "美白", ru: "Отбеливание" },
  "catV라인": { ko: "V라인", en: "V-Line", th: "วีไลน์", zh: "V脸", ru: "V-линия" },
  "cat리프팅": { ko: "리프팅", en: "Lifting", th: "ยกกระชับ", zh: "提升", ru: "Лифтинг" },
  "cat스킨부스터": { ko: "스킨부스터", en: "Skin Booster", th: "สกินบูสเตอร์", zh: "水光针", ru: "Скинбустер" },
  "cat필러": { ko: "필러", en: "Filler", th: "ฟิลเลอร์", zh: "填充", ru: "Филлер" },

  catDescAll: { ko: "방콕 전 지역 제휴 클리닉을 한눈에 비교하세요.", en: "Compare every partner clinic across Bangkok at a glance.", th: "เปรียบเทียบคลินิกพันธมิตรทั่วกรุงเทพได้ในที่เดียว", zh: "一览曼谷所有合作诊所。", ru: "Сравните все клиники-партнёры Бангкока." },
  "catDesc화이트닝": { ko: "레이저 토닝·물광주사·글루타치온으로 톤을 단계적으로 밝힙니다.", en: "Laser toning, aqua shine and glutathione for step-by-step brightening.", th: "เลเซอร์โทนนิ่ง วอเตอร์ไชน์ และกลูตาไธโอน เพื่อผิวกระจ่างใสทีละขั้น", zh: "激光调色、水光针与谷胱甘肽，逐步提亮肤色。", ru: "Лазерный тонинг, аква-сияние и глутатион для поэтапного осветления." },
  "catDescV라인": { ko: "사각턱 보톡스와 턱 필러로 턱선 윤곽을 정리합니다.", en: "Masseter botox and chin filler to refine the jawline.", th: "โบท็อกซ์กรามและฟิลเลอร์คางเพื่อปรับรูปหน้า", zh: "咬肌瘦脸针与下巴填充，修饰下颌线条。", ru: "Ботокс жевательных мышц и филлер подбородка для контура." },
  "catDesc리프팅": { ko: "울쎄라·올리지오 RF로 처진 조직을 끌어올립니다.", en: "Ulthera and Oligio RF to lift sagging tissue.", th: "อัลเทอร่าและโอลิจิโอ RF ยกกระชับผิวที่หย่อนคล้อย", zh: "超声刀与 Oligio 射频，提拉松弛组织。", ru: "Ultherapy и Oligio RF для подтяжки тканей." },
  "catDesc스킨부스터": { ko: "리쥬란·엑소좀으로 피부결과 속건조를 개선합니다.", en: "Rejuran and exosomes to improve texture and inner dryness.", th: "รีจูรันและเอ็กโซโซมเพื่อผิวเรียบเนียนชุ่มชื้น", zh: "丽珠兰与外泌体，改善肤质与深层干燥。", ru: "Rejuran и экзосомы для текстуры и глубокого увлажнения." },
  "catDesc필러": { ko: "부족한 볼륨을 채워 얼굴 비율의 균형을 맞춥니다.", en: "Restore lost volume to balance facial proportions.", th: "เติมวอลลุ่มที่ขาดหายเพื่อสัดส่วนใบหน้าที่สมดุล", zh: "填补流失容积，平衡面部比例。", ru: "Восполнение объёма для баланса пропорций лица." },
};

export function t(key: keyof typeof DICT | string, lang: LangCode): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.ko ?? key;
}
