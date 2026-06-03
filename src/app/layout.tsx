import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RONG — Inventory & Stock Management",
  description:
    "RONG inventory and stock management ERP — products, stock, purchasing and sales for a Dhaka clothing brand.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookie server-side — no script tag needed, no React 19 warning
  const theme = (await cookies()).get("rong-theme")?.value;
  const dark = theme === "dark";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dark ? "dark " : ""}${playfair.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
