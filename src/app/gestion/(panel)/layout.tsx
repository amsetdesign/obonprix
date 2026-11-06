import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { ROLE_LABEL, STAFF_NAV } from "@/lib/roles";
import { logoutAction } from "../auth-actions";
import StaffNav from "./StaffNav";
import { orderPulse } from "./watch-actions";

export const metadata: Metadata = { title: { default: "Gestion", template: "%s | Gestion Ô Bon Prix" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const pulse = staff.role === "gerant" || staff.role === "vendeur" ? await orderPulse().catch(() => null) : null;
  const items = STAFF_NAV.filter((i) => i.roles.includes(staff.role)).map(({ href, label }) => ({ href, label }));
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link href="/gestion" aria-label="Accueil de la gestion">
            <Image src="/brand/logo.png" alt="Ô Bon Prix" width={130} height={61} priority />
          </Link>
          <div className="text-right lg:mt-5 lg:text-left">
            <p className="text-sm font-semibold">{staff.name || staff.email}</p>
            <p className="text-xs text-mute">{ROLE_LABEL[staff.role]}</p>
          </div>
        </div>
        <StaffNav items={items} initial={pulse} />
        <form action={logoutAction} className="hidden px-5 py-5 lg:mt-auto lg:block">
          <button type="submit" className="text-sm text-mute underline-offset-4 hover:text-red hover:underline">Se déconnecter</button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
        <form action={logoutAction} className="mt-10 lg:hidden">
          <button type="submit" className="text-sm text-mute underline underline-offset-4">Se déconnecter</button>
        </form>
      </main>
    </div>
  );
}
