"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppFloatButton() {
  return (
    <a
      href="https://wa.me/221787378290?text=Bonjour%20%C3%94%20Bon%20Prix%2C%20j%27ai%20une%20question."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter Ô Bon Prix sur WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-500 text-white shadow-xl shadow-black/20 transition hover:scale-105 active:scale-95"
    >
      <MessageCircle size={26} fill="white" className="text-brand-green-500" />
    </a>
  );
}
