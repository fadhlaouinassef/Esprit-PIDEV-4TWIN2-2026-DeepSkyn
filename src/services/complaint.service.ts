import prisma from '@/lib/prisma';
import { EtatComplaint } from '../entities/Enums';

export const createComplaint = async (data: {
  user_id: number;
  titre: string;
  description?: string;
  etat?: EtatComplaint;
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
    orderBy: { date: 'desc' },
  });
};

export const findAllComplaints = async () => {
  return await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { date: 'desc' },
  });
};

export const findComplaintsByStatus = async (etat: EtatComplaint) => {
  return await prisma.complaint.findMany({
    where: { etat },
    include: { user: true },
    orderBy: { date: 'desc' },
  });
};

export const updateComplaint = async (
  id: number,
  data: { titre?: string; description?: string; etat?: EtatComplaint }
) => {
  return await prisma.complaint.update({ where: { id }, data });
};

export const deleteComplaint = async (id: number) => {
  return await prisma.complaint.delete({ where: { id } });
};
