import { Router } from "express";
import { vehicleGroups, insertVehicleGroupSchema, type VehicleGroup } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

// Get all vehicle groups
router.get("/api/vehicle-groups", async (_req, res) => {
  try {
    const groups = await db.select().from(vehicleGroups);
    res.json(groups);
  } catch (error: any) {
    console.error("Error fetching vehicle groups:", error);
    res.status(500).json({ error: "Failed to fetch vehicle groups" });
  }
});

// Create new vehicle group
router.post("/api/vehicle-groups", async (req, res) => {
  try {
    // Validate the request data
    const validatedData = insertVehicleGroupSchema.parse(req.body);

    // Insert into database
    const [newGroup] = await db.insert(vehicleGroups).values({
      group_code: validatedData.group_code,
      region: validatedData.region,
      name: validatedData.name,
      type: validatedData.type,
      department: validatedData.department,
      image_url: validatedData.image_url || null,
      description: validatedData.description || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();

    res.status(201).json(newGroup);
  } catch (error: any) {
    console.error("Error creating vehicle group:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to create vehicle group" });
  }
});

// Update vehicle group
router.patch("/api/vehicle-groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const validatedData = insertVehicleGroupSchema.partial().parse(req.body);

    const [updatedGroup] = await db
      .update(vehicleGroups)
      .set({
        ...validatedData,
        updated_at: new Date()
      })
      .where(eq(vehicleGroups.id, id))
      .returning();

    if (!updatedGroup) {
      return res.status(404).json({ error: "Vehicle group not found" });
    }

    res.json(updatedGroup);
  } catch (error: any) {
    console.error("Error updating vehicle group:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to update vehicle group" });
  }
});

// Get vehicle group by ID
router.get("/api/vehicle-groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const [group] = await db
      .select()
      .from(vehicleGroups)
      .where(eq(vehicleGroups.id, id));

    if (!group) {
      return res.status(404).json({ error: "Vehicle group not found" });
    }
    res.json(group);
  } catch (error: any) {
    console.error("Error fetching vehicle group:", error);
    res.status(500).json({ error: "Failed to fetch vehicle group" });
  }
});

export default router;