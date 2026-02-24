import 'dotenv/config';


import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Utiliser DATABASE_URL de l'environnement ou créer un pool avec des variables d'environnement
const connectionString = process.env.DATABASE_URL

let prisma: PrismaClient

if (connectionString) {
  // En production (Vercel), utiliser la connection string directe
  const pool = new Pool({
    connectionString,
  })
  
  const adapter = new PrismaPg(pool)
  
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
} else {
  // En développement local, utiliser les options individuelles
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'deepskyn',
    password: process.env.MDP_DB || 'admin',
    port: parseInt(process.env.DB_PORT || '5432'),
  })
  
  const adapter = new PrismaPg(pool)
  
  prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

export { prisma }
