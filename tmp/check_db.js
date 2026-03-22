const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quizCount = await prisma.quiz.count();
  const questionCount = await prisma.quizQuestion.count();
  console.log('Quiz count:', quizCount);
  console.log('Question count:', questionCount);
  const questions = await prisma.quizQuestion.findMany();
  console.log('Questions:', JSON.stringify(questions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
