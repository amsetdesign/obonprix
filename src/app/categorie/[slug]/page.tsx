import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCategories } from "@/lib/store";
import { CatalogueBrowser } from "@/components/catalogue-browser";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  return (
    <div>
      <div className="border-b border-border-subtle bg-surface-muted/60 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-stone-900">
            <span>{category.emoji}</span> {category.name}
          </h1>
        </div>
      </div>
      <Suspense>
        <CatalogueBrowser lockedCategory={category.slug} />
      </Suspense>
    </div>
  );
}
