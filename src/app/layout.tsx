import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-montserrat", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dmsans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Ô Bon Prix : votre supérette en ligne à Dakar", template: "%s | Ô Bon Prix" },
  description: "Produits frais, épicerie, boissons, hygiène : commandez en ligne, payez par Wave ou Orange Money, livré partout à Dakar.",
  applicationName: "Ô Bon Prix",
  metadataBase: new URL(SITE_URL),
  openGraph: { type: "website", locale: "fr_SN", siteName: "Ô Bon Prix", title: "Ô Bon Prix : vos courses livrées à Dakar", description: "Produits frais, épicerie, boissons, hygiène : commandez en ligne, payez par Wave ou Orange Money, livré partout à Dakar." },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#d1141b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${dmSans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
