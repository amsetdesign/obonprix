"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { formatFcfa } from "@/lib/whatsapp";

type FormState = {
  id?: string;
  name: string;
  category: string;
  price: string;
  oldPrice: string;
  unit: string;
  emoji: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  badge: string;
};

const emptyForm: FormState = {
  name: "",
  category: "",
  price: "",
  oldPrice: "",
  unit: "",
  emoji: "🛒",
  description: "",
  inStock: true,
  featured: false,
  badge: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/categories", { cache: "no-store" }),
    ]);
    setProducts(await productsRes.json());
    setCategories(await categoriesRes.json());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const openCreate = () => {
    setForm({ ...emptyForm, category: categories[0]?.slug ?? "" });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      unit: product.unit,
      emoji: product.emoji,
      description: product.description,
      inStock: product.inStock,
      featured: product.featured,
      badge: product.badge ?? "",
    });
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : "",
      unit: form.unit,
      emoji: form.emoji,
      description: form.description,
      inStock: form.inStock,
      featured: form.featured,
      badge: form.badge,
    };

    const res = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Une erreur est survenue.");
      return;
    }

    setFormOpen(false);
    await loadData();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Supprimer « ${product.name} » ?`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    await loadData();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-stone-900">
            Gestion du catalogue
          </h1>
          <p className="text-sm text-stone-500">{products.length} produits au total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-full bg-brand-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-600"
          >
            <Plus size={16} /> Ajouter un produit
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-surface-muted"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full rounded-full border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-red-400"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border-subtle">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface">
            {filtered.map((product) => (
              <tr key={product.id}>
                <td className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted text-xl">
                    {product.emoji}
                  </span>
                  <div>
                    <p className="font-medium text-stone-800">{product.name}</p>
                    <p className="text-xs text-stone-400">{product.unit}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {categories.find((c) => c.slug === product.category)?.name ?? product.category}
                </td>
                <td className="px-4 py-3 font-semibold text-brand-red-600">
                  {formatFcfa(product.price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.inStock
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {product.inStock ? "En stock" : "Rupture"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="rounded-full p-2 text-stone-500 hover:bg-surface-muted hover:text-brand-red-600"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="rounded-full p-2 text-stone-500 hover:bg-surface-muted hover:text-brand-red-600"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {form.id ? "Modifier le produit" : "Nouveau produit"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-full p-1.5 text-stone-500 hover:bg-surface-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Nom du produit</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Catégorie</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Emoji / icône</label>
                  <input
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Prix (FCFA)</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Ancien prix</label>
                  <input
                    type="number"
                    min={0}
                    value={form.oldPrice}
                    onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500">Unité</label>
                  <input
                    placeholder="1kg, pack..."
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">
                  Badge (optionnel : Promo, Nouveau...)
                </label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle px-3 py-2 text-sm outline-none focus:border-brand-red-400"
                />
              </div>

              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                  />
                  En stock
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Mettre en avant
                </label>
              </div>

              {error && <p className="text-sm text-brand-red-600">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="mt-2 rounded-full bg-brand-red-500 py-2.5 font-semibold text-white hover:bg-brand-red-600 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : form.id ? "Enregistrer les modifications" : "Créer le produit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
