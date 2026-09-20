"use client";

import { useState } from "react";

function hashSeed(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bitGrid(seed: string, size = 25) {
  let a = hashSeed(seed);
  const next = () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    a >>>= 0;
    return a / 4294967296;
  };
  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(next() > 0.52);
    grid.push(row);
  }

  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = edge || core;
      }
    }
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const gy = oy + y;
        const gx = ox + x;
        if (gy < 0 || gx < 0 || gy >= size || gx >= size) continue;
        if (y === -1 || x === -1 || y === 7 || x === 7) grid[gy][gx] = false;
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  return grid;
}

export function PseudoQR({ seed, className = "" }: { seed: string; className?: string }) {
  const size = 25;
  const grid = bitGrid(seed, size);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="PromptPay QR (demo)"
    >
      <rect width={size} height={size} fill="#ffffff" />
      {grid.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#353839" /> : null,
        ),
      )}
    </svg>
  );
}

const COVER_PALETTES = [
  ["#f7c9d3", "#d97c93"],
  ["#cfd9e8", "#6f7f9c"],
  ["#f3dcc4", "#c2926a"],
  ["#d3e3d8", "#6f9280"],
  ["#e2d4ec", "#8d76a8"],
  ["#f6d7c6", "#c58163"],
];

// public/clinics/<id>.jpg 를 넣으면 실제 사진으로 바뀌고, 없으면 자동 생성 커버가 뜬다
export function ClinicPhoto({
  clinicId,
  name,
  district,
  src,
  className = "",
}: {
  clinicId: string;
  name: string;
  district: string;
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const seed = hashSeed(clinicId);
  const [from, to] = COVER_PALETTES[seed % COVER_PALETTES.length];
  const angle = 120 + (seed % 90);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`size-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative size-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }}
      role="img"
      aria-label={`${name} 대표 이미지`}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(60% 70% at ${25 + (seed % 50)}% 20%, rgba(255,255,255,0.85), transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <span className="text-[10px] font-semibold tracking-widest opacity-80">
          {district.toUpperCase()}
        </span>
        <span className="text-sm font-bold drop-shadow">{name}</span>
      </div>
      <span className="absolute right-3 top-3 rounded-pill bg-white/25 px-2 py-0.5 text-[9px] font-bold tracking-widest text-white">
        DEMO PHOTO
      </span>
    </div>
  );
}

export interface SlipData {
  id: string;
  bank: string;
  from: string;
  to: string;
  amount: string;
  ref: string;
  at: string;
}

export const DEMO_SLIPS: SlipData[] = [
  {
    id: "SLIP1",
    bank: "HeyBank",
    from: "DODO J.",
    to: "SIAM GLOW CLINIC",
    amount: "1,000.00",
    ref: "HB2609170001",
    at: "17 Sep 2026 10:24",
  },
  {
    id: "SLIP2",
    bank: "HeyBank",
    from: "DODO J.",
    to: "BANGKOK LUMIERE",
    amount: "1,000.00",
    ref: "HB2609170002",
    at: "17 Sep 2026 10:31",
  },
  {
    id: "SLIP3",
    bank: "DemoPay Wallet",
    from: "DODO J.",
    to: "ASOKE SKINLAB",
    amount: "1,000.00",
    ref: "DP2609170003",
    at: "16 Sep 2026 18:02",
  },
];

export function SlipImage({
  slip,
  compact = false,
}: {
  slip: SlipData;
  compact?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/slips/${slip.id}.jpg`} alt={`${slip.bank} → ${slip.to}, ฿${slip.amount} 송금 견본`}
      className={`w-full rounded-cell bg-white object-contain hairline ${compact ? "max-h-40" : "max-h-96"}`} />
  );
}

export interface IdCardData {
  id: string;
  name: string;
  nameTh: string;
  idNo: string;
  birth: string;
  address: string;
  issued: string;
  expiry: string;
}

export const DEMO_ID_CARDS: IdCardData[] = [
  {
    "id": "IDC1",
    "name": "Miss Narisa Prasit",
    "nameTh": "นางสาว นาริสา ประสิทธิ์",
    "idNo": "0-1234-56789-01-7",
    "birth": "1994-03-12",
    "address": "128/45 ถนนสาธิต แขวงตัวอย่าง เขตทดสอบ กรุงเทพมหานคร 10240",
    "issued": "2024-02-15",
    "expiry": "2032-03-11"
  },
  {
    "id": "IDC2",
    "name": "Mr. Somchai Boonma",
    "nameTh": "นาย สมชาย บุญมา",
    "idNo": "0-9876-54321-09-3",
    "birth": "1988-11-02",
    "address": "76/9 ถนนจำลอง ตำบลตัวอย่าง อำเภอทดสอบ เชียงใหม่ 50200",
    "issued": "2025-08-08",
    "expiry": "2033-11-01"
  }
];

export function IdCardImage({ card }: { card: IdCardData }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/idcards/${card.id}.jpg`} alt={`${card.name} 가상 ID 카드 견본`}
      className="w-full rounded-cell bg-white object-contain hairline" />
  );
}

export interface BoxLabelData {
  id: string;
  productName: string;
  volume: string;
  lot: string;
  expiry: string;
}

export const DEMO_BOX_LABELS: BoxLabelData[] = [
  { id: "BOX1", productName: "Rejuran", volume: "2ml", lot: "LOT48211", expiry: "2027-03" },
  { id: "BOX2", productName: "Nabota 100U", volume: "100U", lot: "LOT77120", expiry: "2027-08" },
  { id: "BOX3", productName: "Juvederm Volite", volume: "1ml", lot: "LOT30945", expiry: "2028-01" },
];

export function BoxLabelImage({ label }: { label: BoxLabelData }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/boxlabels/${label.id}.jpg`} alt={`${label.productName} ${label.volume} 제품 박스 견본`}
      className="max-h-64 w-full rounded-cell bg-white object-contain hairline" />
  );
}
