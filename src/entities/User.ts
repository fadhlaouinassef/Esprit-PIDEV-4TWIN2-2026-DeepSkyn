import { RoleType, SkinType } from './Enums';

export class User {
  id!: number;
  email!: string;
  password!: string;
  role!: RoleType;
  created_at!: Date;
  nom?: string;
  prenom?: string;
  sexe?: string;
  age?: number;
  skin_type?: SkinType;
  image?: string;
  verified!: boolean;
  otp_code?: string;
  otp_expiry?: Date;
}
