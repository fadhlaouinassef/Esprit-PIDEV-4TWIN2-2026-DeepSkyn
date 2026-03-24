CREATE TABLE "ImageSurvey" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "analyse_id" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageSurvey_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImageSurvey_user_id_idx" ON "ImageSurvey"("user_id");
CREATE INDEX "ImageSurvey_analyse_id_idx" ON "ImageSurvey"("analyse_id");

ALTER TABLE "ImageSurvey"
ADD CONSTRAINT "ImageSurvey_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImageSurvey"
ADD CONSTRAINT "ImageSurvey_analyse_id_fkey"
FOREIGN KEY ("analyse_id") REFERENCES "SkinScoreAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
