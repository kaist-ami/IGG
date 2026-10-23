import type { Metadata } from "next";
import "../../../lib/igg-fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accord Mock",
  description: "A realistic Accord-like benchmark mock interface",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
