"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountBadge, OrderToast, useOrderAlerts } from "../order-alerts";
import type { OrderPulse } from "./watch-actions";

export default function StaffNav({ items, initial }: { items: { href: string; label: string }[]; initial: OrderPulse | null }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/gestion" ? path === href : path.startsWith(href));
  const { pulse, toast, closeToast, perm, enable, pushError } = useOrderAlerts(initial);

  return (
    <>
      <nav aria-label="Gestion" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
        <ul className="flex gap-1 lg:flex-col">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={isActive(i.href) ? "page" : undefined}
                className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive(i.href) ? "bg-red text-white" : "text-ink hover:bg-cream"
                }`}
              >
                {i.label}
                {i.href === "/gestion/commandes" && <CountBadge count={pulse?.count ?? 0} inverted={isActive(i.href)} />}
              </Link>
            </li>
          ))}
        </ul>
        {initial && perm !== "granted" && (
          <button type="button" onClick={enable} className="mt-3 w-full rounded-xl border border-dashed border-red/40 px-3 py-2 text-left text-xs font-semibold text-red hover:bg-red-50">
            Activer le son et les notifications de commandes
          </button>
        )}
        {pushError && <p role="status" className="mt-2 rounded-xl bg-sun-100 px-3 py-2 text-xs">{pushError}</p>}
      </nav>
      <OrderToast toast={toast} onClose={closeToast} />
    </>
  );
}
