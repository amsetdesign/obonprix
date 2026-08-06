import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateId, getProducts, saveProducts, slugify } from "@/lib/store";
import type { Product } from "@/lib/types";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name || !body.category || typeof body.price !== "number") {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const products = await getProducts();

  const newProduct: Product = {
    id: generateId(),
    name: body.name,
    slug: slugify(body.name),
    category: body.category,
    price: body.price,
    oldPrice: body.oldPrice || undefined,
    unit: body.unit || "unité",
    emoji: body.emoji || "🛒",
    description: body.description || "",
    inStock: body.inStock ?? true,
    featured: body.featured ?? false,
    badge: body.badge || undefined,
  };

  products.push(newProduct);
  await saveProducts(products);

  return NextResponse.json(newProduct, { status: 201 });
}
