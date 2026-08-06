import Link from "next/link";
import { ArrowRight, ShieldCheck, Timer, Truck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-red-600">
      <div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-gold-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-brand-red-800/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div className="text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            Votre supérette de quartier, en ligne
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Vos courses,
            <span className="block text-brand-gold-300">au meilleur prix.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-brand-red-50/90 sm:text-lg">
            Épicerie, boissons, produits frais et plus encore. Composez votre panier en
            quelques clics et validez votre commande directement sur WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gold-400 px-6 py-3.5 font-semibold text-brand-red-900 shadow-lg shadow-black/10 transition hover:bg-brand-gold-300"
            >
              Découvrir le catalogue <ArrowRight size={18} />
            </Link>
            <a
              href="https://wa.me/221787378290"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Commander sur WhatsApp
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6 text-white/90">
            <div className="flex flex-col items-start gap-1.5">
              <Truck size={20} className="text-brand-gold-300" />
              <span className="text-xs font-medium sm:text-sm">Livraison rapide</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <ShieldCheck size={20} className="text-brand-gold-300" />
              <span className="text-xs font-medium sm:text-sm">Produits garantis</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Timer size={20} className="text-brand-gold-300" />
              <span className="text-xs font-medium sm:text-sm">Commande en 2 min</span>
            </div>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {["🍚", "🥤", "🧀", "🧴", "🍫", "🍗"].map((emoji, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-3xl bg-white/95 text-6xl shadow-2xl ${
                  i % 2 === 0 ? "translate-y-4" : "-translate-y-2"
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
