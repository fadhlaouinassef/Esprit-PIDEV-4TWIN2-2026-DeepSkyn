-- Create table to persist detailed skin score snapshots for each user.
CREATE TABLE "SkinScoreAnalysis" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "quiz_id" INTEGER,
  "score" DOUBLE PRECISION NOT NULL,
  "score_eau" DOUBLE PRECISION,
  "age_peau" INTEGER,
  "skin_type" "SkinType",
  "hydration" DOUBLE PRECISION NOT NULL,
  "barrier" DOUBLE PRECISION NOT NULL,
  "calmness" DOUBLE PRECISION NOT NULL,
  "clarity" DOUBLE PRECISION NOT NULL,
  "protection" DOUBLE PRECISION NOT NULL,
  "lifestyle" DOUBLE PRECISION NOT NULL,
  "strengths" JSONB,
  "concerns" JSONB,
  "recommendations" JSONB,
  "routine" JSONB,
  "summary" TEXT,
  "trigger" TEXT NOT NULL DEFAULT 'progress',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SkinScoreAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SkinScoreAnalysis_user_id_created_at_idx" ON "SkinScoreAnalysis"("user_id", "created_at");
CREATE INDEX "SkinScoreAnalysis_quiz_id_idx" ON "SkinScoreAnalysis"("quiz_id");

ALTER TABLE "SkinScoreAnalysis"
  ADD CONSTRAINT "SkinScoreAnalysis_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkinScoreAnalysis"
  ADD CONSTRAINT "SkinScoreAnalysis_quiz_id_fkey"
  FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
