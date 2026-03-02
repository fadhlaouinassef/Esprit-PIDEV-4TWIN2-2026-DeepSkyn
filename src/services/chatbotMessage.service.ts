import prisma from '@/lib/prisma';
import { MsgType } from '../entities/Enums';

export const createChatbotMessage = async (data: {
  user_id: number;
  message: string;
  role: string;
  msg_type: MsgType;
}) => {
  return await prisma.chatbotMessage.create({ data });
};

export const findChatbotMessageById = async (id: number) => {
  return await prisma.chatbotMessage.findUnique({ where: { id } });
};

export const findChatbotMessagesByUserId = async (userId: number) => {
  return await prisma.chatbotMessage.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });
};

export const findAllChatbotMessages = async () => {
  return await prisma.chatbotMessage.findMany({
    orderBy: { created_at: 'desc' },
  });
};

export const deleteChatbotMessage = async (id: number) => {
  return await prisma.chatbotMessage.delete({ where: { id } });
};

export const deleteChatbotMessagesByUserId = async (userId: number) => {
  return await prisma.chatbotMessage.deleteMany({ where: { user_id: userId } });
};
