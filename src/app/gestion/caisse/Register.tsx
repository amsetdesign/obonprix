"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fcfa, qty as fmtQty } from "@/lib/format";
import { IconClose, IconReceipt, IconSearch, IconTrash } from "@/components/icons";
import { cancelSale, recordSale, todaySales } from "./actions";
import Receipt, { type ReceiptData } from "./Receipt";
import Keypad from "./Keypad";
import CloseRegister from "./CloseRegister";
import { CountBadge, OrderToast, useOrderAlerts } from "../order-alerts";
import type { OrderPulse } from "../(panel)/watch-actions";

type Product = { id: string; name: string; unit: "piece" | "kg"; price: number; barcode: string | null; category_id: number | null; kind: string };
type Line = Product & { qty: number };
type Pay = "especes" | "wave" | "om";
type Props = { products: Product[]; categories: { id: number; name: string }[]; cashier: string; isManager: boolean; store: { phone: string; address: string }; pulse: OrderPulse | null };

const PAY_LABEL: Record<Pay, string> = { especes: "Espèces", wave: "Wave", om: "Orange Money" };
const plain = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const lineTotal = (l: Line) => Math.round(l.price * l.qty);

export default function Register({ products, categories, cashier, isManager, store, pulse: initialPulse }: Props) {
  const alerts = useOrderAlerts(initialPulse);
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<number | null>(null);
  // ligne sélectionnée (surlignée) : le pavé numérique règle sa quantité, comme sur Odoo
  const [sel, setSel] = useState<{ id: string; buf: string; fresh: boolean } | null>(null);
  const [paying, setPaying] = useState<{ method: Pay; cash: string } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof todaySales>> | null>(null);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const [pending, start] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState("");

  useEffect(() => {
    const tick = () => setNow(new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dakar" }).format(new Date()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const byBarcode = useMemo(() => new Map(products.filter((p) => p.barcode).map((p) => [p.barcode as string, p])), [products]);
  const shown = useMemo(() => {
    const n = plain(search.trim());
    return products.filter((p) => (cat == null || p.category_id === cat) && (!n || plain(p.name).includes(n) || p.barcode === search.trim()));
  }, [products, search, cat]);
  const total = lines.reduce((n, l) => n + lineTotal(l), 0);
  const count = lines.reduce((n, l) => n + (l.unit === "kg" ? 1 : l.qty), 0);

  const addQty = (p: Product, q: number) => {
    setError("");
    setLines((ls) => {
      const found = ls.find((l) => l.id === p.id);
      if (found) return ls.map((l) => (l.id === p.id ? { ...l, qty: Math.round((l.qty + q) * 1000) / 1000 } : l));
      return [...ls, { ...p, qty: q }];
    });
  };
  const setQty = (id: string, q: number) => setLines((ls) => ls.flatMap((l) => (l.id !== id ? [l] : q > 0 ? [{ ...l, qty: Math.round(q * 1000) / 1000 }] : [])));
  /** Toucher un produit : +1 (ou 1 kg) et la ligne devient la ligne sélectionnée */
  const tap = (p: Product) => {
    const exists = lines.some((l) => l.id === p.id);
    if (!exists || p.unit === "piece") addQty(p, 1);
    setSel({ id: p.id, buf: "", fresh: true });
  };
  const selLine = lines.find((l) => l.id === sel?.id);

  /** Pavé numérique : la première touche remplace la quantité, les suivantes complètent */
  const press = (k: string) => {
    if (!sel || !selLine) return;
    if (k === "suppr") { setQty(sel.id, 0); setSel(null); return; }
    if (k === "+1" || k === "-1") {
      const q = selLine.qty + (k === "+1" ? 1 : -1);
      setQty(sel.id, q);
      if (q <= 0) setSel(null); else setSel({ ...sel, fresh: true });
      return;
    }
    if (k === "⌫") {
      const buf = sel.fresh ? "" : sel.buf.slice(0, -1);
      if (!buf) { setQty(sel.id, 0); setSel(null); return; }
      setSel({ ...sel, buf, fresh: false });
      const q = Number(buf.replace(",", "."));
      if (q > 0) setQty(sel.id, q);
      return;
    }
    if (k === "," && (selLine.unit !== "kg" || (!sel.fresh && sel.buf.includes(",")))) return;
    const buf = (sel.fresh ? "" : sel.buf) + (k === "," && sel.fresh ? "0," : k);
    if (buf.length > 7) return;
    setSel({ ...sel, buf, fresh: false });
    const q = Number(buf.replace(",", "."));
    if (q > 0) setQty(sel.id, selLine.unit === "kg" ? q : Math.floor(q));
  };

  // douchette : elle tape le code-barres puis « Entrée »
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const code = search.trim();
    const hit = byBarcode.get(code) ?? (shown.length === 1 ? shown[0] : undefined);
    if (hit) { tap(hit); setSearch(""); }
    else if (code) setError(`Aucun produit pour « ${code} ».`);
  };

  const pay = (method: Pay) => {
    if (!lines.length) return;
    setPaying({ method, cash: "" });
  };
  const cashGiven = paying?.cash ? Number(paying.cash) : null;
  const change = cashGiven != null ? cashGiven - total : null;

  const confirm = () => {
    if (!paying) return;
    if (paying.method === "especes" && (cashGiven == null || cashGiven < total)) { setError("Le montant donné est inférieur au total."); return; }
    const snapshot = lines;
    start(async () => {
      const res = await recordSale(snapshot.map((l) => ({ product_id: l.id, qty: l.qty })), paying.method, paying.method === "especes" ? cashGiven : null);
      if (res.error || !res.sale) { setError(res.error ?? "Erreur"); return; }
      setReceipt({
        number: res.sale.number, at: res.sale.at, cashier, payment: PAY_LABEL[paying.method], total: res.sale.total,
        cash: paying.method === "especes" ? cashGiven : null, change: res.sale.change,
        lines: snapshot.map((l) => ({ name: l.name, unit: l.unit, qty: l.qty, price: l.price, total: lineTotal(l) })),
        store,
      });
      setPaying(null);
      setLines([]);
      setSel(null);
    });
  };

  // le ticket s'imprime dès qu'il est prêt (silencieux avec Chrome --kiosk-printing)
  useEffect(() => {
    if (!receipt) return;
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, [receipt]);

  const openHistory = () => start(async () => setHistory(await todaySales()));

  return (
    <div className="flex h-dvh flex-col bg-cream select-none">
      {/* barre du haut */}
      <header className="flex items-center justify-between gap-4 bg-ink px-4 py-2 text-white">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white px-2 py-1"><Image src="/brand/logo.png" alt="Ô Bon Prix" width={72} height={34} /></span>
          <span className="text-sm"><strong>Caisse</strong> · {cashier}</span>
        </div>
        <span className="hidden text-sm text-white/70 first-letter:uppercase md:block">{now}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={openHistory} className="btn min-h-10 bg-white/10 text-white hover:bg-white/20"><IconReceipt className="size-5" /> Tickets du jour</button>
          <button type="button" onClick={() => setClosing(true)} className="btn min-h-10 bg-white/10 text-white hover:bg-white/20">Clôturer</button>
          <Link href="/gestion/commandes" className="btn min-h-10 bg-white/10 text-white hover:bg-white/20">
            Commandes en ligne <CountBadge count={alerts.pulse?.count ?? 0} />
          </Link>
          {alerts.perm === "default" && <button type="button" onClick={alerts.enable} className="btn min-h-10 bg-sun text-ink hover:bg-white">Activer le son</button>}
          <Link href="/gestion" className="btn min-h-10 bg-white/10 text-white hover:bg-white/20">Gestion</Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* produits */}
        <section className="flex min-w-0 flex-1 flex-col gap-3 p-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mute" />
            <input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Chercher un produit ou scanner un code-barres"
              className="field h-14 pl-12 text-lg"
              aria-label="Chercher un produit"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: null as number | null, name: "Tout" }, ...categories].map((c) => (
              <button key={c.name} type="button" onClick={() => setCat(c.id)}
                className={`h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${cat === c.id ? "bg-red text-white" : "bg-white ring-1 ring-line"}`}>
                {c.name}
              </button>
            ))}
          </div>
          <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => tap(p)} className="flex h-24 w-full flex-col justify-between rounded-xl bg-white p-3 text-left ring-1 ring-line active:bg-red-50 active:ring-red">
                  <span className="line-clamp-2 text-sm leading-tight font-semibold">{p.name}{p.kind === "pack" && <span className="ml-1 rounded bg-red px-1 text-[10px] text-white">PACK</span>}</span>
                  <span className="font-display text-lg font-extrabold tabular">{fcfa(p.price)}{p.unit === "kg" && <span className="text-xs font-semibold text-mute"> /kg</span>}</span>
                </button>
              </li>
            ))}
            {!shown.length && <li className="col-span-full p-8 text-center text-mute">Aucun produit.</li>}
          </ul>
        </section>

        {/* ticket en cours */}
        <aside className="flex w-[380px] shrink-0 flex-col border-l border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-lg font-extrabold">Ticket <span className="text-sm font-semibold text-mute">({count} article{count > 1 ? "s" : ""})</span></p>
            {lines.length > 0 && <button type="button" onClick={() => { setLines([]); setSel(null); }} className="flex items-center gap-1 text-sm text-mute hover:text-red"><IconTrash className="size-4" /> Vider</button>}
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {lines.map((l) => {
              const active = sel?.id === l.id;
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => setSel({ id: l.id, buf: "", fresh: true })} aria-pressed={active}
                    className={`block w-full px-4 py-2.5 text-left ${active ? "bg-red-50 shadow-[inset_4px_0_0_var(--color-red)]" : "hover:bg-cream"}`}>
                    <span className="flex justify-between gap-2 text-sm">
                      <span className="font-semibold">{l.name}</span>
                      <span className="font-semibold tabular">{fcfa(lineTotal(l))}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between text-xs text-mute tabular">
                      <span>{fcfa(l.price)}{l.unit === "kg" ? " /kg" : ""}</span>
                      <span className={`rounded-md px-2 py-0.5 text-sm font-bold ${active ? "bg-red text-white" : "bg-cream text-ink"}`}>
                        {active && !sel.fresh ? `${sel.buf}${l.unit === "kg" ? " kg" : ""}` : fmtQty(l.qty, l.unit)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {!lines.length && <li className="p-8 text-center text-sm text-mute">Touchez un produit ou scannez un code-barres, puis tapez la quantité sur le pavé.</li>}
          </ul>
          <div className="space-y-3 border-t border-line p-4">
            {error && !paying && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="font-display text-4xl font-black tabular">{fcfa(total)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5" aria-label="Pavé numérique">
              {["7", "8", "9", "⌫", "4", "5", "6", "suppr", "1", "2", "3", ",", "0", "00", "-1", "+1"].map((k) => (
                <button key={k} type="button" disabled={!selLine} onClick={() => press(k)}
                  className={`h-12 rounded-lg text-lg font-bold tabular disabled:opacity-35 ${k === "suppr" ? "bg-red-50 text-sm text-red" : /^[0-9,]+$/.test(k) ? "bg-cream active:bg-line" : "bg-ink/5 text-base active:bg-line"}`}
                  aria-label={k === "⌫" ? "Effacer un chiffre" : k === "suppr" ? "Supprimer la ligne" : k === "+1" ? "Plus un" : k === "-1" ? "Moins un" : k}>
                  {k === "suppr" ? "Suppr." : k === "-1" ? "−1" : k}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" disabled={!lines.length} onClick={() => pay("especes")} className="h-14 rounded-xl bg-leaf text-base font-bold text-white disabled:opacity-40">Espèces</button>
              <button type="button" disabled={!lines.length} onClick={() => pay("wave")} className="h-14 rounded-xl bg-[#1dc3ff] text-base font-bold text-ink disabled:opacity-40">Wave</button>
              <button type="button" disabled={!lines.length} onClick={() => pay("om")} className="h-14 rounded-xl bg-[#ff7900] text-base font-bold text-white disabled:opacity-40">Orange Money</button>
            </div>
          </div>
        </aside>
      </div>

      {/* paiement */}
      {paying && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal aria-label="Paiement">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-mute">{PAY_LABEL[paying.method]}</p><p className="font-display text-4xl font-black tabular">{fcfa(total)}</p></div>
              <button type="button" onClick={() => { setPaying(null); setError(""); }} aria-label="Fermer"><IconClose className="size-6" /></button>
            </div>
            {paying.method === "especes" ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {[total, 1000, 2000, 5000, 10000].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4).map((v) => (
                    <button key={v} type="button" onClick={() => setPaying({ ...paying, cash: String(v) })} className="h-12 rounded-xl bg-sun-100 text-sm font-bold tabular">{v === total ? "Compte juste" : fcfa(v)}</button>
                  ))}
                </div>
                <div className="flex justify-between rounded-xl bg-cream px-4 py-3">
                  <span className="text-mute">Donné</span>
                  <span className="font-display text-2xl font-black tabular">{fcfa(cashGiven ?? 0)}</span>
                </div>
                <Keypad value={paying.cash} onChange={(v) => setPaying({ ...paying, cash: v.replace(/\D/g, "") })} />
                <div className={`flex justify-between rounded-xl px-4 py-3 ${change != null && change >= 0 ? "bg-leaf-50 text-leaf" : "bg-cream text-mute"}`}>
                  <span className="font-semibold">Monnaie à rendre</span>
                  <span className="font-display text-2xl font-black tabular">{change != null && change >= 0 ? fcfa(change) : "—"}</span>
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-cream p-4 text-sm">Vérifiez sur le téléphone marchand la réception de <strong>{fcfa(total)}</strong> par {PAY_LABEL[paying.method]}, puis validez.</p>
            )}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="button" onClick={confirm} disabled={pending} className="btn-primary h-16 w-full text-xl">{pending ? "Encaissement…" : "Encaisser et imprimer"}</button>
          </div>
        </div>
      )}

      {/* ticket encaissé */}
      {receipt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 print:hidden" role="dialog" aria-modal aria-label="Ticket encaissé">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 text-center">
            <p className="font-display text-2xl font-black text-leaf">Encaissé</p>
            <p className="text-mute">Ticket {receipt.number} · {fcfa(receipt.total)}</p>
            {receipt.change != null && <p className="rounded-xl bg-leaf-50 py-4 font-display text-3xl font-black text-leaf tabular">Rendre {fcfa(receipt.change)}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => window.print()} className="btn-ghost h-14">Réimprimer</button>
              <button type="button" onClick={() => { setReceipt(null); setTimeout(() => searchRef.current?.focus(), 0); }} className="btn-primary h-14 text-base">Client suivant</button>
            </div>
          </div>
        </div>
      )}

      {/* tickets du jour */}
      {history && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/50 print:hidden" role="dialog" aria-modal aria-label="Tickets du jour">
          <div className="flex h-full w-full max-w-lg flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="font-display text-xl font-extrabold">Tickets du jour</p>
                <p className="text-sm text-mute">{history.filter((h) => !h.cancelled_at).length} ticket(s) · {fcfa(history.filter((h) => !h.cancelled_at).reduce((n, h) => n + h.total, 0))}</p>
              </div>
              <button type="button" onClick={() => setHistory(null)} aria-label="Fermer"><IconClose className="size-6" /></button>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {history.map((h) => (
                <li key={h.id} className={`flex items-center justify-between gap-3 px-5 py-3 ${h.cancelled_at ? "opacity-50" : ""}`}>
                  <div>
                    <p className="font-semibold tabular">{h.number} · {fcfa(h.total)}</p>
                    <p className="text-xs text-mute">
                      {new Date(h.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dakar" })} · {PAY_LABEL[h.payment_method as Pay]}{h.cancelled_at ? " · annulé" : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHistory(null);
                        setReceipt({
                          number: h.number, at: h.created_at, cashier, payment: PAY_LABEL[h.payment_method as Pay], total: h.total,
                          cash: h.cash_given, change: h.change_given,
                          lines: (h.sale_items ?? []).map((i) => ({ name: i.name, unit: i.unit, qty: Number(i.qty), price: i.unit_price, total: i.line_total })),
                          store, duplicate: true,
                        });
                      }}
                      className="btn-ghost min-h-10 px-3"
                    >
                      Réimprimer
                    </button>
                    {isManager && !h.cancelled_at && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Annuler le ticket ${h.number} ? Le stock sera rendu.`)) return;
                          start(async () => { const r = await cancelSale(h.id); if (r.error) setError(r.error); setHistory(await todaySales()); });
                        }}
                        className="min-h-10 rounded-xl px-3 text-sm text-red hover:bg-red-50"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {!history.length && <li className="p-8 text-center text-mute">Aucun ticket aujourd&apos;hui.</li>}
            </ul>
          </div>
        </div>
      )}

      {receipt && <Receipt data={receipt} />}
      {closing && <CloseRegister cashier={cashier} store={store} onClose={() => setClosing(false)} />}
      <OrderToast toast={alerts.toast} onClose={alerts.closeToast} />
    </div>
  );
}
