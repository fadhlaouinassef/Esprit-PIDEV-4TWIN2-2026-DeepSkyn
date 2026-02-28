import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserById, updateUserOtp, verifyUserOtp as verifyOtpInDb, markUserAsVerified, updateUser } from './user.service';
import { sendOtpEmail, sendWelcomeEmail, generateOtp } from './email.service';
import { RoleType } from '../entities/Enums';

export interface SignupData {
  email: string;
  password: string;
  nom: string;
  sexe?: string;
  age?: number;
}

export interface SigninData {
  email: string;
  password: string;
}

export const signup = async (data: SignupData) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await createUser({
      email: data.email,
      password: hashedPassword,
      nom: data.nom,
      sexe: data.sexe,
      age: data.age,
      role: RoleType.USER,
      verified: false,
    });

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await updateUserOtp(user.id, otp, otpExpiry);

    // Send OTP email
    await sendOtpEmail(data.email, otp, data.nom);

    return {
      success: true,
      userId: user.id,
      message: 'Account created successfully. Please check your email for the verification code.',
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const verifyOtp = async (userId: number, otp: string) => {
  try {
    const isValid = await verifyOtpInDb(userId, otp);

    if (!isValid) {
      throw new Error('Invalid or expired OTP code');
    }

    // Mark user as verified
    const user = await markUserAsVerified(userId);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.nom || 'User');

    return {
      success: true,
      message: 'Account verified successfully',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

export const signin = async (data: SigninData) => {
  try {
    // Find user by email
    const user = await findUserByEmail(data.email);
    if (!user) {
      throw new Error('Email ou mot de passe invalide');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe invalide');
    }

    // Check if user is verified AFTER password validation
    if (!user.verified) {
      // Generate new OTP
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await updateUserOtp(user.id, otp, otpExpiry);

      // Send OTP email
      await sendOtpEmail(user.email, otp, user.nom || 'User');

      return {
        success: false,
        unverified: true,
        userId: user.id,
        email: user.email,
        message: 'Compte non vérifié. Un nouveau code de vérification vous a été envoyé par e-mail.',
      };
    }

    return {
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        image: user.image,
        age: user.age,
        sexe: user.sexe,
        skin_type: user.skin_type,
        verified: user.verified,
      },
    };
  } catch (error) {
    console.error('Signin error:', error);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Aucun utilisateur trouvé avec cet e-mail');
    }

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await updateUserOtp(user.id, otp, otpExpiry);

    // Send OTP email (using a generic OTP template or dedicated one if exists)
    await sendOtpEmail(user.email, otp, user.nom || 'User');

    return {
      success: true,
      userId: user.id,
      email: user.email,
      message: 'Un code de réinitialisation a été envoyé à votre e-mail.',
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (userId: number, password: string) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear OTP
    await updateUser(userId, {
      password: hashedPassword,
      otp_code: null,
      otp_expiry: null,
    });

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const resendOtp = async (userId: number) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (user.verified) {
      throw new Error('Account is already verified');
    }

    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP in database
    await updateUserOtp(userId, otp, otpExpiry);

    // Send OTP email
    await sendOtpEmail(user.email, otp, user.nom || 'User');

    return {
      success: true,
      message: 'New verification code sent to your email',
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};
