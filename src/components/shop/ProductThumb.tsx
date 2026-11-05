import Image from "next/image";
import { IconBottle, IconCandy, IconCart, IconJar, IconLeaf, IconSnow, IconSpray } from "@/components/icons";

// Teinte et pictogramme de chaque rayon : servent de vignette tant qu'un produit n'a pas sa photo
export const RAYON_STYLE: Record<string, { tint: string; ink: string; Icon: (p: { className?: string }) => React.ReactNode }> = {
  "produits-frais": { tint: "#eaf5ec", ink: "#1f7a4d", Icon: IconLeaf },
  "epicerie-salee": { tint: "#fdeeea", ink: "#b3261e", Icon: IconJar },
  "epicerie-sucree": { tint: "#fff3d6", ink: "#8a5a00", Icon: IconCandy },
  surgeles: { tint: "#e8f1fb", ink: "#1d5fa0", Icon: IconSnow },
  boissons: { tint: "#fdecef", ink: "#a3214a", Icon: IconBottle },
  "hygiene-entretien": { tint: "#eef0fb", ink: "#3f4aa8", Icon: IconSpray },
};
const FALLBACK = { tint: "#f3efe8", ink: "#6f6760", Icon: IconCart };

export default function ProductThumb({ name, image, rayon, sizes, className = "" }: { name: string; image: string; rayon?: string; sizes: string; className?: string }) {
  if (image) {
    return (
      <div className={`relative overflow-hidden bg-white ${className}`}>
        <Image src={image} alt={name} fill sizes={sizes} className="object-contain p-3" />
      </div>
    );
  }
  const s = (rayon && RAYON_STYLE[rayon]) || FALLBACK;
  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-3 text-center ${className}`} style={{ background: s.tint, color: s.ink }}>
      <s.Icon className="size-9 opacity-80" />
      <span className="line-clamp-2 font-display text-[13px] font-bold leading-tight">{name}</span>
    </div>
  );
}
