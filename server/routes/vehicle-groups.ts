import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleGroupSchema, vehicleGroups } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

// Get all vehicle groups
router.get("/api/vehicle-groups", async (req, res) => {
  try {
    const groups = await db.select().from(vehicleGroups);
    console.log("Fetched vehicle groups:", groups);
    res.json(groups);
  } catch (error: any) {
    console.error("Error fetching vehicle groups:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create new vehicle group
router.post("/api/vehicle-groups", async (req, res) => {
  try {
    console.log("Received vehicle group data:", req.body);

    // Validate the request data
    const validatedData = insertVehicleGroupSchema.parse(req.body);
    console.log("Validated data:", validatedData);

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

    console.log("Created vehicle group:", newGroup);
    res.status(201).json(newGroup);
  } catch (error: any) {
    console.error("Error creating vehicle group:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update vehicle group
router.patch("/api/vehicle-groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log("Updating vehicle group:", id, "with data:", req.body);

    const data = insertVehicleGroupSchema.partial().parse(req.body);

    const [updatedGroup] = await db
      .update(vehicleGroups)
      .set({
        ...data,
        updated_at: new Date()
      })
      .where(eq(vehicleGroups.id, id))
      .returning();

    if (!updatedGroup) {
      return res.status(404).json({ message: "Vehicle group not found" });
    }

    console.log("Updated vehicle group:", updatedGroup);
    res.json(updatedGroup);
  } catch (error: any) {
    console.error("Error updating vehicle group:", error);
    res.status(400).json({ message: error.message });
  }
});

// Get vehicle group by ID
router.get("/api/vehicle-groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [group] = await db
      .select()
      .from(vehicleGroups)
      .where(eq(vehicleGroups.id, id));

    if (!group) {
      return res.status(404).json({ message: "Vehicle group not found" });
    }
    res.json(group);
  } catch (error: any) {
    console.error("Error fetching vehicle group:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;