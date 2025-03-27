import { Router } from "express";
import { 
  VehicleFuelType, 
  Region, 
  Department, 
  PlateCategory,
  TransmissionType 
} from "@shared/schema";
import { db } from "../db";
import { vehicleGroups } from "@shared/schema";

const router = Router();

// Current UAE fuel prices - Updated March 2024
const currentFuelPrices: Record<string, number> = {
  'PETROL': 2.85,
  'DIESEL': 2.95,
  'ELECTRIC': 0,
  'HYBRID': 2.85,
  'CNG': 2.35,
  'LPG': 2.25
};

// Service Plans
const servicePlans = [
  {
    code: "BASIC",
    name: "Basic Service Plan",
    description: "Regular maintenance and basic service coverage",
    intervalKm: 5000,
    intervalMonths: 6
  },
  {
    code: "STANDARD",
    name: "Standard Service Plan",
    description: "Comprehensive maintenance with extended coverage",
    intervalKm: 10000,
    intervalMonths: 12
  },
  {
    code: "PREMIUM",
    name: "Premium Service Plan",
    description: "Complete coverage including preventive maintenance",
    intervalKm: 15000,
    intervalMonths: 12
  }
];

// Units master data
const units = [
  "Fleet Operations",
  "Maintenance",
  "Emergency Response",
  "Patient Transport",
  "Special Operations",
  "General Transport",
  "VIP Services"
];

// Updated UAE Vehicle Models by Manufacturer with detailed info
const vehicleModelMaster: Record<string, { models: Array<{
  name: string;
  efficiency: number;
  capacity: number;
  idleConsumption: number;
  passengerCapacity: number;
  categories: string[];
}> }> = {
  "Toyota": {
    models: [
      {
        name: "Corolla",
        efficiency: 14.5,
        capacity: 13,
        idleConsumption: 0.8,
        passengerCapacity: 5,
        categories: ["SEDAN"]
      },
      {
        name: "Land Cruiser",
        efficiency: 8.5,
        capacity: 82,
        idleConsumption: 1.5,
        passengerCapacity: 8,
        categories: ["SUV"]
      }
    ]
  },
  "Nissan": {
    models: [
      {
        name: "Patrol",
        efficiency: 7.8,
        capacity: 95,
        idleConsumption: 1.6,
        passengerCapacity: 8,
        categories: ["SUV"]
      },
      {
        name: "Altima",
        efficiency: 13.8,
        capacity: 15,
        idleConsumption: 0.9,
        passengerCapacity: 5,
        categories: ["SEDAN"]
      }
    ]
  }
};

// CO2 Emission Factors by fuel type
const co2EmissionFactors: Record<string, number> = {
  "PETROL": 2.31,    // kg CO2/liter
  "DIESEL": 2.68,    // kg CO2/liter
  "ELECTRIC": 0,     // Zero direct emissions
  "HYBRID": 1.85,    // Assumes 20% lower than petrol
  "CNG": 1.81,       // kg CO2/m³
  "LPG": 1.51        // kg CO2/liter
};

// Master data endpoints
router.get("/api/vehicle-masters", async (_req, res) => {
  try {
    // Fetch vehicle groups from database
    const groups = await db.select().from(vehicleGroups);

    res.json({
      groups,
      vehicleModels: vehicleModelMaster,
      fuelTypes: Object.entries(currentFuelPrices).map(([type, price]) => ({
        type,
        price,
        co2Factor: co2EmissionFactors[type.toUpperCase()] || 0
      })),
      regions: Object.values(Region),
      departments: Object.values(Department),
      servicePlans,
      units,
      plateCategories: Object.values(PlateCategory),
      transmissionTypes: Object.values(TransmissionType)
    });
  } catch (error: any) {
    console.error("Error fetching master data:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;