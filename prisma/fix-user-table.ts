import 'dotenv/config';


import { prisma } from './prisma.config';

async function syncUserTable() {
  try {
    console.log('🔄 Synchronisation de la table User...');
    await prisma.$connect();

    // Colonnes à ajouter si elles n'existent pas
    const columns = [
      { name: 'prenom', type: 'VARCHAR(255)' },
      { name: 'image', type: 'TEXT' },
      { name: 'verified', type: 'BOOLEAN DEFAULT false' },
      { name: 'otp_code', type: 'VARCHAR(255)' },
      { name: 'otp_expiry', type: 'TIMESTAMP' }
    ];

    for (const col of columns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "${col.name}" ${col.type}`);
        console.log(`✅ Colonne "${col.name}" ajoutée`);
      } catch (e: any) {
        if (e.message.includes('already exists')) {
          console.log(`ℹ️ Colonne "${col.name}" existe déjà`);
        } else {
          console.error(`❌ Erreur pour "${col.name}":`, e.message);
        }
      }
    }

    console.log('✅ Synchronisation terminée');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserTable();
