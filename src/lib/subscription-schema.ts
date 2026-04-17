import prisma from '@/lib/prisma';

let amountColumnEnsured = false;

/**
 * Ensure legacy databases have the Subscription.amount column expected by Prisma.
 */
export const ensureSubscriptionAmountColumn = async (): Promise<void> => {
  if (amountColumnEnsured) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Subscription"
    ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION;
  `);

  amountColumnEnsured = true;
};
