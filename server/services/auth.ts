import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Employee, InsertUser, User } from '@shared/schema';
import { storage } from '../storage';
import { UserType, UserOperationType, UserGroup } from '@shared/schema';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'ns1.dt.ae',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'alert@dt-alert.com',
    pass: process.env.SMTP_PASS || 'oiuy!@#dr69'
  },
  tls: {
    rejectUnauthorized: false
  }
});

export class AuthService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOTPEmail(email: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'alert@dt-alert.com',
        to: email,
        subject: 'Your TripXL Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to TripXL!</h1>
            <p style="font-size: 16px; text-align: center;">Your verification code is:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <strong style="font-size: 32px; letter-spacing: 8px;">${otp}</strong>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              This code will expire in 15 minutes.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send verification code');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async registerUser(userData: InsertUser): Promise<{ user: User; userId: number }> {
    try {
      // Hash the password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create inactive user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        isActive: false
      });

      // Generate and store OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await storage.createOtpVerification({
        userId: user.id,
        otp,
        type: 'registration',
        expiresAt
      });

      // Send OTP email
      await this.sendOTPEmail(userData.emailId, otp);

      return { user, userId: user.id };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async verifyOTP(userId: number, otp: string): Promise<{ user: User; token: string }> {
    try {
      const verification = await storage.getOtpVerification(userId);
      if (!verification) {
        throw new Error('Verification code not found');
      }

      if (verification.otp !== otp) {
        throw new Error('Invalid verification code');
      }

      if (new Date() > verification.expiresAt) {
        throw new Error('Verification code has expired');
      }

      // Activate user
      const user = await storage.activateUser(userId);

      // Delete used OTP
      await storage.deleteOtpVerification(userId);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, emailId: user.emailId },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '24h' }
      );

      return { user, token };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  }

  async login(emailId: string, password: string): Promise<{ user: User; token: string }> {
    if (!emailId || !password) {
      throw new Error('Email and password are required');
    }

    const user = await storage.findUserByEmail(emailId);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    await storage.updateUserLastLogin(user.id);

    const token = jwt.sign(
      { userId: user.id, emailId: user.emailId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async verifyEmployee(employeeId: string, emailId: string): Promise<Employee | null> {
    if (!employeeId || !emailId) {
      return null;
    }

    try {
      const employee = await storage.findEmployeeByIdAndEmail(employeeId, emailId);
      if (!employee || !employee.isActive) {
        return null;
      }
      return employee;
    } catch (error) {
      console.error('Error in verifyEmployee:', error);
      return null;
    }
  }
  async initializeDefaultUser(): Promise<void> {
    try {
      console.log("Checking for default user existence...");
      const existingUser = await storage.getUserByUserName("john.smith");

      if (!existingUser) {
        console.log("Default user not found, creating...");
        const password = await this.hashPassword("Code@4088");

        try {
          const userCode = "USR" + Math.floor(1000 + Math.random() * 9000).toString();
          await storage.createUser({
            userName: "john.smith",
            userCode: userCode,
            userType: UserType.ADMIN,
            emailId: "john.smith@company.com",
            userOperationType: UserOperationType.ADMIN,
            userGroup: UserGroup.GROUP_A,
            firstName: "John",
            lastName: "Smith",
            fullName: "John Smith",
            password,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log("Default user created successfully");
        } catch (error: any) {
          if (error.code === '23505') {
            console.log("Default user already exists (caught duplicate key)");
            return;
          }
          throw error;
        }
      } else {
        console.log("Default user already exists");
      }
    } catch (error) {
      console.error("Error in initializeDefaultUser:", error);
    }
  }
}

export const authService = new AuthService();