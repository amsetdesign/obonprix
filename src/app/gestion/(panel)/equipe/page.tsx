import type { Metadata } from "next";
import { requireStaff } from "@/lib/staff";
import { serviceClient } from "@/lib/supabase/service";
import { ROLE_LABEL, type StaffRole } from "@/lib/roles";
import AddMemberForm from "./AddMemberForm";
import { updateMember } from "./actions";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const { supabase, userId } = await requireStaff(["gerant"]);
  const { data: team } = await supabase.from("profiles").select("id, full_name, phone, role, active").not("role", "is", null).order("created_at");
  // les e-mails sont dans le service d'authentification (lecture avec la clé de service)
  const admin = serviceClient();
  const emails = new Map<string, string>();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    data?.users.forEach((u) => emails.set(u.id, u.email ?? ""));
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Équipe</h1>
        <p className="mt-1 text-sm text-mute">Chaque membre voit uniquement ce que son rôle permet. Un compte désactivé ne peut plus rien faire.</p>
      </header>

      <ul className="card divide-y divide-line">
        {(team ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="font-semibold">{m.full_name || "Sans nom"} {m.id === userId && <span className="text-sm font-normal text-mute">(vous)</span>}</p>
              <p className="text-sm text-mute">{emails.get(m.id) ?? ""}</p>
            </div>
            {m.id === userId ? (
              <span className="pill bg-red-50 text-red">{ROLE_LABEL[m.role as StaffRole]}</span>
            ) : (
              <form action={updateMember.bind(null, m.id)} className="flex flex-wrap items-center gap-3">
                <select name="role" defaultValue={m.role} className="field w-auto py-2" aria-label={`Rôle de ${m.full_name}`}>
                  {(Object.keys(ROLE_LABEL) as StaffRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={m.active} className="size-4 accent-[var(--color-red)]" /> Actif</label>
                <button type="submit" className="btn-ghost min-h-10">Enregistrer</button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <AddMemberForm />
    </div>
  );
}
