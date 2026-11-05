import type { Metadata } from "next";
import MyOrders from "./MyOrders";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default function MyOrdersPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-black">Mes commandes</h1>
      <p className="mt-1 text-mute">Les commandes passées depuis ce téléphone, sans compte à créer.</p>
      <MyOrders />
    </main>
  );
}
