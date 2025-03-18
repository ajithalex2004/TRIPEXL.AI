import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import type { Employee, InsertUser, User } from '@shared/schema';
import { storage } from '../storage';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class AuthService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateToken(user: User): Promise<string> {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
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

    // Hash password
    try {
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Generate and store OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // OTP expires in 15 minutes

      await storage.createOtpVerification({
        userId: user.id,
        otp,
        type: 'email',
        expiresAt,
      });

      // Send OTP email
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: 'Verify your account',
        html: `
          <h1>Welcome to Vehicle Booking System</h1>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        `,
      });

      return { user, otp };
    } catch (error) {
      console.error('Error in registerUser:', error);
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