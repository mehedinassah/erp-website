import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

// Professional, modern type system:
//   IBM Plex Sans  — body, data, tables, UI
//   IBM Plex Serif — display headings (subtle editorial weight)
const plexSans = IBM_Plex_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PERICO — ERP System",
  description:
    "PERICO ERP — inventory, stock management, purchasing, sales and ledger for modern businesses.",
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
      className={`${dark ? "dark " : ""}${plexSerif.variable} ${plexSans.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
