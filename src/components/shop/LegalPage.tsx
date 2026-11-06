/** Mise en page commune des pages légales (texte long lisible) */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black sm:text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-mute">Dernière mise à jour : {updated}</p>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink/85 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </main>
  );
}
