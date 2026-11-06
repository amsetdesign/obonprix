export type StaffRole = "gerant" | "stock" | "vendeur" | "livreur";

export const ROLE_LABEL: Record<StaffRole, string> = {
  gerant: "Gérant",
  stock: "Gestionnaire de stock",
  vendeur: "Vendeur",
  livreur: "Livreur",
};

export const ROLE_HINT: Record<StaffRole, string> = {
  gerant: "Accès complet : chiffres, équipe, réglages.",
  stock: "Produits, prix, photos, arrivages et inventaires.",
  vendeur: "Caisse et commandes en ligne. Consulte les produits.",
  livreur: "Ses livraisons du jour.",
};

type NavItem = { href: string; label: string; roles: StaffRole[] };

/** Menu du back-office : chacun ne voit que ce que son rôle permet (la base applique la même règle). */
export const STAFF_NAV: NavItem[] = [
  { href: "/gestion", label: "Accueil", roles: ["gerant", "stock", "vendeur", "livreur"] },
  { href: "/gestion/caisse", label: "Caisse", roles: ["gerant", "vendeur"] },
  { href: "/gestion/statistiques", label: "Statistiques", roles: ["gerant"] },
  { href: "/gestion/commandes", label: "Commandes", roles: ["gerant", "vendeur", "livreur"] },
  { href: "/gestion/produits", label: "Produits", roles: ["gerant", "stock", "vendeur"] },
  { href: "/gestion/reappro", label: "Réapprovisionnement", roles: ["gerant", "stock"] },
  { href: "/gestion/stock", label: "Arrivages et pertes", roles: ["gerant", "stock"] },
  { href: "/gestion/inventaire", label: "Inventaire", roles: ["gerant", "stock"] },
  { href: "/gestion/prix-achat", label: "Prix d'achat", roles: ["gerant", "stock"] },
  { href: "/gestion/equipe", label: "Équipe", roles: ["gerant"] },
  { href: "/gestion/reglages", label: "Réglages", roles: ["gerant"] },
];

export const canEditCatalog = (role: StaffRole) => role === "gerant" || role === "stock";
