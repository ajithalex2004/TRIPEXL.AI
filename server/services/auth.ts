import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Employee, InsertUser, User } from '@shared/schema';
import { storage } from '../storage';
import { UserType, UserOperationType, UserGroup } from '@shared/schema';

// Mock SMS service for development
const smsService = {
  sendMessage: async (to: string, message: string) => {
    console.log('SMS would be sent:', { to, message });
    return true;
  }
};

export class AuthService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: User): Promise<string> {
    return Promise.resolve(jwt.sign(
      { userId: user.id, emailId: user.emailId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    ));
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

  async registerUser(userData: InsertUser, password: string): Promise<{ user: User; otp: string }> {
    if (!password) {
      throw new Error('Password is required');
    }

    console.log('Attempting to verify employee:', { employeeId: userData.employeeId, email: userData.email });

    // Verify employee exists and is active
    const employee = await this.verifyEmployee(userData.employeeId, userData.email);
    if (!employee) {
      throw new Error('Invalid employee ID or email');
    }

    try {
      // Hash password
      const passwordHash = await this.createHashedPassword(password);

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

    console.log('Attempting login for email:', email);

    const user = await storage.findUserByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('Invalid password for user:', email);
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

  async initializeDefaultUser(): Promise<void> {
    try {
      console.log("Checking for default user existence...");
      const existingUser = await storage.getUserByUserName("john.smith");

      if (!existingUser) {
        console.log("Default user not found, creating...");
        const password = await this.createHashedPassword("Code@4088");

        try {
          await storage.createUser({
            userName: "john.smith",
            userCode: "USR001",
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
          // If error is a duplicate key error, we can ignore it as the user already exists
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
      // Don't throw the error further as this is initialization code
    }
  }
}

export const authService = new AuthService();