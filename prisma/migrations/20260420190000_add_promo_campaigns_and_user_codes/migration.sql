-- Create enums
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "PromoCodeStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- Create campaign table
CREATE TABLE "PromoCampaign" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "badge_level" "NiveauBadge" NOT NULL,
  "brand" TEXT NOT NULL,
  "category" TEXT,
  "discount_type" "PromoDiscountType" NOT NULL,
  "discount_value" DOUBLE PRECISION NOT NULL,
  "code_prefix" TEXT,
  "expires_in_days" INTEGER NOT NULL DEFAULT 14,
  "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "max_redemptions_user" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCampaign_pkey" PRIMARY KEY ("id")
);

-- Create user code table
CREATE TABLE "UserPromoCode" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "campaign_id" INTEGER NOT NULL,
  "badge_id" INTEGER,
  "code" TEXT NOT NULL,
  "status" "PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPromoCode_pkey" PRIMARY KEY ("id")
);

-- Constraints
CREATE UNIQUE INDEX "UserPromoCode_code_key" ON "UserPromoCode"("code");
CREATE UNIQUE INDEX "UserPromoCode_user_id_campaign_id_key" ON "UserPromoCode"("user_id", "campaign_id");

-- Performance indexes
CREATE INDEX "PromoCampaign_badge_level_is_active_idx" ON "PromoCampaign"("badge_level", "is_active");
CREATE INDEX "UserPromoCode_user_id_status_idx" ON "UserPromoCode"("user_id", "status");
CREATE INDEX "UserPromoCode_expires_at_idx" ON "UserPromoCode"("expires_at");

-- Foreign keys
ALTER TABLE "UserPromoCode"
  ADD CONSTRAINT "UserPromoCode_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPromoCode"
  ADD CONSTRAINT "UserPromoCode_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "PromoCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPromoCode"
  ADD CONSTRAINT "UserPromoCode_badge_id_fkey"
  FOREIGN KEY ("badge_id") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default campaigns for important badges
INSERT INTO "PromoCampaign" (
  "name", "description", "badge_level", "brand", "category", "discount_type", "discount_value", "code_prefix", "expires_in_days", "is_active", "updated_at"
) VALUES
  ('Gold Reward', 'Unlocked with Gold badge', 'GOLD', 'SVR', 'skincare', 'PERCENT', 10, 'GLD', 14, true, CURRENT_TIMESTAMP),
  ('Platinum Reward', 'Unlocked with Platinum badge', 'PLATINUM', 'La Roche-Posay', 'serum', 'PERCENT', 15, 'PLT', 21, true, CURRENT_TIMESTAMP),
  ('Ruby Master Reward', 'Unlocked with Ruby Master badge', 'RUBY_MASTER', 'CeraVe', 'moisturizer', 'PERCENT', 20, 'RBY', 30, true, CURRENT_TIMESTAMP);
