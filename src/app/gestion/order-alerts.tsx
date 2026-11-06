"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fcfa } from "@/lib/format";
import { orderPulse, type OrderPulse } from "./(panel)/watch-actions";
import { savePushSubscription } from "./push-actions";

const SEEN_KEY = "obp-derniere-commande-vue";
const POLL_MS = 30_000;

/** Petit carillon (deux notes), sans fichier son à charger */
function chime() {
  try {
    const ctx = new AudioContext();
    [[880, 0], [1320, 0.18]].forEach(([freq, at]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.65);
    });
  } catch { /* son bloqué par le navigateur : la pastille et le message restent */ }
}

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function base64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Abonne l'appareil aux notifications (même gestion fermée) ; renvoie un message d'erreur lisible sinon */
async function subscribeDevice(): Promise<string | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID) {
    return /iphone|ipad/i.test(navigator.userAgent)
      ? "Sur iPhone : ajoutez d'abord la gestion à l'écran d'accueil (Partager > Sur l'écran d'accueil), puis ouvrez-la depuis l'icône."
      : "Ce navigateur ne reçoit pas les notifications. Utilisez Chrome.";
  }
  const reg = await navigator.serviceWorker.register("/sw-gestion.js", { scope: "/gestion" });
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(VAPID) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const res = await savePushSubscription(json, navigator.userAgent);
  return res.ok ? null : res.error ?? "Enregistrement impossible.";
}

/**
 * Surveille les commandes en ligne (toutes les 30 s et au retour sur la page) :
 * nombre en attente pour la pastille, carillon + message + notification à chaque nouvelle commande.
 */
export function useOrderAlerts(initial: OrderPulse | null) {
  const router = useRouter();
  const [pulse, setPulse] = useState(initial);
  const [toast, setToast] = useState<OrderPulse["latest"]>(null);
  const [perm, setPerm] = useState<NotificationPermission | "absent">("default");
  const [pushError, setPushError] = useState<string | null>(null);
  const lastId = useRef<string | null>(null);

  // commande la plus récente déjà signalée sur cet appareil
  useEffect(() => {
    try { lastId.current = localStorage.getItem(SEEN_KEY) ?? initial?.latest?.id ?? null; } catch { lastId.current = initial?.latest?.id ?? null; }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- état du navigateur lu une fois après hydratation
    setPerm(typeof Notification === "undefined" ? "absent" : Notification.permission);
    // appareil déjà autorisé : on s'assure qu'il reste abonné (nouvel appareil, abonnement renouvelé…)
    if (initial && typeof Notification !== "undefined" && Notification.permission === "granted") subscribeDevice().catch(() => {});
  }, [initial, initial?.latest?.id]);

  const check = useCallback(async () => {
    const p = await orderPulse().catch(() => null);
    if (!p) return;
    setPulse(p);
    const latest = p.latest;
    if (latest && latest.id !== lastId.current) {
      lastId.current = latest.id;
      try { localStorage.setItem(SEEN_KEY, latest.id); } catch { /* sans conséquence */ }
      setToast(latest);
      chime();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification("Nouvelle commande Ô Bon Prix", { body: `${latest.number} · ${latest.customer_name} · ${fcfa(latest.total)}`, icon: "/icon.png", tag: latest.id });
        n.onclick = () => { window.focus(); router.push(`/gestion/commandes/${latest.id}`); };
      }
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    if (!initial) return; // seulement pour le gérant et le vendeur
    const t = setInterval(check, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [check, initial]);

  // le nombre de commandes en attente apparaît aussi dans l'onglet du navigateur
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pulse?.count ? `(${pulse.count}) ${base}` : base;
  }, [pulse?.count]);

  const enable = async () => {
    chime(); // le clic autorise aussi le son pour la suite
    if (typeof Notification === "undefined") { setPushError(await subscribeDevice().catch(() => "Notifications indisponibles.")); return; }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") setPushError(await subscribeDevice().catch(() => "L'abonnement a échoué. Réessayez."));
    else setPushError("Notifications refusées : autorisez-les dans les réglages du navigateur pour ce site.");
  };

  return { pulse, toast, closeToast: () => setToast(null), perm, enable, pushError };
}

/** Message affiché en bas à droite à l'arrivée d'une commande */
export function OrderToast({ toast, onClose }: { toast: OrderPulse["latest"]; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div role="alert" className="fixed right-4 bottom-4 z-50 w-[min(92vw,360px)] rounded-2xl bg-ink p-4 text-white shadow-2xl print:hidden">
      <p className="text-xs font-bold tracking-[0.14em] text-sun uppercase">Nouvelle commande · {toast.channel === "app" ? "application" : "site"}</p>
      <p className="mt-1 font-display text-lg font-extrabold">{toast.number} · {fcfa(toast.total)}</p>
      <p className="text-sm text-white/75">{toast.customer_name}</p>
      <div className="mt-3 flex gap-2">
        <Link href={`/gestion/commandes/${toast.id}`} onClick={onClose} className="btn-primary min-h-10 flex-1">Ouvrir</Link>
        <button type="button" onClick={onClose} className="btn min-h-10 bg-white/10 text-white hover:bg-white/20">Plus tard</button>
      </div>
    </div>
  );
}

/** Pastille rouge : nombre de commandes en attente */
export function CountBadge({ count, inverted }: { count: number; inverted?: boolean }) {
  if (count <= 0) return null;
  return (
    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular ${inverted ? "bg-white text-red" : "bg-red text-white"}`} aria-label={`${count} commande${count > 1 ? "s" : ""} en attente`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
