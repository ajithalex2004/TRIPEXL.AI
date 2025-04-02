import { type Vehicle, type Driver, type Booking, type InsertBooking, type VehicleGroup, type InsertVehicleGroup, type VehicleMaster, type InsertVehicleMaster } from "@shared/schema";
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { type Employee } from '@shared/schema';
import { type User, type InsertUser } from '@shared/schema';
import { type OtpVerification, type InsertOtpVerification } from '@shared/schema';
import { type VehicleTypeMaster, type InsertVehicleTypeMaster, type FuelType, VehicleFuelType } from '@shared/schema';
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

// Add these methods to the IStorage interface
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
  findUserByEmail(email: string): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  markUserAsVerified(userId: number): Promise<User>;
  updateUserLastLogin(userId: number): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserByUserName(userName: string): Promise<User | null>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(userId: number, userData: Partial<User>): Promise<User>;
  deleteUser(userId: number): Promise<void>;


  // OTP methods
  createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerification(userId: number): Promise<OtpVerification | null>;
  deleteOtpVerification(userId: number): Promise<void>;
  activateUser(userId: number): Promise<User>;

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
  deleteVehicleType(id: number): Promise<void>;

  // Vehicle Master operations
  getAllVehicleMaster(): Promise<VehicleMaster[]>;
  getVehicleMaster(id: number): Promise<VehicleMaster | null>;
  createVehicleMaster(data: InsertVehicleMaster): Promise<VehicleMaster>;
  updateVehicleMaster(id: number, data: Partial<InsertVehicleMaster>): Promise<VehicleMaster>;

  updateUserResetToken(userId: number, resetToken: string | null, resetTokenExpiry: Date | null): Promise<User>;
  findUserByResetToken(resetToken: string): Promise<User | null>;
  getAllEmployees(): Promise<Employee[]>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User>;
  initializeDefaultUser(): Promise<void>; // Added method
  
  // Fuel-related methods
  getAllFuelTypes(): Promise<FuelType[]>;
  getFuelTypeById(id: number): Promise<FuelType | null>;
  getFuelTypeByType(type: string): Promise<FuelType | null>;
  createFuelType(data: any): Promise<FuelType>;
  updateFuelType(id: number, data: Partial<FuelType>): Promise<FuelType>;
  updateFuelTypePrice(fuelType: string, price: number): Promise<void>;
  recalculateVehicleCosts(): Promise<void>;
  getFuelPriceHistory(): Promise<any[]>; // Get historical fuel price data
  deleteFuelType(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Fuel-related methods
  async getAllFuelTypes(): Promise<FuelType[]> {
    try {
      console.log("Fetching all fuel types");
      const fuelTypes = await db.select().from(schema.fuelTypes);
      console.log("Found fuel types:", fuelTypes);
      return fuelTypes;
    } catch (error) {
      console.error("Error in getAllFuelTypes:", error);
      throw error;
    }
  }

  async updateFuelTypePrice(fuelType: string, price: number): Promise<void> {
    try {
      console.log(`Updating price for fuel type ${fuelType} to ${price}`);
      await db
        .update(schema.fuelTypes)
        .set({
          price: price.toString(),
          updated_at: new Date(),
          last_fetched_at: new Date()
        })
        .where(eq(schema.fuelTypes.type, fuelType));
      console.log("Fuel price updated successfully");
    } catch (error) {
      console.error(`Error updating fuel price for ${fuelType}:`, error);
      throw error;
    }
  }

  async recalculateVehicleCosts(): Promise<void> {
    try {
      console.log("Recalculating vehicle costs and efficiency metrics based on updated fuel prices");
      
      // Get all fuel types with their current prices and other metrics
      const fuelTypes = await this.getAllFuelTypes();
      const fuelTypeMap = new Map<string, FuelType>();
      
      // Create maps for all fuel type metrics for quick lookup
      fuelTypes.forEach(fuel => {
        fuelTypeMap.set(fuel.type, fuel);
      });
      
      // Efficiency adjustment factors based on fuel price changes
      // As fuel prices increase, fuel efficiency might slightly decrease due to quality changes
      const efficiencyAdjustmentFactor = 0.99; // 1% reduction in efficiency for new fuel
      
      // Idle consumption adjustment based on fuel quality and price
      const idleConsumptionAdjustmentFactor = 1.02; // 2% increase in idle consumption for new fuel
      
      // Get all vehicle types
      const vehicleTypes = await this.getAllVehicleTypes();
      
      // Get current month/year for logging
      const newDataMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      console.log(`Updating vehicle metrics for ${newDataMonth}`);
      
      // Update each vehicle type with the new fuel price and recalculated values
      for (const vehicleType of vehicleTypes) {
        const fuelType = fuelTypeMap.get(vehicleType.fuel_type);
        
        if (fuelType) {
          const fuelPrice = parseFloat(fuelType.price.toString());
          
          // Get current values to calculate adjustments
          const currentFuelEfficiency = parseFloat(vehicleType.fuel_efficiency.toString());
          const currentIdleConsumption = parseFloat(vehicleType.idle_fuel_consumption?.toString() || "0");
          
          // Calculate adjusted efficiency and consumption values
          const adjustedFuelEfficiency = Math.round(currentFuelEfficiency * efficiencyAdjustmentFactor * 100) / 100;
          const adjustedIdleConsumption = Math.round(currentIdleConsumption * idleConsumptionAdjustmentFactor * 100) / 100;
          
          // Calculate new cost per km based on fuel efficiency and new price
          const costPerKm = Math.round((fuelPrice / adjustedFuelEfficiency) * 100) / 100;
          
          // Get CO2 emission factor for this fuel type
          const co2Factor = parseFloat(fuelType.co2_factor?.toString() || "0");
          
          console.log(`Updating ${vehicleType.vehicle_type_name} (${vehicleType.vehicle_type_code}):`);
          console.log(`- Fuel price: ${fuelPrice} AED/liter`);
          console.log(`- Adjusted fuel efficiency: ${adjustedFuelEfficiency} km/liter`);
          console.log(`- Adjusted idle consumption: ${adjustedIdleConsumption} liters/hour`);
          console.log(`- New cost per km: ${costPerKm} AED/km`);
          console.log(`- CO2 emission factor: ${co2Factor} kg/liter`);
          
          // Update the vehicle type with new values
          await db
            .update(schema.vehicleTypeMaster)
            .set({
              fuel_price_per_litre: fuelPrice.toString(),
              fuel_efficiency: adjustedFuelEfficiency.toString(),
              idle_fuel_consumption: adjustedIdleConsumption.toString(),
              cost_per_km: costPerKm.toString(),
              co2_emission_factor: co2Factor.toString(),
              updated_at: new Date()
            })
            .where(eq(schema.vehicleTypeMaster.id, vehicleType.id));
        } else {
          console.warn(`Fuel type ${vehicleType.fuel_type} not found for vehicle type ${vehicleType.vehicle_type_name}, skipping update`);
        }
      }
      
      console.log("Vehicle costs, efficiency, and consumption values recalculated successfully");
      
      // Now update vehicle masters based on their type
      console.log("Updating vehicle master records with new metrics");
      const vehicleMasters = await this.getAllVehicleMaster();
      
      for (const vehicle of vehicleMasters) {
        // Find the vehicle type for this vehicle
        const matchingVehicleTypes = vehicleTypes.filter(vt => vt.id === vehicle.vehicle_type_id);
        
        if (matchingVehicleTypes.length > 0) {
          const vehicleType = matchingVehicleTypes[0];
          
          // Update the vehicle master with metrics from its vehicle type
          await db
            .update(schema.vehicleMaster)
            .set({
              fuel_price_per_litre: vehicleType.fuel_price_per_litre,
              fuel_efficiency: vehicleType.fuel_efficiency,
              idle_fuel_consumption: vehicleType.idle_fuel_consumption,
              cost_per_km: vehicleType.cost_per_km,
              co2_emission_factor: vehicleType.co2_emission_factor,
              updated_at: new Date()
            })
            .where(eq(schema.vehicleMaster.id, vehicle.id));
          
          console.log(`Updated vehicle master ${vehicle.vehicle_number} with new metrics from type ${vehicleType.vehicle_type_name}`);
        }
      }
      
      console.log("Vehicle master records updated successfully");
    } catch (error) {
      console.error("Error recalculating vehicle metrics:", error);
      throw error;
    }
  }
  
  // Get historical fuel price data
  async getFuelPriceHistory(): Promise<any[]> {
    try {
      console.log("Fetching fuel price history");
      
      // Get all fuel types with their historical price data
      const fuelTypes = await this.getAllFuelTypes();
      const result: any[] = [];
      
      // Flatten the historical price data from all fuel types
      fuelTypes.forEach(fuel => {
        if (fuel.historical_prices && Array.isArray(fuel.historical_prices)) {
          const fuelHistory = fuel.historical_prices.map(record => ({
            fuel_type: fuel.type,
            date: record.date,
            price: record.price
          }));
          result.push(...fuelHistory);
        }
        
        // Also add the current price as the latest entry
        result.push({
          fuel_type: fuel.type,
          date: fuel.updated_at || new Date(),
          price: fuel.price
        });
      });
      
      // Sort the combined history by date (newest first)
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log(`Found ${result.length} historical fuel price records`);
      return result;
    } catch (error) {
      console.error("Error fetching fuel price history:", error);
      throw error;
    }
  }
  
  // Get a specific fuel type by ID
  async getFuelTypeById(id: number): Promise<FuelType | null> {
    try {
      console.log(`Fetching fuel type with ID: ${id}`);
      const [fuelType] = await db
        .select()
        .from(schema.fuelTypes)
        .where(eq(schema.fuelTypes.id, id));
      
      return fuelType || null;
    } catch (error) {
      console.error(`Error fetching fuel type by ID ${id}:`, error);
      throw error;
    }
  }
  
  // Get a specific fuel type by type name
  async getFuelTypeByType(type: string): Promise<FuelType | null> {
    try {
      console.log(`Fetching fuel type with type: ${type}`);
      const [fuelType] = await db
        .select()
        .from(schema.fuelTypes)
        .where(eq(schema.fuelTypes.type, type));
      
      return fuelType || null;
    } catch (error) {
      console.error(`Error fetching fuel type by type ${type}:`, error);
      throw error;
    }
  }
  
  // Create a new fuel type
  async createFuelType(data: any): Promise<FuelType> {
    try {
      console.log("Creating new fuel type:", data);
      
      // Process the historical_prices field if it's a string
      let historicalPrices = data.historical_prices;
      if (typeof historicalPrices === 'string') {
        // Already a string, keep as is
      } else if (Array.isArray(historicalPrices)) {
        // Convert array to JSON string
        historicalPrices = JSON.stringify(historicalPrices);
      } else {
        // Default to empty array
        historicalPrices = '[]';
      }
      
      const [newFuelType] = await db
        .insert(schema.fuelTypes)
        .values({
          type: data.type,
          price: data.price.toString(),
          co2_factor: data.co2_factor.toString(),
          efficiency: data.efficiency ? data.efficiency.toString() : "0",
          idle_consumption: data.idle_consumption ? data.idle_consumption.toString() : "0",
          updated_at: data.updated_at || new Date(),
          last_fetched_at: data.last_fetched_at || new Date(),
          historical_prices: historicalPrices,
          created_at: data.created_at || new Date()
        })
        .returning();
        
      console.log("Successfully created fuel type:", newFuelType);
      return newFuelType;
    } catch (error) {
      console.error("Error creating fuel type:", error);
      throw error;
    }
  }
  
  // Update an existing fuel type
  async updateFuelType(id: number, data: Partial<FuelType>): Promise<FuelType> {
    try {
      console.log(`Updating fuel type with ID ${id}:`, data);
      
      // Create an update object with processed fields
      const updateData: Record<string, any> = {};
      
      // Only include fields that are present in the request and properly format them
      if (data.type !== undefined) updateData.type = data.type;
      
      if (data.price !== undefined) {
        updateData.price = typeof data.price === 'string' ? data.price : data.price.toString();
      }
      
      if (data.co2_factor !== undefined) {
        updateData.co2_factor = typeof data.co2_factor === 'string' ? data.co2_factor : data.co2_factor.toString();
      }
      
      if (data.efficiency !== undefined) {
        updateData.efficiency = typeof data.efficiency === 'string' ? data.efficiency : data.efficiency.toString();
      }
      
      if (data.idle_consumption !== undefined) {
        updateData.idle_consumption = typeof data.idle_consumption === 'string' ? 
          data.idle_consumption : data.idle_consumption.toString();
      }
      
      if (data.historical_prices !== undefined) {
        if (typeof data.historical_prices === 'string') {
          updateData.historical_prices = data.historical_prices;
        } else if (Array.isArray(data.historical_prices)) {
          updateData.historical_prices = JSON.stringify(data.historical_prices);
        }
      }
      
      // Always update the timestamps
      updateData.updated_at = new Date();
      
      // If last_fetched_at is provided, use it
      if (data.last_fetched_at) {
        updateData.last_fetched_at = data.last_fetched_at;
      }
      
      console.log("Update data:", updateData);
      
      const [updatedFuelType] = await db
        .update(schema.fuelTypes)
        .set(updateData)
        .where(eq(schema.fuelTypes.id, id))
        .returning();
        
      if (!updatedFuelType) {
        throw new Error(`Fuel type with ID ${id} not found`);
      }
      
      console.log("Successfully updated fuel type:", updatedFuelType);
      
      // After updating fuel type, recalculate vehicle costs
      if (data.price !== undefined) {
        console.log("Fuel price changed, scheduling vehicle cost recalculation");
        // Schedule for later to not block the response
        setTimeout(() => {
          this.recalculateVehicleCosts()
            .catch(err => console.error("Error recalculating vehicle costs after fuel price update:", err));
        }, 100);
      }
      
      return updatedFuelType;
    } catch (error) {
      console.error("Error updating fuel type:", error);
      throw error;
    }
  }
  
  // Delete a fuel type
  async deleteFuelType(id: number): Promise<void> {
    try {
      console.log(`Deleting fuel type with ID ${id}`);
      
      // Check if the fuel type exists first
      const fuelType = await this.getFuelTypeById(id);
      if (!fuelType) {
        throw new Error(`Fuel type with ID ${id} not found`);
      }
      
      // Check if there are any vehicles using this fuel type
      const [vehicleCount] = await db
        .select({ count: sql`count(*)` })
        .from(schema.vehicleTypeMaster)
        .where(eq(schema.vehicleTypeMaster.fuel_type, fuelType.type));
        
      if (vehicleCount && Number(vehicleCount.count) > 0) {
        throw new Error(`Cannot delete fuel type "${fuelType.type}" as it is being used by ${vehicleCount.count} vehicles`);
      }
      
      // Delete the fuel type
      await db
        .delete(schema.fuelTypes)
        .where(eq(schema.fuelTypes.id, id));
        
      console.log(`Successfully deleted fuel type with ID ${id}`);
    } catch (error) {
      console.error(`Error deleting fuel type with ID ${id}:`, error);
      throw error;
    }
  }
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
  
  async deleteVehicleType(id: number): Promise<void> {
    try {
      console.log(`Deleting vehicle type with ID ${id}`);
      
      // Check if the vehicle type exists first
      const vehicleType = await this.getVehicleType(id);
      if (!vehicleType) {
        throw new Error(`Vehicle type with ID ${id} not found`);
      }
      
      // Check if this vehicle type is being used by any vehicles
      const [vehicleCount] = await db
        .select({ count: sql`count(*)` })
        .from(schema.vehicleMaster)
        .where(eq(schema.vehicleMaster.vehicle_type_id, id));
        
      if (vehicleCount && Number(vehicleCount.count) > 0) {
        throw new Error(`Cannot delete vehicle type "${vehicleType.vehicle_type_name}" as it is being used by ${vehicleCount.count} vehicles`);
      }
      
      // Delete the vehicle type
      await db
        .delete(schema.vehicleTypeMaster)
        .where(eq(schema.vehicleTypeMaster.id, id));
        
      console.log(`Successfully deleted vehicle type with ID ${id}`);
    } catch (error) {
      console.error(`Error deleting vehicle type with ID ${id}:`, error);
      throw error;
    }
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

  async findUserByEmail(emailId: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email_id, emailId))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Database error while finding user');
    }
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
  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Log the incoming data
      console.log('Creating user with data:', {
        ...userData,
        password: '[REDACTED]',
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      const requiredFields = [
        'user_name',
        'user_code',
        'email_id',
        'user_type',
        'user_operation_type',
        'user_group',
        'first_name',
        'last_name',
        'full_name'
      ];

      const missingFields = requiredFields.filter(field => !userData[field as keyof InsertUser]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Begin transaction
      const newUser = await db.transaction(async (tx) => {
        console.log('Starting database transaction for user creation');

        const [user] = await tx
          .insert(schema.users)
          .values({
            user_name: userData.user_name,
            user_code: userData.user_code,
            email_id: userData.email_id,
            user_type: userData.user_type,
            user_operation_type: userData.user_operation_type,
            user_group: userData.user_group,
            first_name: userData.first_name,
            last_name: userData.last_name,
            full_name: userData.full_name,
            password: userData.password,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning();

        if (!user) {
          throw new Error('Failed to create user record');
        }

        console.log('Database transaction completed successfully');
        return user;
      });

      console.log('User created successfully:', {
        id: newUser.id,
        email: newUser.email_id,
        username: newUser.user_name,
        timestamp: new Date().toISOString()
      });

      return newUser;
    } catch (error) {
      console.error('Error in createUser:', error);
      if (error instanceof Error) {
        console.error('Detailed error:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    try {
      console.log('Updating user:', userId, 'with data:', {
        ...userData,
        password: '[REDACTED]'
      });

      // Ensure mobile number and country code are included in the update
      const updateData = {
        ...userData,
        country_code: userData.country_code || "+971",
        mobile_number: userData.mobile_number || null,
        updated_at: new Date()
      };

      const [user] = await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId))
        .returning();

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      console.log('User updated successfully:', {
        id: user.id,
        email: user.email_id,
        country_code: user.country_code,
        mobile_number: user.mobile_number
      });

      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(userId: number): Promise<void> {
    try {
      console.log('Deleting user:', userId);
      await db
        .delete(schema.users)
        .where(eq(schema.users.id, userId));
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.user_name, userName))
        .limit(1);

      return user || null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Database error while finding user');
    }
  }

  async updateUserResetToken(userId: number, resetToken: string | null, resetTokenExpiry: Date | null): Promise<User> {
    try {
      console.log('Updating reset token for user:', userId);
      const [user] = await db
        .update(schema.users)
        .set({
          reset_token: resetToken,
          reset_token_expiry: resetTokenExpiry,
          updated_at: new Date()
        })
        .where(eq(schema.users.id, userId))
        .returning();

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      return user;
    } catch (error) {
      console.error('Error updating reset token:', error);
      throw new Error(`Failed to update reset token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findUserByResetToken(resetToken: string): Promise<User | null> {
    try {
      console.log('Finding user by reset token');
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.reset_token, resetToken))
        .where(sql`${schema.users.reset_token_expiry} > NOW()`);

      return user || null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      throw new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
    try {
      console.log('Finding employee by ID:', employeeId);

      // Simple query to get employee by ID
      const [employee] = await db
        .select({
          employeeId: schema.employees.employee_id,
          employeeName: schema.employees.employee_name,
          emailId: schema.employees.email,
          mobileNumber: schema.employees.mobile_number,
          employeeType: schema.employees.employee_type,
          designation: schema.employees.designation,
          department: schema.employees.department,
          nationality: schema.employees.nationality,
          region: schema.employees.region,
          communicationLanguage: schema.employees.communication_language,
          unit: schema.employees.unit
        })
        .from(schema.employees)
        .where(eq(schema.employees.employee_id, employeeId));

      if (!employee) {
        console.log('No employee found with ID:', employeeId);
        return null;
      }

      console.log('Found employee:', {
        ...employee,
        mobileNumber: '****' + (employee.mobileNumber?.slice(-4) || '')
      });

      return employee;
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

  async getAllEmployees(): Promise<Employee[]> {
    try {
      console.log('Fetching all employees');
      const employees = await db
        .select()
        .from(schema.employees)
        .orderBy(schema.employees.employee_id);

      console.log(`Found ${employees.length} employees`);
      return employees;
    } catch (error) {
      console.error('Error fetching all employees:', error);
      throw error;
    }
  }
  async getOtpVerification(userId: number): Promise<OtpVerification | null> {
    const [verification] = await db
      .select()
      .from(schema.otpVerifications)
      .where(eq(schema.otpVerifications.userId, userId))
      .orderBy(desc(schema.otpVerifications.createdAt))
      .limit(1);
    return verification || null;
  }

  async deleteOtpVerification(userId: number): Promise<void> {
    await db
      .delete(schema.otpVerifications)
      .where(eq(schema.otpVerifications.userId, userId));
  }

  async activateUser(userId: number): Promise<User> {
    const [user] = await db
      .update(schema.users)
      .set({
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }
  async validateUserPassword(user: User, password: string): Promise<boolean> {
    try {
      console.log('Starting password validation for user:', user.email_id);

      if (!user.password) {
        console.log('No password hash stored for user');
        return false;
      }

      const isValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isValid);

      return isValid;
    } catch (error) {
      console.error('Error during password validation:', error);
      return false;
    }
  }
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    try {
      console.log('Updating password for user:', userId);
      const [user] = await db
        .update(schema.users)
        .set({
          password: hashedPassword,
          reset_token: null,
          reset_token_expiry: null,
          updated_at: new Date()
        })
        .where(eq(schema.users.id, userId))
        .returning();

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      return user;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw new Error(`Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async initializeDefaultUser(): Promise<void> {
    try {
      console.log("Checking for default user existence...");
      const defaultUser = await this.findUserByEmail("admin@tripxl.com");

      if (defaultUser) {
        console.log("Default user already exists");
        return;
      }

      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash("Admin@123", 10);

      const userData = {
        email_id: "admin@tripxl.com",
        password: hashedPassword,
        user_name: "admin",
        user_code: "ADM001",
        user_type: "ADMIN",
        user_operation_type: "ADMIN",
        user_group: "ADMIN",
        first_name: "System",
        last_name: "Admin",
        full_name: "System Admin",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.createUser(userData);
      console.log("Default admin user created successfully");
    } catch (error) {
      console.error("Error initializing default user:", error);
      // Don't throw the error to prevent app crash
      // Just log it and continue
    }
  }
}

export const storage = new DatabaseStorage();