import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Créer un pool de connexion PostgreSQL avec options explicites
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'deepskyn',
  password: 'douaa',
  port: 5432,
})

// Créer l'adapter Prisma pour PostgreSQL
const adapter = new PrismaPg(pool)

// Créer le client Prisma avec l'adapter
export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})
