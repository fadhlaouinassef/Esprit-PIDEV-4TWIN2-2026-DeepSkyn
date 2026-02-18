This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Architecture du Projet

Le projet **DeepSkyN** suit une architecture en couches pour séparer clairement les responsabilités :

```
deepskyn/
├─ public/                   ← Ressources statiques (images, icônes)
│
├─ src/
│  ├─ app/                   ← FRONTEND (rendu & routing)
│  │  ├─ globals.css        ← Styles globaux de l'application
│  │  ├─ layout.tsx         ← Layout principal
│  │  ├─ not-found.tsx      ← Page 404
│  │  ├─ page.tsx           ← Page d'accueil principale
│  │  │
│  │  ├─ components/         ← Composants de l'application
│  │  │  └─ home_page/      ← Composants de la page d'accueil
│  │  │     ├─ BankingScaleHero.tsx
│  │  │     ├─ CaseStudiesCarousel.tsx
│  │  │     ├─ FAQSection.tsx
│  │  │     ├─ Footer.tsx
│  │  │     ├─ IntegrationCarousel.tsx
│  │  │     ├─ PortfolioNavbar.tsx
│  │  │     ├─ PricingSection.tsx
│  │  │     ├─ ProductTeaserCard.tsx
│  │  │     └─ theme-provider.tsx
│  │  │
│  │  ├─ home/              ← Page home
│  │  │  └─ page.tsx
│  │  │
│  │  └─ ui/                ← Interface utilisateur
│  │     └─ home.tsx
│  │
│  ├─ components/           ← (À compléter)
│  │
│  ├─ services/             ← BACKEND (logique applicative)
│  │
│  ├─ entities/             ← ENTITÉS métier (données)
│  │
│  ├─ modele/               ← MODÈLE IA (TypeScript pur)
│  │
│  ├─ lib/                  ← Infrastructure & utilitaires
│  │  └─ utils.ts          ← Fonctions utilitaires
│  │
│  └─ styles/               ← Styles globaux
│     └─ globals.css
│
├─ components.json          ← Configuration des composants UI
├─ eslint.config.mjs        ← Configuration ESLint
├─ next-env.d.ts            ← Définitions TypeScript Next.js
├─ next.config.ts           ← Configuration Next.js
├─ package.json             ← Dépendances du projet
├─ postcss.config.mjs       ← Configuration PostCSS
├─ tsconfig.json            ← Configuration TypeScript
└─ README.md                ← Documentation du projet
```

### Description des Couches

#### 🎨 **app/ui/** - Interface Utilisateur
- Contient toutes les pages accessibles par l'utilisateur
- Gère le routing et le rendu des composants
- Utilise les composants réutilisables et appelle les services

#### 🧩 **components/** - Composants Réutilisables
- Boutons, cartes, formulaires, etc.
- Composants partagés entre plusieurs pages
- Aucune logique métier, uniquement l'affichage

#### ⚙️ **services/** - Logique Applicative (Backend)
- Contient toute la logique métier
- Fait le lien entre l'UI et les entités/modèles
- Gère les appels API et les opérations sur les données

#### 📦 **entities/** - Entités Métier
- Définit les structures de données principales
- Classes et interfaces représentant les objets métier
- Validation et méthodes métier associées

#### 🤖 **modele/** - Modèle IA
- Code TypeScript pur pour l'analyse de peau par IA
- Règles de prédiction et scoring
- Indépendant du framework (peut être réutilisé ailleurs)

#### 🔧 **lib/** - Infrastructure
- Utilitaires et configurations
- Connexion à la base de données
- Helpers génériques

#### 🎨 **styles/** - Styles
- Fichiers CSS globaux
- Variables de thème

## Getting Started

### 1. Démarrer le serveur PostgreSQL

Avant de lancer le projet, vous devez démarrer le serveur PostgreSQL.

Ouvrez PowerShell en tant qu'administrateur et exécutez :

```powershell
# Démarrer PostgreSQL
net start postgresql-x64-18

# Pour arrêter PostgreSQL (si nécessaire)
net stop postgresql-x64-18
```

### 2. Lancer le projet

Naviguez vers le dossier du projet et démarrez le serveur de développement :

```bash
cd deepskyn
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.











npm install prisma@7 --save-dev --legacy-peer-deps
npm install @prisma/client --legacy-peer-deps



npm run db:create   # Créer la base de données
npm run db:migrate  # Exécuter la migration
npm run db:setup    # Tout faire en une fois (create + migrate)
npm run db:studio   # Ouvrir Prisma Studio pour visualiser les données