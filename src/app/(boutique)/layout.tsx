import { CartProvider } from "@/lib/cart";
import { getActivePacks, getCategories, getPromoCount, getSettings, getZones } from "@/lib/shop";
import { fcfa } from "@/lib/format";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import TopBar from "@/components/shop/TopBar";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, zones, promoCount, packs] = await Promise.all([getCategories(), getSettings(), getZones(), getPromoCount(), getActivePacks()]);
  const minFee = fcfa(zones.length ? Math.min(...zones.map((z) => z.price)) : 1000);
  return (
    <CartProvider>
      <TopBar phone={settings?.phone ?? "+221 78 737 82 90"} promoCount={promoCount} minFee={minFee} pack={packs[0] ? { slug: packs[0].slug, name: packs[0].name, price: fcfa(packs[0].promo_price ?? packs[0].price) } : null} />
      <Header categories={categories} />
      <div className="min-h-[60dvh]">{children}</div>
      <Footer categories={categories} settings={settings} />
    </CartProvider>
  );
}
