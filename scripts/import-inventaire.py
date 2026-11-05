"""
Génère supabase/seed/catalogue_initial.sql depuis l'inventaire Google Sheets exporté en CSV.

  python -I scripts/import-inventaire.py chemin/vers/inventaire.csv

Colonnes : Produit | QA | QV | QVP | QT (stock) | PVU (prix) | PVP (prix promo) | TPV | Commentaire.
Les promotions de juin ne sont pas reprises : le gérant les réactive au besoin dans le back-office.
"""
import csv
import re
import sys
import unicodedata
from pathlib import Path

CATEGORIES = [
    ("produits-frais", "Produits frais"),
    ("epicerie-salee", "Épicerie salée"),
    ("epicerie-sucree", "Épicerie sucrée"),
    ("surgeles", "Surgelés"),
    ("boissons", "Boissons"),
    ("hygiene-entretien", "Hygiène et entretien"),
]

# Premier motif trouvé dans le nom (en minuscules, sans accents) -> rayon
RULES = [
    ("epicerie-salee", r"corned"),
    ("hygiene-entretien", r"armonia|lave mains|papier|mouchoir|insecticide|couches|madar"),
    ("surgeles", r"aile en kg|pilon|cuisse|poulet entier|saucisse|foie|eskima"),
    ("boissons", r"kirene|pressea|candy up|mirinda|pepsi|casamancaise|casa\. jus|fanta|coca|press up|fada"),
    ("produits-frais", r"oeuf|oignon|pomme de terre|fromage|beurre|dolima|yoggi"),
    ("epicerie-sucree", r"choco|sucre|lait|nido|madilait|nescafe|datte|bounty|mars|twix|snikers|m&m|fini|chewing|gomme|jelly"
                        r"|hollywood|tangal|levure|bicarbonate|essence|fleur d'orange|ananas|kango|frizz"),
    ("epicerie-salee", r"."),
]

# Corrections de libellés les plus visibles ; le reste se corrige dans le back-office
RENAME = {
    "Armonia Déso. 500ml": "Armonia Désodorisant 500 ml",
    "Armonia Dtg 15g": "Armonia Détergent 15 g",
    "Armonia Dtg 30g": "Armonia Détergent 30 g",
    "Armonia Dtg 60g": "Armonia Détergent 60 g",
    "Armonia Dtg 450g": "Armonia Détergent 450 g",
    "Armonia Dtg 1Kg": "Armonia Détergent 1 kg",
    "Armonia Multi-U PM": "Armonia Multi-usage PM",
    "Armonia Nettoyant M.": "Armonia Nettoyant multi-surfaces",
    "Lave mains b. M. 500ml": "Lave-mains 500 ml",
    "Purée PM": "Purée de tomate PM",
    "Kirène 1,5L Pack6": "Eau Kirène 1,5 L",
    "Kirène 33cl Pack12": "Eau Kirène 33 cl",
    "Présséa 1L Orange": "Présséa Orange 1 L",
    "Présséa fresh 33cl M.": "Présséa Fresh 33 cl Mangue",
    "Présséa fresh 33cl O.": "Présséa Fresh 33 cl Orange",
    "Candy UP V. 150ml": "Candy Up Vanille 150 ml",
    "Dolima 1kg": "Dolima 1 kg",
    "Mirinda fruity canette": "Mirinda Fruity canette",
    "Vinaigre 250mlx24": "Vinaigre 250 ml",
    "Doli Epice 10gx60": "Doli Épices 10 g (boîte de 60)",
    "Adja epice 60gx60 Sachets": "Adja Épices (sachet)",
    "Joker epice 60gx60": "Joker Épices (sachet)",
    "Aile en Kg": "Ailes de poulet (au kg)",
    "Pilon en Kg": "Pilons de poulet (au kg)",
    "Cuisse en Kg": "Cuisses de poulet (au kg)",
    "Casamançaise eau 33CL": "Eau Casamançaise 33 cl",
    "Casamançaise eau  0,5L": "Eau Casamançaise 0,5 L",
    "Casamançaise eau  1,5L": "Eau Casamançaise 1,5 L",
    "Casamançaise eau  10L": "Eau Casamançaise 10 L",
    "Casa. Jus Bissap 1L": "Jus Casamançaise Bissap 1 L",
    "Casa. Jus Tropical 1L": "Jus Casamançaise Tropical 1 L",
    "Casa. Jus Bouye-Gimgembre 1L": "Jus Casamançaise Bouye-Gingembre 1 L",
    "Casa. Jus Orange1L": "Jus Casamançaise Orange 1 L",
    "Haricot vert fins 1/2 D'AUCY": "Haricots verts fins D'aucy 1/2",
    "Haricot blanc pré. 1/2 D'AUCY": "Haricots blancs préparés D'aucy 1/2",
    "Haricot Rouge pré. 1/2 D'AUCY": "Haricots rouges préparés D'aucy 1/2",
    "Lentilles pré. 1/2 D'AUCY": "Lentilles préparées D'aucy 1/2",
    "Pois chiche pré. 1/2 D'AUCY": "Pois chiches préparés D'aucy 1/2",
    "Macedoine de legume 1/2 Maingroung": "Macédoine de légumes Maingroung 1/2",
    "sel fin 125g la baleine": "Sel fin La Baleine 125 g",
    "Sachet sucre menthe 180G": "Sucre menthe 180 g (sachet)",
    "Sachet sucre Vanille 180G": "Sucre vanille 180 g (sachet)",
    "Lait concentre sucre Bon Appetit 1KG": "Lait concentré sucré Bon Appétit 1 kg",
    "Mais doux mina 340ML": "Maïs doux Mina 340 ml",
    "Mais doux B.A 340ML": "Maïs doux Bon Appétit 340 ml",
    "Sardine à huile 125G": "Sardines à l'huile 125 g",
    "Nescafe classic sachet 100g": "Nescafé Classic 100 g (sachet)",
    "NIDO 800G": "Nido 800 g",
    "EVD Spaguetti 500G": "Spaghetti EVD 500 g",
    "Beurre Blue band 450g": "Beurre Blue Band 450 g",
    "1kg Dattes (5kg x 10 carton)": "Dattes 1 kg",
    "1kg Foie": "Foie 1 kg",
    "Madilait 400G": "Madilait 400 g",
    "Oignon blanc": "Oignon blanc (au kg)",
    "Oignon rouge": "Oignon rouge (au kg)",
    "Pomme de terre": "Pomme de terre (au kg)",
    "Poulet entier SEARA 1300G": "Poulet entier Seara 1,3 kg",
    "Sucre JADORE": "Sucre J'adore",
    "5kg Riz B.P Umbrella": "Riz Umbrella 5 kg",
    "TWIXS": "Twix",
    "Snikers": "Snickers",
    "M&M Chocolate": "M&M's Chocolat",
    "Palette de 30 oeufs": "Œufs (plateau de 30)",
    "Palette de 15 oeufs": "Œufs (plateau de 15)",
    "oeufs": "Œuf (à l'unité)",
    "Fromage emmental 100g": "Fromage emmental 100 g",
    "Couscous Kayna 500g": "Couscous Kayna 500 g",
    "Couscous Khoulala 1kg": "Couscous Khoulala 1 kg",
    "Coca cola can. 30cl": "Coca-Cola canette 30 cl",
    "Huile Tournesol 5L": "Huile de tournesol 5 L",
    "Huile Zita 1L": "Huile Zita 1 L",
    "Huile Jadida 250ml": "Huile Jadida 250 ml",
    "Macedoine de legume Avril": "Macédoine de légumes Avril",
    "Corned boeuf- poulet Sara 350g": "Corned beef poulet Sara 350 g",
    "Sucre Morçeaux St Louis": "Sucre en morceaux Saint-Louis",
    "Sucre Morçeaux Beghin Say": "Sucre en morceaux Béghin Say",
    "Conserve Ananas Morçeaux Sofia": "Ananas en morceaux Sofia (conserve)",
    "Essences Aromes 3 Lions": "Arômes 3 Lions",
    "Eau de fleur d'orange GM": "Eau de fleur d'oranger GM",
    "Papier Toilette": "Papier toilette",
    "Papier Essuie tout": "Essuie-tout",
    "Mouchoir Facial": "Mouchoirs",
    "Olive verte Entières": "Olives vertes entières",
    "Pates Auntie B Spaguetti GM 400": "Spaghetti Auntie B 400 g",
    "Sucre buchette St Louis": "Sucre en bûchettes Saint-Louis",
    "Jus Press Up Ananas": "Jus Press Up Ananas",
    "Tomate Double concentrée Jongoma": "Tomate double concentrée Jongoma",
}

KG = {"Aile en Kg", "Pilon en Kg", "Cuisse en Kg", "Oignon blanc", "Oignon rouge", "Pomme de terre"}


def plain(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", plain(s).replace("&", " et ")).strip("-")[:120]


def num(s: str):
    s = (s or "").strip().replace(",", ".").replace(" ", "")
    return float(s) if s else None


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main(src: str) -> None:
    rows = list(csv.reader(open(src, encoding="utf-8")))
    start = next(i for i, r in enumerate(rows) if r and r[0].strip() == "Produit") + 1
    products, seen = [], set()
    for r in rows[start:]:
        raw = (r[0] if r else "").strip()
        if not raw or raw.upper().startswith("TOTAL") or raw.startswith("Du "):
            continue
        name = RENAME.get(raw, raw[:1].upper() + raw[1:])
        slug = slugify(name)
        while slug in seen:
            slug += "-2"
        seen.add(slug)
        cat = next(c for c, pat in RULES if re.search(pat, plain(raw)))
        price = num(r[5])
        stock = num(r[4]) or 0
        products.append((slug, name, cat, "kg" if raw in KG else "piece", int(price) if price else None, stock))

    out = [
        "/*",
        "  # Catalogue initial Ô Bon Prix (inventaire du 22/06/2026)",
        f"  - {len(products)} produits répartis dans 6 rayons (classement proposé, à corriger dans le back-office).",
        "  - Stock de départ = quantités de l'inventaire de juin, enregistrées comme mouvement « import ».",
        "    Un inventaire physique est à faire avant l'ouverture (écran Inventaire du back-office).",
        "  - Produits sans prix : enregistrés mais non vendus en ligne tant qu'un prix n'est pas saisi.",
        "  - Promotions de juin non reprises.",
        "  - Zones de livraison autour de HLM Patte d'Oie (1 000 à 2 500 F).",
        "  Relançable sans doublon.",
        "*/",
        "INSERT INTO categories (slug, name, position) VALUES",
        ",\n".join(f"  ({q(s)}, {q(n)}, {i})" for i, (s, n) in enumerate(CATEGORIES)),
        "ON CONFLICT (slug) DO UPDATE SET name = excluded.name, position = excluded.position;",
        "",
        "INSERT INTO products (slug, name, category_id, unit, price, is_online)",
        "SELECT v.slug, v.name, c.id, v.unit, v.price, v.price IS NOT NULL",
        "FROM (VALUES",
        ",\n".join(f"  ({q(s)}, {q(n)}, {q(c)}, {q(u)}, {p if p else 'NULL'}::integer)" for s, n, c, u, p, _ in products),
        ") AS v(slug, name, cat, unit, price)",
        "JOIN categories c ON c.slug = v.cat",
        "ON CONFLICT (slug) DO NOTHING;",
        "",
        "-- Stock de départ (une seule fois par produit)",
        "INSERT INTO stock_movements (product_id, delta, reason, note)",
        "SELECT p.id, v.qty, 'import', 'Inventaire du 22/06/2026'",
        "FROM (VALUES",
        ",\n".join(f"  ({q(s)}, {round(st, 3)})" for s, _, _, _, _, st in products if st),
        ") AS v(slug, qty)",
        "JOIN products p ON p.slug = v.slug",
        "WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id AND m.reason = 'import');",
        "",
        "INSERT INTO delivery_zones (id, name, price, position, areas) VALUES",
        "  (1, 'Zone 1', 1000, 1, ARRAY['HLM Patte d''Oie', 'Patte d''Oie', 'Cité Soprim', 'Grand Yoff', 'Scat Urbam', 'Dalifort', 'Cité Millionnaire', 'Hamo']),",
        "  (2, 'Zone 2', 1500, 2, ARRAY['Parcelles Assainies', 'Liberté 1', 'Liberté 2', 'Liberté 3', 'Liberté 4', 'Liberté 5', 'Liberté 6', 'Sacré-Cœur', 'Dieuppeul', 'Derklé', 'Castors', 'HLM', 'Hann Maristes', 'Cambérène']),",
        "  (3, 'Zone 3', 2000, 3, ARRAY['Mermoz', 'Ouakam', 'Yoff', 'Point E', 'Fann', 'Médina', 'Grand Dakar', 'Biscuiterie', 'Golf Sud', 'Guédiawaye', 'Pikine']),",
        "  (4, 'Zone 4', 2500, 4, ARRAY['Plateau', 'Almadies', 'Ngor', 'Thiaroye', 'Malika', 'Keur Massar'])",
        "ON CONFLICT (id) DO NOTHING;",
        "SELECT setval('delivery_zones_id_seq', greatest((SELECT max(id) FROM delivery_zones), 1));",
        "",
        "-- Vérification : nombre de produits par rayon",
        "SELECT c.name AS rayon, count(p.id) AS produits, count(p.id) FILTER (WHERE p.price IS NULL) AS sans_prix",
        "FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.name, c.position ORDER BY c.position;",
        "",
    ]
    dest = Path(__file__).resolve().parent.parent / "supabase" / "seed" / "catalogue_initial.sql"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(out), encoding="utf-8")
    for c, n in CATEGORIES:
        items = [p for p in products if p[2] == c]
        print(f"\n{n} ({len(items)})")
        for s, name, _, u, p, st in items:
            print(f"   {name} | {p or 'SANS PRIX'} F{'/kg' if u == 'kg' else ''} | stock {st:g}")


if __name__ == "__main__":
    main(sys.argv[1])
