import prisma from '@/lib/prisma';
import { getIO } from '../lib/socket-io';

export const createNotification = async (data: {
  userId?: number;
  image?: string;
  title: string;
  subTitle: string;
  type: string;
  message?: string;
  score?: number;
}) => {
  try {
    const dbNotif = await prisma.notification.create({
      data: {
        user_id: data.userId,
        image: data.image || "/avatar.png",
        title: data.title,
        subTitle: data.subTitle,
        type: data.type,
        message: data.message,
        score: data.score,
      }
    });

    const io = getIO();
    if (io) {
      io.emit(data.type, {
        ...dbNotif,
        timestamp: dbNotif.created_at,
        nom: data.userId ? (await prisma.user.findUnique({ where: { id: data.userId }, select: { nom: true } }))?.nom : 'User'
      });
    }

    return dbNotif;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getAdminNotifications = async (limit = 50) => {
  return await prisma.notification.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
  });
};

export const markNotificationAsRead = async (id: number | 'all') => {
  if (id === 'all') {
    return await prisma.notification.updateMany({
      where: { is_read: false },
      data: { is_read: true },
    });
  }
  return await prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
};
