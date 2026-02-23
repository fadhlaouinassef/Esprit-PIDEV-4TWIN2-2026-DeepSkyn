import { prisma } from './prisma.config';

async function migrate() {
  try {
    console.log('🔄 Démarrage de la migration...');

    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si les tables existent déjà
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('📋 Tables existantes:', tables);

    // Créer les enums
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

    console.log('✅ Types enum créés');

    // Créer les tables
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
        "type" VARCHAR(100) NOT NULL
      );
    `);

    // Table QuizQuestion
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "QuizQuestion" (
        "id" SERIAL PRIMARY KEY,
        "quiz_id" INTEGER NOT NULL,
        "question" TEXT NOT NULL,
        "type_reponse" VARCHAR(100) NOT NULL,
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

    // Table Ingredient
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

    // Table SkinAnalyse
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

    // Vérifier les tables créées
    const finalTables = await prisma.$queryRaw`
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
