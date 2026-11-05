import { CartProvider } from "@/lib/cart";
import { getCategories, getSettings } from "@/lib/shop";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  return (
    <CartProvider>
      <Header categories={categories} />
      <div className="min-h-[60dvh]">{children}</div>
      <Footer categories={categories} settings={settings} />
    </CartProvider>
  );
}
