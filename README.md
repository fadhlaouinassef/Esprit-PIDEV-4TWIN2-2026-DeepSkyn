# DeepSkyN

A Next.js application for AI-powered skin analysis with user authentication and management.

## Quick Start

### 1. Start PostgreSQL Server

Open PowerShell as Administrator:

```powershell
net start postgresql-x64-18
```

### 2. Setup Database

```bash
npm install --legacy-peer-deps
npm run db:setup
```

This will create and migrate the database automatically.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

```bash
npm run db:create   # Create the database
npm run db:migrate  # Run migrations
npm run db:setup    # Create + migrate (all in one)
npm run db:studio   # Open Prisma Studio
```

```
-- Régénérer le client Prisma`
npx prisma generate
```

## Project Structure

```
deepskyn/
├─ src/
│  ├─ app/              # Frontend (UI & routing)
│  ├─ services/         # Backend logic
│  ├─ entities/         # Data models
│  ├─ modele/           # AI model (TypeScript)
│  ├─ store/            # Redux store (state management)
│  │  ├─ slices/        # Redux slices
│  │  ├─ hooks.ts       # Custom Redux hooks
│  │  ├─ index.ts       # Store configuration
│  │  └─ Provider.tsx   # Redux Provider component
│  └─ lib/              # Infrastructure & utilities
├─ prisma/              # Database schema & migrations
└─ public/              # Static assets
```