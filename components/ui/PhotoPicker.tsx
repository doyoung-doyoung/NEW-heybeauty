"use client";

import { useRef } from "react";
import { useT } from "@/lib/i18n";

// 브라우저에서 바로 줄여서 저장한다. localStorage 용량을 아끼려고 긴 변을 720px로 맞춘다.
function shrinkToDataUrl(file: File, maxSide = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoPicker({
  images,
  onChange,
  max = 3,
  label = "사진 첨부",
  hint = "비워두면 데모 기본 이미지가 표시됩니다",
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useT();

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max - images.length;
    const picked = Array.from(files).slice(0, room);
    const urls = await Promise.all(picked.map((f) => shrinkToDataUrl(f)));
    onChange([...images, ...urls]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-sub">{label}</span>
        <span className="text-[11px] text-ink-sub">
          {images.length}/{max}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div
            key={`${i}-${src.slice(0, 24)}`}
            className="relative overflow-hidden rounded-cell bg-white/70 hairline"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-24 w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1.5 top-1.5 rounded-pill bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-white"
            >
              {t("removePhoto")}
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 flex-col items-center justify-center gap-1 rounded-cell bg-white/60 text-ink-sub transition hairline hover:bg-white"
          >
            <PlusIcon />
            <span className="text-[11px]">{t("addPhoto")}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        onChange={(e) => pick(e.target.files)}
        className="hidden"
      />
      {hint && <p className="mt-2 text-[11px] text-ink-sub">{hint}</p>}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M9 4v10M4 9h10" />
    </svg>
  );
}
