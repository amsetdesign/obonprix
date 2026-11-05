import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getProductsByCategory } from "@/lib/shop";
import ProductCard from "@/components/shop/ProductCard";
import { rayonImage } from "@/components/shop/RayonCard";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: cat.name, description: `${cat.name} livrés partout à Dakar. Paiement Wave ou Orange Money.` } : {};
}

export default async function RayonPage({ params }: { params: Params }) {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) notFound();
  const products = await getProductsByCategory(cat.id);
  const img = rayonImage(cat.slug);
  const others = (await getCategories()).filter((c) => c.id !== cat.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="relative grid items-center overflow-hidden rounded-[24px] bg-red text-white sm:grid-cols-[1fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Rayon</p>
          <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">{cat.name}</h1>
          <p className="mt-1 text-sm text-white/80">{products.length} produit{products.length > 1 ? "s" : ""} · livrés partout à Dakar</p>
        </div>
        {img && (
          <div className="relative mr-4 hidden aspect-[2.2/1] h-40 justify-self-end sm:block">
            <Image src={img} alt="" fill priority sizes="360px" className="object-cover [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_72%)]" />
          </div>
        )}
      </header>
      <nav aria-label="Autres rayons" className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          {others.map((c) => (
            <li key={c.slug}><Link href={`/rayons/${c.slug}`} className="block rounded-full bg-white px-3.5 py-1.5 text-sm font-medium whitespace-nowrap ring-1 ring-line hover:text-red hover:ring-red/40">{c.name}</Link></li>
          ))}
        </ul>
      </nav>
      {products.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {products.map((p) => <ProductCard key={p.id} p={p} rayon={cat.slug} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-mute">Ce rayon se remplit bientôt.</p>
      )}
    </main>
  );
}
