import type { Metadata, Viewport } from "next";

// La gestion s'installe comme une application (écran d'accueil) pour recevoir les notifications de commandes
export const metadata: Metadata = {
  manifest: "/gestion.webmanifest",
  appleWebApp: { capable: true, title: "OBP Gestion", statusBarStyle: "default" },
  icons: { apple: "/gestion-icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#d1141b" };

export default function GestionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
