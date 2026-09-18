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
    <div className="relative overflow-hidden rounded-cell bg-white hairline">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rotate-[-22deg] text-4xl font-black tracking-widest text-ink/8">
          DEMO
        </span>
      </div>
      <div className="relative p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-hb-600">{slip.bank}</span>
          <span className="text-[10px] text-ink-sub">Transfer Success</span>
        </div>
        <div className="mt-2 text-lg font-bold">฿ {slip.amount}</div>
        {!compact && (
          <dl className="mt-2 space-y-1 text-[11px] text-ink-sub">
            <div className="flex justify-between gap-2">
              <dt>From</dt>
              <dd className="text-ink">{slip.from}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>To</dt>
              <dd className="truncate text-ink">{slip.to}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Ref</dt>
              <dd className="text-ink">{slip.ref}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Date</dt>
              <dd className="text-ink">{slip.at}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
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
}

export const DEMO_ID_CARDS: IdCardData[] = [
  {
    id: "IDC1",
    name: "NARISA PRASIT",
    nameTh: "นาริสา ประสิทธิ์",
    idNo: "0-0000-00000-00-0",
    birth: "1994-03-12",
    address: "Sukhumvit Demo Rd. 00, Bangkok",
    issued: "2022-01-05",
  },
  {
    id: "IDC2",
    name: "SOMCHAI BOONMA",
    nameTh: "สมชาย บุญมา",
    idNo: "0-0000-00000-11-0",
    birth: "1988-11-02",
    address: "Silom Demo Soi 00, Bangkok",
    issued: "2021-07-19",
  },
];

export function IdCardImage({ card }: { card: IdCardData }) {
  return (
    <div className="relative overflow-hidden rounded-cell bg-gradient-to-br from-hb-50 to-white p-3 hairline">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rotate-[-18deg] text-3xl font-black tracking-widest text-ink/8">
          DEMO
        </span>
      </div>
      <div className="relative flex gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-cell bg-hb-200/60 text-[10px] text-ink-sub">
          PHOTO
        </div>
        <div className="min-w-0 text-[11px]">
          <div className="text-[9px] font-semibold text-ink-sub">DEMO ID CARD</div>
          <div className="truncate font-bold">{card.name}</div>
          <div className="truncate text-ink-sub">{card.nameTh}</div>
          <div className="mt-1 text-ink-sub">ID {card.idNo}</div>
          <div className="text-ink-sub">DOB {card.birth}</div>
        </div>
      </div>
    </div>
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
    <div className="relative overflow-hidden rounded-cell bg-white p-3 hairline">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rotate-[-16deg] text-3xl font-black tracking-widest text-ink/8">
          DEMO
        </span>
      </div>
      <div className="relative font-mono text-[11px] leading-relaxed">
        <div className="text-sm font-bold">{label.productName}</div>
        <div className="text-ink-sub">VOL {label.volume}</div>
        <div className="text-ink-sub">{label.lot}</div>
        <div className="text-ink-sub">EXP {label.expiry}</div>
      </div>
    </div>
  );
}
