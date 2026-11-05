import Image from "next/image";
import { IconBottle, IconCandy, IconCart, IconJar, IconLeaf, IconSnow, IconSpray } from "@/components/icons";

// Teinte et pictogramme de chaque rayon : vignette discrète tant qu'un produit n'a pas sa photo
export const RAYON_STYLE: Record<string, { tint: string; ink: string; Icon: (p: { className?: string }) => React.ReactNode }> = {
  "produits-frais": { tint: "#eef6f0", ink: "#1f7a4d", Icon: IconLeaf },
  "epicerie-salee": { tint: "#fbefec", ink: "#b3261e", Icon: IconJar },
  "epicerie-sucree": { tint: "#fdf5e1", ink: "#8a5a00", Icon: IconCandy },
  surgeles: { tint: "#edf3fb", ink: "#1d5fa0", Icon: IconSnow },
  boissons: { tint: "#fbeef1", ink: "#a3214a", Icon: IconBottle },
  "hygiene-entretien": { tint: "#f0f1fb", ink: "#3f4aa8", Icon: IconSpray },
};
const FALLBACK = { tint: "#f4f0ea", ink: "#6f6760", Icon: IconCart };

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
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: s.tint, color: s.ink }} role={name ? "img" : undefined} aria-label={name || undefined}>
      {/* pictogramme du rayon en filigrane, en attendant la photo du produit */}
      <s.Icon className="size-[38%] max-h-16 max-w-16 opacity-25" />
    </div>
  );
}
