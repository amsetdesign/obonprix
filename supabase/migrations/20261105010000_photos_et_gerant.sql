/*
  # Photos des produits et premier gérant

  - Espace de stockage public « produits » (Supabase Storage) : JPG, PNG ou WEBP, 3 Mo maximum.
    Seuls le gérant et la gestionnaire de stock ajoutent, remplacent ou suppriment des photos.
  - Le premier compte créé dans Authentication devient gérant (uniquement s'il n'y a pas encore de gérant).
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('produits', 'produits', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "Stock team uploads product photos" ON storage.objects;
CREATE POLICY "Stock team uploads product photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'produits' AND public.has_role('gerant', 'stock'));
DROP POLICY IF EXISTS "Stock team replaces product photos" ON storage.objects;
CREATE POLICY "Stock team replaces product photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'produits' AND public.has_role('gerant', 'stock'));
DROP POLICY IF EXISTS "Stock team deletes product photos" ON storage.objects;
CREATE POLICY "Stock team deletes product photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'produits' AND public.has_role('gerant', 'stock'));

-- L'équipe voit les noms des collègues (journal du stock, commandes attribuées)
DROP POLICY IF EXISTS "Staff read team" ON public.profiles;
CREATE POLICY "Staff read team" ON public.profiles FOR SELECT TO authenticated
  USING (role IS NOT NULL AND public.is_staff());

UPDATE public.profiles SET role = 'gerant'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'gerant');

-- Vérification : l'équipe
SELECT u.email, p.full_name, p.role FROM public.profiles p JOIN auth.users u ON u.id = p.id ORDER BY u.created_at;
