import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get all vehicles
  app.get("/api/vehicles", async (_req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  // Get available vehicles
  app.get("/api/vehicles/available", async (_req, res) => {
    const vehicles = await storage.getAvailableVehicles();
    res.json(vehicles);
  });

  // Get all drivers
  app.get("/api/drivers", async (_req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers);
  });

  // Get available drivers
  app.get("/api/drivers/available", async (_req, res) => {
    const drivers = await storage.getAvailableDrivers();
    res.json(drivers);
  });

  // Get all bookings
  app.get("/api/bookings", async (_req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  // Create new booking with AI assignment
  app.post("/api/bookings", async (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid booking data" });
    }

    try {
      const booking = await storage.createBooking(result.data);

      if (booking.status === "pending") {
        return res.status(409).json({ 
          error: "No suitable vehicle/driver combination found",
          booking 
        });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  return httpServer;
}