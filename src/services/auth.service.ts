import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, updateUserOtp, verifyUserOtp as verifyOtpInDb, markUserAsVerified } from './user.service';
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
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.verified) {
      throw new Error('Please verify your account first. Check your email for the verification code.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return {
      success: true,
      message: 'Login successful',
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

export const resendOtp = async (userId: number) => {
  try {
    const user = await findUserByEmail(''); // We need to modify this to find by ID
    if (!user) {
      throw new Error('User not found');
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
