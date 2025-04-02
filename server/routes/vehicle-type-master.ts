import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleTypeMasterSchema, vehicleTypeMaster } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { vehicleModels, manufacturers, servicePlans, units } from "./masters";
import { 
  updateFuelPrices,
  triggerFuelPriceUpdate,
  initializeFuelPriceService 
} from "../services/fuel-price-service";

const router = Router();

// Updated fuel prices with proper types
const currentFuelPrices: Record<string, number> = {
  'PETROL': 2.99,
  'DIESEL': 2.89,
  'ELECTRIC': 0.45,
  'HYBRID': 2.85,
  'CNG': 2.10,
  'LPG': 2.25
};

const uaeVehicleModels: Record<string, string[]> = {
  "Toyota": [
    "Corolla",
    "Camry",
    "Land Cruiser",
    "Prado",
    "RAV4",
    "Fortuner",
    "Hiace",
    "Yaris",
    "Hilux",
    "Coaster",
    "Innova"
  ],
  "Nissan": [
    "Altima",
    "Patrol",
    "X-Trail",
    "Sunny",
    "Kicks",
    "Pathfinder",
    "Urvan",
    "Navara"
  ]
  // ... [Keep other manufacturer models]
};

const defaultFuelEfficiency: Record<string, number> = {
  "TOYOTA-COROLLA": 14.5,
  "TOYOTA-CAMRY": 13.2,
  "TOYOTA-LANDCRUISER": 8.5,
  "TOYOTA-PRADO": 9.5,
  "TOYOTA-RAV4": 11.8
  // ... [Keep other efficiency data]
};

const defaultVehicleCapacity: Record<string, number> = {
  "TOYOTA-COROLLA": 13,
  "TOYOTA-CAMRY": 15,
  "TOYOTA-LANDCRUISER": 82
  // ... [Keep other capacity data]
};

const defaultIdleFuelConsumption: Record<string, number> = {
  "TOYOTA-COROLLA": 0.8,
  "TOYOTA-CAMRY": 0.9,
  "TOYOTA-LANDCRUISER": 1.5
  // ... [Keep other consumption data]
};

const co2EmissionFactors: Record<string, number> = {
  "Petrol": 2.31,
  "Diesel": 2.68,
  "Electric": 0,
  "Hybrid": 1.85,
  "CNG": 1.81,
  "LPG": 1.51
};

// Enhanced fuel prices endpoint with better error handling
router.get("/api/fuel-prices", async (_req, res) => {
  try {
    console.log("Fetching current fuel prices from database...");
    
    // Get real fuel prices from the database
    const fuelTypes = await storage.getAllFuelTypes();
    
    // Convert response to lowercase keys for consistency
    const formattedPrices = fuelTypes.reduce((acc, fuelType) => {
      acc[fuelType.type.toLowerCase()] = parseFloat(fuelType.price.toString());
      return acc;
    }, {} as Record<string, number>);

    console.log("Sending formatted fuel prices:", formattedPrices);
    res.json(formattedPrices);
  } catch (error: any) {
    console.error("Error fetching fuel prices:", error);
    res.status(500).json({ 
      error: "Failed to fetch fuel prices",
      message: error.message,
      details: error.stack
    });
  }
});

// Get all vehicle types
router.get("/api/vehicle-types", async (_req, res) => {
  try {
    console.log("Fetching all vehicle types");
    const types = await db.select().from(vehicleTypeMaster);
    
    // Process each record to convert null values to empty strings for string fields
    const processedTypes = types.map(type => {
      return Object.entries(type).reduce((acc, [key, value]) => {
        if (typeof value === 'string' || value === null) {
          acc[key] = value === null ? "" : value;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
    });
    
    console.log("Retrieved vehicle types:", processedTypes);
    res.json(processedTypes);
  } catch (error: any) {
    console.error("Error fetching vehicle types:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new vehicle type with proper type handling
router.post("/api/vehicle-types", async (req, res) => {
  try {
    console.log("Received vehicle type data:", req.body);

    const result = insertVehicleTypeMasterSchema.safeParse(req.body);

    if (!result.success) {
      console.error("Validation failed:", result.error.issues);
      return res.status(400).json({
        error: "Invalid vehicle type data",
        details: result.error.issues
      });
    }

    // Ensure all data is properly formatted for database
    // First, create the base object with correct string values for required fields
    const formattedData = {
      group_id: result.data.group_id,
      vehicle_type_code: result.data.vehicle_type_code,
      vehicle_type_name: result.data.vehicle_type_name,
      manufacturer: result.data.manufacturer,
      model_year: result.data.model_year,
      number_of_passengers: result.data.number_of_passengers,
      region: result.data.region || "Abu Dhabi",
      fuel_type: result.data.fuel_type,
      department: result.data.department || "Fleet",
      vehicle_capacity: result.data.vehicle_capacity,
      alert_before: result.data.alert_before,
      
      // Ensure all string fields have values
      vehicle_model: result.data.vehicle_model || (result.data.vehicle_type || ""),
      vehicle_type: result.data.vehicle_type || (result.data.vehicle_model || ""),
      service_plan: result.data.service_plan || "",
      unit: result.data.unit || "",
      color: result.data.color || "",
      
      // Convert numeric fields to strings
      fuel_efficiency: typeof result.data.fuel_efficiency === 'number' 
        ? result.data.fuel_efficiency.toString()
        : (result.data.fuel_efficiency || "0"),
        
      fuel_price_per_litre: typeof result.data.fuel_price_per_litre === 'number'
        ? result.data.fuel_price_per_litre.toString()
        : (result.data.fuel_price_per_litre || "0"),
        
      cost_per_km: typeof result.data.cost_per_km === 'number'
        ? result.data.cost_per_km.toString()
        : (result.data.cost_per_km || "0"),
        
      idle_fuel_consumption: typeof result.data.idle_fuel_consumption === 'number'
        ? result.data.idle_fuel_consumption.toString()
        : (result.data.idle_fuel_consumption || "0"),
        
      co2_emission_factor: typeof result.data.co2_emission_factor === 'number'
        ? result.data.co2_emission_factor.toString()
        : (result.data.co2_emission_factor || "0")
    };
    
    console.log("Formatted data for insert:", formattedData);
    
    // Insert using await db.insert() pattern
    const [newType] = await db
      .insert(vehicleTypeMaster)
      .values(formattedData)
      .returning();

    // Convert null values to empty strings for string fields
    const processedNewType = Object.entries(newType).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || value === null) {
        acc[key] = value === null ? "" : value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    console.log("Successfully created vehicle type:", processedNewType);
    res.status(201).json(processedNewType);
  } catch (error: any) {
    console.error("Error creating vehicle type:", error);

    if (error.code === '23505') {
      return res.status(400).json({ 
        error: "Vehicle type with this code already exists",
        details: error.detail
      });
    }

    res.status(500).json({ 
      error: "Failed to create vehicle type",
      message: error.message
    });
  }
});

// Get single vehicle type
router.get("/api/vehicle-types/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    console.log("Fetching vehicle type with ID:", id);
    const [type] = await db
      .select()
      .from(vehicleTypeMaster)
      .where(eq(vehicleTypeMaster.id, id));

    if (!type) {
      console.log("Vehicle type not found with ID:", id);
      return res.status(404).json({ error: "Vehicle type not found" });
    }

    // Convert null values to empty strings for string fields
    const processedType = Object.entries(type).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || value === null) {
        acc[key] = value === null ? "" : value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    console.log("Retrieved and processed vehicle type:", processedType);
    res.json(processedType);
  } catch (error: any) {
    console.error("Error fetching vehicle type:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get form-ready vehicle type data
router.get("/api/vehicle-types/:id/form-data", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    console.log("Fetching form-ready vehicle type with ID:", id);
    const [type] = await db
      .select()
      .from(vehicleTypeMaster)
      .where(eq(vehicleTypeMaster.id, id));

    if (!type) {
      console.log("Vehicle type not found with ID:", id);
      return res.status(404).json({ error: "Vehicle type not found" });
    }

    // Process stringified numeric values for form display
    const formReadyData = {
      ...type,
      // String fields - ensure they're not null
      vehicle_type_code: type.vehicle_type_code || "",
      vehicle_type_name: type.vehicle_type_name || "",
      manufacturer: type.manufacturer || "",
      vehicle_model: type.vehicle_model || "",
      region: type.region || "Abu Dhabi",
      fuel_type: type.fuel_type || "",
      service_plan: type.service_plan || "",
      vehicle_type: type.vehicle_type || "",
      department: type.department || "Fleet",
      unit: type.unit || "",
      color: type.color || "",
      
      // Numeric fields - parse and format
      fuel_efficiency: type.fuel_efficiency ? parseFloat(type.fuel_efficiency.toString()) : 0,
      fuel_price_per_litre: type.fuel_price_per_litre ? parseFloat(type.fuel_price_per_litre.toString()) : 0,
      cost_per_km: type.cost_per_km ? parseFloat(type.cost_per_km.toString()) : 0,
      idle_fuel_consumption: type.idle_fuel_consumption ? parseFloat(type.idle_fuel_consumption.toString()) : 0,
      co2_emission_factor: type.co2_emission_factor ? parseFloat(type.co2_emission_factor.toString()) : 0,
      
      // Integer fields
      model_year: type.model_year || new Date().getFullYear(),
      number_of_passengers: type.number_of_passengers || 0,
      alert_before: type.alert_before || 0,
      vehicle_capacity: type.vehicle_capacity || 0,
      group_id: type.group_id || 0,
    };

    console.log("Form-ready vehicle type data:", formReadyData);
    res.json(formReadyData);
  } catch (error: any) {
    console.error("Error fetching form-ready vehicle type:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle type
router.patch("/api/vehicle-types/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    console.log("Updating vehicle type:", id, "with data:", req.body);
    const result = insertVehicleTypeMasterSchema.partial().safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid vehicle type data",
        details: result.error.issues
      });
    }

    // Create a clean update object with proper type conversions
    const updateData: Record<string, any> = {};
    
    // Only include fields that are present in the request
    if (result.data.group_id !== undefined) updateData.group_id = result.data.group_id;
    if (result.data.vehicle_type_code !== undefined) updateData.vehicle_type_code = result.data.vehicle_type_code;
    if (result.data.vehicle_type_name !== undefined) updateData.vehicle_type_name = result.data.vehicle_type_name;
    if (result.data.manufacturer !== undefined) updateData.manufacturer = result.data.manufacturer;
    
    // Handle special text fields
    if (result.data.vehicle_model !== undefined) {
      updateData.vehicle_model = result.data.vehicle_model || "";
    }
    
    if (result.data.model_year !== undefined) updateData.model_year = result.data.model_year;
    if (result.data.number_of_passengers !== undefined) updateData.number_of_passengers = result.data.number_of_passengers;
    if (result.data.region !== undefined) updateData.region = result.data.region || "Abu Dhabi";
    
    // Handle numeric fields with proper string conversion
    if (result.data.fuel_efficiency !== undefined) {
      updateData.fuel_efficiency = typeof result.data.fuel_efficiency === 'number'
        ? result.data.fuel_efficiency.toString()
        : (result.data.fuel_efficiency || "0");
    }
    
    if (result.data.fuel_price_per_litre !== undefined) {
      updateData.fuel_price_per_litre = typeof result.data.fuel_price_per_litre === 'number'
        ? result.data.fuel_price_per_litre.toString()
        : (result.data.fuel_price_per_litre || "0");
    }
    
    if (result.data.fuel_type !== undefined) updateData.fuel_type = result.data.fuel_type;
    if (result.data.service_plan !== undefined) updateData.service_plan = result.data.service_plan || "";
    
    if (result.data.cost_per_km !== undefined) {
      updateData.cost_per_km = typeof result.data.cost_per_km === 'number'
        ? result.data.cost_per_km.toString()
        : (result.data.cost_per_km || "0");
    }
    
    // Handle vehicle_type field with fallback to vehicle_model
    if (result.data.vehicle_type !== undefined) {
      updateData.vehicle_type = result.data.vehicle_type || "";
    } else if (result.data.vehicle_model !== undefined) {
      updateData.vehicle_type = result.data.vehicle_model || "";
    }
    
    if (result.data.department !== undefined) updateData.department = result.data.department || "Fleet";
    if (result.data.unit !== undefined) updateData.unit = result.data.unit || "";
    if (result.data.alert_before !== undefined) updateData.alert_before = result.data.alert_before;
    
    if (result.data.idle_fuel_consumption !== undefined) {
      updateData.idle_fuel_consumption = typeof result.data.idle_fuel_consumption === 'number'
        ? result.data.idle_fuel_consumption.toString()
        : (result.data.idle_fuel_consumption || "0");
    }
    
    if (result.data.vehicle_capacity !== undefined) updateData.vehicle_capacity = result.data.vehicle_capacity;
    
    if (result.data.co2_emission_factor !== undefined) {
      updateData.co2_emission_factor = typeof result.data.co2_emission_factor === 'number'
        ? result.data.co2_emission_factor.toString()
        : (result.data.co2_emission_factor || "0");
    }
    
    if (result.data.color !== undefined) updateData.color = result.data.color || "";
    
    console.log("Formatted update data:", updateData);
    
    const [updatedType] = await db
      .update(vehicleTypeMaster)
      .set(updateData)
      .where(eq(vehicleTypeMaster.id, id))
      .returning();

    if (!updatedType) {
      return res.status(404).json({ error: "Vehicle type not found" });
    }

    // Convert null values to empty strings for string fields
    const processedUpdatedType = Object.entries(updatedType).reduce((acc, [key, value]) => {
      if (typeof value === 'string' || value === null) {
        acc[key] = value === null ? "" : value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    console.log("Updated and processed vehicle type:", processedUpdatedType);
    res.json(processedUpdatedType);
  } catch (error: any) {
    console.error("Error updating vehicle type:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fuel price management endpoints
router.get("/api/fuel-types", async (_req, res) => {
  try {
    console.log("Fetching all fuel types from database");
    const fuelTypes = await storage.getAllFuelTypes();
    console.log("Retrieved fuel types:", fuelTypes);
    res.json(fuelTypes);
  } catch (error: any) {
    console.error("Error fetching fuel types:", error);
    res.status(500).json({ 
      error: "Failed to fetch fuel types",
      message: error.message 
    });
  }
});

// Endpoint to manually trigger fuel price update
router.post("/api/fuel-prices/update", async (_req, res) => {
  try {
    console.log("Manually triggering fuel price update");
    await triggerFuelPriceUpdate();
    console.log("Fuel prices updated successfully");
    
    // Return the updated fuel types
    const updatedFuelTypes = await storage.getAllFuelTypes();
    res.json({
      message: "Fuel prices updated successfully",
      fuelTypes: updatedFuelTypes
    });
  } catch (error: any) {
    console.error("Error updating fuel prices:", error);
    res.status(500).json({ 
      error: "Failed to update fuel prices",
      message: error.message 
    });
  }
});

export default router;