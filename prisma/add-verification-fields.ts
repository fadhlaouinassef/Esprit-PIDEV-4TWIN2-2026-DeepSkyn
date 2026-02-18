import { prisma } from './prisma.config';

async function addUserVerificationFields() {
  try {
    console.log('🔄 Adding verification fields to User table...');

    // Add image column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "image" TEXT;
    `);
    console.log('✅ Added image column');

    // Add verified column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false NOT NULL;
    `);
    console.log('✅ Added verified column');

    // Add otp_code column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "otp_code" TEXT;
    `);
    console.log('✅ Added otp_code column');

    // Add otp_expiry column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "otp_expiry" TIMESTAMP;
    `);
    console.log('✅ Added otp_expiry column');

    console.log('✅ Successfully added all verification fields to User table!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error adding verification fields:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addUserVerificationFields();
