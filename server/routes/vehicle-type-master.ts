import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleTypeMasterSchema, vehicleTypeMaster } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

// Master data endpoints
router.get("/api/vehicle-masters", async (_req, res) => {
  try {
    const manufacturers = uaeVehicleModels;
    const fuelTypes = Object.keys(currentFuelPrices).map(type => ({
      type,
      price: currentFuelPrices[type]
    }));
    const efficiencies = defaultFuelEfficiency;
    const capacities = defaultVehicleCapacity;
    const idleConsumptions = defaultIdleFuelConsumption;
    const emissions = co2EmissionFactors;

    res.json({
      manufacturers,
      fuelTypes,
      efficiencies,
      capacities,
      idleConsumptions,
      emissions
    });
  } catch (error: any) {
    console.error("Error fetching master data:", error);
    res.status(500).json({ error: error.message });
  }
});


// Updated fuel prices with proper types
const currentFuelPrices: Record<string, number> = {
  'PETROL': 2.99,
  'DIESEL': 2.89,
  'ELECTRIC': 0.45,
  'HYBRID': 2.85,
  'CNG': 2.10,
  'LPG': 2.25
};

const uaeVehicleModels = {
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
  ],
  // ... [Keep other manufacturer models]
};

const defaultFuelEfficiency = {
  // Toyota models
  "TOYOTA-COROLLA": 14.5,
  "TOYOTA-CAMRY": 13.2,
  "TOYOTA-LANDCRUISER": 8.5,
  "TOYOTA-PRADO": 9.5,
  "TOYOTA-RAV4": 11.8,
  // ... [Keep other efficiency data]
};

const defaultVehicleCapacity = {
  // Toyota models
  "TOYOTA-COROLLA": 13,
  "TOYOTA-CAMRY": 15,
  "TOYOTA-LANDCRUISER": 82,
  // ... [Keep other capacity data]
};

const defaultIdleFuelConsumption = {
  // Toyota models
  "TOYOTA-COROLLA": 0.8,
  "TOYOTA-CAMRY": 0.9,
  "TOYOTA-LANDCRUISER": 1.5,
  // ... [Keep other consumption data]
};

const co2EmissionFactors = {
  "Petrol": 2.31,
  "Diesel": 2.68,
  "Electric": 0,
  "Hybrid": 1.85,
  "CNG": 1.81,
  "LPG": 1.51
};

// Enhanced fuel prices endpoint with better error handling
router.get("/api/fuel-prices", (_req, res) => {
  try {
    console.log("Fetching current fuel prices...");
    console.log("Available fuel types:", Object.keys(currentFuelPrices));

    // Convert response to lowercase keys for consistency
    const formattedPrices = Object.entries(currentFuelPrices).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
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
    console.log("Retrieved vehicle types:", types);
    res.json(types);
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

    // Format the data for database insertion
    const vehicleData = {
      ...result.data,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log("Formatted data for insertion:", vehicleData);

    const [newType] = await db
      .insert(vehicleTypeMaster)
      .values([vehicleData])
      .returning();

    console.log("Successfully created vehicle type:", newType);
    res.status(201).json(newType);
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
      message: error.message,
      details: error.stack
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

    console.log("Retrieved vehicle type:", type);
    res.json(type);
  } catch (error: any) {
    console.error("Error fetching vehicle type:", error);
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

    const [updatedType] = await db
      .update(vehicleTypeMaster)
      .set({
        ...result.data,
        updated_at: new Date()
      })
      .where(eq(vehicleTypeMaster.id, id))
      .returning();

    if (!updatedType) {
      return res.status(404).json({ error: "Vehicle type not found" });
    }

    console.log("Updated vehicle type:", updatedType);
    res.json(updatedType);
  } catch (error: any) {
    console.error("Error updating vehicle type:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;