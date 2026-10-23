import type { Metadata } from "next";

import "../../../lib/igg-fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google Docs Mock",
  description: "Interactive Google Docs-style mockup",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
