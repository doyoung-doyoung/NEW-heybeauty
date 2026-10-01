// 2026-10-01에 새로 만든 이미지(지도 · 소모품 · 팝업 광고)는 Supabase Storage의
// 공개 버킷 "heybeauty"에 올려 두었다. public/ 폴더에 넣은 기존 이미지와 달리
// 저장소에 파일이 없고 이 주소로 바로 불러온다.
export const ASSET_BASE =
  "https://hdujouoaeqatrazrnlhn.supabase.co/storage/v1/object/public/heybeauty";

export const asset = (path: string) => `${ASSET_BASE}/${path}`;
