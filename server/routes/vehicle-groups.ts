import { Router } from "express";
import { storage } from "../storage";
import { insertVehicleGroupSchema } from "@shared/schema";

const router = Router();

// Get all vehicle groups
router.get("/api/vehicle-groups", async (req, res) => {
  try {
    const groups = await storage.getAllVehicleGroups();
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
    const data = insertVehicleGroupSchema.parse(req.body);
    const newGroup = await storage.createVehicleGroup(data);
    console.log("Created vehicle group:", newGroup);
    res.status(201).json(newGroup);
  } catch (error: any) {
    console.error("Error creating vehicle group:", error);
    res.status(400).json({ message: error.message });
  }
});

// Update vehicle group
router.patch("/api/vehicle-groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertVehicleGroupSchema.partial().parse(req.body);
    const updatedGroup = await storage.updateVehicleGroup(id, data);
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
    const group = await storage.getVehicleGroup(id);
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