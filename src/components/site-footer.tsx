import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { getCategories } from "@/lib/store";

export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className="border-t border-border-subtle bg-brand-red-900 text-brand-red-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 rounded-xl bg-white/95 px-3 py-2 w-fit">
            <span className="font-display text-lg font-extrabold text-brand-red-600">Ô Bon Prix</span>
          </div>
          <p className="text-sm text-brand-red-100/90">
            Votre supérette de quartier, maintenant en ligne. Qualité, fraîcheur et bons prix
            livrés chez vous.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold hover:bg-white/20"
            >
              f
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold hover:bg-white/20"
            >
              ig
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-brand-gold-300">
            Catégories
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-brand-red-100/90">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/categorie/${cat.slug}`} className="hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-brand-gold-300">
            Liens utiles
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-brand-red-100/90">
            <li>
              <Link href="/catalogue" className="hover:text-white">
                Tout le catalogue
              </Link>
            </li>
            <li>
              <Link href="/panier" className="hover:text-white">
                Mon panier
              </Link>
            </li>
            <li>
              <a href="https://wa.me/221787378290" className="hover:text-white">
                Commander sur WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-brand-gold-300">
            Contact
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-brand-red-100/90">
            <li className="flex items-start gap-2">
              <Phone size={16} className="mt-0.5 shrink-0" />
              <a href="tel:+221787378290" className="hover:text-white">
                +221 78 737 82 90
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>Dakar, Sénégal</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-brand-red-100/70">
        © {new Date().getFullYear()} Ô Bon Prix Supérette. Tous droits réservés.
      </div>
    </footer>
  );
}
