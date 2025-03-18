import { type Vehicle, type Driver, type Booking, type InsertBooking, type Location, type TimeWindow } from "@shared/schema";
import * as z from 'zod';

const locations = z.object({
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  })
});

const timeWindow = z.object({
  start: z.date(),
  end: z.date()
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
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private drivers: Map<number, Driver>;
  private bookings: Map<number, Booking>;
  private currentId: { [key: string]: number };

  constructor() {
    this.vehicles = new Map();
    this.drivers = new Map();
    this.bookings = new Map();
    this.currentId = { vehicles: 1, drivers: 1, bookings: 1 };
    
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
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
        }
      },
      // Add more mock vehicles...
    ];

    const mockDrivers: Driver[] = [
      {
        id: this.currentId.drivers++,
        name: "John Doe",
        status: "available",
        avatarUrl: "https://images.unsplash.com/photo-1541747277704-ef7fb8e1a31c",
        currentLocation: {
          address: "456 Park Ave",
          coordinates: { lat: 40.7580, lng: -73.9855 }
        }
      },
      // Add more mock drivers...
    ];

    mockVehicles.forEach(v => this.vehicles.set(v.id, v));
    mockDrivers.forEach(d => this.drivers.set(d.id, d));
  }

  // Vehicle methods
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

  // Driver methods
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

    // Check vehicle capacity
    if (vehicle.loadCapacity >= booking.loadSize) {
      score += 10;
      // Bonus for optimal capacity usage (80-90%)
      const capacityUtilization = booking.loadSize / vehicle.loadCapacity;
      if (capacityUtilization >= 0.8 && capacityUtilization <= 0.9) {
        score += 5;
      }
    } else {
      return -1; // Immediate disqualification
    }

    // Distance score (inverse relationship - closer is better)
    const pickupDistance = calculateDistance(vehicle.currentLocation, booking.pickupLocation);
    score += Math.max(0, 10 - pickupDistance); // Up to 10 points for proximity

    // Check existing bookings for this vehicle/driver for potential conflicts
    const existingBookings = Array.from(this.bookings.values())
      .filter(b => 
        (b.vehicleId === vehicle.id || b.driverId === driver.id) && 
        b.status !== 'completed'
      );

    // Check for time window conflicts
    for (const existing of existingBookings) {
      if (timeWindowsOverlap(booking.pickupWindow, existing.pickupWindow) ||
          timeWindowsOverlap(booking.dropoffWindow, existing.dropoffWindow)) {
        return -1; // Immediate disqualification
      }
    }

    // Bonus for drivers who are already in the area
    const driverToPickupDistance = calculateDistance(driver.currentLocation, booking.pickupLocation);
    score += Math.max(0, 5 - driverToPickupDistance); // Up to 5 points for driver proximity

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

  // Booking methods
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
}

export const storage = new MemStorage();