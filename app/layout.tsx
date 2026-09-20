import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: "Hey! Beauty",
  description: "태국 뷰티 클리닉 O2O 플랫폼 + 클리닉 AI CRM — 시연용 MVP",
  openGraph: {
    title: "Hey! Beauty",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Hey! Beauty" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
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
