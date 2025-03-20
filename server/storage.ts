import { type Vehicle, type Driver, type Booking, type InsertBooking, type VehicleGroup, type InsertVehicleGroup } from "@shared/schema";
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { type Employee } from '@shared/schema';
import { type User, type InsertUser } from '@shared/schema';
import { type OtpVerification, type InsertOtpVerification } from '@shared/schema';
import { type VehicleTypeMaster, type InsertVehicleTypeMaster } from '@shared/schema'; // Import VehicleTypeMaster
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

const locations = z.object({
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  })
});

const timeWindow = z.object({
  start: z.union([z.string(), z.date()]),
  end: z.union([z.string(), z.date()])
});

function calculateDistance(loc1: z.infer<typeof locations>, loc2: z.infer<typeof locations>): number {
  const R = 6371; // Earth's radius in km
  const lat1 = loc1.coordinates.lat * Math.PI / 180;
  const lat2 = loc2.coordinates.lat * Math.PI / 180;
  const dLat = (loc2.coordinates.lat - loc1.coordinates.lat) * Math.PI / 180;
  const dLon = (loc2.coordinates.lng - loc1.coordinates.lng) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function timeWindowsOverlap(window1: z.infer<typeof timeWindow>, window2: z.infer<typeof timeWindow>): boolean {
  const start1 = new Date(window1.start).getTime();
  const end1 = new Date(window1.end).getTime();
  const start2 = new Date(window2.start).getTime();
  const end2 = new Date(window2.end).getTime();

  return start1 < end2 && end1 > start2;
}

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
}

export class DatabaseStorage implements IStorage {
  // Vehicle Type Master methods
  async getAllVehicleTypes(): Promise<VehicleTypeMaster[]> {
    return await db.select().from(schema.vehicleTypeMaster);
  }

  async getVehicleType(id: number): Promise<VehicleTypeMaster | null> {
    const [type] = await db
      .select()
      .from(schema.vehicleTypeMaster)
      .where(eq(schema.vehicleTypeMaster.id, id));
    return type || null;
  }

  async createVehicleType(type: InsertVehicleTypeMaster): Promise<VehicleTypeMaster> {
    const [newType] = await db
      .insert(schema.vehicleTypeMaster)
      .values({
        ...type,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newType;
  }

  async updateVehicleType(id: number, data: Partial<InsertVehicleTypeMaster>): Promise<VehicleTypeMaster> {
    const [updatedType] = await db
      .update(schema.vehicleTypeMaster)
      .set({
        ...data,
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