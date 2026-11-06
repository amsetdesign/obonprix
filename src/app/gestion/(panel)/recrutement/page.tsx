import type { Metadata } from "next";
import { requireStaff } from "@/lib/staff";
import { dateTime } from "@/lib/format";
import OfferForm from "./OfferForm";
import CvButton from "./CvButton";
import { setApplicationStatus, toggleOffer } from "./actions";

export const metadata: Metadata = { title: "Recrutement" };

const STATUS: Record<string, { label: string; tone: string }> = {
  nouvelle: { label: "Nouvelle", tone: "bg-red-50 text-red" },
  vue: { label: "Vue", tone: "bg-cream text-ink" },
  retenue: { label: "Retenue", tone: "bg-leaf-50 text-leaf" },
  refusee: { label: "Non retenue", tone: "bg-cream text-mute" },
};

export default async function RecruitmentAdmin() {
  const { supabase } = await requireStaff(["gerant"]);
  const [{ data: offers }, { data: apps }] = await Promise.all([
    supabase.from("job_offers").select("id, title, contract, location, is_open, closes_on, created_at").order("created_at", { ascending: false }),
    supabase.from("job_applications").select("id, offer_id, full_name, phone, email, message, cv_path, status, created_at").order("created_at", { ascending: false }).limit(200),
  ]);
  const title = new Map((offers ?? []).map((o) => [o.id, o.title]));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Recrutement</h1>
        <p className="mt-1 text-sm text-mute">Les offres ouvertes s&apos;affichent sur la page « Recrutement » du site. Les candidatures (et les CV) ne sont visibles que par vous.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold">Candidatures</h2>
        <ul className="space-y-2">
          {(apps ?? []).map((a) => {
            const st = STATUS[a.status];
            const wa = a.phone.replace(/\D/g, "");
            return (
              <li key={a.id} className="card space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.full_name} <span className={`pill ml-1 ${st.tone}`}>{st.label}</span></p>
                    <p className="text-sm text-mute">{a.offer_id ? title.get(a.offer_id) ?? "Offre supprimée" : "Candidature spontanée"} · {dateTime(a.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="btn-ghost min-h-9 px-3">Appeler</a>
                    <a href={`https://wa.me/${wa.length === 9 ? `221${wa}` : wa}`} className="btn-ghost min-h-9 px-3">WhatsApp</a>
                    {a.cv_path && <CvButton id={a.id} />}
                  </div>
                </div>
                <p className="text-sm tabular">{a.phone}{a.email ? ` · ${a.email}` : ""}</p>
                {a.message && <p className="whitespace-pre-line text-sm text-ink/80">{a.message}</p>}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS).filter(([k]) => k !== a.status).map(([k, v]) => (
                    <form key={k} action={setApplicationStatus.bind(null, a.id, k)}>
                      <button type="submit" className="rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-line hover:ring-ink/30">Marquer « {v.label} »</button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
          {!apps?.length && <li className="card p-6 text-center text-mute">Aucune candidature pour l&apos;instant.</li>}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold">Offres</h2>
        <ul className="card divide-y divide-line">
          {(offers ?? []).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span><strong>{o.title}</strong> <span className="text-sm text-mute">· {o.contract} · {o.location}{o.closes_on ? ` · jusqu'au ${o.closes_on.split("-").reverse().join("/")}` : ""}</span></span>
              <form action={toggleOffer.bind(null, o.id, !o.is_open)}>
                <button type="submit" className={`pill px-3 py-1 ${o.is_open ? "bg-leaf-50 text-leaf" : "bg-cream text-mute"}`}>{o.is_open ? "En ligne · fermer" : "Fermée · rouvrir"}</button>
              </form>
            </li>
          ))}
          {!offers?.length && <li className="px-5 py-5 text-sm text-mute">Aucune offre publiée.</li>}
        </ul>
        <OfferForm />
      </section>
    </div>
  );
}
