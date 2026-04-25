import prisma from '@/lib/prisma';
import { ComplaintCategory, EtatComplaint } from '@prisma/client';

export const createComplaint = async (data: {
  user_id: number;
  content: string;
  category?: ComplaintCategory;
}) => {
  return await prisma.complaint.create({ data });
};

export const findComplaintById = async (id: number) => {
  return await prisma.complaint.findUnique({
    where: { id },
    include: { user: true },
  });
};

export const findComplaintsByUserId = async (userId: number) => {
  return await prisma.complaint.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

export const findAllComplaints = async () => {
  return await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { created_at: 'desc' },
  });
};

export const findComplaintsByStatus = async (status: EtatComplaint) => {
  return await prisma.complaint.findMany({
    where: { status },
    include: { user: true },
    orderBy: { created_at: 'desc' },
  });
};

export const updateComplaint = async (
  id: number,
  data: { content?: string; category?: ComplaintCategory; status?: EtatComplaint }
) => {
  return await prisma.complaint.update({ where: { id }, data });
};

export const deleteComplaint = async (id: number) => {
  return await prisma.complaint.delete({ where: { id } });
};
