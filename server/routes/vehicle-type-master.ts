import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleTypeMasterSchema, vehicleTypeMaster, VehicleFuelType } from "@shared/schema";
import multer from "multer";
import XLSX from "xlsx";
import { db } from "../db";
import { eq } from "drizzle-orm";

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

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

// Create new vehicle type
router.post("/api/vehicle-types", async (req, res) => {
  try {
    console.log("Creating vehicle type with data:", req.body);

    const result = insertVehicleTypeMasterSchema.safeParse(req.body);

    if (!result.success) {
      console.error("Invalid vehicle type data:", result.error.issues);
      return res.status(400).json({
        error: "Invalid vehicle type data",
        details: result.error.issues
      });
    }

    // Log the validated data before insertion
    console.log("Validated data for insertion:", result.data);

    // Insert into database
    const [newType] = await db
      .insert(vehicleTypeMaster)
      .values({
        ...result.data,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning();

    console.log("Created new vehicle type:", newType);
    res.status(201).json(newType);
  } catch (error: any) {
    console.error("Error creating vehicle type:", error);

    if (error.code === '23505') { // Unique constraint violation
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
    res.status(500).json({ error: "Failed to update vehicle type" });
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

// Export vehicle types
router.get("/api/vehicle-types/export", async (_req, res) => {
  try {
    const types = await db.select().from(vehicleTypeMaster);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(types);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Types");

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle-types.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buf);
  } catch (error: any) {
    console.error("Error exporting vehicle types:", error);
    res.status(500).json({ error: "Failed to export vehicle types" });
  }
});

// Import vehicle types
router.post("/api/vehicle-types/import", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Track import results
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of data) {
      try {
        const vehicleType = {
          group_id: Number(row['Group ID']),
          vehicle_type_code: String(row['Vehicle Type Code']),
          manufacturer: String(row['Manufacturer']),
          model_year: Number(row['Model Year']),
          vehicle_type: String(row['Vehicle Type']),
          number_of_passengers: Number(row['Number of Passengers']),
          region: String(row['Region']),
          department: String(row['Department']),
          fuel_type: String(row['Fuel Type']),
          fuel_efficiency: String(row['Fuel Efficiency']),
          service_plan: String(row['Service Plan']) || null,
          cost_per_km: Number(row['Cost Per KM']),
          alert_before: Number(row['Alert Before']) || null,
          idle_fuel_consumption: Number(row['Idle Fuel Consumption']),
          vehicle_capacity: Number(row['Vehicle Capacity']),
          co2_emission_factor: String(row['CO2 Emission Factor'])
        };

        const validationResult = insertVehicleTypeMasterSchema.safeParse(vehicleType);

        if (validationResult.success) {
          await db.insert(vehicleTypeMaster).values({
            ...validationResult.data,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          });
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Row failed: ${JSON.stringify(row)} - ${validationResult.error.message}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error processing row: ${JSON.stringify(row)} - ${error.message}`);
      }
    }

    res.json({
      message: "Import completed",
      results
    });
  } catch (error: any) {
    console.error("Error importing vehicle types:", error);
    res.status(500).json({ 
      error: "Failed to import vehicle types",
      message: error.message
    });
  }
});

// Get vehicle type template
router.get("/api/vehicle-types/template", async (_req, res) => {
  try {
    // Create template with mandatory fields and descriptions
    const templateData = [{
      'Vehicle Group': 'Required - Select from available vehicle groups',
      'Vehicle Type Code': 'Required - Will be auto-generated (Manufacturer-Model-Year)',
      'Manufacturer': 'Required - e.g., Toyota, Honda, Nissan',
      'Model Year': 'Required - e.g., 2024',
      'Vehicle Type': 'Required - e.g., Corolla, Land Cruiser, Patrol',
      'Number of Passengers': 'Required - Maximum number of passengers',
      'Region': 'Required - Operating region',
      'Department': 'Required - Operations, Logistics, Medical, Administration, Maintenance, or Security',
      'Fuel Type': 'Required - Petrol, Diesel, Electric, Hybrid, CNG, or LPG',
      'Fuel Efficiency (KM/L)': 'Required - Average fuel consumption',
      'Service Plan': 'Optional - Maintenance schedule or service plan details',
      'Cost Per KM': 'Will be calculated automatically',
      'Alert Before (Days)': 'Optional - Days before service notification',
      'Idle Fuel Consumption': 'Will be calculated based on vehicle type',
      'Vehicle Volume (m³)': 'Will be calculated based on vehicle type',
      'CO2 Emission Factor': 'Will be calculated based on fuel type'
    }];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData, {
      header: Object.keys(templateData[0]),
      skipHeader: false
    });

    // Add column widths and styling
    const colWidths = Object.keys(templateData[0]).map(() => ({ wch: 30 }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Types Template");

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle-types-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buf);
  } catch (error: any) {
    console.error("Error generating template:", error);
    res.status(500).json({ error: "Failed to generate template", details: error.message });
  }
});


// Export vehicle types
router.get("/api/vehicle-types/export", async (_req, res) => {
  try {
    const types = await db.select().from(vehicleTypeMaster);

    // Transform data for Excel export
    const exportData = types.map(type => ({
      'Vehicle Group': type.vehicleGroup,
      'Vehicle Type Code': type.vehicleTypeCode,
      'Number of Passengers': type.numberOfPassengers,
      'Region': type.region,
      'Section': type.section,
      'Special Vehicle Type': type.specialVehicleType,
      'Road Speed Threshold': type.roadSpeedThreshold,
      'Service Plan': type.servicePlan,
      'Cost Per KM': type.costPerKm,
      'Maximum Weight': type.maximumWeight,
      'Vehicle Type': type.vehicleType,
      'Department': type.department,
      'Unit': type.unit,
      'Alert Before': type.alertBefore,
      'Idle Fuel Consumption': type.idleFuelConsumption,
      'Vehicle Volume': type.vehicleVolume,
      'Status': type.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(type.createdAt).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Vehicle Types");

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=vehicle-types.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buf);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to export vehicle types" });
  }
});

// Import vehicle types from Excel
router.post("/api/vehicle-types/import", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Track import results
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of data) {
      try {
        const vehicleType = {
          vehicleGroup: row['Vehicle Group'],
          vehicleTypeCode: row['Vehicle Type Code'],
          numberOfPassengers: Number(row['Number of Passengers']),
          region: row['Region'],
          section: row['Section'],
          specialVehicleType: row['Special Vehicle Type'],
          roadSpeedThreshold: Number(row['Road Speed Threshold']),
          servicePlan: row['Service Plan'],
          costPerKm: Number(row['Cost Per KM']),
          maximumWeight: Number(row['Maximum Weight']),
          vehicleType: row['Vehicle Type'],
          department: row['Department'],
          unit: row['Unit'],
          alertBefore: Number(row['Alert Before']),
          idleFuelConsumption: Number(row['Idle Fuel Consumption']),
          vehicleVolume: Number(row['Vehicle Volume'])
        };

        const validationResult = insertVehicleTypeMasterSchema.safeParse(vehicleType);

        if (validationResult.success) {
          await db.insert(vehicleTypeMaster).values({...validationResult.data, is_active: true, created_at: new Date(), updated_at: new Date()});
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Row failed: ${JSON.stringify(row)} - ${validationResult.error.message}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error processing row: ${JSON.stringify(row)} - ${error.message}`);
      }
    }

    res.json({
      message: "Import completed",
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to import vehicle types" });
  }
});

export default router;