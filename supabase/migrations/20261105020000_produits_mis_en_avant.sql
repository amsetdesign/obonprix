/*
  # Produits mis en avant à l'accueil

  - products.featured : produits prioritaires affichés dans le bloc de gauche de l'accueil
    (case « Mis en avant à l'accueil » dans la fiche produit du back-office).
  - Au départ : la volaille et la charcuterie (cuisses, ailes, pilons, poulet entier, saucisse, foie).
*/

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products (featured) WHERE featured;

UPDATE public.products SET featured = true
WHERE slug IN ('cuisses-de-poulet-au-kg', 'ailes-de-poulet-au-kg', 'pilons-de-poulet-au-kg', 'poulet-entier-seara-1-3-kg', 'saucisse', 'foie-1-kg');

-- Vérification
SELECT name, featured FROM public.products WHERE featured ORDER BY name;
