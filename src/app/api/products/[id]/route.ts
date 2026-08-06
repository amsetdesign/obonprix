import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProducts, saveProducts, slugify } from "@/lib/store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  const existing = products[index];
  const updated = {
    ...existing,
    name: body.name ?? existing.name,
    slug: body.name ? slugify(body.name) : existing.slug,
    category: body.category ?? existing.category,
    price: typeof body.price === "number" ? body.price : existing.price,
    oldPrice: body.oldPrice === "" || body.oldPrice === null ? undefined : body.oldPrice ?? existing.oldPrice,
    unit: body.unit ?? existing.unit,
    emoji: body.emoji ?? existing.emoji,
    description: body.description ?? existing.description,
    inStock: body.inStock ?? existing.inStock,
    featured: body.featured ?? existing.featured,
    badge: body.badge === "" ? undefined : body.badge ?? existing.badge,
  };

  products[index] = updated;
  await saveProducts(products);

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  }

  await saveProducts(filtered);
  return NextResponse.json({ ok: true });
}
