"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StaffNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/gestion" ? path === href : path.startsWith(href));
  return (
    <nav aria-label="Gestion" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={isActive(i.href) ? "page" : undefined}
              className={`block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive(i.href) ? "bg-red text-white" : "text-ink hover:bg-cream"
              }`}
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
