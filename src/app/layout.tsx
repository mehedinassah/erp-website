import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { cookies } from "next/headers";
import { SITE } from "@/lib/site";
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
  metadataBase: new URL(SITE.url),
  title: {
    default: "PERICO — ERP System",
    template: "%s · PERICO",
  },
  description:
    "PERICO ERP — inventory, stock management, purchasing, sales and ledger for modern businesses.",
  applicationName: SITE.name,
  keywords: [
    "ERP", "inventory management", "POS", "barcode POS", "Dena Paona",
    "দেনা পাওনা", "Bangladesh ERP", "shop management", "wholesale software",
  ],
  icons: {
    icon: "/perico.png",
    shortcut: "/perico.png",
    apple: "/perico.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
  },
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
