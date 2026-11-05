import Image from "next/image";
import Link from "next/link";
import type { Category, StoreSettings } from "@/lib/shop";
import { hoursLines } from "@/lib/shop";
import { IconFacebook, IconInstagram, IconTiktok, IconWhatsapp } from "@/components/icons";

// Comptes officiels (repris du Linktree linktr.ee/OBonPrixsn)
const SOCIALS = [
  { href: "https://www.facebook.com/obonprixsn", label: "Facebook", Icon: IconFacebook },
  { href: "https://www.instagram.com/o_bon_prix_sn", label: "Instagram", Icon: IconInstagram },
  { href: "https://www.tiktok.com/@o.bon.prix.sn", label: "TikTok", Icon: IconTiktok },
];
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBRecV6LwHtEGzSvL02";

export default function Footer({ categories, settings }: { categories: Category[]; settings: StoreSettings | null }) {
  const phone = settings?.phone ?? "+221 78 737 82 90";
  const wa = settings?.whatsapp ?? "221787378290";
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="inline-block rounded-2xl bg-white px-4 py-3">
            <Image src="/brand/logo.png" alt="Ô Bon Prix Superette" width={140} height={65} />
          </div>
          <p className="max-w-xs text-sm text-white/70">Votre supérette en ligne : courses livrées partout à Dakar, paiement Wave ou Orange Money.</p>
          <ul className="flex gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-red">
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
          <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-white/80 underline underline-offset-4 hover:text-white">
            Suivre nos promos sur la chaîne WhatsApp
          </a>
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-sun">Rayons</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {categories.map((c) => <li key={c.slug}><Link href={`/rayons/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
          </ul>
        </div>
        <div className="space-y-5 text-sm">
          <div>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-sun">Horaires</h2>
            <ul className="mt-3 space-y-1 text-white/80">
              {settings && hoursLines(settings.hours).map((l) => <li key={l.days}>{l.days} : {l.time}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-sun">Contact</h2>
            <p className="mt-3 text-white/80">{phone} (appel, Wave, Orange Money)</p>
            <a href={`https://wa.me/${wa}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1f9d55] px-4 py-2.5 font-semibold hover:bg-[#17864a]">
              <IconWhatsapp className="size-5" /> Écrire sur WhatsApp
            </a>
          </div>
          <p className="text-white/80"><Link href="/suivi" className="underline underline-offset-4 hover:text-white">Suivre ma commande</Link></p>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} Ô Bon Prix Superette, Dakar</p>
    </footer>
  );
}
