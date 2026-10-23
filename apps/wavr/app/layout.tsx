import type { Metadata } from "next";
import "../../../lib/igg-fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wavr",
  description: "Music streaming mockup for IGG benchmark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
