import { type Vehicle, type Driver, type Booking, type InsertBooking } from "@shared/schema";

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
