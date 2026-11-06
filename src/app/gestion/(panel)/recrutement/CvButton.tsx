"use client";

import { useTransition } from "react";
import { cvLink } from "./actions";

/** Ouvre le CV via un lien temporaire (l'espace des CV est privé) */
export default function CvButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { const url = await cvLink(id); if (url) window.open(url, "_blank", "noopener"); })}
      className="btn-primary min-h-9 px-3"
    >
      {pending ? "…" : "Voir le CV"}
    </button>
  );
}
