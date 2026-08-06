# Ô Bon Prix — Supérette en ligne

Site e-commerce pour la supérette Ô Bon Prix (Dakar, Sénégal), avec catalogue produits,
panier, commande via WhatsApp et panneau d'administration.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner ADMIN_PASSWORD
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example` :

- `ADMIN_PASSWORD` — mot de passe du panneau d'administration (`/admin`)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — numéro WhatsApp Business (format international sans `+`)
- `NEXT_PUBLIC_SITE_NAME` — nom affiché du site

## Panneau d'administration

Accessible sur `/admin`. Permet d'ajouter, modifier et supprimer des produits du
catalogue. Les données sont stockées dans `data/products.json` et `data/categories.json`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Panier persistant en `localStorage`
- Commande transmise via un lien `wa.me` pré-rempli
- Stockage produits en fichier JSON (pas de base de données requise)
