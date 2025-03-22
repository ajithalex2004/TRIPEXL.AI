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

  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, emailId: user.emailId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );
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
      // Create user
      const user = await storage.createUser({
        ...userData,
        password,
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

      return { user, otp };
    } catch (error) {
      console.error('Error in registerUser:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to register user');
    }
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