import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Get all fuel types
router.get("/", async (req, res) => {
  try {
    const fuelTypes = await storage.getAllFuelTypes();
    res.json(fuelTypes);
  } catch (error) {
    console.error("Error getting fuel types:", error);
    res.status(500).json({ error: "Failed to get fuel types" });
  }
});

// Create a new fuel type
router.post("/", async (req, res) => {
  try {
    const schema = z.object({
      type: z.string().min(2),
      price: z.number().min(0),
      co2_factor: z.number().min(0),
    });

    const validatedData = schema.parse(req.body);
    const currentDate = new Date();
    
    // Convert number fields to strings for database storage
    const fuelTypeData: Record<string, any> = {
      type: validatedData.type,
      price: String(validatedData.price),
      co2_factor: String(validatedData.co2_factor),
      created_at: currentDate,
      updated_at: currentDate,
      historical_prices: JSON.stringify([{
        date: currentDate.toISOString(),
        price: validatedData.price
      }])
    };
    
    const newFuelType = await storage.createFuelType(fuelTypeData);
    
    res.status(201).json(newFuelType);
  } catch (error) {
    console.error("Error creating fuel type:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to create fuel type" });
    }
  }
});

// Update a fuel type
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const schema = z.object({
      type: z.string().min(2).optional(),
      price: z.number().min(0).optional(),
      co2_factor: z.number().min(0).optional(),
    });

    const validatedData = schema.parse(req.body);
    const currentFuelType = await storage.getFuelTypeById(id);
    
    if (!currentFuelType) {
      return res.status(404).json({ error: "Fuel type not found" });
    }
    
    // If price is being updated, add to historical prices
    let historicalPrices = [];
    if (currentFuelType.historical_prices) {
      try {
        // It's possible the historical_prices is already an object if it was returned like that from the database
        if (typeof currentFuelType.historical_prices === 'string') {
          historicalPrices = JSON.parse(currentFuelType.historical_prices);
        } else if (Array.isArray(currentFuelType.historical_prices)) {
          historicalPrices = currentFuelType.historical_prices;
        } else {
          console.log('Historical prices is neither a string nor an array:', currentFuelType.historical_prices);
        }
      } catch (err) {
        console.error('Error parsing historical prices:', err);
        console.log('Raw historical prices:', currentFuelType.historical_prices);
      }
    }
    
    // Convert numbers to strings to match database types
    const updateData: Partial<Record<string, any>> = {
      ...validatedData,
      updated_at: new Date()
    };
    
    // Convert number fields to strings for the database
    if (validatedData.price !== undefined) {
      updateData.price = String(validatedData.price);
    }
    
    if (validatedData.co2_factor !== undefined) {
      updateData.co2_factor = String(validatedData.co2_factor);
    }
    
    // Check if price has changed and update historical prices
    if (validatedData.price && Number(validatedData.price) !== Number(currentFuelType.price)) {
      historicalPrices.push({
        date: new Date().toISOString(),
        price: validatedData.price
      });
      
      updateData.historical_prices = JSON.stringify(historicalPrices);
    }
    
    const updatedFuelType = await storage.updateFuelType(id, updateData);
    
    res.json(updatedFuelType);
  } catch (error) {
    console.error("Error updating fuel type:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: "Failed to update fuel type" });
    }
  }
});

// Delete a fuel type
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    await storage.deleteFuelType(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting fuel type:", error);
    res.status(500).json({ error: "Failed to delete fuel type" });
  }
});

export default router;