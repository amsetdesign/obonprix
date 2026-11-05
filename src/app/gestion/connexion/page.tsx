import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/staff";
import { hasSupabase } from "@/lib/supabase/env";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion de l'équipe", robots: { index: false } };

export default async function LoginPage() {
  if (await getStaff()) redirect("/gestion");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">
        <Image src="/brand/logo.png" alt="Ô Bon Prix" width={180} height={84} className="mx-auto" priority />
        <h1 className="mt-6 text-center font-display text-xl font-extrabold">Espace équipe</h1>
        <p className="mt-1 text-center text-sm text-mute">Stock, caisse et commandes.</p>
        {hasSupabase ? (
          <LoginForm />
        ) : (
          <p className="mt-6 rounded-xl bg-sun-100 p-4 text-sm">La base de données n&apos;est pas encore reliée (fichier .env.local).</p>
        )}
      </div>
    </main>
  );
}
