import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Hey! Beauty";
const description = "태국 뷰티 클리닉 O2O 플랫폼 + 클리닉 AI CRM — 시연용 MVP";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title,
  description,
  openGraph: {
    title,
    description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
};

// maximumScale 1: 입력칸을 눌렀을 때 아이폰이 화면을 멋대로 확대하지 않게 한다.
// (iOS 10부터는 이 값이 있어도 사용자가 두 손가락으로 확대하는 건 막지 않는다.)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
