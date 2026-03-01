import 'dotenv/config';

import { prisma } from './prisma.config';

async function migrate() {
  try {
    console.log('🔄 Démarrage de la migration...');

    // Connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    // Vérifier les tables existantes
    const tables = await prisma.$queryRaw<
      { table_name: string }[]
    >`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tables existantes:', tables);

    // =========================
    // 1) Création des ENUMS
    // =========================
    console.log('📝 Création des types enum...');

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "RoleType" AS ENUM ('USER', 'PREMIUM_USER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "NiveauBadge" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY_MASTER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "SkinType" AS ENUM ('OILY', 'DRY', 'SENSITIVE', 'NORMAL', 'COMBINATION');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "MsgType" AS ENUM ('receiver', 'sender');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "EtatComplaint" AS ENUM ('ACCEPT', 'PENDING', 'REJECT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "EtatFeedback" AS ENUM ('visible', 'invisible');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Types enum créés');

    // =========================
    // 2) Création des TABLES
    // =========================
    console.log('📝 Création des tables...');

    // Table User
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "role" "RoleType" DEFAULT 'USER' NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "nom" VARCHAR(255),
        "sexe" VARCHAR(50),
        "age" INTEGER,
        "skin_type" "SkinType"
      );
    `);

    // Table Badge
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Badge" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "description" TEXT,
        "niveau" "NiveauBadge" NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table Subscription
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "plan" VARCHAR(255) NOT NULL,
        "date_debut" TIMESTAMP NOT NULL,
        "date_fin" TIMESTAMP NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table ChatbotMessage
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ChatbotMessage" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "message" TEXT NOT NULL,
        "role" VARCHAR(100) NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "msg_type" "MsgType" NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table Complaint
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Complaint" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "nom" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "image" TEXT,
        "etat" "EtatComplaint" DEFAULT 'PENDING' NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table Feedback
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Feedback" (
        "id" SERIAL PRIMARY KEY,
        "nom" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "note" INTEGER NOT NULL,
        "etat" "EtatFeedback" DEFAULT 'visible' NOT NULL
      );
    `);

    // Table Quiz
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Quiz" (
        "id" SERIAL PRIMARY KEY,
        "titre" VARCHAR(255) NOT NULL,
        "type" VARCHAR(100) NOT NULL,
        "description" TEXT
      );
    `);

    // Table QuizQuestion
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "QuizQuestion" (
        "id" SERIAL PRIMARY KEY,
        "quiz_id" INTEGER NOT NULL,
        "question" TEXT NOT NULL,
        "type_reponse" VARCHAR(100) NOT NULL,
        "reponse_options" TEXT,
        FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE
      );
    `);

    // Table SurveyAnswer
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SurveyAnswer" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "question_id" INTEGER NOT NULL,
        "quiz_id" INTEGER NOT NULL,
        "reponse" TEXT NOT NULL,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("question_id") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE,
        FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE
      );
    `);

    // Table Routine
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Routine" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "type" VARCHAR(100) NOT NULL,
        "objectif" TEXT,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table RoutineStep
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RoutineStep" (
        "id" SERIAL PRIMARY KEY,
        "routine_id" INTEGER NOT NULL,
        "ordre" INTEGER NOT NULL,
        "action" TEXT NOT NULL,
        FOREIGN KEY ("routine_id") REFERENCES "Routine"("id") ON DELETE CASCADE
      );
    `);

    // Table Ingredient (au début: "nom", on va sync/rename ensuite)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ingredient" (
        "id" SERIAL PRIMARY KEY,
        "routine_step_id" INTEGER NOT NULL,
        "nom" VARCHAR(255) NOT NULL,
        "description" TEXT,
        FOREIGN KEY ("routine_step_id") REFERENCES "RoutineStep"("id") ON DELETE CASCADE
      );
    `);

    // Table IngredientConflict
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "IngredientConflict" (
        "id" SERIAL PRIMARY KEY,
        "ingredient_id" INTEGER NOT NULL,
        "description" TEXT NOT NULL,
        FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id") ON DELETE CASCADE
      );
    `);

    // Table SkinAnalyse (au début: score_peau + date_analyse, on sync/rename ensuite)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SkinAnalyse" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "score_peau" DOUBLE PRECISION,
        "age_peau" INTEGER,
        "date_analyse" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "score" DOUBLE PRECISION,
        "description" TEXT,
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Table SkinImage
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SkinImage" (
        "id" SERIAL PRIMARY KEY,
        "analyse_id" INTEGER NOT NULL,
        "image_url" TEXT NOT NULL,
        FOREIGN KEY ("analyse_id") REFERENCES "SkinAnalyse"("id") ON DELETE CASCADE
      );
    `);

    // Table SkinCondition
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SkinCondition" (
        "id" SERIAL PRIMARY KEY,
        "nom" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "type" VARCHAR(100)
      );
    `);

    console.log('✅ Toutes les tables ont été créées avec succès!');

    // =========================
    // 3) Synchronisation colonnes (ADD / RENAME)
    // =========================
    console.log('🛠️ Synchronisation des colonnes manquantes/renommées...');

    const columnExists = async (table: string, column: string) => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = $1
             AND column_name = $2
         ) AS "exists"`,
        table,
        column
      );
      return result[0]?.exists === true;
    };

    const addColumnIfMissing = async (table: string, ddl: string) => {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${ddl};`
      );
    };

    // User: colonnes manquantes
    await addColumnIfMissing('User', '"prenom" VARCHAR(255)');
    await addColumnIfMissing('User', '"image" TEXT');
    await addColumnIfMissing('User', '"verified" BOOLEAN DEFAULT false NOT NULL');
    await addColumnIfMissing('User', '"status" "UserStatus" DEFAULT \'PENDING\' NOT NULL');
    await addColumnIfMissing('User', '"otp_code" TEXT');
    await addColumnIfMissing('User', '"otp_expiry" TIMESTAMP');
    await addColumnIfMissing('User', '"admin_notes" TEXT');

    // Badge: titre
    await addColumnIfMissing('Badge', `"titre" VARCHAR(255) NOT NULL DEFAULT 'Badge'`);

    // Routine: envie
    await addColumnIfMissing('Routine', '"envie" TEXT');

    // Quiz: description
    await addColumnIfMissing('Quiz', '"description" TEXT');

    // QuizQuestion: reponse_options
    await addColumnIfMissing('QuizQuestion', '"reponse_options" TEXT');

    // IngredientConflict: text
    await addColumnIfMissing('IngredientConflict', '"text" TEXT');

    // Ingredient: rename nom -> ingredient (ou add si absent)
    const ingredientExists = await columnExists('Ingredient', 'ingredient');
    const nomExists = await columnExists('Ingredient', 'nom');
    if (!ingredientExists && nomExists) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Ingredient" RENAME COLUMN "nom" TO "ingredient";'
      );
    } else if (!ingredientExists) {
      await addColumnIfMissing('Ingredient', `"ingredient" VARCHAR(255) NOT NULL DEFAULT 'unknown'`);
    }

    // SkinAnalyse: score_peau -> score_eau (ou add)
    const scoreEauExists = await columnExists('SkinAnalyse', 'score_eau');
    const scorePeauExists = await columnExists('SkinAnalyse', 'score_peau');
    if (!scoreEauExists && scorePeauExists) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "SkinAnalyse" RENAME COLUMN "score_peau" TO "score_eau";'
      );
    } else if (!scoreEauExists) {
      await addColumnIfMissing('SkinAnalyse', '"score_eau" DOUBLE PRECISION');
    }

    // SkinAnalyse: date_analyse -> date_creation (ou add)
    const dateCreationExists = await columnExists('SkinAnalyse', 'date_creation');
    const dateAnalyseExists = await columnExists('SkinAnalyse', 'date_analyse');
    if (!dateCreationExists && dateAnalyseExists) {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "SkinAnalyse" RENAME COLUMN "date_analyse" TO "date_creation";'
      );
    } else if (!dateCreationExists) {
      await addColumnIfMissing(
        'SkinAnalyse',
        '"date_creation" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL'
      );
    }

    console.log('✅ Synchronisation des colonnes terminée');

    // Vérifier les tables finales
    const finalTables = await prisma.$queryRaw<
      { table_name: string }[]
    >`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('\n📊 Tables dans la base de données:');
    console.log(finalTables);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Déconnexion de la base de données');
  }
}

migrate()
  .then(() => {
    console.log('\n✅ Migration terminée avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec de la migration:', error);
    process.exit(1);
  });