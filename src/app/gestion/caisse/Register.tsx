"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { fcfa, qty as fmtQty } from "@/lib/format";
import { IconClose, IconMinus, IconPlus, IconReceipt, IconSearch, IconTrash } from "@/components/icons";
import { cancelSale, recordSale, todaySales } from "./actions";
import Receipt, { type ReceiptData } from "./Receipt";

type Product = { id: string; name: string; unit: "piece" | "kg"; price: number; barcode: string | null; category_id: number | null; kind: string };
type Line = Product & { qty: number };
type Pay = "especes" | "wave" | "om";
type Props = { products: Product[]; categories: { id: number; name: string }[]; cashier: string; isManager: boolean; store: { phone: string; address: string } };

const PAY_LABEL: Record<Pay, string> = { especes: "Espèces", wave: "Wave", om: "Orange Money" };
const plain = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const lineTotal = (l: Line) => Math.round(l.price * l.qty);

/** Pavé numérique tactile */
function Keypad({ value, onChange, decimal }: { value: string; onChange: (v: string) => void; decimal?: boolean }) {
  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", decimal ? "," : "00", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            if (k === "⌫") onChange(value.slice(0, -1));
            else if (k === "," && value.includes(",")) return;
            else onChange((value === "0" && k !== "," ? "" : value) + k);
          }}
          className="h-16 rounded-xl bg-cream text-2xl font-bold tabular active:bg-line"
          aria-label={k === "⌫" ? "Effacer" : k}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

export default function Register({ products, categories, cashier, isManager, store }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<number | null>(null);
  const [weighing, setWeighing] = useState<{ product: Product; value: string } | null>(null);
  const [paying, setPaying] = useState<{ method: Pay; cash: string } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof todaySales>> | null>(null);
  const [error, setError] = useState("");
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
  const tap = (p: Product) => (p.unit === "kg" ? setWeighing({ product: p, value: "" }) : addQty(p, 1));
  const setQty = (id: string, q: number) => setLines((ls) => ls.flatMap((l) => (l.id !== id ? [l] : q > 0 ? [{ ...l, qty: Math.round(q * 1000) / 1000 }] : [])));

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
            {lines.length > 0 && <button type="button" onClick={() => setLines([])} className="flex items-center gap-1 text-sm text-mute hover:text-red"><IconTrash className="size-4" /> Vider</button>}
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {lines.map((l) => (
              <li key={l.id} className="px-4 py-2.5">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{l.name}</span>
                  <span className="font-semibold tabular">{fcfa(lineTotal(l))}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-mute tabular">{fcfa(l.price)}{l.unit === "kg" ? " /kg" : ""}</span>
                  {l.unit === "kg" ? (
                    <button type="button" onClick={() => setWeighing({ product: l, value: String(l.qty).replace(".", ",") })} className="rounded-lg bg-cream px-3 py-2 text-sm font-semibold tabular">{fmtQty(l.qty, "kg")}</button>
                  ) : (
                    <span className="flex items-center gap-1">
                      <button type="button" onClick={() => setQty(l.id, l.qty - 1)} className="flex size-10 items-center justify-center rounded-lg bg-cream" aria-label="Moins un"><IconMinus className="size-4" /></button>
                      <span className="w-8 text-center font-bold tabular">{l.qty}</span>
                      <button type="button" onClick={() => setQty(l.id, l.qty + 1)} className="flex size-10 items-center justify-center rounded-lg bg-cream" aria-label="Plus un"><IconPlus className="size-4" /></button>
                    </span>
                  )}
                </div>
              </li>
            ))}
            {!lines.length && <li className="p-8 text-center text-sm text-mute">Touchez un produit ou scannez un code-barres.</li>}
          </ul>
          <div className="space-y-3 border-t border-line p-4">
            {error && !paying && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="font-display text-4xl font-black tabular">{fcfa(total)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" disabled={!lines.length} onClick={() => pay("especes")} className="h-16 rounded-xl bg-leaf text-base font-bold text-white disabled:opacity-40">Espèces</button>
              <button type="button" disabled={!lines.length} onClick={() => pay("wave")} className="h-16 rounded-xl bg-[#1dc3ff] text-base font-bold text-ink disabled:opacity-40">Wave</button>
              <button type="button" disabled={!lines.length} onClick={() => pay("om")} className="h-16 rounded-xl bg-[#ff7900] text-base font-bold text-white disabled:opacity-40">Orange Money</button>
            </div>
          </div>
        </aside>
      </div>

      {/* pesée d'un produit au kilo */}
      {weighing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal aria-label={`Poids : ${weighing.product.name}`}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-display text-lg font-extrabold">{weighing.product.name}</p><p className="text-sm text-mute">{fcfa(weighing.product.price)} le kilo</p></div>
              <button type="button" onClick={() => setWeighing(null)} aria-label="Fermer"><IconClose className="size-6" /></button>
            </div>
            <p className="rounded-xl bg-cream px-4 py-3 text-right font-display text-4xl font-black tabular">{weighing.value || "0"} <span className="text-xl">kg</span></p>
            <p className="text-right text-sm text-mute tabular">= {fcfa(Math.round(weighing.product.price * (Number(weighing.value.replace(",", ".")) || 0)))}</p>
            <Keypad decimal value={weighing.value} onChange={(v) => setWeighing({ ...weighing, value: v })} />
            <button
              type="button"
              onClick={() => {
                const q = Number(weighing.value.replace(",", "."));
                if (!(q > 0)) return;
                const existing = lines.find((l) => l.id === weighing.product.id);
                if (existing) setQty(existing.id, q); else addQty(weighing.product, q);
                setWeighing(null);
              }}
              className="btn-primary h-14 w-full text-lg"
            >
              Valider le poids
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}
