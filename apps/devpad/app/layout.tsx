import "../../../lib/igg-fonts.css";
import "./globals.css";

export const metadata = {
  title: "Devpad",
  description: "Code editor benchmark mockup",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
