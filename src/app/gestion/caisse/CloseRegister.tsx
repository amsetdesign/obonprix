"use client";

import { useEffect, useState, useTransition } from "react";
import { fcfa } from "@/lib/format";
import { IconClose } from "@/components/icons";
import Keypad from "./Keypad";
import { closeRegister, registerStatus, type Closure, type RegisterStatus } from "./actions";

const FLOAT_KEY = "obp-fond-de-caisse";
const time = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(iso));

/** Clôture de caisse : point des ventes, comptage des espèces, écart, ticket Z imprimé */
export default function CloseRegister({ cashier, store, onClose }: { cashier: string; store: { phone: string; address: string }; onClose: () => void }) {
  const [st, setSt] = useState<RegisterStatus | null>(null);
  const [field, setField] = useState<"float" | "counted">("counted");
  // fenêtre ouverte au clic (jamais rendue côté serveur) : le dernier fond de caisse est relu directement
  const [float, setFloat] = useState(() => { try { return localStorage.getItem(FLOAT_KEY) ?? ""; } catch { return ""; } });
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Closure | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    registerStatus().then(setSt).catch(() => setError("Point de caisse indisponible."));
  }, []);
  useEffect(() => { if (done) setTimeout(() => window.print(), 250); }, [done]);

  const f = Number(float || 0), c = counted === "" ? null : Number(counted);
  const expected = st ? f + st.cash : null;
  const diff = expected != null && c != null ? c - expected : null;

  const confirm = () => {
    if (c == null) { setError("Saisissez les espèces comptées dans le tiroir."); return; }
    setError("");
    start(async () => {
      const r = await closeRegister(f, c, note);
      if (r.error || !r.closure) { setError(r.error ?? "Erreur"); return; }
      try { localStorage.setItem(FLOAT_KEY, String(f)); } catch { /* sans conséquence */ }
      setDone(r.closure);
    });
  };

  return (
    <>
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4 print:hidden" role="dialog" aria-modal aria-label="Clôture de caisse">
      <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-2xl font-black">{done ? "Caisse clôturée" : "Clôture de caisse"}</p>
            {st && <p className="text-sm text-mute">Depuis le {time(st.since)} · {st.tickets} ticket{st.tickets > 1 ? "s" : ""}{st.cancelled ? ` · ${st.cancelled} annulé${st.cancelled > 1 ? "s" : ""}` : ""}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"><IconClose className="size-6" /></button>
        </div>

        {st && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["Espèces", st.cash], ["Wave", st.wave], ["Orange Money", st.om]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl bg-cream p-3">
                <p className="text-xs text-mute">{l}</p>
                <p className="font-display text-xl font-extrabold tabular">{fcfa(v as number)}</p>
              </div>
            ))}
          </div>
        )}

        {done ? (
          <div className="mt-5 space-y-3 text-center">
            <p className={`rounded-xl py-4 font-display text-2xl font-black tabular ${done.difference === 0 ? "bg-leaf-50 text-leaf" : done.difference > 0 ? "bg-sun-100 text-[#7a5300]" : "bg-red-50 text-red"}`}>
              {done.difference === 0 ? "Caisse juste" : done.difference > 0 ? `Excédent ${fcfa(done.difference)}` : `Manque ${fcfa(-done.difference)}`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => window.print()} className="btn-ghost h-14">Réimprimer le ticket Z</button>
              <button type="button" onClick={onClose} className="btn-primary h-14 text-base">Terminer</button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              {([["float", "Fond de caisse (mis le matin)", f], ["counted", "Espèces comptées dans le tiroir", c ?? 0]] as const).map(([k, l, v]) => (
                <button key={k} type="button" onClick={() => setField(k)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${field === k ? "border-red bg-red-50" : "border-line"}`}>
                  <span className="text-sm font-semibold">{l}</span>
                  <span className="font-display text-2xl font-black tabular">{fcfa(v)}</span>
                </button>
              ))}
              <div className="rounded-xl bg-cream px-4 py-3 text-sm">
                <div className="flex justify-between"><span>Attendu dans le tiroir</span><strong className="tabular">{expected == null ? "…" : fcfa(expected)}</strong></div>
                <p className="text-xs text-mute">Fond de caisse + ventes en espèces</p>
              </div>
              {diff != null && (
                <p className={`rounded-xl px-4 py-3 text-center font-display text-xl font-black tabular ${diff === 0 ? "bg-leaf-50 text-leaf" : diff > 0 ? "bg-sun-100 text-[#7a5300]" : "bg-red-50 text-red"}`}>
                  {diff === 0 ? "Caisse juste" : diff > 0 ? `Excédent ${fcfa(diff)}` : `Manque ${fcfa(-diff)}`}
                </p>
              )}
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Remarque (facultatif)" className="field" />
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="button" onClick={confirm} disabled={pending || !st} className="btn-primary h-14 w-full text-lg">{pending ? "Clôture…" : "Clôturer et imprimer"}</button>
            </div>
            <Keypad value={field === "float" ? float : counted} onChange={(v) => (field === "float" ? setFloat(v.replace(/\D/g, "")) : setCounted(v.replace(/\D/g, "")))} />
          </div>
        )}
      </div>
    </div>

      {/* ticket Z (imprimé seul, hors de la fenêtre masquée à l'impression) */}
      {done && (
        <>
          <style>{`
            @media screen { #ticket-z { display: none; } }
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body * { visibility: hidden; }
              #ticket-z, #ticket-z * { visibility: visible; }
              #ticket-z { position: absolute; left: 0; top: 0; width: 72mm; padding: 2mm 3mm 6mm; font: 12px/1.4 Arial, sans-serif; color: #000; }
            }
          `}</style>
          <div id="ticket-z" aria-hidden>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15 }}>Ô BON PRIX · CLÔTURE DE CAISSE</div>
            <div style={{ textAlign: "center" }}>{store.address}</div>
            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
            <div>Du {time(done.period_start)}</div>
            <div>Au {time(done.period_end)}</div>
            <div>Caisse : {cashier}</div>
            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
            {[["Tickets", String(done.tickets)], ["Tickets annulés", String(done.cancelled)], ["Ventes espèces", fcfa(done.cash_sales)], ["Ventes Wave", fcfa(done.wave_sales)], ["Ventes Orange Money", fcfa(done.om_sales)],
              ["TOTAL VENTES", fcfa(done.cash_sales + done.wave_sales + done.om_sales)]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontWeight: l === "TOTAL VENTES" ? 700 : 400 }}><span>{l}</span><span>{v}</span></div>
            ))}
            <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
            {[["Fond de caisse", fcfa(done.opening_float)], ["Espèces attendues", fcfa(done.expected_cash)], ["Espèces comptées", fcfa(done.counted_cash)], ["ÉCART", fcfa(done.difference)]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontWeight: l === "ÉCART" ? 700 : 400 }}><span>{l}</span><span>{v}</span></div>
            ))}
            {done.note && <div style={{ marginTop: 6 }}>Remarque : {done.note}</div>}
            <div style={{ marginTop: 18 }}>Signature :</div>
          </div>
        </>
      )}
    </>
  );
}
