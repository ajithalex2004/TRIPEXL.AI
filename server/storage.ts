import { type Vehicle, type Driver, type Booking, type InsertBooking, type Location, type TimeWindow } from "@shared/schema";
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { type Employee } from '@shared/schema';
import { type User, type InsertUser } from '@shared/schema';
import { type OtpVerification, type InsertOtpVerification } from '@shared/schema';

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
  markUserAsVerified(userId: number): Promise<User>;
  updateUserLastLogin(userId: number): Promise<User>;

  // OTP methods
  createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification>;
  findLatestOtpVerification(userId: number): Promise<OtpVerification | null>;
  markOtpAsUsed(verificationId: number): Promise<OtpVerification>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private drivers: Map<number, Driver>;
  private bookings: Map<number, Booking>;
  private currentId: { [key: string]: number };
  private employees: Map<number, Employee>;
  private users: Map<number, User>;
  private otpVerifications: Map<number, OtpVerification>;

  constructor() {
    this.vehicles = new Map();
    this.drivers = new Map();
    this.bookings = new Map();
    this.employees = new Map();
    this.users = new Map();
    this.otpVerifications = new Map();
    this.currentId = { vehicles: 1, drivers: 1, bookings: 1, users: 1, employees: 1, otpVerifications: 1 };

    // Initialize with mock data
    this.initializeMockData();
  }

  private async initializeMockData() {
    // Mock employees
    const mockEmployees: Employee[] = [
      {
        id: this.currentId.employees++,
        employeeId: "EMP001",
        name: "John Smith",
        email: "john.smith@company.com",
        phone: "+1234567890",
        department: "Operations",
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Initialize mock employees
    mockEmployees.forEach(e => this.employees.set(e.id, e));

    // Create initial user for EMP001 with hashed password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Code@4088", salt);

    const user: User = {
      id: this.currentId.users++,
      employeeId: "EMP001",
      email: "john.smith@company.com",
      passwordHash,
      phoneNumber: "+1234567890",
      isVerified: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the user
    this.users.set(user.id, user);
    console.log("Default user created with email:", user.email);

    // Mock vehicles
    const mockVehicles: Vehicle[] = [
      {
        id: this.currentId.vehicles++,
        name: "Delivery Van 1",
        type: "van",
        loadCapacity: 1000,
        imageUrl: "https://images.unsplash.com/photo-1581406785482-53e693f8eb78",
        status: "available",
        currentLocation: {
          address: "123 Main St",
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        features: []
      }
    ];

    // Mock drivers
    const mockDrivers: Driver[] = [
      {
        id: this.currentId.drivers++,
        name: "John Doe",
        status: "available",
        avatarUrl: "https://images.unsplash.com/photo-1541747277704-ef7fb8e1a31c",
        currentLocation: {
          address: "456 Park Ave",
          coordinates: { lat: 40.7580, lng: -73.9855 }
        },
        specializations: []
      }
    ];

    // Initialize vehicles and drivers
    mockVehicles.forEach(v => this.vehicles.set(v.id, v));
    mockDrivers.forEach(d => this.drivers.set(d.id, d));
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(v => v.status === "available");
  }

  async updateVehicleStatus(id: number, status: string): Promise<Vehicle> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) throw new Error("Vehicle not found");

    const updated = { ...vehicle, status };
    this.vehicles.set(id, updated);
    return updated;
  }

  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(d => d.status === "available");
  }

  async updateDriverStatus(id: number, status: string): Promise<Driver> {
    const driver = this.drivers.get(id);
    if (!driver) throw new Error("Driver not found");

    const updated = { ...driver, status };
    this.drivers.set(id, updated);
    return updated;
  }

  private async calculateAssignmentScore(
    booking: InsertBooking,
    vehicle: Vehicle,
    driver: Driver
  ): Promise<number> {
    let score = 0;

    // Check vehicle capacity with more granular scoring
    if (vehicle.loadCapacity >= booking.loadSize) {
      // Base score for meeting capacity requirement
      score += 10;

      // Optimal capacity utilization scoring (80-95%)
      const capacityUtilization = booking.loadSize / vehicle.loadCapacity;
      if (capacityUtilization >= 0.8 && capacityUtilization <= 0.95) {
        // More points for better utilization
        score += Math.floor((1 - Math.abs(0.875 - capacityUtilization)) * 10);
      }
    } else {
      return -1; // Immediate disqualification if capacity is insufficient
    }

    // Distance scoring with exponential decay
    const pickupDistance = calculateDistance(vehicle.currentLocation, booking.pickupLocation);
    const distanceScore = Math.max(0, 15 * Math.exp(-pickupDistance / 10));
    score += distanceScore;

    // Check existing bookings for this vehicle/driver
    const existingBookings = Array.from(this.bookings.values())
      .filter(b =>
        (b.vehicleId === vehicle.id || b.driverId === driver.id) &&
        b.status !== 'completed'
      );

    // Time window conflict checking with buffer zones
    const BUFFER_MINUTES = 30;
    for (const existing of existingBookings) {
      // Add buffer time to avoid tight scheduling
      const existingStart = new Date(existing.pickupWindow.start);
      const existingEnd = new Date(existing.dropoffWindow.end);
      const bookingStart = new Date(booking.pickupWindow.start);
      const bookingEnd = new Date(booking.dropoffWindow.end);

      existingStart.setMinutes(existingStart.getMinutes() - BUFFER_MINUTES);
      existingEnd.setMinutes(existingEnd.getMinutes() + BUFFER_MINUTES);

      if (bookingStart < existingEnd && bookingEnd > existingStart) {
        return -1; // Conflict with buffer zone
      }
    }

    // Driver proximity and historical performance scoring
    const driverToPickupDistance = calculateDistance(driver.currentLocation, booking.pickupLocation);
    const driverProximityScore = Math.max(0, 10 * Math.exp(-driverToPickupDistance / 8));
    score += driverProximityScore;

    // Bonus for vehicle type suitability (can be expanded based on cargo type)
    if (booking.loadSize <= 1000 && vehicle.type === 'van') score += 5;
    else if (booking.loadSize <= 5000 && vehicle.type === 'truck') score += 5;
    else if (booking.loadSize > 5000 && vehicle.type === 'semi') score += 5;

    return score;
  }

  private async findOptimalAssignment(booking: InsertBooking): Promise<{ vehicleId: number, driverId: number } | null> {
    const availableVehicles = await this.getAvailableVehicles();
    const availableDrivers = await this.getAvailableDrivers();

    let bestScore = -1;
    let bestAssignment = null;

    for (const vehicle of availableVehicles) {
      for (const driver of availableDrivers) {
        const score = await this.calculateAssignmentScore(booking, vehicle, driver);
        if (score > bestScore) {
          bestScore = score;
          bestAssignment = { vehicleId: vehicle.id, driverId: driver.id };
        }
      }
    }

    return bestAssignment;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.currentId.bookings++;
    const newBooking: Booking = {
      ...booking,
      id,
      vehicleId: null,
      driverId: null,
      createdAt: new Date(),
      status: "pending"
    };

    this.bookings.set(id, newBooking);

    // Find optimal assignment
    const assignment = await this.findOptimalAssignment(booking);
    if (assignment) {
      return this.assignBooking(id, assignment.vehicleId, assignment.driverId);
    }

    return newBooking;
  }

  async assignBooking(bookingId: number, vehicleId: number, driverId: number): Promise<Booking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    const updated: Booking = {
      ...booking,
      vehicleId,
      driverId,
      status: "assigned"
    };

    this.bookings.set(bookingId, updated);
    await this.updateVehicleStatus(vehicleId, "booked");
    await this.updateDriverStatus(driverId, "booked");

    return updated;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) throw new Error("Booking not found");

    const updated = { ...booking, status };
    this.bookings.set(id, updated);
    return updated;
  }

  async findEmployeeByIdAndEmail(employeeId: string, email: string): Promise<Employee | null> {
    try {
      if (!this.employees || this.employees.size === 0) {
        console.log("No employees found in the system");
        return null;
      }

      const employee = Array.from(this.employees.values()).find(
        e => e.employeeId === employeeId && e.email === email
      );

      if (!employee) {
        console.log(`No employee found with ID ${employeeId} and email ${email}`);
        return null;
      }

      return employee;
    } catch (error) {
      console.error("Error finding employee:", error);
      return null;
    }
  }

  async createUser(userData: InsertUser & { passwordHash: string }): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      ...userData,
      id,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };
    this.users.set(id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async markUserAsVerified(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const updated: User = {
      ...user,
      isVerified: true,
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserLastLogin(userId: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const updated: User = {
      ...user,
      lastLogin: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    const id = this.currentId.otpVerifications++;
    const newVerification: OtpVerification = {
      ...verification,
      id,
      isUsed: false,
      createdAt: new Date(),
    };
    this.otpVerifications.set(id, newVerification);
    return newVerification;
  }

  async findLatestOtpVerification(userId: number): Promise<OtpVerification | null> {
    const verifications = Array.from(this.otpVerifications.values())
      .filter(v => v.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return verifications[0] || null;
  }

  async markOtpAsUsed(verificationId: number): Promise<OtpVerification> {
    const verification = this.otpVerifications.get(verificationId);
    if (!verification) throw new Error('Verification not found');

    const updated: OtpVerification = {
      ...verification,
      isUsed: true,
    };
    this.otpVerifications.set(verificationId, updated);
    return updated;
  }
}

export const storage = new MemStorage();