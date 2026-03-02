import { MsgType } from './Enums';
import prisma from '@/lib/prisma';

export class ChatbotMessage {
  id!: number;
  user_id!: number;
  message!: string;
  role!: string;
  created_at!: Date;
  msg_type!: MsgType;
}

// Fonctions utilitaires pour ChatbotMessage
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

export const findChatbotMessagesByUserId = async (user_id: number) => {
  return await prisma.chatbotMessage.findMany({ 
    where: { user_id },
    orderBy: { created_at: 'asc' }
  });
};

export const findAllChatbotMessages = async () => {
  return await prisma.chatbotMessage.findMany();
};

export const deleteChatbotMessage = async (id: number) => {
  return await prisma.chatbotMessage.delete({ where: { id } });
};

export const deleteChatbotMessagesByUserId = async (user_id: number) => {
  return await prisma.chatbotMessage.deleteMany({ where: { user_id } });
};
