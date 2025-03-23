import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Employee, InsertUser, User } from '@shared/schema';
import { storage } from '../storage';
import { UserType, UserOperationType, UserGroup } from '@shared/schema';
import nodemailer from 'nodemailer';

// Configure email transporter for development
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export class AuthService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, emailId: user.emailId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );
  }

  private async sendOTPEmail(email: string, otp: string) {
    try {
      console.log('Attempting to send OTP email to:', email);

      // Verify SMTP configuration
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Missing SMTP configuration');
        throw new Error('Email service not properly configured');
      }

      // Log SMTP configuration (without sensitive data)
      console.log('SMTP Configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        from: process.env.SMTP_FROM || '"TripXL Support" <support@tripxl.com>',
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"TripXL Support" <support@tripxl.com>',
        to: email,
        subject: 'Your TripXL Registration Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; text-align: center;">Welcome to TripXL!</h1>
            <p style="font-size: 16px;">Your verification code is:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
              <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This code will expire in 15 minutes.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `
      };

      console.log('Sending email with options:', { ...mailOptions, to: '***' });

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error('Failed to send verification code. Please try again later.');
    }
  }

  async login(emailId: string, password: string): Promise<{ user: User; token: string }> {
    if (!emailId || !password) {
      throw new Error('Email and password are required');
    }

    console.log('Attempting login for email:', emailId);

    const user = await storage.findUserByEmail(emailId);
    if (!user) {
      console.log('User not found:', emailId);
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password for user:', emailId);
      throw new Error('Invalid email or password');
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    const token = this.generateToken(user);
    return { user, token };
  }

  async verifyEmployee(employeeId: string, emailId: string): Promise<Employee | null> {
    if (!employeeId || !emailId) {
      console.log('Missing employee verification data:', { employeeId, emailId });
      return null;
    }

    try {
      const employee = await storage.findEmployeeByIdAndEmail(employeeId, emailId);
      if (!employee || !employee.isActive) {
        console.log('Employee verification failed:', { employeeId, emailId });
        return null;
      }
      return employee;
    } catch (error) {
      console.error('Error in verifyEmployee:', error);
      return null;
    }
  }

  private async createHashedPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async registerUser(userData: InsertUser): Promise<{ user: User; otp: string }> {
    if (!userData.password) {
      throw new Error('Password is required');
    }

    // Hash password
    const password = await this.createHashedPassword(userData.password);

    try {
      // Create user with pending status
      const user = await storage.createUser({
        ...userData,
        password,
        isActive: false, // User starts as inactive until OTP verification
      });

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Store OTP
      await storage.createOtpVerification({
        userId: user.id,
        otp,
        type: 'registration',
        expiresAt,
      });

      // Send OTP email
      await this.sendOTPEmail(userData.emailId, otp);

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
    const token = this.generateToken(user);

    return { user, token };
  }
  async initializeDefaultUser(): Promise<void> {
    try {
      console.log("Checking for default user existence...");
      const existingUser = await storage.getUserByUserName("john.smith");

      if (!existingUser) {
        console.log("Default user not found, creating...");
        const password = await this.createHashedPassword("Code@4088");

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