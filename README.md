<p align="center">
	<img src="/logo.png" alt="DeepSkyn Logo" width="140" />
</p>

# DeepSkyn - Intelligent Skincare Platform

## Overview
This project was developed as part of the PIDEV engineering program at Esprit School of Engineering (Academic Year 2025-2026).

DeepSkyn is a full-stack web application dedicated to skincare analysis. It combines user journeys (authentication, surveys, routines), AI-assisted skin data workflows, and premium subscription capabilities in one integrated platform.

Repository public description (GitHub):
Developed at Esprit School of Engineering - Tunisia | Academic Year 2025-2026 | Main technologies: Next.js, TypeScript, Prisma, PostgreSQL, Stripe, n8n.

Topics (required project labels):
- esprit-school-of-engineering
- academic-project
- esprit-pidev
- 2025-2026
- nextjs

## Features
- Complete authentication flow: sign up, sign in, forgot/reset password, verification steps
- User skincare questionnaires and survey answer history
- Skin analysis and image-related workflows
- Admin dashboard for users, subscriptions, settings, and operational monitoring
- Premium subscription management with Stripe sync logic
- Workflow automation support with n8n (importable via workflow.json)
- Modular service layer for maintainable domain logic

## Tech Stack
### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Stripe API
- n8n integrations

## Architecture
The project follows a layered and modular organization:

- Presentation layer:
	Next.js pages, layouts, and reusable UI components under src/app and src/components
- Business layer:
	Domain services under src/services (auth, quiz, subscription, skin analysis, notifications)
- Data layer:
	Prisma schema and migrations under prisma, with entity definitions under src/entities
- Integration layer:
	External integrations in src/lib (Stripe, Cloudinary, email, sockets, automation helpers)

High-level structure:

```text
src/
|- app/            # App Router pages, route groups, API routes
|- components/     # Shared UI components
|- services/       # Business services by domain
|- entities/       # Domain entities/models
|- lib/            # Technical integrations (DB, Stripe, mail, utils)
|- hooks/          # Custom React hooks
|- store/          # State management
\- types/          # Shared TypeScript types
prisma/
|- schema.prisma
\- migrations/
```

## Contributors
- Nassef Fadhlaoui
- DeepSkyn project team

## Academic Context
Developed at Esprit School of Engineering - Tunisia
PIDEV | Academic Year 2025-2026

Institution naming requirement respected: the keyword Esprit School of Engineering is intentionally used.

## Getting Started
1. Clone the repository and move to the project folder.

2. Install dependencies:

```bash
npm install --legacy-peer-deps
```

3. Configure environment variables in .env (database, Stripe, email, and other required keys).

4. Start PostgreSQL service (Windows example):

```powershell
net start postgresql-x64-18
```

5. Prepare database and Prisma artifacts:

```bash
npm run db:setup
npx prisma generate
```

6. Start development server:

```bash
npm run dev
```

7. Open the application at http://localhost:3000

Useful database commands:

```bash
npm run db:create
npm run db:migrate
npm run db:studio
```

## Acknowledgments
- Esprit School of Engineering
- PIDEV faculty, supervisors, and academic mentors
- Open-source communities behind Next.js, Prisma, PostgreSQL, Stripe, and n8n