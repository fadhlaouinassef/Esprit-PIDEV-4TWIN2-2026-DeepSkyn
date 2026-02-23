import { EtatComplaint } from './Enums';
import { prisma } from '../../prisma/prisma.config';

export class Complaint {
  id!: number;
  user_id!: number;
  nom!: string;
  message!: string;
  image?: string;
  etat!: EtatComplaint;
}

// Fonctions utilitaires pour Complaint
export const createComplaint = async (data: {
  user_id: number;
  nom: string;
  message: string;
  image?: string;
}) => {
  return await prisma.complaint.create({ data });
};

export const findComplaintById = async (id: number) => {
  return await prisma.complaint.findUnique({ where: { id } });
};

export const findComplaintsByUserId = async (user_id: number) => {
  return await prisma.complaint.findMany({ where: { user_id } });
};

export const findComplaintsByEtat = async (etat: EtatComplaint) => {
  return await prisma.complaint.findMany({ where: { etat } });
};

export const findAllComplaints = async () => {
  return await prisma.complaint.findMany();
};

export const updateComplaint = async (id: number, data: Partial<Omit<Complaint, 'id'>>) => {
  return await prisma.complaint.update({ where: { id }, data });
};

export const updateComplaintEtat = async (id: number, etat: EtatComplaint) => {
  return await prisma.complaint.update({ where: { id }, data: { etat } });
};

export const deleteComplaint = async (id: number) => {
  return await prisma.complaint.delete({ where: { id } });
};
