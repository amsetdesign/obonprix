import type { CartLine, Product } from "./types";

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function buildWhatsAppOrderMessage(
  lines: CartLine[],
  products: Product[],
  customerName?: string
): string {
  const rows = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return "";
    const total = product.price * line.quantity;
    return `• ${product.name} — ${line.quantity} x ${formatFcfa(product.price)} = ${formatFcfa(total)}`;
  });

  const total = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + (product ? product.price * line.quantity : 0);
  }, 0);

  const greeting = customerName
    ? `Bonjour, je suis ${customerName}. Je souhaite passer la commande suivante sur Ô Bon Prix :`
    : "Bonjour, je souhaite passer la commande suivante sur Ô Bon Prix :";

  return [
    greeting,
    "",
    ...rows,
    "",
    `Total : ${formatFcfa(total)}`,
  ].join("\n");
}

export function buildWhatsAppLink(message: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
