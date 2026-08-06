import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/catalogue-browser";

export const metadata = {
  title: "Catalogue — Ô Bon Prix",
};

export default function CataloguePage() {
  return (
    <div>
      <div className="border-b border-border-subtle bg-surface-muted/60 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="font-display text-3xl font-extrabold text-stone-900">
            Tout le catalogue
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Parcourez l&apos;ensemble de nos produits et ajoutez-les à votre panier.
          </p>
        </div>
      </div>
      <Suspense>
        <CatalogueBrowser />
      </Suspense>
    </div>
  );
}
