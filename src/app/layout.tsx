import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getCategories, getProducts } from "@/lib/store";
import { ProductsProvider } from "@/lib/products-context";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloatButton } from "@/components/whatsapp-float-button";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ô Bon Prix — Supérette en ligne à Dakar",
  description:
    "Faites vos courses en ligne chez Ô Bon Prix : épicerie, boissons, frais, hygiène et plus encore. Commandez et recevez votre confirmation directement sur WhatsApp.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ProductsProvider initialProducts={products} initialCategories={categories}>
          <CartProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <WhatsAppFloatButton />
          </CartProvider>
        </ProductsProvider>
      </body>
    </html>
  );
}
