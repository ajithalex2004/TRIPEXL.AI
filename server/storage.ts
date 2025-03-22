import { type Vehicle, type Driver, type Booking, type InsertBooking, type VehicleGroup, type InsertVehicleGroup, type VehicleMaster, type InsertVehicleMaster } from "@shared/schema";
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { type Employee } from '@shared/schema';
import { type User, type InsertUser } from '@shared/schema';
import { type OtpVerification, type InsertOtpVerification } from '@shared/schema';
import { type VehicleTypeMaster, type InsertVehicleTypeMaster } from '@shared/schema';
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

// Add VehicleMaster operations to IStorage interface
import { type User, type InsertUser } from "@shared/schema";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getAvailableVehicles(): Promise<Vehicle[]>;
  updateVehicleStatus(id: number, status: string): Promise<Vehicle>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getAvailableDrivers(): Promise<Driver[]>;
  updateDriverStatus(id: number, status: string): Promise<Driver>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  assignBooking(bookingId: number, vehicleId: number, driverId: number): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking>;
  updateBookingMetadata(
    bookingId: number,
    metadata: {
      totalDistance?: number;
      estimatedCost?: number;
      co2Emissions?: number;
    }
  ): Promise<Booking>;

  // Employee methods
  findEmployeeByIdAndEmail(employeeId: string, email: string): Promise<Employee | null>;
  findEmployeeByEmployeeId(employeeId: string): Promise<Employee | null>; // Added method
  findUserByEmployeeId(employeeId: string): Promise<User | null>; // Added method

  // User methods
  createUser(user: InsertUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  markUserAsVerified(userId: number): Promise<User>;
  updateUserLastLogin(userId: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserByUserName(userName: string): Promise<User | null>;


  // OTP methods
  createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification>;
  findLatestOtpVerification(userId: number): Promise<OtpVerification | null>;
  markOtpAsUsed(verificationId: number): Promise<OtpVerification>;

  // Add Vehicle Group methods
  getAllVehicleGroups(): Promise<VehicleGroup[]>;
  getVehicleGroup(id: number): Promise<VehicleGroup | null>;
  createVehicleGroup(group: InsertVehicleGroup): Promise<VehicleGroup>;
  updateVehicleGroup(id: number, data: Partial<InsertVehicleGroup>): Promise<VehicleGroup>;

  // Vehicle Type Master methods
  getAllVehicleTypes(): Promise<VehicleTypeMaster[]>;
  getVehicleType(id: number): Promise<VehicleTypeMaster | null>;
  createVehicleType(type: InsertVehicleTypeMaster): Promise<VehicleTypeMaster>;
  updateVehicleType(id: number, data: Partial<InsertVehicleTypeMaster>): Promise<VehicleTypeMaster>;

  // Vehicle Master operations
  getAllVehicleMaster(): Promise<VehicleMaster[]>;
  getVehicleMaster(id: number): Promise<VehicleMaster | null>;
  createVehicleMaster(data: InsertVehicleMaster): Promise<VehicleMaster>;
  updateVehicleMaster(id: number, data: Partial<InsertVehicleMaster>): Promise<VehicleMaster>;

  updateUserResetToken(userId: number, resetToken: string, resetTokenExpiry: Date): Promise<User>;
  findUserByResetToken(resetToken: string): Promise<User | null>;
}

export class DatabaseStorage implements IStorage {
  // Vehicle Type Master methods
  async getAllVehicleTypes(): Promise<VehicleTypeMaster[]> {
    try {
      console.log("Querying vehicle type master records");
      const vehicleTypes = await db.select().from(schema.vehicleTypeMaster);
      console.log("Found vehicle types:", vehicleTypes);
      return vehicleTypes;
    } catch (error) {
      console.error("Error in getAllVehicleTypes:", error);
      throw error;
    }
  }

  async getVehicleType(id: number): Promise<VehicleTypeMaster | null> {
    try {
      const [type] = await db
        .select()
        .from(schema.vehicleTypeMaster)
        .where(eq(schema.vehicleTypeMaster.id, id));
      return type || null;
    } catch (error) {
      console.error("Error in getVehicleType:", error);
      throw error;
    }
  }

  async createVehicleType(type: InsertVehicleTypeMaster): Promise<VehicleTypeMaster> {
    // Generate the vehicle type name by combining manufacturer and vehicle type
    const vehicleTypeName = `${type.manufacturer} ${type.vehicleType}`;

    const [newType] = await db
      .insert(schema.vehicleTypeMaster)
      .values({
        ...type,
        vehicleTypeName,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newType;
  }

  async updateVehicleType(id: number, data: Partial<InsertVehicleTypeMaster>): Promise<VehicleTypeMaster> {
    let updateData = { ...data };

    // If either manufacturer or vehicleType is updated, update the vehicleTypeName
    if (data.manufacturer || data.vehicleType) {
      const [currentType] = await db
        .select()
        .from(schema.vehicleTypeMaster)
        .where(eq(schema.vehicleTypeMaster.id, id));

      const manufacturer = data.manufacturer || currentType.manufacturer;
      const vehicleType = data.vehicleType || currentType.vehicleType;
      updateData.vehicleTypeName = `${manufacturer} ${vehicleType}`;
    }

    const [updatedType] = await db
      .update(schema.vehicleTypeMaster)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(schema.vehicleTypeMaster.id, id))
      .returning();
    return updatedType;
  }

  // Vehicle Group methods
  async getAllVehicleGroups(): Promise<VehicleGroup[]> {
    return await db.select().from(schema.vehicleGroups);
  }

  async getVehicleGroup(id: number): Promise<VehicleGroup | null> {
    const [group] = await db
      .select()
      .from(schema.vehicleGroups)
      .where(eq(schema.vehicleGroups.id, id));
    return group || null;
  }

  async createVehicleGroup(group: InsertVehicleGroup): Promise<VehicleGroup> {
    const [newGroup] = await db
      .insert(schema.vehicleGroups)
      .values({
        ...group,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newGroup;
  }

  async updateVehicleGroup(id: number, data: Partial<InsertVehicleGroup>): Promise<VehicleGroup> {
    const [updatedGroup] = await db
      .update(schema.vehicleGroups)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.vehicleGroups.id, id))
      .returning();
    return updatedGroup;
  }


  // Implement Vehicle Master operations
  async getAllVehicleMaster(): Promise<VehicleMaster[]> {
    return await db.select().from(schema.vehicleMaster);
  }

  async getVehicleMaster(id: number): Promise<VehicleMaster | null> {
    const [vehicle] = await db
      .select()
      .from(schema.vehicleMaster)
      .where(eq(schema.vehicleMaster.id, id));
    return vehicle || null;
  }

  async createVehicleMaster(data: InsertVehicleMaster): Promise<VehicleMaster> {
    const [newVehicle] = await db
      .insert(schema.vehicleMaster)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newVehicle;
  }

  async updateVehicleMaster(id: number, data: Partial<InsertVehicleMaster>): Promise<VehicleMaster> {
    const [updatedVehicle] = await db
      .update(schema.vehicleMaster)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.vehicleMaster.id, id))
      .returning();
    return updatedVehicle;
  }

  async getVehicles(): Promise<Vehicle[]> {
    throw new Error("Method not implemented.");
  }
  async getAvailableVehicles(): Promise<Vehicle[]> {
    throw new Error("Method not implemented.");
  }
  async updateVehicleStatus(id: number, status: string): Promise<Vehicle> {
    const [vehicle] = await db
      .update(schema.vehicles)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(schema.vehicles.id, id))
      .returning();

    return vehicle;
  }
  async getDrivers(): Promise<Driver[]> {
    throw new Error("Method not implemented.");
  }
  async getAvailableDrivers(): Promise<Driver[]> {
    throw new Error("Method not implemented.");
  }
  async updateDriverStatus(id: number, status: string): Promise<Driver> {
    const [driver] = await db
      .update(schema.drivers)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(schema.drivers.id, id))
      .returning();

    return driver;
  }
  async getBookings(): Promise<Booking[]> {
    return await db.select().from(schema.bookings);
  }
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    try {
      console.log("Creating booking with data:", JSON.stringify(bookingData, null, 2));

      const processedData = {
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ensure number fields are properly typed
        numBoxes: bookingData.numBoxes ? Number(bookingData.numBoxes) : null,
        weight: bookingData.weight ? Number(bookingData.weight) : null,
        numPassengers: bookingData.numPassengers ? Number(bookingData.numPassengers) : null,
        totalDistance: bookingData.totalDistance ? Number(bookingData.totalDistance) : null,
        estimatedCost: bookingData.estimatedCost ? Number(bookingData.estimatedCost) : null,
        co2Emissions: bookingData.co2Emissions ? Number(bookingData.co2Emissions) : null
      };

      const [booking] = await db
        .insert(schema.bookings)
        .values(processedData)
        .returning();

      console.log("Successfully created booking:", booking);
      return booking;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to create booking");
    }
  }
  async assignBooking(bookingId: number, vehicleId: number, driverId: number): Promise<Booking> {
    const [booking] = await db
      .update(schema.bookings)
      .set({
        assignedVehicleId: vehicleId,
        assignedDriverId: driverId,
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.bookings.id, bookingId))
      .returning();

    return booking;
  }
  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const statusTimestamp = new Date();
    const updateData: Partial<Booking> = {
      status,
      updatedAt: statusTimestamp
    };

    // Add specific timestamp based on status
    switch (status) {
      case "confirmed":
        updateData.confirmedAt = statusTimestamp;
        break;
      case "completed":
        updateData.completedAt = statusTimestamp;
        break;
      case "cancelled":
        updateData.cancelledAt = statusTimestamp;
        break;
    }

    const [updatedBooking] = await db
      .update(schema.bookings)
      .set(updateData)
      .where(eq(schema.bookings.id, id))
      .returning();

    return updatedBooking;
  }
  async findEmployeeByIdAndEmail(employeeId: string, email: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.employeeId, employeeId))
      .where(eq(schema.employees.email, email));
    return employee || null;
  }
  async createUser(user: InsertUser): Promise<User> {
    console.log('Creating new user:', { ...user, password: '[REDACTED]' });
    try {
      const [newUser] = await db
        .insert(schema.users)
        .values({
          ...user,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      console.log('Created user successfully');
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  async findUserByEmail(emailId: string): Promise<User | null> {
    console.log('Finding user by email:', emailId);
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email_id, emailId))
        .limit(1);

      if (user) {
        console.log('User found:', { ...user, password: '[REDACTED]' });
      } else {
        console.log('No user found with email:', emailId);
      }

      return user || null;
    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user || null;
  }
  async getUser(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user || null;
  }
  async markUserAsVerified(userId: number): Promise<User> {
    const [user] = await db
      .update(schema.users)
      .set({
        isVerified: true,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }
  async updateUserLastLogin(userId: number): Promise<User> {
    console.log('Updating last login for user:', userId);
    try {
      const [user] = await db
        .update(schema.users)
        .set({
          updated_at: new Date()
        })
        .where(eq(schema.users.id, userId))
        .returning();

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      console.log('Last login updated successfully');
      return user;
    } catch (error) {
      console.error('Error updating user last login:', error);
      throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    const [newVerification] = await db
      .insert(schema.otpVerifications)
      .values({
        ...verification,
        isUsed: false,
        createdAt: new Date()
      })
      .returning();
    return newVerification;
  }
  async findLatestOtpVerification(userId: number): Promise<OtpVerification | null> {
    const [verification] = await db
      .select()
      .from(schema.otpVerifications)
      .where(eq(schema.otpVerifications.userId, userId))
      .orderBy(desc(schema.otpVerifications.createdAt))
      .limit(1);
    return verification || null;
  }
  async markOtpAsUsed(verificationId: number): Promise<OtpVerification> {
    const [verification] = await db
      .update(schema.otpVerifications)
      .set({
        isUsed: true
      })
      .where(eq(schema.otpVerifications.id, verificationId))
      .returning();
    return verification;
  }
  async updateBookingMetadata(
    bookingId: number,
    metadata: {
      totalDistance?: number;
      estimatedCost?: number;
      co2Emissions?: number;
    }
  ): Promise<Booking> {
    try {
      console.log("Storage: Updating booking metadata:", { bookingId, metadata });

      const [updatedBooking] = await db
        .update(schema.bookings)
        .set({
          ...metadata,
          updatedAt: new Date()
        })
        .where(eq(schema.bookings.id, bookingId))
        .returning();

      console.log("Storage: Successfully updated booking metadata:", updatedBooking);
      return updatedBooking;
    } catch (error) {
      console.error("Storage: Error updating booking metadata:", error);
      throw new Error(`Failed to update booking metadata: ${error.message}`);
    }
  }
  async getAllUsers(): Promise<User[]> {
    console.log('Fetching all users');
    try {
      const users = await db.select().from(schema.users);
      console.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getUserByUserName(userName: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.userName, userName));
    return user || null;
  }

  async getUserByEmail(emailId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.emailId, emailId));
    return user || null;
  }

  async updateUserResetToken(userId: number, resetToken: string, resetTokenExpiry: Date): Promise<User> {
    try {
      console.log('Updating reset token for user:', userId);
      const [user] = await db
        .update(schema.users)
        .set({
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId))
        .returning();

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      console.log('Reset token updated successfully');
      return user;
    } catch (error) {
      console.error('Error updating reset token:', error);
      throw new Error(`Failed to update reset token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findUserByResetToken(resetToken: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.resetToken, resetToken))
        .where(sql`${schema.users.resetTokenExpiry} > NOW()`)
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    try {
      console.log('Finding employee by ID:', employeeId);
      const [employee] = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.employeeId, employeeId))
        .limit(1);

      if (employee) {
        console.log('Found employee:', {
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          emailId: employee.emailId,
          mobileNumber: employee.mobileNumber
        });
      } else {
        console.log('No employee found with ID:', employeeId);
      }

      return employee || null;
    } catch (error) {
      console.error('Error finding employee:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findUserByEmployeeId(employeeId: string): Promise<User | null> {
    try {
      console.log('Checking if employee is already registered:', employeeId);
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.employeeId, employeeId))
        .limit(1);

      console.log('Existing user found:', user ? 'Yes' : 'No');
      return user || null;
    } catch (error) {
      console.error('Error checking user registration:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storage = new DatabaseStorage();