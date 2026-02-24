import 'dotenv/config';

import { Pool } from 'pg';

async function createDatabase() {
  // Se connecter à la base postgres par défaut pour créer deepskyn
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Base par défaut
    password: process.env.MDP_DB,
    port: 5432,
  });

  try {
    console.log('🔄 Vérification de l\'existence de la base de données deepskyn...');
    
    // Vérifier si la base existe déjà
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = 'deepskyn'`
    );

    if (result.rows.length > 0) {
      console.log('✅ La base de données deepskyn existe déjà');
    } else {
      console.log('📝 Création de la base de données deepskyn...');
      await pool.query('CREATE DATABASE deepskyn');
      console.log('✅ Base de données deepskyn créée avec succès!');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createDatabase()
  .then(() => {
    console.log('\n✅ Terminé! Vous pouvez maintenant lancer: npm run db:migrate');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec:', error);
    process.exit(1);
  });
