import Link from "next/link";
import { IconPhone, IconTruck, IconWallet } from "@/components/icons";

/** Bandeau fin au-dessus de l'en-tête : numéro, promotions en cours, infos rapides */
export default function TopBar({ phone, promoCount, minFee }: { phone: string; promoCount: number; minFee: string }) {
  const tel = phone.replace(/\s/g, "");
  return (
    <div className="bg-ink text-[13px] text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <a href={`tel:${tel}`} className="flex shrink-0 items-center gap-1.5 font-semibold hover:text-sun">
          <IconPhone className="size-4 text-sun" /> Commandez au {phone.replace(/^\+221\s?/, "")}
        </a>
        {promoCount > 0 && (
          <Link href="/promotions" className="truncate rounded-full bg-sun px-3 py-0.5 font-semibold text-ink hover:bg-white">
            {promoCount} produit{promoCount > 1 ? "s" : ""} en promo
          </Link>
        )}
        <ul className="hidden items-center gap-5 text-white/80 md:flex">
          <li className="flex items-center gap-1.5"><IconTruck className="size-4 text-sun" /> Livraison dès {minFee}</li>
          <li className="flex items-center gap-1.5"><IconWallet className="size-4 text-sun" /> Wave et Orange Money</li>
        </ul>
      </div>
    </div>
  );
}
