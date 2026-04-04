-- CreateTable
CREATE TABLE "LoginActivity" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'credentials',
    "day_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("id")
);

-- Deduplicate Badge rows before unique constraint
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, niveau, titre
      ORDER BY id ASC
    ) AS rn
  FROM "Badge"
)
DELETE FROM "Badge"
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- CreateIndex
CREATE INDEX "LoginActivity_user_id_created_at_idx" ON "LoginActivity"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "LoginActivity_day_key_idx" ON "LoginActivity"("day_key");

-- CreateIndex
CREATE INDEX "Badge_user_id_date_idx" ON "Badge"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_user_id_niveau_titre_key" ON "Badge"("user_id", "niveau", "titre");

-- AddForeignKey
ALTER TABLE "LoginActivity" ADD CONSTRAINT "LoginActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
