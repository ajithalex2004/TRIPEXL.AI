import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import type { Employee, InsertUser, User } from '@shared/schema';
import { storage } from '../storage';

// Mock SMS service for development
const smsService = {
  sendMessage: async (to: string, message: string) => {
    console.log('SMS would be sent:', { to, message });
    return true;
  }
};

// Create a mock transporter for development
const transporter = {
  sendMail: async (options: any) => {
    console.log('Email would be sent:', options);
    return true;
  }
};

export class AuthService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateToken(user: User): Promise<string> {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );
  }

  async verifyEmployee(employeeId: string, email: string): Promise<Employee | null> {
    const employee = await storage.findEmployeeByIdAndEmail(employeeId, email);
    if (!employee || !employee.isActive) {
      return null;
    }
    return employee;
  }

  async registerUser(userData: InsertUser, password: string): Promise<{ user: User; otp: string }> {
    if (!password) {
      throw new Error('Password is required');
    }

    // Verify employee exists and is active
    const employee = await this.verifyEmployee(userData.employeeId, userData.email);
    if (!employee) {
      throw new Error('Invalid employee ID or email');
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await storage.createOtpVerification({
        userId: user.id,
        otp,
        type: 'phone',
        expiresAt,
      });

      // Log OTP for development (remove in production)
      console.log('Generated OTP:', otp);

      // Send OTP via SMS
      if (user.phoneNumber) {
        await smsService.sendMessage(
          user.phoneNumber,
          `Your verification code is: ${otp}`
        );
      }

      return { user, otp };
    } catch (error) {
      console.error('Error in registerUser:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to register user');
    }
  }

  async verifyOTP(userId: number, otp: string): Promise<{ user: User; token: string }> {
    const verification = await storage.findLatestOtpVerification(userId);

    if (!verification || verification.isUsed || verification.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > verification.expiresAt) {
      throw new Error('OTP expired');
    }

    // Mark OTP as used
    await storage.markOtpAsUsed(verification.id);

    // Mark user as verified
    const user = await storage.markUserAsVerified(userId);
    const token = await this.generateToken(user);

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await storage.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your account first');
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    const token = await this.generateToken(user);
    return { user, token };
  }
}

export const authService = new AuthService();