import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hey! Beauty",
  description: "태국 뷰티 클리닉 O2O 플랫폼 + 클리닉 AI CRM — 시연용 MVP",
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
