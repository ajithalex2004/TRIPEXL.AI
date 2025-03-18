import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema } from "@shared/schema";
import { authService } from "./services/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize default user
  await authService.initializeDefaultUser();

  // Auth routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      console.log('Finding user in storage');
      const user = await storage.findUserByEmail(email);

      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      console.log('Comparing passwords');
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isVerified) {
        console.log('User not verified:', email);
        return res.status(401).json({ error: "Please verify your account first" });
      }

      // Get employee details
      const employee = await storage.findEmployeeByIdAndEmail(user.employeeId, user.email);
      if (!employee) {
        console.log('Employee not found for user:', email);
        return res.status(404).json({ error: "Employee not found" });
      }

      // Update last login time
      await storage.updateUserLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'dev-secret-key',
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', email);
      // Return both user and employee data
      res.json({ token, user, employee });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Server error during login" }); 
    }
  });

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
        message: "Registration successful. Please verify your account.", 
        userId: user.id,
        otp // Include OTP in the response
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

  // Add a new route to get current employee information
  app.get("/api/employee/current", async (req, res) => {
    try {
      // Get employee ID from the authenticated user's token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as { userId: number, email: string };

      // Get user details
      const user = await storage.findUserByEmail(decoded.email);
      if (!user || !user.employeeId) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Get employee details
      const employee = await storage.findEmployeeByIdAndEmail(user.employeeId, user.email);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ error: "Failed to fetch employee information" });
    }
  });

  return httpServer;
}