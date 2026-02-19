-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('USER', 'PREMIUM_USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NiveauBadge" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY_MASTER');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('OILY', 'DRY', 'SENSITIVE', 'NORMAL', 'COMBINATION');

-- CreateEnum
CREATE TYPE "MsgType" AS ENUM ('receiver', 'sender');

-- CreateEnum
CREATE TYPE "EtatComplaint" AS ENUM ('ACCEPT', 'PENDING', 'REJECT');

-- CreateEnum
CREATE TYPE "EtatFeedback" AS ENUM ('visible', 'invisible');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleType" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nom" TEXT,
    "prenom" TEXT,
    "sexe" TEXT,
    "age" INTEGER,
    "skin_type" "SkinType",
    "image" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "otp_code" TEXT,
    "otp_expiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "niveau" "NiveauBadge" NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotMessage" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "msg_type" "MsgType" NOT NULL,

    CONSTRAINT "ChatbotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image" TEXT,
    "etat" "EtatComplaint" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "etat" "EtatFeedback" NOT NULL DEFAULT 'visible',

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type_reponse" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnswer" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "reponse" TEXT NOT NULL,
    "quiz_id" INTEGER NOT NULL,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "envie" TEXT,
    "objectif" TEXT,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineStep" (
    "id" SERIAL NOT NULL,
    "routine_id" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "RoutineStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "routine_step_id" INTEGER NOT NULL,
    "ingredient" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientConflict" (
    "id" SERIAL NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "text" TEXT,

    CONSTRAINT "IngredientConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkinAnalyse" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "score_eau" DOUBLE PRECISION,
    "age_peau" INTEGER,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "SkinAnalyse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkinImage" (
    "id" SERIAL NOT NULL,
    "analyse_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "SkinImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkinCondition" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,

    CONSTRAINT "SkinCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotMessage" ADD CONSTRAINT "ChatbotMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineStep" ADD CONSTRAINT "RoutineStep_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_routine_step_id_fkey" FOREIGN KEY ("routine_step_id") REFERENCES "RoutineStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientConflict" ADD CONSTRAINT "IngredientConflict_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinAnalyse" ADD CONSTRAINT "SkinAnalyse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinImage" ADD CONSTRAINT "SkinImage_analyse_id_fkey" FOREIGN KEY ("analyse_id") REFERENCES "SkinAnalyse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
