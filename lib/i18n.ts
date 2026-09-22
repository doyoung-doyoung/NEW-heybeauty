"use client";

import { createContext, useContext } from "react";
import { CONTENT, CONTENT_PATTERNS } from "./i18n-content";

export type LangCode = "ko" | "en" | "th" | "zh" | "ru" | "ar";

export const LANGS: { code: LangCode; label: string; comingSoon?: boolean }[] = [
  { code: "ko", label: "KO" },
  { code: "en", label: "EN" },
  { code: "th", label: "TH" },
  { code: "zh", label: "ZH" },
  { code: "ru", label: "RU" },
  { code: "ar", label: "AR", comingSoon: true },
];

export type Entry = Partial<Record<LangCode, string>>;

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

  detail: { ko: "자세히 보기", en: "View details", th: "ดูรายละเอียด", zh: "查看详情", ru: "Подробнее" },
  goBack: { ko: "뒤로", en: "Back", th: "ย้อนกลับ", zh: "返回", ru: "Назад" },
  goHome: { ko: "홈으로", en: "Home", th: "หน้าแรก", zh: "返回首页", ru: "На главную" },
  optional: { ko: "선택", en: "optional", th: "ไม่บังคับ", zh: "选填", ru: "необязательно" },

  chatTitle: { ko: "어떤 고민이 있으세요?", en: "What's on your mind?", th: "คุณกังวลเรื่องอะไรอยู่", zh: "您有什么困扰？", ru: "Что вас беспокоит?" },
  chatSubtitle: { ko: "아래 질문을 눌러 바로 상담을 시작할 수 있어요.", en: "Tap a question below to start the consultation right away.", th: "แตะคำถามด้านล่างเพื่อเริ่มปรึกษาได้ทันที", zh: "点击下方问题即可立即开始咨询。", ru: "Нажмите на вопрос ниже, чтобы начать консультацию." },
  chatPlaceholder: { ko: "궁금한 시술을 물어보세요", en: "Ask about any treatment", th: "สอบถามเกี่ยวกับหัตถการที่สนใจ", zh: "询问您想了解的项目", ru: "Спросите о любой процедуре" },
  bookShort: { ko: "예약 →", en: "Book →", th: "จอง →", zh: "预约 →", ru: "Запись →" },
  chatEnded: { ko: "클리닉 상담을 종료했습니다", en: "Clinic chat ended", th: "จบการสนทนากับคลินิกแล้ว", zh: "已结束诊所咨询", ru: "Чат с клиникой завершён" },

  clinicFallback: { ko: "클리닉", en: "Clinic", th: "คลินิก", zh: "诊所", ru: "Клиника" },
  replyTime: { ko: "보통 5분 내 답변", en: "Usually replies within 5 minutes", th: "ตอบกลับภายใน 5 นาทีโดยเฉลี่ย", zh: "通常 5 分钟内回复", ru: "Обычно отвечает в течение 5 минут" },
  endChat: { ko: "종료하기", en: "End chat", th: "จบการสนทนา", zh: "结束对话", ru: "Завершить" },
  msgPlaceholder: { ko: "메시지를 입력하세요", en: "Type a message", th: "พิมพ์ข้อความ", zh: "请输入消息", ru: "Введите сообщение" },

  branch: { ko: "지점", en: "Branch", th: "สาขา", zh: "分店", ru: "Филиал" },
  attendingDoctor: { ko: "담당 의사", en: "Doctor in charge", th: "แพทย์ผู้ดูแล", zh: "主诊医生", ru: "Лечащий врач" },
  codeFromFriend: { ko: "친구에게 받은 코드 · 예: HB-7K2M", en: "Code from a friend · e.g. HB-7K2M", th: "โค้ดจากเพื่อน · เช่น HB-7K2M", zh: "朋友分享的码 · 例：HB-7K2M", ru: "Код от друга · напр. HB-7K2M" },
  codeNotFound: { ko: "일치하는 후기코드가 없습니다", en: "No matching review code", th: "ไม่พบโค้ดรีวิวที่ตรงกัน", zh: "找不到匹配的评价码", ru: "Совпадающий код отзыва не найден" },
  codeIsMine: { ko: "내가 받은 코드는 쓸 수 없어요", en: "You can't use your own code", th: "ใช้โค้ดของตัวเองไม่ได้", zh: "不能使用自己的评价码", ru: "Нельзя использовать собственный код" },
  codeNotApproved: { ko: "아직 승인되지 않은 후기의 코드입니다", en: "This code's review isn't approved yet", th: "รีวิวของโค้ดนี้ยังไม่ได้รับการอนุมัติ", zh: "该码对应的评价尚未审核", ru: "Отзыв по этому коду ещё не одобрен" },
  confirmed: { ko: "확인됨", en: "Confirmed", th: "ยืนยันแล้ว", zh: "已确认", ru: "Подтверждено" },
  codeOwnerEarns: { ko: "{0}님에게 ฿{1} 적립", en: "{0} earns ฿{1}", th: "{0} จะได้รับ ฿{1}", zh: "{0} 将获得 ฿{1}", ru: "{0} получит ฿{1}" },
  codeApplied: { ko: "송금이 확인되었습니다 · 후기코드 {0} 적용", en: "Transfer confirmed · review code {0} applied", th: "ยืนยันการโอนแล้ว · ใช้โค้ดรีวิว {0}", zh: "转账已确认 · 已使用评价码 {0}", ru: "Перевод подтверждён · код отзыва {0} применён" },
  transferConfirmed: { ko: "송금이 확인되었습니다", en: "Transfer confirmed", th: "ยืนยันการโอนแล้ว", zh: "转账已确认", ru: "Перевод подтверждён" },
  depositNotice: { ko: "예약금 ฿{0}은 시술 금액에서 차감됩니다. 방문 24시간 전까지 취소 시 전액 환불되며, 이후 취소 또는 미방문 시 예약금은 환불되지 않습니다.", en: "The ฿{0} deposit is deducted from the treatment price. Cancel at least 24 hours before your visit for a full refund; later cancellations and no-shows are non-refundable.", th: "มัดจำ ฿{0} จะถูกหักจากค่าหัตถการ ยกเลิกก่อนเข้ารับบริการอย่างน้อย 24 ชั่วโมงคืนเงินเต็มจำนวน หากยกเลิกภายหลังหรือไม่มาตามนัดจะไม่คืนเงิน", zh: "฿{0} 定金将从项目费用中扣除。到店前 24 小时以上取消可全额退款，之后取消或未到店则不予退还。", ru: "Депозит ฿{0} вычитается из стоимости процедуры. Полный возврат при отмене не позднее чем за 24 часа до визита; позже — без возврата." },
  payDeposit: { ko: "예약금 ฿{0} 결제하기", en: "Pay ฿{0} deposit", th: "ชำระมัดจำ ฿{0}", zh: "支付 ฿{0} 定金", ru: "Оплатить депозит ฿{0}" },
  scanQr: { ko: "QR을 스캔해 ฿{0}을 송금해주세요", en: "Scan the QR and transfer ฿{0}", th: "สแกน QR แล้วโอน ฿{0}", zh: "扫描二维码并转账 ฿{0}", ru: "Отсканируйте QR и переведите ฿{0}" },
  demoQr: { ko: "DEMO QR · 실제 결제 아님", en: "DEMO QR · not a real payment", th: "QR สาธิต · ไม่ใช่การชำระเงินจริง", zh: "演示二维码 · 非真实付款", ru: "DEMO QR · не настоящий платёж" },
  sentAttachSlip: { ko: "송금했어요 · 슬립 첨부하기", en: "I've transferred · attach slip", th: "โอนแล้ว · แนบสลิป", zh: "已转账 · 上传凭证", ru: "Перевёл · прикрепить чек" },
  chatWithClinicTitle: { ko: "{0}과의 채팅", en: "Chat with {0}", th: "แชทกับ {0}", zh: "与 {0} 的对话", ru: "Чат с {0}" },
  slipHint: { ko: "송금 슬립을 첨부하면 클리닉이 확인합니다.", en: "Attach your transfer slip and the clinic will verify it.", th: "แนบสลิปการโอนแล้วคลินิกจะตรวจสอบให้", zh: "上传转账凭证后，诊所会进行核对。", ru: "Прикрепите чек — клиника проверит перевод." },
  slipGreeting: { ko: "안녕하세요! 예약금 송금 후 슬립을 보내주시면 바로 확인해 드릴게요.", en: "Hello! Send us the slip after transferring the deposit and we'll confirm right away.", th: "สวัสดีค่ะ! โอนมัดจำแล้วส่งสลิปมาได้เลย เราจะตรวจสอบให้ทันที", zh: "您好！转账定金后发送凭证给我们，我们会立即确认。", ru: "Здравствуйте! Пришлите чек после перевода депозита — мы сразу подтвердим." },
  attachImage: { ko: "이미지 첨부", en: "Attach image", th: "แนบรูปภาพ", zh: "添加图片", ru: "Прикрепить фото" },
  savedImages: { ko: "저장된 이미지", en: "Saved images", th: "รูปภาพที่บันทึกไว้", zh: "已保存的图片", ru: "Сохранённые изображения" },
  transferDone: { ko: "송금 확인 완료", en: "Transfer verified", th: "ตรวจสอบการโอนเรียบร้อย", zh: "转账核对完成", ru: "Перевод подтверждён" },
  chatWithClinic: { ko: "클리닉과 채팅하기", en: "Chat with the clinic", th: "แชทกับคลินิก", zh: "与诊所聊天", ru: "Чат с клиникой" },

  crmLinkedTitle: { ko: "{0} 파트너 CRM에 자동 연동되었습니다", en: "Automatically synced to {0}'s partner CRM", th: "เชื่อมต่อกับ CRM ของ {0} อัตโนมัติแล้ว", zh: "已自动同步至{0}的合作伙伴 CRM", ru: "Автоматически передано в партнёрскую CRM {0}" },
  crmLinkedBooking: { ko: "예약 관리 · {0} {1} 예약 확정", en: "Bookings · {0} {1} confirmed", th: "การจอง · ยืนยัน {0} {1}", zh: "预约管理 · {0} {1} 已确认", ru: "Записи · {0} {1} подтверждено" },
  crmLinkedCustomerNew: { ko: "고객 관리 · {0}님 고객 카드 생성", en: "Customers · new card created for {0}", th: "ลูกค้า · สร้างข้อมูลลูกค้าของคุณ{0}", zh: "客户管理 · 已为{0}创建客户卡", ru: "Клиенты · создана карточка для {0}" },
  crmLinkedCustomerUpdate: { ko: "고객 관리 · {0}님 고객 카드 갱신", en: "Customers · card updated for {0}", th: "ลูกค้า · อัปเดตข้อมูลลูกค้าของคุณ{0}", zh: "客户管理 · 已更新{0}的客户卡", ru: "Клиенты · карточка {0} обновлена" },
  crmLinkedInbox: { ko: "통합 인박스 · 새 문의 스레드 생성", en: "Unified inbox · new conversation created", th: "กล่องข้อความรวม · สร้างแชทใหม่แล้ว", zh: "统一收件箱 · 已创建新会话", ru: "Общий инбокс · создан новый диалог" },
  crmLinkedCommission: { ko: "커미션 정산 · {0}님에게 ฿{1} 적립", en: "Commissions · {0} earns ฿{1}", th: "ค่าคอมมิชชัน · {0} ได้รับ ฿{1}", zh: "佣金结算 · {0} 获得 ฿{1}", ru: "Комиссии · {0} получает ฿{1}" },
  crmLinkedHint: { ko: "예약 한 번으로 {0}곳이 동시에 채워졌습니다", en: "One booking filled {0} places at once", th: "จองครั้งเดียว อัปเดต {0} จุดพร้อมกัน", zh: "一次预约，同时更新 {0} 处", ru: "Одна запись обновила сразу {0} раздела" },

  chatLinkedTitle: { ko: "보낸 메시지가 클리닉에 바로 전달됐습니다", en: "Your message went straight to the clinic", th: "ข้อความของคุณถูกส่งถึงคลินิกแล้ว", zh: "您的消息已直接送达诊所", ru: "Ваше сообщение сразу ушло в клинику" },
  chatLinkedInbox: { ko: "통합 인박스 · {0} 스레드에 안 읽음 표시", en: "Unified inbox · marked unread in {0}'s thread", th: "กล่องข้อความรวม · ทำเครื่องหมายยังไม่อ่านในแชทของ{0}", zh: "统一收件箱 · 已在{0}的会话中标记未读", ru: "Общий инбокс · отмечено непрочитанным в диалоге {0}" },
  chatLinkedHint: { ko: "클리닉 담당자가 파트너 화면에서 같은 내용을 보고 있습니다", en: "The clinic's staff sees the same message on their partner screen", th: "พนักงานคลินิกเห็นข้อความเดียวกันบนหน้าจอพาร์ทเนอร์", zh: "诊所工作人员在合作伙伴界面看到同样的内容", ru: "Сотрудник клиники видит то же сообщение в партнёрском экране" },

  reviewLinkedTitle: { ko: "후기가 승인 대기열로 넘어갔습니다", en: "Your review moved to the approval queue", th: "รีวิวของคุณเข้าสู่คิวอนุมัติแล้ว", zh: "您的评价已进入审核队列", ru: "Отзыв отправлен в очередь на модерацию" },
  reviewLinkedAdmin: { ko: "어드민 후기 관리 · 승인 대기 1건 추가", en: "Admin reviews · 1 item added to pending", th: "จัดการรีวิว (แอดมิน) · เพิ่มรายการรออนุมัติ 1 รายการ", zh: "管理后台评价 · 新增 1 条待审核", ru: "Отзывы в админке · добавлен 1 на модерацию" },
  reviewLinkedClinic: { ko: "{0} · 승인되면 클리닉 상세에 노출", en: "{0} · will appear on the clinic page once approved", th: "{0} · จะแสดงบนหน้าคลินิกเมื่อได้รับอนุมัติ", zh: "{0} · 审核通过后将显示在诊所页面", ru: "{0} · появится на странице клиники после одобрения" },
  reviewLinkedCode: { ko: "후기코드 {0} · 방문 확인 완료", en: "Review code {0} · visit verified", th: "โค้ดรีวิว {0} · ยืนยันการเข้ารับบริการแล้ว", zh: "评价码 {0} · 到店已核实", ru: "Код отзыва {0} · визит подтверждён" },
  reviewLinkedHint: { ko: "내 후기 목록에서 승인 상태를 확인할 수 있습니다", en: "You can track the approval status in My reviews", th: "ติดตามสถานะการอนุมัติได้ที่รีวิวของฉัน", zh: "可在“我的评价”中查看审核状态", ru: "Статус можно отследить в разделе «Мои отзывы»" },

  noBookings: { ko: "아직 예약이 없습니다.", en: "No bookings yet.", th: "ยังไม่มีการจอง", zh: "暂无预约。", ru: "Записей пока нет." },
  depositPaid: { ko: "예약금 ฿{0} 결제완료", en: "฿{0} deposit paid", th: "ชำระมัดจำ ฿{0} แล้ว", zh: "已支付 ฿{0} 定金", ru: "Депозит ฿{0} оплачен" },

  reviewIntro: { ko: "방문 후 발행된 후기코드를 입력하면 후기를 작성할 수 있어요.", en: "Enter the review code issued after your visit to write a review.", th: "กรอกโค้ดรีวิวที่ได้รับหลังเข้ารับบริการเพื่อเขียนรีวิว", zh: "输入到店后发放的评价码即可撰写评价。", ru: "Введите код отзыва, выданный после визита, чтобы оставить отзыв." },
  codeExample: { ko: "예: HB-7K2M", en: "e.g. HB-7K2M", th: "เช่น HB-7K2M", zh: "例：HB-7K2M", ru: "напр. HB-7K2M" },
  rating: { ko: "평점", en: "Rating", th: "คะแนน", zh: "评分", ru: "Оценка" },
  reviewBody: { ko: "내용", en: "Your review", th: "เนื้อหารีวิว", zh: "评价内容", ru: "Текст отзыва" },
  reviewPlaceholder: { ko: "시술 경험을 남겨주세요", en: "Tell us about your experience", th: "เล่าประสบการณ์ของคุณ", zh: "请分享您的体验", ru: "Расскажите о своём опыте" },
  photoLabel: { ko: "시술 사진 (최대 3장)", en: "Treatment photos (up to 3)", th: "รูปภาพหัตถการ (สูงสุด 3 รูป)", zh: "项目照片（最多 3 张）", ru: "Фото процедуры (до 3)" },
  photoHint: { ko: "사진을 선택하면 자동으로 크기를 줄여 저장합니다", en: "Selected photos are resized automatically before saving", th: "รูปที่เลือกจะถูกย่อขนาดอัตโนมัติก่อนบันทึก", zh: "选择的照片会自动压缩后保存", ru: "Выбранные фото автоматически уменьшаются перед сохранением" },
  userGreeting: { ko: "{0}님", en: "{0}", th: "คุณ{0}", zh: "{0}", ru: "{0}" },
  addPhoto: { ko: "사진 추가", en: "Add photo", th: "เพิ่มรูป", zh: "添加照片", ru: "Добавить фото" },
  removePhoto: { ko: "삭제", en: "Remove", th: "ลบ", zh: "删除", ru: "Удалить" },
  submitReview: { ko: "후기 등록", en: "Submit review", th: "ส่งรีวิว", zh: "提交评价", ru: "Отправить отзыв" },
  myReviews: { ko: "내가 쓴 후기", en: "My reviews", th: "รีวิวของฉัน", zh: "我的评价", ru: "Мои отзывы" },
  reviewBlocked: { ko: "차단됨", en: "Blocked", th: "ถูกระงับ", zh: "已屏蔽", ru: "Заблокирован" },
  reviewApproved: { ko: "승인됨", en: "Approved", th: "อนุมัติแล้ว", zh: "已通过", ru: "Одобрен" },
  reviewPending: { ko: "승인 대기", en: "Pending", th: "รออนุมัติ", zh: "审核中", ru: "На рассмотрении" },
  checkCode: { ko: "후기코드를 확인해주세요", en: "Please check the review code", th: "กรุณาตรวจสอบโค้ดรีวิว", zh: "请检查评价码", ru: "Проверьте код отзыва" },
  writeSomething: { ko: "후기 내용을 입력해주세요", en: "Please write your review", th: "กรุณาเขียนเนื้อหารีวิว", zh: "请填写评价内容", ru: "Напишите текст отзыва" },
  reviewSubmitted: { ko: "후기가 등록되었습니다 · 어드민 승인 후 노출됩니다", en: "Review submitted · it goes live after admin approval", th: "ส่งรีวิวแล้ว · จะแสดงหลังผู้ดูแลอนุมัติ", zh: "评价已提交 · 通过管理员审核后显示", ru: "Отзыв отправлен · появится после одобрения" },
};

// "{0}" 자리에 값을 끼워 넣는다. 언어마다 값의 위치가 달라서 문장을 쪼개 붙이면 어순이 깨진다.
export function tf(key: string, lang: LangCode, ...values: (string | number)[]) {
  return t(key, lang).replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)] ?? ""));
}

export function t(key: string, lang: LangCode): string {
  const entry = DICT[key] ?? CONTENT[key];
  if (entry) return entry[lang] ?? entry.ko ?? key;

  // 시드가 만들어 내는 문장은 이름·카테고리가 끼워 넣어져 있어 통째로 사전에 담을 수 없다.
  // 틀만 번역해 두고, 끼워 넣어진 조각은 다시 t()에 태워 번역한다.
  for (const p of CONTENT_PATTERNS) {
    const m = p.match.exec(key);
    if (!m) continue;
    const tpl = CONTENT[p.key]?.[lang];
    if (!tpl) break;
    return tpl.replace(/\{(\d+)\}/g, (_, i) => t(m[Number(i) + 1], lang));
  }
  return key;
}

// 홈 탭 안쪽 화면까지 lang을 손으로 내려보내면 중간 컴포넌트가 전부 그 값을 받아 나르게 된다.
const LangContext = createContext<LangCode>("ko");
export const LangProvider = LangContext.Provider;

export function useT() {
  const lang = useContext(LangContext);
  return {
    lang,
    t: (key: string) => t(key, lang),
    tf: (key: string, ...values: (string | number)[]) => tf(key, lang, ...values),
  };
}
