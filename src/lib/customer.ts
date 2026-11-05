"use client";

import type { CartLine } from "@/lib/cart";

/*
  Mémoire du client dans son navigateur (pas de compte) :
  - ses coordonnées, pour pré-remplir la commande suivante ;
  - ses dernières commandes, pour les suivre et les recommander en un clic.
  Rien n'est envoyé ailleurs : tout reste sur son téléphone, et il peut l'effacer.
*/

export type CustomerInfo = {
  name: string; phone: string; delivery: string; area_other: string;
  address: string; landmark: string; payment: string;
};
export type SavedOrder = { number: string; phone: string; total?: number; date: string; lines: CartLine[] };

const INFO_KEY = "obp-client-v1";
const ORDERS_KEY = "obp-commandes-v1";
const PENDING_KEY = "obp-commande-en-cours-v1";
const MAX_ORDERS = 20;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée : rien n'est gardé */ }
}

export const loadCustomer = () => read<CustomerInfo | null>(INFO_KEY, null);
export const saveCustomer = (info: CustomerInfo) => write(INFO_KEY, info);

export const loadOrders = () => read<SavedOrder[]>(ORDERS_KEY, []).filter((o) => o && typeof o.number === "string");

/** Au moment de valider : on garde le panier et le téléphone en attendant le numéro de commande */
export const savePending = (lines: CartLine[], phone: string) => write(PENDING_KEY, { lines, phone });

/** Sur la page de remerciement : la commande en attente reçoit son numéro et rejoint l'historique */
export function confirmPending(number: string, total: number) {
  const pending = read<{ lines: CartLine[]; phone: string } | null>(PENDING_KEY, null);
  const orders = loadOrders();
  if (orders.some((o) => o.number === number)) return;
  if (!pending) return;
  write(ORDERS_KEY, [{ number, phone: pending.phone, total, date: new Date().toISOString(), lines: pending.lines }, ...orders].slice(0, MAX_ORDERS));
  try { localStorage.removeItem(PENDING_KEY); } catch { /* sans conséquence */ }
}

/** Téléphone partagé : le client efface tout ce que le site a gardé */
export function forgetCustomer() {
  try {
    [INFO_KEY, ORDERS_KEY, PENDING_KEY].forEach((k) => localStorage.removeItem(k));
  } catch { /* sans conséquence */ }
}
