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

// Add VehicleMaster operations to IStorage interface
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

  // Employee methods
  findEmployeeByIdAndEmail(employeeId: string, email: string): Promise<Employee | null>;

  // User methods
  createUser(user: InsertUser & { passwordHash: string }): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  markUserAsVerified(userId: number): Promise<User>;
  updateUserLastLogin(userId: number): Promise<User>;

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
    throw new Error("Method not implemented.");
  }
  async getDrivers(): Promise<Driver[]> {
    throw new Error("Method not implemented.");
  }
  async getAvailableDrivers(): Promise<Driver[]> {
    throw new Error("Method not implemented.");
  }
  async updateDriverStatus(id: number, status: string): Promise<Driver> {
    throw new Error("Method not implemented.");
  }
  async getBookings(): Promise<Booking[]> {
    throw new Error("Method not implemented.");
  }
  async createBooking(booking: InsertBooking): Promise<Booking> {
    throw new Error("Method not implemented.");
  }
  async assignBooking(bookingId: number, vehicleId: number, driverId: number): Promise<Booking> {
    throw new Error("Method not implemented.");
  }
  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    throw new Error("Method not implemented.");
  }
  async findEmployeeByIdAndEmail(employeeId: string, email: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.employeeId, employeeId))
      .where(eq(schema.employees.email, email));
    return employee || null;
  }
  async createUser(userData: InsertUser & { passwordHash: string }): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values({
        ...userData,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }
  async findUserByEmail(email: string): Promise<User | null> {
    return this.getUserByEmail(email);
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
    const [user] = await db
      .update(schema.users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
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
}

export const storage = new DatabaseStorage();