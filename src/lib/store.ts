import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { Category, Product } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

export async function getProducts(): Promise<Product[]> {
  const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function saveProducts(products: Product[]): Promise<void> {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export async function getCategories(): Promise<Category[]> {
  const raw = await fs.readFile(CATEGORIES_FILE, "utf-8");
  return JSON.parse(raw);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateId(): string {
  return `p${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
