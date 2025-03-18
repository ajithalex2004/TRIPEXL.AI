import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema } from "@shared/schema";
import { authService } from "./services/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid registration data", details: result.error.issues });
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
      const { user, otp } = await authService.registerUser(result.data, password);
      res.json({ 
        message: "Registration successful. Please check your email for verification code.", 
        userId: user.id 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Server error during registration" });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ error: "User ID and OTP are required" });
    }

    try {
      const { user, token } = await authService.verifyOTP(userId, otp);
      res.json({ message: "Account verified successfully", token, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message }); 
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      const { user, token } = await authService.login(email, password);
      res.json({ token, user });
    } catch (error: any) {
      res.status(401).json({ error: "Invalid credentials" }); 
    }
  });

  // Get all vehicles
  app.get("/api/vehicles", async (_req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve vehicles" }); 
    }
  });

  // Get available vehicles
  app.get("/api/vehicles/available", async (_req, res) => {
    try {
      const vehicles = await storage.getAvailableVehicles();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve available vehicles" }); 
    }
  });

  // Get all drivers
  app.get("/api/drivers", async (_req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve drivers" }); 
    }
  });

  // Get available drivers
  app.get("/api/drivers/available", async (_req, res) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve available drivers" }); 
    }
  });

  // Get all bookings
  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve bookings" }); 
    }
  });

  // Create new booking with AI assignment
  app.post("/api/bookings", async (req, res) => {
    const result = insertBookingSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid booking data", details: result.error.issues }); 
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
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  return httpServer;
}