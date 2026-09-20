export type Distribution = "정식" | "병행수입";
export type Channel = "LINE" | "Meta" | "App";
export type BookingStatus = "예약확정" | "방문완료" | "취소";
export type Gender = "여" | "남" | "미확인";
export type AccountStatus = "사용가능" | "홀드" | "차단";
export type NoticeTarget = "유저" | "클리닉" | "전체";

export interface Hours {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface Doctor {
  id: string;
  clinicId: string;
  branchId: string;
  name: string;
  title: string;
  specialties: string[];
  employeeNo: string;
}

export interface Staff {
  id: string;
  clinicId: string;
  branchId: string;
  name: string;
  role: string;
  employeeNo: string;
}

export interface Treatment {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface Promotion {
  id: string;
  clinicId: string;
  title: string;
  description: string;
  discountPct: number;
  period: string;
}

export interface Branch {
  id: string;
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  parking: string;
  hours: Hours[];
}

export interface Clinic {
  id: string;
  name: string;
  hasBranches: boolean;
  district: string;
  address: string;
  phone: string;
  lineId: string;
  parking: string;
  hours: Hours[];
  rating: number;
  reviewCount: number;
  intro: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  unitPriceTHB: number;
  unit: string;
}

export interface InventoryItem {
  id: string;
  clinicId: string;
  branchId: string;
  productId: string;
  qty: number;
  distribution: Distribution;
  volume: string;
  expiry: string;
  supplier: string;
  manager: string;
  purchaseDate: string;
  purchasePrice: number;
  salePrice: number;
  lotNo: string;
  warnPct: number;
}

export interface StockLog {
  id: string;
  inventoryItemId: string;
  type: "입고" | "사용" | "조정";
  qty: number;
  reason: string;
  at: string;
  by: string;
}

export interface Customer {
  id: string;
  clinicId: string;
  branchId: string;
  name: string;
  phone: string;
  birthday: string;
  gender: Gender;
  nationality: string;
  channel: Channel;
  interests: string[];
  doctorId: string;
  memo: string;
  createdAt: string;
  // 헤이뷰티 앱으로 예약한 유저의 카드면 그 유저 ID. 클리닉이 직접 받은 고객은 null.
  appUserId: string | null;
}

export interface OpdChart {
  id: string;
  customerId: string;
  clinicId: string;
  branchId: string;
  visitDate: string;
  doctorId: string;
  staffId: string;
  treatmentNames: string[];
  usedProducts: { productId: string; qty: number }[];
  comment: string;
  paidAmount: number;
}

export interface AppUser {
  id: string;
  name: string;
  lineId: string;
  phone: string;
  blocked: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  clinicId: string;
  branchId: string;
  treatmentId: string;
  doctorId: string;
  date: string;
  time: string;
  depositTHB: number;
  slipImage: string | null;
  status: BookingStatus;
  usedReviewCode: string | null;
  createdAt: string;
  // 이 예약으로 만들어졌거나 이어붙은 파트너 CRM 고객 카드 ID.
  customerId: string | null;
}

export interface Review {
  id: string;
  userId: string;
  clinicId: string;
  code: string;
  rating: number;
  text: string;
  images: string[];
  approved: boolean;
  blocked: boolean;
  createdAt: string;
}

export interface ReviewCode {
  id: string;
  code: string;
  ownerUserId: string;
  clinicId: string;
  bookingId: string;
  issuedAt: string;
  usedByBookingIds: string[];
}

export interface Commission {
  id: string;
  reviewCodeId: string;
  bookingId: string;
  amountTHB: number;
  at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "clinic";
  text: string;
  at: string;
  attachment?: string;
}

export interface ChatThread {
  id: string;
  kind: "ai" | "clinic";
  userId: string;
  clinicId: string | null;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface InboxThread {
  id: string;
  clinicId: string;
  branchId: string;
  channel: Channel;
  customerName: string;
  unread: boolean;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface CrmEntry {
  id: string;
  clinicId: string;
  branchId: string;
  kind: "음성" | "사진" | "텍스트";
  raw: string;
  summary: string;
  by: string;
  at: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  target: NoticeTarget;
  at: string;
}

export interface Popup {
  id: string;
  title: string;
  body: string;
  image: string | null;
  active: boolean;
}

export interface Account {
  id: string;
  kind: "clinic" | "user";
  label: string;
  loginId: string;
  password: string;
  status: AccountStatus;
}

export interface SmsLog {
  id: string;
  clinicId: string;
  to: string;
  customerName: string;
  template: "생일" | "재방문" | "프로모션";
  text: string;
  at: string;
}

export interface DemoDb {
  version: number;
  clinics: Clinic[];
  branches: Branch[];
  doctors: Doctor[];
  staff: Staff[];
  treatments: Treatment[];
  promotions: Promotion[];
  products: Product[];
  inventory: InventoryItem[];
  stockLogs: StockLog[];
  customers: Customer[];
  charts: OpdChart[];
  users: AppUser[];
  bookings: Booking[];
  reviews: Review[];
  reviewCodes: ReviewCode[];
  commissions: Commission[];
  chats: ChatThread[];
  inbox: InboxThread[];
  crmEntries: CrmEntry[];
  notices: Notice[];
  popups: Popup[];
  accounts: Account[];
  smsLogs: SmsLog[];
}
