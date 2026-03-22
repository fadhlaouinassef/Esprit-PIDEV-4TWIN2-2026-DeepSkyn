<h1 align="center">DeepSkyN</h1>

<p align="center">
	Plateforme skincare intelligente pour l'analyse de peau, les questionnaires utilisateurs et l'automatisation de workflows.
</p>

<p align="center">
	<img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
	<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
	<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
	<img alt="n8n" src="https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white" />
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
</p>

<p align="center">
	<strong>Next.js</strong> • <strong>Tailwind CSS</strong> • <strong>PostgreSQL</strong> • <strong>Prisma</strong> • <strong>n8n</strong> • <strong>TypeScript</strong>
</p>

---

## Table des matieres

- [Description du projet](#description-du-projet)
- [Fonctionnalites](#fonctionnalites)
- [Stack technique](#stack-technique)
- [Demarrage rapide](#demarrage-rapide)
- [Workflow n8n](#workflow-n8n)
- [Commandes base de donnees](#commandes-base-de-donnees)
- [Structure du projet](#structure-du-projet)

## Description du projet

DeepSkyN est un projet skincare construit avec Next.js. L'objectif est de proposer une experience complete de suivi et d'analyse de la peau avec authentification utilisateur, gestion des donnees, quiz/questionnaires, abonnement et integration d'automatisations.

## Fonctionnalites

- Authentification et parcours utilisateur (signup, signin, reset password)
- Espace admin (analytics, users, subscriptions, products, settings)
- Quiz/questionnaires utilisateur et suivi des analyses
- API Next.js pour auth, quiz, user, admin et Stripe
- Persistance PostgreSQL avec Prisma ORM
- Workflow n8n importable depuis workflow.json

### Stack technique

- Frontend: Next.js + Tailwind CSS + TypeScript
- Backend: API Routes Next.js + Services metier
- Base de donnees: PostgreSQL + Prisma
- Automatisation: n8n (workflow importable via workflow.json)

## Demarrage rapide

### 1) Lancer PostgreSQL

Ouvrir PowerShell en mode administrateur puis executer :

```powershell
net start postgresql-x64-18
```

### 2) Installer les dependances et preparer la base

```bash
npm install --legacy-peer-deps
npm run db:setup
```

### 3) Lancer l'application

```bash
npm run dev
```

Application disponible sur : http://localhost:3000

---

## Workflow n8n

### Etapes

1. Installation globale de n8n

```bash
npm install n8n -g
```

2. Lancement de n8n

```bash
n8n
```

3. Import du workflow depuis le fichier workflow.json

Dans l'interface n8n : Import from file puis selectionner workflow.json.

4. Executer le workflow

Verifier que tous les noeuds sont correctement configures puis lancer l'execution.

5. Tester dans les pages user/questionnaires

Verifier le comportement de bout en bout depuis les pages user/questionnaires et valider que le workflow est bien declenche.

---

## Commandes base de donnees

```bash
npm run db:create   # Creer la base
npm run db:migrate  # Executer les migrations
npm run db:setup    # Creer + migrer
npm run db:studio   # Ouvrir Prisma Studio
npx prisma generate # Regenerer le client Prisma
```

## Structure du projet

```text
deepskyn/
|- src/
|  |- app/
|  |  |- admin/         # Pages et sections admin
|  |  |- api/           # Endpoints API (auth, quiz, user, stripe, admin)
|  |  |- home/
|  |  |- signin/
|  |  |- signup/
|  |  |- forgot-password/
|  |  |- reset-password/
|  |  |- user/
|  |  |- components/    # Composants app router
|  |  |- css/           # Styles globaux et pages
|  |  \- ui/            # UI locale app
|  |- components/       # Composants partages
|  |- entities/         # Modeles/entites metier
|  |- services/         # Services metier
|  |- lib/              # Prisma, Stripe, utils, helpers
|  |- store/            # Redux store + slices
|  |- hooks/            # Hooks custom
|  |- types/            # Definitions TypeScript
|  \- fonts/            # Polices locales
|- prisma/
|  |- schema.prisma
|  \- migrations/
|- public/              # Assets statiques
|- workflow.json        # Workflow n8n
\- README.md
```

## Notes

- Le fichier workflow.json est prevu pour etre importe dans n8n.
- Pour les tests fonctionnels du workflow, utiliser les parcours dans les pages user/questionnaires.