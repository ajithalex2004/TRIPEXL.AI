import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import { schema } from "./db";
import { log } from "./vite";
// Import debug utils
import { logBookingRequest, logBookingError } from "./debug/booking-debug";
import { createToken, verifyToken, isValidTokenPayload } from "./auth/token-service";
import vehicleGroupRouter from "./routes/vehicle-groups";
import vehicleTypeMasterRouter from "./routes/vehicle-type-master";
import { ecoRoutesRouter } from "./routes/eco-routes";
import multer from "multer";
import { approvalWorkflowsRouter } from './routes/approval-workflows';
import { insertBookingSchema, insertUserSchema, employees, bookings, insertEmployeeSchema, insertApprovalWorkflowSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import authTestRouter from "./routes/auth-test";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { eq, sql } from 'drizzle-orm';
import mastersRouter from "./routes/masters"; // Added import statement
import { initializeFuelPriceService, updateFuelPrices, getFuelPriceHistory, triggerFuelPriceUpdate, runWamFuelPriceScraper } from "./services/fuel-price-service";
import { performanceRouter } from "./routes/performance-snapshot";
import fuelTypesRouter from "./routes/fuel-types";
import userEmployeeRouter from "./routes/user-employee-router";
import bookingDebugRouter from "./routes/booking-debug";
import bookingTestRouter from "./routes/booking-test";
import bookingDebugTraceRouter from "./routes/booking-debug-trace";
import bookingManagementRouter from "./routes/booking-management";

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

export async function registerRoutes(app: Express): Promise<Server> {
  log("Starting route registration...");
  const httpServer = createServer(app);

  try {
    // Health check endpoint
    app.get("/api/health", (_req, res) => {
      res.json({ status: "healthy" });
    });
    log("Health check endpoint registered");
    
    // Debug API for booking analysis
    app.get("/api/debug/booking", (req, res) => {
      try {
        // Trigger a test log message to verify the debug system
        console.log('[DEBUG] API check:', { timestamp: new Date().toISOString() });
        
        // Get booking ID from query parameters if available
        const bookingId = req.query.id ? Number(req.query.id) : undefined;
        
        // Send info about the debug mode
        res.json({
          status: "active",
          message: "Booking debug system is active. Check server logs for detailed information.",
          note: "Debug information is being logged to the server console.",
          debugEndpoints: {
            "/api/debug/booking": "Check debug status",
            "/api/debug/booking?id=123": "Log specific booking ID information"
          },
          bookingId: bookingId ? `Debugging for booking ID: ${bookingId}` : "No specific booking ID provided"
        });
        
        // Log diagnostic information if a booking ID was provided
        if (bookingId) {
          log(`[DEBUG] Request for debugging booking ID: ${bookingId}`);
          storage.getBookings()
            .then(bookings => {
              const booking = bookings.find(b => b.id === bookingId);
              if (booking) {
                console.log('[DEBUG] Booking found:', booking);
              } else {
                console.log('[DEBUG] Booking not found for ID:', bookingId);
              }
            })
            .catch(error => {
              log(`[DEBUG] Error retrieving booking ${bookingId}: ${error.message}`);
            });
        }
        
      } catch (error: any) {
        log(`[DEBUG] Error in debug endpoint: ${error.message}`);
        res.status(500).json({ 
          error: "Error in debug system",
          message: error.message
        });
      }
    });
    log("Booking debug endpoint registered");

    // Initialize default user
    log("Initializing default user...");
    await storage.initializeDefaultUser();
    log("Default user initialized");
    
    // Initialize fuel price service
    log("Initializing fuel price service...");
    await initializeFuelPriceService();
    log("Fuel price service initialized successfully");

    // Register vehicle group routes
    log("Registering vehicle group routes...");
    app.use(vehicleGroupRouter);
    log("Vehicle group routes registered");

    // Add vehicle type master routes
    log("Registering vehicle type master routes...");
    app.use(vehicleTypeMasterRouter);
    log("Vehicle type master routes registered");

    // Approval workflows routes are registered later with the /api prefix

    app.use(mastersRouter); // Added mastersRouter
    
    // Add auth test routes
    app.use("/api", authTestRouter);
    log("Auth test routes registered");
    
    // Register user-employee mapping router
    log("Registering user-employee mapping routes...");
    app.use("/api/users", userEmployeeRouter);
    log("User-employee mapping routes registered");

    // Auth routes
    log("Registering auth routes...");
    
    // Add a GET endpoint to retrieve current user info
    app.get("/api/auth/user", async (req, res) => {
      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log(`[USER-GET] ERROR: No authorization token provided`);
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        console.log(`[USER-GET] ERROR: Invalid authorization header format`);
        return res.status(401).json({ error: "Invalid authorization header" });
      }
      
      try {
        // Verify the token and get user ID using token service
        const decoded = verifyToken(token) as { userId: number, email: string };
        console.log(`[USER-GET] Token verified for user:`, decoded);
        
        // Retrieve user from database
        const user = await storage.getUser(decoded.userId);
        if (!user) {
          console.log(`[USER-GET] User not found for ID:`, decoded.userId);
          return res.status(404).json({ error: "User not found" });
        }
        
        // Remove sensitive information
        const { password, ...safeUser } = user;
        
        console.log(`[USER-GET] Successfully retrieved user:`, safeUser.email_id);
        return res.json(safeUser);
      } catch (error) {
        console.error(`[USER-GET] Token verification error:`, error);
        return res.status(401).json({ error: "Invalid token" });
      }
    });
    
    // Handle /api/auth/login for backward compatibility
    app.post("/api/auth/login", async (req, res) => {
      try {
        // Support both userName and emailId field names
        const emailValue = req.body.emailId || req.body.userName || req.body.email;
        const password = req.body.password;
        console.log('Login attempt initiated for:', emailValue);

        // Input validation
        if (!emailValue || !password) {
          return res.status(400).json({
            error: "Email/username and password are required"
          });
        }

        // Find user - try by username or email
        const user = await storage.findUserByEmail(emailValue) || 
                    await storage.getUserByUserName(emailValue);
                    
        if (!user) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isValidPassword);

        if (!isValidPassword) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Generate token - using createToken from token-service.ts to maintain consistency
        const token = createToken(user.id, user.email_id);
        console.log(`Created token for user ${user.id} with email ${user.email_id}. Token: ${token.substring(0, 20)}...`);

        // Update last login
        await storage.updateUserLastLogin(user.id);

        // Send response
        console.log('Login successful for:', user.email_id);
        const { password: _, ...userData } = user;
        res.json({
          token,
          ...userData, // Flattening the user data for backward compatibility
          message: "Login successful"
        });
      } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
          error: "Server error during login",
          details: error.message
        });
      }
    });
    
    // Get current user information from auth token
    app.get("/api/auth/user", async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "Authorization header missing" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Invalid authorization header format" });
      }

      try {
        // Verify the token using token service
        const decoded = verifyToken(token) as { userId: number, email: string };
        
        // Get user information
        const user = await storage.getUser(decoded.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Remove sensitive information
        const { password, ...userInfo } = user;
        
        // Return user data
        res.json(userInfo);
      } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    });

    // Original login endpoint
    app.post("/api/login", async (req, res) => {
      try {
        // Support both userName and emailId field names
        const emailValue = req.body.emailId || req.body.userName || req.body.email;
        const password = req.body.password;
        
        console.log('Login attempt initiated for:', emailValue);

        // Input validation
        if (!emailValue || !password) {
          return res.status(400).json({
            error: "Email/username and password are required"
          });
        }

        // Find user - try by username or email
        const user = await storage.findUserByEmail(emailValue) || 
                    await storage.getUserByUserName(emailValue);
                    
        if (!user) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isValidPassword);

        if (!isValidPassword) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Generate token using the token-service for consistency
        const token = createToken(user.id, user.email_id);
        console.log(`Created token for user ${user.id} with email ${user.email_id}. Token: ${token.substring(0, 20)}...`);

        // Update last login
        await storage.updateUserLastLogin(user.id);

        // Send response
        console.log('Login successful for:', emailValue);
        const { password: _, ...userData } = user;
        res.json({
          token,
          user: userData,
          message: "Login successful"
        });
      } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
          error: "Server error during login",
          details: error.message
        });
      }
    });
    log("Auth routes registered");

    // Update the registration route to handle basic registration
    app.post("/api/auth/register", async (req, res) => {
      try {
        console.log("Registration attempt with data:", {
          ...req.body,
          password: '[REDACTED]'
        });

        const { email, password, firstName, lastName, userType = 'USER' } = req.body;

        // Basic validation
        if (!email || !password || !firstName || !lastName) {
          return res.status(400).json({
            error: "Missing required fields",
            details: "Email, password, first name and last name are required"
          });
        }

        // Check if user already exists
        const existingUser = await storage.findUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            error: "User already exists",
            details: "An account with this email already exists"
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user data object
        const userData = {
          email_id: email,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          user_name: email.split('@')[0],
          user_code: `USR${Math.floor(Math.random() * 10000)}`,
          user_type: userType,
          user_operation_type: userType,
          user_group: 'DEFAULT',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        // Create user
        const user = await storage.createUser(userData);
        console.log("User created successfully:", {
          id: user.id,
          email: user.email_id,
          name: user.full_name
        });

        // Generate token for immediate login using token-service for consistency
        const token = createToken(user.id, user.email_id);
        console.log(`Created token for new user ${user.id} with email ${user.email_id}. Token: ${token.substring(0, 20)}...`);

        res.status(201).json({
          message: "Registration successful",
          token,
          user: {
            id: user.id,
            email: user.email_id,
            name: user.full_name,
            userType: user.user_type
          }
        });

      } catch (error: any) {
        console.error("Registration error:", error);
        res.status(500).json({
          error: "Server error during registration",
          details: error.message
        });
      }
    });

    app.post("/api/auth/verify", async (req, res) => {
      const { userId, otp } = req.body;
      if (!userId || !otp) {
        return res.status(400).json({ error: "User ID and OTP are required" });
      }

      try {
        // Get OTP verification record
        const verification = await storage.getOtpVerification(userId);
        
        if (!verification) {
          return res.status(400).json({ error: "No verification code found" });
        }
        
        if (verification.otp !== otp) {
          return res.status(400).json({ error: "Invalid verification code" });
        }
        
        // Mark user as verified
        const user = await storage.markUserAsVerified(userId);
        
        // Generate token
        const token = createToken(user.id, user.email_id);
        
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
    // Simple test endpoint to verify API connectivity
    app.get("/api/bookings/test", (req, res) => {
      console.log("Booking test endpoint called");
      res.status(200).json({
        message: "Booking API is working",
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          dbConnected: !!db
        }
      });
    });
    
    app.get("/api/bookings", async (req, res) => {
      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log(`[BOOKINGS-GET] ERROR: No authorization token provided`);
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        console.log(`[BOOKINGS-GET] ERROR: Invalid authorization header format`);
        return res.status(401).json({ error: "Invalid authorization header" });
      }
      
      // Verify the token using our improved token service
      try {
        // Enhanced debugging for token verification
        console.log(`[BOOKINGS-GET] DEBUG: Token to verify:`, token.substring(0, 15) + '...');
        console.log(`[BOOKINGS-GET] DEBUG: Using improved token-service`);
        
        // The token service now handles normalization of user IDs
        const decoded = verifyToken(token);
        
        // Check if the token has valid information
        if (!isValidTokenPayload(decoded)) {
          console.log(`[BOOKINGS-GET] ERROR: Invalid token payload:`, JSON.stringify(decoded));
          return res.status(401).json({ error: "Invalid token format - missing user identifier" });
        }
        
        // By now, userId should be normalized
        console.log(`[BOOKINGS-GET] User authenticated with ID: ${decoded.userId}`);
        
        // Add the verified user to the request
        (req as any).user = decoded;
      } catch (error: any) {
        console.log(`[BOOKINGS-GET] ERROR: Token verification failed:`, error);
        // More specific error message based on the error
        if (error.name === 'TokenExpiredError' || error.message === 'Token expired') {
          return res.status(401).json({ error: "Your session has expired. Please login again." });
        }
        return res.status(401).json({ error: "Authentication failed. Please login again." });
      }
      
      try {
        const bookings = await storage.getBookings();
        
        // Log the first booking to debug format issues
        if (bookings.length > 0) {
          console.log('[BOOKINGS-GET] First booking sample:', JSON.stringify(bookings[0]));
          
          // Check for potential format issues
          const firstBooking = bookings[0];
          console.log('[BOOKINGS-GET] Pickup location type:', typeof firstBooking.pickup_location);
          if (typeof firstBooking.pickup_location === 'string') {
            try {
              // Try to parse the location if it's a string
              console.log('[BOOKINGS-GET] Attempting to parse pickup_location string');
              bookings.forEach(booking => {
                if (typeof booking.pickup_location === 'string') {
                  booking.pickup_location = JSON.parse(booking.pickup_location);
                }
                if (typeof booking.dropoff_location === 'string') {
                  booking.dropoff_location = JSON.parse(booking.dropoff_location);
                }
              });
              console.log('[BOOKINGS-GET] Successfully parsed location strings to objects');
            } catch (parseError) {
              console.error('[BOOKINGS-GET] Failed to parse location string:', parseError);
            }
          }
        }
        
        console.log(`[BOOKINGS-GET] Returning ${bookings.length} bookings`);
        res.json(bookings);
      } catch (error: any) {
        console.error(`[BOOKINGS-GET] ERROR:`, error);
        res.status(500).json({ error: "Failed to retrieve bookings" });
      }
    });

    // Update the booking creation route
    app.post("/api/bookings", async (req, res) => {
      const debugId = Date.now().toString();
      
      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log(`[BOOKING-${debugId}] ERROR: No authorization token provided`);
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        console.log(`[BOOKING-${debugId}] ERROR: Invalid authorization header format`);
        return res.status(401).json({ error: "Invalid authorization header" });
      }
      
      // Verify the token
      let decodedUserId: number;
      
      // For debugging purposes, print important information
      console.log(`[BOOKING-${debugId}] JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
      console.log(`[BOOKING-${debugId}] Token being verified:`, token.substring(0, 10) + '...');
      
      try {
        // Use our token service for consistent JWT verification
        console.log(`[BOOKING-${debugId}] Verifying token using token service`);
        
        const decoded = verifyToken(token);
        console.log(`[BOOKING-${debugId}] Decoded token:`, JSON.stringify(decoded));
        
        // Extract userId from the decoded token, no matter what its structure is
        if (typeof decoded === 'object' && decoded !== null) {
          // Log all properties of the decoded token
          console.log(`[BOOKING-${debugId}] Token properties:`, Object.keys(decoded));
          
          decodedUserId = (decoded as any).userId;
          console.log(`[BOOKING-${debugId}] Found userId in token:`, decodedUserId);
          
          if (!decodedUserId) {
            console.log(`[BOOKING-${debugId}] ERROR: Token does not contain userId`);
            // Try to find any user identifier in the token
            const possibleIds = ['id', 'user_id', 'userId', 'sub'];
            for (const idField of possibleIds) {
              if ((decoded as any)[idField]) {
                decodedUserId = (decoded as any)[idField];
                console.log(`[BOOKING-${debugId}] Found alternative user ID field: ${idField} = ${decodedUserId}`);
                break;
              }
            }
            
            if (!decodedUserId) {
              console.log(`[BOOKING-${debugId}] ERROR: Could not find any user identifier in token`);
              return res.status(401).json({ error: "Invalid token format - missing user identifier" });
            }
          }
          
          console.log(`[BOOKING-${debugId}] User authenticated with userId: ${decodedUserId}`);
        } else {
          console.log(`[BOOKING-${debugId}] ERROR: Token payload is not an object`, decoded);
          return res.status(401).json({ error: "Invalid token format - payload not object" });
        }
      } catch (error: any) {
        console.log(`[BOOKING-${debugId}] ERROR: Invalid token`, error.message);
        console.log(`[BOOKING-${debugId}] ERROR details:`, error);
        return res.status(401).json({ error: "Invalid or expired token", details: error.message });
      }
      
      // Use our enhanced logging helper for detailed diagnostics
      console.log(`[BOOKING-${debugId}] Received booking request`);
      const validationSummary = logBookingRequest(req, debugId);
      
      // Log all required fields for detailed debugging
      console.log(`[BOOKING-${debugId}] Required fields check:
        employee_id: ${req.body.employee_id ? '✓' : '✗'} (${typeof req.body.employee_id})
        booking_type: ${req.body.booking_type ? '✓' : '✗'}
        purpose: ${req.body.purpose ? '✓' : '✗'}
        priority: ${req.body.priority ? '✓' : '✗'}
        pickup_location: ${req.body.pickup_location ? '✓' : '✗'}
        dropoff_location: ${req.body.dropoff_location ? '✓' : '✗'}
        pickup_time: ${req.body.pickup_time ? '✓' : '✗'}
        dropoff_time: ${req.body.dropoff_time ? '✓' : '✗'}`);

      try {
        // STEP 1: Validate and normalize the employee ID - this is critical for DB operations
        // Handle both camelCase and snake_case field names for backward compatibility
        let employeeIdValue = req.body.employee_id !== undefined ? req.body.employee_id : req.body.employeeId;
        
        console.log(`[BOOKING-${debugId}] Original employee ID:`, employeeIdValue, "Type:", typeof employeeIdValue);
        
        // Enhanced validation - check if employee_id exists and has a value
        if (employeeIdValue === undefined || employeeIdValue === null || employeeIdValue === '') {
          console.error(`[BOOKING-${debugId}] Missing employee_id in request`);
          return res.status(400).json({
            error: "Employee ID is required",
            details: "Please provide a valid employee ID"
          });
        }
        
        // Special case handling for string values that may look like numbers (e.g., "1004")
        // Some clients may send the employee ID as a string representation of a number
        if (typeof employeeIdValue === 'string' && /^\d+$/.test(employeeIdValue.trim())) {
          employeeIdValue = Number(employeeIdValue.trim());
          console.log(`[BOOKING-${debugId}] Converted numeric string employee_id to number:`, employeeIdValue);
        }
        
        // Ensure employee_id is a number before validation
        let formattedEmployeeId = employeeIdValue;
        if (typeof employeeIdValue !== 'number') {
          const originalValue = employeeIdValue;
          formattedEmployeeId = Number(employeeIdValue);
          
          // Check if conversion was successful
          if (isNaN(formattedEmployeeId)) {
            console.error(`[BOOKING-${debugId}] Failed to convert employee_id "${originalValue}" to a number`);
            return res.status(400).json({
              error: "Invalid employee ID format",
              details: `The value "${originalValue}" could not be converted to a valid employee ID number`
            });
          }
          
          console.log(`[BOOKING-${debugId}] Converted employee_id from "${originalValue}" to number:`, formattedEmployeeId);
        }
        
        // Update the req.body with normalized employee_id
        req.body.employee_id = formattedEmployeeId;
        
        // For compatibility, ensure both snake_case and camelCase formats are available
        req.body.employeeId = formattedEmployeeId;
        
        // STEP 2: Format location data to ensure proper structure
        console.log(`[BOOKING-${debugId}] Formatting location data for consistency`);
        
        // Format pickup_location
        if (req.body.pickup_location) {
          try {
            // Ensure address is a string
            if (req.body.pickup_location.address) {
              req.body.pickup_location.address = String(req.body.pickup_location.address);
            }
            
            // Ensure coordinates are properly formatted
            if (req.body.pickup_location.coordinates) {
              req.body.pickup_location.coordinates = {
                lat: parseFloat(String(req.body.pickup_location.coordinates.lat || 0)),
                lng: parseFloat(String(req.body.pickup_location.coordinates.lng || 0))
              };
            }
            
            console.log(`[BOOKING-${debugId}] Formatted pickup_location:`, JSON.stringify(req.body.pickup_location));
          } catch (locationError) {
            console.error(`[BOOKING-${debugId}] Error formatting pickup_location:`, locationError);
          }
        }
        
        // Format dropoff_location
        if (req.body.dropoff_location) {
          try {
            // Ensure address is a string
            if (req.body.dropoff_location.address) {
              req.body.dropoff_location.address = String(req.body.dropoff_location.address);
            }
            
            // Ensure coordinates are properly formatted
            if (req.body.dropoff_location.coordinates) {
              req.body.dropoff_location.coordinates = {
                lat: parseFloat(String(req.body.dropoff_location.coordinates.lat || 0)),
                lng: parseFloat(String(req.body.dropoff_location.coordinates.lng || 0))
              };
            }
            
            console.log(`[BOOKING-${debugId}] Formatted dropoff_location:`, JSON.stringify(req.body.dropoff_location));
          } catch (locationError) {
            console.error(`[BOOKING-${debugId}] Error formatting dropoff_location:`, locationError);
          }
        }
        
        // Format waypoints if present
        if (req.body.waypoints && Array.isArray(req.body.waypoints)) {
          try {
            req.body.waypoints = req.body.waypoints.map((wp: any) => ({
              address: String(wp?.address || ''),
              coordinates: {
                lat: parseFloat(String(wp?.coordinates?.lat || 0)),
                lng: parseFloat(String(wp?.coordinates?.lng || 0))
              }
            }));
            
            console.log(`[BOOKING-${debugId}] Formatted ${req.body.waypoints.length} waypoints`);
          } catch (waypointsError) {
            console.error(`[BOOKING-${debugId}] Error formatting waypoints:`, waypointsError);
          }
        }
        
        // STEP 3: Validate the booking data using Zod schema
        console.log(`[BOOKING-${debugId}] Validating booking data with schema`);
        const result = insertBookingSchema.safeParse(req.body);

        if (!result.success) {
          console.error(`[BOOKING-${debugId}] Schema validation errors:`, result.error.issues);
          return res.status(400).json({
            error: "Invalid booking data",
            details: result.error.issues
          });
        }

        // Double-check employee ID is a number after validation
        console.log(`[BOOKING-${debugId}] Employee ID after validation:`, result.data.employee_id, "Type:", typeof result.data.employee_id);

        // STEP 3: Verify the employee exists in the database
        try {
          console.log(`[BOOKING-${debugId}] Verifying employee ID ${result.data.employee_id} exists in database`);
          
          // CRITICAL FIX: For PostgreSQL, ensure we have a numeric value for DB lookup
          const employeeId = typeof result.data.employee_id === 'string' 
            ? parseInt(result.data.employee_id) 
            : result.data.employee_id;
            
          console.log(`[BOOKING-${debugId}] Using employeeId (number):`, employeeId, typeof employeeId);
          
          // First try lookup by internal database ID (the primary key)
          const employeeByInternalId = await db
            .select()
            .from(schema.employees)
            .where(eq(schema.employees.id, employeeId))
            .limit(1);
          
          if (employeeByInternalId.length > 0) {
            console.log(`[BOOKING-${debugId}] Employee found by internal id:`, employeeByInternalId[0].employee_name);
            
            // Already using internal ID, just ensure type is correct
            result.data.employee_id = employeeByInternalId[0].id;
            console.log(`[BOOKING-${debugId}] Using internal ID for DB relations:`, result.data.employee_id);
          } else {
            // Try looking up by employee_id field (the "display ID" shown to users)
            console.log(`[BOOKING-${debugId}] Employee not found by internal ID, trying employee_id field`);
            
            // Convert to string for this lookup since employee_id is stored as string in DB
            const employeeIdStr = String(result.data.employee_id);
            console.log(`[BOOKING-${debugId}] Looking up with employee_id string:`, employeeIdStr);
            
            const employeeByDisplayId = await db
              .select()
              .from(schema.employees) 
              .where(eq(schema.employees.employee_id, employeeIdStr))
              .limit(1);
              
            if (employeeByDisplayId.length === 0) {
              console.error(`[BOOKING-${debugId}] No employee found with either ID ${result.data.employee_id}`);
              return res.status(400).json({
                error: "Invalid employee ID",
                details: `Employee with ID ${result.data.employee_id} does not exist in the system`
              });
            }
            
            // Use the internal ID for database relations
            result.data.employee_id = employeeByDisplayId[0].id;
            console.log(`[BOOKING-${debugId}] Employee found by display ID:`, employeeByDisplayId[0].employee_name);
            console.log(`[BOOKING-${debugId}] Using internal ID for DB relations:`, result.data.employee_id);
          }
          
          // Final validation to ensure we have a number value
          if (typeof result.data.employee_id !== 'number') {
            result.data.employee_id = Number(result.data.employee_id);
            console.log(`[BOOKING-${debugId}] Converted employee_id to number:`, result.data.employee_id);
          }
        } catch (employeeCheckError) {
          console.error(`[BOOKING-${debugId}] Error checking employee:`, employeeCheckError);
          return res.status(500).json({
            error: "Employee verification failed",
            details: "Unable to verify employee information"
          });
        }

        // STEP 4: Prepare booking data with proper status
        const isHighPriority = ["Critical", "Emergency", "High"].includes(result.data.priority);
        const initialStatus = isHighPriority ? "approved" : "new";

        const bookingData = {
          ...result.data,
          reference_no: result.data.reference_no || `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status: initialStatus,
          created_at: new Date(),
          updated_at: new Date()
        };

        console.log(`[BOOKING-${debugId}] Prepared booking data:`, JSON.stringify(bookingData, null, 2));

        // STEP 5: Create the booking in the database
        console.log(`[BOOKING-${debugId}] Calling storage.createBooking...`);
        const booking = await storage.createBooking(bookingData);
        console.log(`[BOOKING-${debugId}] Successfully created booking with ID ${booking.id}:`, JSON.stringify(booking, null, 2));

        // Calculate and update metadata
        const totalDistance = calculateTotalDistance(booking.pickup_location, booking.dropoff_location);
        const estimatedCost = calculateEstimatedCost(booking);
        const co2Emissions = calculateCO2Emissions(booking);

        console.log("Calculated metadata:", { totalDistance, estimatedCost, co2Emissions });

        // Update booking with metadata
        const updatedBooking = await storage.updateBookingMetadata(booking.id, {
          totalDistance,
          estimatedCost,
          co2Emissions
        });

        console.log(`[BOOKING-${debugId}] Final booking data being returned:`, JSON.stringify(updatedBooking, null, 2));
        res.status(201).json(updatedBooking);
      } catch (error: any) {
        console.error(`[BOOKING-${debugId}] Error creating booking:`, error);
        
        // Detailed error logging with stack trace
        console.error(`[BOOKING-${debugId}] Error stack trace:`, error.stack);
        
        // Log specific error properties for database errors
        if (error.code) {
          console.error(`[BOOKING-${debugId}] SQL Error code:`, error.code);
          console.error(`[BOOKING-${debugId}] SQL Error detail:`, error.detail || "No details");
          console.error(`[BOOKING-${debugId}] SQL Error hint:`, error.hint || "No hint");
          console.error(`[BOOKING-${debugId}] SQL Error constraint:`, error.constraint || "No constraint");
          console.error(`[BOOKING-${debugId}] SQL Error table:`, error.table || "No table");
          console.error(`[BOOKING-${debugId}] SQL Error column:`, error.column || "No column");
        }
        
        // Log data that was being processed
        console.error(`[BOOKING-${debugId}] Booking data that caused error:`, req.body);
        
        // Determine if this is a known error type with a specific message
        if (error.message && error.message.includes('violates foreign key constraint')) {
          if (error.message.includes('employee_id')) {
            return res.status(400).json({
              error: "Invalid employee reference",
              details: "The employee ID provided does not exist in the system",
              debug: {
                errorMessage: error.message,
                errorCode: error.code || 'unknown'
              }
            });
          } else if (error.message.includes('user_id')) {
            return res.status(400).json({
              error: "Invalid user reference",
              details: "The user ID provided does not exist in the system",
              debug: {
                errorMessage: error.message,
                errorCode: error.code || 'unknown'
              }
            });
          }
        }
        
        // Check for validation errors
        if (error.name === 'ValidationError' || (error.message && error.message.includes('validation failed'))) {
          return res.status(400).json({
            error: "Validation error",
            details: error.message,
            debug: {
              validationErrors: error.errors || error.issues || 'unknown'
            }
          });
        }
        
        // Check for specific Zod validation errors
        if (error.name === 'ZodError' || (error.issues && Array.isArray(error.issues))) {
          return res.status(400).json({
            error: "Data validation error",
            details: "The booking data format is invalid",
            issues: error.issues || [],
            message: error.message
          });
        }
        
        // Check for database errors
        if (error.code && error.code.startsWith('23')) {
          return res.status(400).json({
            error: "Database constraint violation",
            details: error.detail || error.message || "A database constraint was violated",
            constraint: error.constraint || "unknown",
            code: error.code
          });
        }
        
        // Default error response with enhanced debugging info
        res.status(500).json({
          error: "Failed to create booking",
          details: error.message || "Unknown error occurred",
          errorType: error.name || typeof error,
          code: error.code || 'unknown'
        });
      }
    });

    // Using arrow functions instead for ES module compatibility
    const calculateTotalDistance = (pickup: any, dropoff: any): number => {
      // Calculate distance using coordinates
      const R = 6371; // Earth's radius in km
      const lat1 = pickup.coordinates.lat * Math.PI / 180;
      const lat2 = dropoff.coordinates.lat * Math.PI / 180;
      const dLat = (dropoff.coordinates.lat - pickup.coordinates.lat) * Math.PI / 180;
      const dLon = (dropoff.coordinates.lng - pickup.coordinates.lng) * Math.PI / 180;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      return parseFloat(distance.toFixed(2));
    };

    const calculateEstimatedCost = (booking: any): number => {
      // Basic cost calculation
      const baseRate = 2.5; // Base rate per km
      const distance = calculateTotalDistance(booking.pickup_location, booking.dropoff_location);
      let estimatedCost = distance * baseRate;

      // Add surcharges based on booking type and priority
      if (booking.booking_type === "ambulance") estimatedCost *= 1.5;
      if (booking.priority === "CRITICAL" || booking.priority === "EMERGENCY") estimatedCost *= 1.3;

      return parseFloat(estimatedCost.toFixed(2));
    };

    const calculateCO2Emissions = (booking: any): number => {
      // Average CO2 emissions calculation (in kg)
      const distance = calculateTotalDistance(booking.pickup_location, booking.dropoff_location);
      const avgEmissionRate = 0.12; // kg CO2 per km (average)
      return parseFloat((distance * avgEmissionRate).toFixed(2));
    };

    // Update the employee endpoint for better performance
    app.get("/api/employee/current", async (req, res) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: "No authorization token provided" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
          return res.status(401).json({ error: "Invalid authorization header" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as { userId: number, email: string };

        // Get user details
        const user = await storage.findUserByEmail(decoded.email);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if employee record exists
        let employee = null;
        if (user.userId) {
          // First attempt: try to find by user ID
          employee = await db.query.employees.findFirst({
            where: eq(employees.userId, user.id)
          });
        }

        if (!employee && user.emailId) {
          // Second attempt: try to find by email
          employee = await db.query.employees.findFirst({
            where: eq(employees.emailId, user.emailId)
          });
        }

        if (!employee) {
          return res.status(404).json({ error: "Employee not found for this user" });
        }

        // Set strong caching headers
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
        
        // Return detailed employee information
        res.json({
          id: employee.id,
          // Include both snake_case and camelCase formats for compatibility
          employee_id: employee.employee_id, // Snake case version (DB format)
          employeeId: employee.employee_id,  // Camel case for backward compatibility
          employee_name: employee.employee_name, // Snake case version
          employeeName: employee.employee_name,  // Camel case version
          name: employee.employee_name, // For more backward compatibility
          email: employee.email_id,
          email_id: employee.email_id, // Snake case
          emailId: employee.email_id,  // Camel case
          department: employee.department,
          designation: employee.designation,
          region: employee.region,
          unit: employee.unit,
          mobile_number: employee.mobile_number, // Snake case
          mobileNumber: employee.mobile_number,  // Camel case
          employee_type: employee.employee_type, // Snake case
          employeeType: employee.employee_type,  // Camel case
          employee_role: employee.employee_role, // Snake case
          employeeRole: employee.employee_role,  // Camel case
          hierarchy_level: employee.hierarchy_level, // Snake case
          hierarchyLevel: employee.hierarchy_level   // Camel case
        });
      } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: "Failed to fetch employee information" });
      }
    });

    // Vehicle Group routes are handled by vehicleGroupRouter

    // Add eco-routes router
    log("Registering eco-routes...");
    app.use(ecoRoutesRouter);
    log("Eco-routes registered");
    
    // Add booking test router for diagnostics
    log("Registering booking test router...");
    app.use("/api/booking-test", bookingTestRouter);
    log("Booking test router registered");
    
    // Register booking debug router for detailed diagnostic output
    log("Registering booking debug router...");
    app.use("/api/booking-debug", bookingDebugRouter);
    log("Booking debug router registered");

    // Register booking debug trace router for diagnosing issues
    app.use("/api/booking-debug-trace", bookingDebugTraceRouter);
    log("Booking debug trace router registered");
    
    // Register booking management router
    app.use("/api/bookings", bookingManagementRouter);
    log("Booking management router registered");
    
    // Add fuel types router
    log("Registering fuel types router...");
    app.use("/api/fuel-types", fuelTypesRouter);
    // Also add the route for fuel-prices/update endpoint from fuelTypesRouter
    // Fuel price endpoints already registered as /api/fuel-types above
    log("Fuel types router registered");
    
    // Add fuel price endpoints
    log("Registering fuel price API endpoints...");
    
    // Note: GET /api/fuel-types is now handled by the fuelTypesRouter
    
    // Get fuel price history
    // This route is redundant, as the same functionality exists in the fuelTypesRouter
    // Keeping it for backward compatibility
    app.get("/api/fuel-prices/history", async (_req, res) => {
      try {
        const history = await getFuelPriceHistory();
        res.json(history);
      } catch (error: any) {
        console.error("Error fetching fuel price history:", error);
        res.status(500).json({ error: "Failed to fetch fuel price history" });
      }
    });
    
    // Trigger manual update of fuel prices (requires admin)
    // This route is redundant, as the same functionality exists in the fuelTypesRouter
    // Keeping it for backward compatibility
    app.post("/api/fuel-prices/update", async (req, res) => {
      try {
        // TODO: Add proper authentication check here
        const result = await triggerFuelPriceUpdate();
        if (result) {
          res.json({ success: true, message: "Fuel prices updated successfully" });
        } else {
          res.status(500).json({ 
            success: false, 
            error: "Failed to update fuel prices" 
          });
        }
      } catch (error: any) {
        console.error("Error updating fuel prices:", error);
        res.status(500).json({ 
          success: false, 
          error: "Error updating fuel prices", 
          details: error.message 
        });
      }
    });
    
    // Endpoint to manually trigger WAM scraper (requires admin)
    // This route is redundant, as the same functionality exists in the fuelTypesRouter
    // Keeping it for backward compatibility
    app.post("/api/fuel-prices/wam-scrape", async (req, res) => {
      try {
        // TODO: Add proper authentication check here
        console.log("Manually triggering WAM fuel price scraper");
        const result = await runWamFuelPriceScraper();
        
        if (result) {
          res.json({ 
            success: true, 
            message: "WAM fuel price scraper completed successfully. Prices updated."
          });
        } else {
          res.status(500).json({ 
            success: false, 
            error: "WAM fuel price scraper failed" 
          });
        }
      } catch (error: any) {
        console.error("Error running WAM fuel price scraper:", error);
        res.status(500).json({ 
          success: false, 
          error: "Error running WAM fuel price scraper", 
          details: error.message 
        });
      }
    });
    
    log("Fuel price API endpoints registered");

    // Add performance snapshot routes
    log("Registering performance snapshot routes...");
    app.use(performanceRouter);
    log("Performance snapshot routes registered");

    // Add employee routes
    app.get("/api/employees", async (_req, res) => {
      try {
        console.log("Fetching all employees");
        const employees = await storage.getAllEmployees();
        console.log(`Found ${employees.length} employees`);
        res.json(employees);
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
      }
    });
    
    // Add endpoint to search for employee by email
    app.get("/api/employee/search", async (req, res) => {
      try {
        const { email, employee_id } = req.query;
        
        if (!email && !employee_id) {
          return res.status(400).json({ error: "Either email or employee_id parameter is required" });
        }
        
        let employee = null;
        
        // Search by email if provided
        if (email) {
          console.log(`Searching for employee with email: ${email}`);
          employee = await storage.findEmployeeByEmail(email.toString());
          
          if (!employee) {
            console.log(`No employee found with email: ${email}`);
          }
        }
        
        // If no employee found by email and employee_id is provided, try that
        if (!employee && employee_id) {
          console.log(`Searching for employee with ID: ${employee_id}`);
          employee = await storage.findEmployeeByEmployeeId(employee_id.toString());
          
          if (!employee) {
            console.log(`No employee found with ID: ${employee_id}`);
          }
        }
        
        // If still no employee found, return 404
        if (!employee) {
          return res.status(404).json({ 
            error: "Employee not found",
            message: "No employee found with the provided email or ID"
          });
        }
        
        console.log(`Found employee: ${employee.employee_name} (ID: ${employee.employee_id})`);
        console.log(`Employee details for booking - ID: ${employee.id}, employee_id: ${employee.employee_id} (type: ${typeof employee.employee_id})`);
        
        // Find the associated user if any
        let associatedUser = null;
        try {
          associatedUser = await storage.mapEmployeeToUser(employee);
          if (associatedUser) {
            console.log(`Found associated user: ${associatedUser.user_name}`);
          } else {
            console.log(`No associated user found for employee ${employee.employee_name}`);
          }
        } catch (err) {
          console.warn("Error getting associated user:", err);
          // Continue without user data
        }
        
        // Return with both snake_case and camelCase for compatibility
        return res.json({
          id: employee.id,
          employee_id: employee.employee_id,  // Add snake_case version for direct use
          employeeId: employee.employee_id,   // Keep camelCase for backward compatibility 
          employeeName: employee.employee_name,
          emailId: employee.email_id,
          department: employee.department,
          designation: employee.designation,
          mobileNumber: employee.mobile_number,
          region: employee.region,
          hierarchy_level: employee.hierarchy_level,
          user: associatedUser ? {
            id: associatedUser.id,
            user_name: associatedUser.user_name,
            user_type: associatedUser.user_type
          } : null
        });
      } catch (error: any) {
        console.error("Error searching for employee:", error);
        res.status(500).json({ error: "Failed to search for employee", details: error.message });
      }
    });

    app.post("/api/employees", async (req, res) => {
      try {
        console.log("Creating employee with data:", req.body);
        const result = insertEmployeeSchema.safeParse(req.body);

        if (!result.success) {
          console.error("Invalid employee data:", result.error.issues);
          return res.status(400).json({
            error: "Invalid employee data",
            details: result.error.issues
          });
        }

        // Create employee data object (without hashing password for now)
        // We'll only hash if a password is provided
        let employeeData = { ...result.data };
        
        // Only hash password if it exists in the request
        if (result.data.password) {
          const hashedPassword = await bcrypt.hash(result.data.password, 10);
          employeeData.password = hashedPassword;
        }

        const employee = await storage.createEmployee(employeeData);
        console.log("Created employee:", employee);

        // Remove password from response
        const { password, ...employeeResponse } = employee;
        res.status(201).json(employeeResponse);
      } catch (error: any) {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: "Failed to create employee" });
      }
    });


    app.get("/api/employees/validate/:employeeId", async (req, res) => {
      try {
        const { employeeId } = req.params;
        console.log("Validating employee ID:", employeeId);

        if (!employeeId) {
          return res.status(400).json({
            error: "Employee ID is required"
          });
        }

        const employee = await storage.findEmployeeByEmployeeId(employeeId);
        console.log("Database response:", employee);

        if (!employee) {
          return res.status(404).json({
            error: "Employee not found",
            message: "No employee found with the provided ID"
          });
        }

        // Find the associated user if any
        let associatedUser = null;
        try {
          associatedUser = await storage.mapEmployeeToUser(employee);
          if (associatedUser) {
            console.log(`Found associated user: ${associatedUser.user_name}`);
          } else {
            console.log(`No associated user found for employee ${employee.employee_name}`);
          }
        } catch (err) {
          console.warn("Error getting associated user:", err);
          // Continue without user data
        }
        
        // Return the response with the user information if available
        res.json({
          ...employee,
          user: associatedUser ? {
            id: associatedUser.id,
            user_name: associatedUser.user_name,
            user_type: associatedUser.user_type
          } : null
        });

      } catch (error: any) {
        console.error("Error validating employee:", error);
        res.status(500).json({
          error: "Server error",
          message: error.message || "Failed to validate employee"
        });
      }
    });

    // Add these new endpoints after existing employee routes
    app.get("/api/employees/:id/details", async (req, res) => {
      try {
        const employeeId = parseInt(req.params.id);
        console.log("Fetching employee details for ID:", employeeId);

        // Get employee with their supervisor details
        const [employee] = await db
          .select({
            id: employees.id,
            employeeId: employees.employeeId,
            name: employees.employeeName,
            designation: employees.designation,
            supervisor: {
              id: sql<number>`supervisor.id`,
              name: sql<string>`supervisor.employee_name`,
              designation: sql<string>`supervisor.designation`
            }
          })
          .from(employees)
          .leftJoin(
            employees,
            'supervisor',
            eq(employees.supervisorId, sql`supervisor.id`)
          )
          .where(eq(employees.id, employeeId));

        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }

        console.log("Found employee details:", employee);
        res.json(employee);
      } catch (error: any) {
        console.error("Error fetching employee details:", error);
        res.status(500).json({ error: "Failed to fetch employee details" });
      }
    });

    app.get("/api/employees/:id/subordinates", async (req, res) => {
      try {
        const employeeId = parseInt(req.params.id);
        console.log("Fetching subordinates for employee ID:", employeeId);

        // Get all subordinates of the employee
        const subordinates = await db
          .select({
            id: employees.id,
            employeeId: employees.employeeId,
            name: employees.employeeName,
            designation: employees.designation,
            department: employees.department
          })
          .from(employees)
          .where(eq(employees.supervisorId, employeeId));

        console.log("Found subordinates:", subordinates);
        res.json(subordinates);
      } catch (error: any) {
        console.error("Error fetching subordinates:", error);
        res.status(500).json({ error: "Failed to fetch subordinates" });
      }
    });

    app.get("/api/employees/:id/bookings", async (req, res) => {
      try {
        const employeeId = parseInt(req.params.id);
        console.log("Fetching bookings for employee ID:", employeeId);

        // Get all bookings for the employee
        const employeeBookings = await db
          .select({
            id: bookings.id,
            referenceNo: bookings.referenceNo,
            purpose: bookings.purpose,
            status: bookings.status,
            pickupTime: bookings.pickupTime,
            dropoffTime: bookings.dropoffTime,
            employee: {
              id: employees.id,
              name: employees.employeeName
            }
          })
          .from(bookings)
          .leftJoin(employees, eq(bookings.employeeId, employees.id))
          .where(eq(bookings.employeeId, employeeId));

        console.log("Found bookings:", employeeBookings);
        res.json(employeeBookings);
      } catch (error: any) {
        console.error("Error fetching employee bookings:", error);
        res.status(500).json({ error: "Failed to fetch employee bookings" });
      }
    });

    app.get("/api/employees/:id/team-bookings", async (req, res) => {
      try {
        const supervisorId = parseInt(req.params.id);
        console.log("Fetching team bookings for supervisor ID:", supervisorId);

        // Get all bookings for the supervisor's team
        const teamBookings = await db
          .select({
            id: bookings.id,
            referenceNo: bookings.referenceNo,
            purpose: bookings.purpose,
            status: bookings.status,
            employee: {
              id: employees.id,
              name: employees.employeeName,
              designation: employees.designation
            }
          })
          .from(bookings)
          .leftJoin(employees, eq(bookings.employeeId, employees.id))
          .where(eq(employees.supervisorId, supervisorId));

        console.log("Found team bookings:", teamBookings);
        res.json(teamBookings);
      } catch (error: any) {
        console.error("Error fetching team bookings:", error);
        res.status(500).json({ error: "Failed to fetch team bookings" });
      }
    });

    // Add user management routes
    app.get("/api/users", async (_req, res) => {
      try {
        console.log("Fetching all users");
        const users = await storage.getAllUsers();

        // Remove sensitive information before sending
        const sanitizedUsers = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });

        res.json(sanitizedUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    });

    app.post("/api/users", async (req, res) => {
      try {
        console.log("Creating user with data:", req.body);
        const result = insertUserSchema.safeParse(req.body);

        if (!result.success) {
          console.error("Invalid user data:", result.error.issues);
          return res.status(400).json({
            error: "Invalid user data",
            details: result.error.issues
          });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(result.data.password, 10);

        // Create user with hashed password
        const userData = {
          ...result.data,
          password: hashedPassword,
          fullName: `${result.data.firstName} ${result.data.lastName}`
        };

        const user = await storage.createUser(userData);
        console.log("Created user:", user);

        // Remove password from response
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    });

    // Add this inside registerRoutes function, after the auth routes
    app.post("/api/auth/forgot-password", async (req, res) => {
      const { userName, emailId } = req.body;
      console.log('Password reset requested for:', { userName, emailId });

      try {
        // Validate input
        if (!userName || !emailId) {
          return res.status(400).json({
            error: "Missing required fields",
            details: "Both username and email are required"
          });
        }

        // Find user
        const user = await storage.findUserByEmail(emailId);
        if (!user || user.user_name !== userName) {
          return res.status(404).json({
            error: "User not found",
            details: "No matching user found with provided username and email"
          });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        try {
          // Update user with reset token
          await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
        } catch (dbError) {
          console.error('Database error updating reset token:', dbError);
          throw new Error('Failed to update reset token');
        }

        // Ensure APP_URL is available
        if (!process.env.APP_URL) {
          throw new Error('APP_URL environment variable is not configured');
        }

        // Create reset URL
        const baseUrl = process.env.APP_URL.replace(/\/$/, '');
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

        console.log('Reset URL generated:', {
          baseUrl,
          resetUrl,
          userName: user.user_name,
          email: user.email_id
        });

        // Setup email transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Send email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"TripXL Support" <support@tripxl.com>',
          to: emailId,
          subject: 'Reset Your TripXL Password',
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #004990; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
            <p>Hello ${user.full_name},</p>
            <p>You have requested to reset your password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #004990; border-radius: 4px; padding: 0;">
                    <a href="${resetUrl}" 
                       target="_blank"
                       style="color: white;
                              padding: 12px 24px;
                              text-decoration: none;
                              display: inline-block;
                              font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
            </div>
            <p style="background-color: #f5f5f5; padding: 15px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #004990; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
        </div>
      `,
          text: `
Reset Your Password

Hello ${user.full_name},

You have requested to reset your password. Click the link below:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.
      `
        });

        console.log('Password reset email sent successfully');

        res.json({
          message: "If an account exists with that email, you will receive password reset instructions."
        });

      } catch (error: any) {
        console.error('Error in forgot password flow:', error);
        res.status(500).json({
          error: "Failed to process password reset request",
          details: error.message
        });
      }
    });

    // Update the reset password endpoint
    app.post("/api/auth/reset-password", async (req, res) => {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({
            error: "Missing required fields"
          });
        }

        // Find user by reset token
        const user = await storage.findUserByResetToken(token);
        if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
          return res.status(400).json({
            error: "Invalid or expired reset token"
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and clear reset token
        await storage.updateUserPassword(user.id, hashedPassword);

        res.json({
          message: "Password reset successful"
        });

      } catch (error: any) {
        console.error('Error resetting password:', error);
        res.status(500).json({
          error: "Failed to reset password",
          details: error.message
        });
      }
    });

    // Add approval workflows routes
    app.use('/api/approval-workflows', approvalWorkflowsRouter);

    // Add employee routes for workflow management
    app.get("/api/employees/approvers", async (req, res) => {
      try {
        const { region, department, unit } = req.query;
        console.log("Fetching all employees");
        
        // Build the WHERE clause dynamically
        let whereClause = sql`(${employees.hierarchy_level} IN ('Level 1', 'Level 2') OR ${employees.employee_role} IN ('Approval Authority', 'Approving Authority')) AND ${employees.is_active} = true`;
        
        // Add region filter if provided
        if (region) {
          whereClause = sql`${whereClause} AND ${employees.region} = ${region}`;
        }
        
        // Add department filter if provided
        if (department) {
          whereClause = sql`${whereClause} AND ${employees.department} = ${department}`;
        }
        
        // Add unit filter if provided
        if (unit) {
          whereClause = sql`${whereClause} AND ${employees.unit} = ${unit}`;
        }
        
        // Get approvers based on filters
        const approvers = await db
          .select()
          .from(employees)
          .where(whereClause);
        
        console.log(`Found ${approvers.length} employees`);
        
        // For employees with "Approval Authority" or "Approving Authority" role, ensure they have Level 1 hierarchy
        const mappedApprovers = approvers.map(employee => {
          // If the employee has an approval role but no hierarchy level specified
          // Set their hierarchy level to Level 1 for workflow management purposes
          if ((employee.employee_role === "Approval Authority" || employee.employee_role === "Approving Authority") 
              && employee.hierarchy_level !== "Level 1") {
            console.log(`Setting employee ${employee.employee_name} with role ${employee.employee_role} to Level 1 hierarchy`);
            return { ...employee, hierarchy_level: "Level 1" };
          }
          return employee;
        });
        
        res.json(mappedApprovers);
      } catch (error: any) {
        console.error("Error fetching approvers:", error);
        res.status(500).json({ error: "Failed to fetch approvers" });
      }
    });

    // Add workflow management routes
    app.post("/api/workflows", async (req, res) => {
      try {
        const result = insertApprovalWorkflowSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid workflow data",
            details: result.error.issues
          });
        }

        const workflow = await storage.createWorkflow(result.data);
        res.status(201).json(workflow);
      } catch (error: any) {
        console.error("Error creating workflow:", error);
        res.status(500).json({ error: "Failed to create workflow" });
      }
    });

    app.get("/api/workflows", async (_req, res) => {
      try {
        const workflows = await storage.getWorkflows();
        res.json(workflows);
      } catch (error: any) {
        console.error("Error fetching workflows:", error);
        res.status(500).json({ error: "Failed to fetch workflows" });
      }
    });

    app.patch("/api/workflows/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid workflow ID" });
        }

        const result = insertApprovalWorkflowSchema.partial().safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid workflow data",
            details: result.error.issues
          });
        }

        const workflow = await storage.updateWorkflow(id, result.data);
        res.json(workflow);
      } catch (error: any) {
        console.error("Error updating workflow:", error);
        res.status(500).json({ error: "Failed to update workflow" });
      }
    });

    // Keep existing route registrations and error handlers
    app.get("/api/employees/:id/team-bookings", async (req, res) => {
      try {
        const supervisorId = parseInt(req.params.id);
        console.log("Fetching team bookings for supervisor ID:", supervisorId);

        // Get all bookings for the supervisor's team
        const teamBookings = await db
          .select({
            id: bookings.id,
            referenceNo: bookings.referenceNo,
            purpose: bookings.purpose,
            status: bookings.status,
            employee: {
              id: employees.id,
              name: employees.employeeName,
              designation: employees.designation
            }
          })
          .from(bookings)
          .leftJoin(employees, eq(bookings.employeeId, employees.id))
          .where(eq(employees.supervisorId, supervisorId));

        console.log("Found team bookings:", teamBookings);
        res.json(teamBookings);
      } catch (error: any) {
        console.error("Error fetching team bookings:", error);
        res.status(500).json({ error: "Failed to fetch team bookings" });
      }
    });

    // Add user management routes
    app.get("/api/users", async (_req, res) => {
      try {
        console.log("Fetching all users");
        const users = await storage.getAllUsers();

        // Remove sensitive information before sending
        const sanitizedUsers = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });

        res.json(sanitizedUsers);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    });

    app.post("/api/users", async (req, res) => {
      try {
        console.log("Creating user with data:", req.body);
        const result = insertUserSchema.safeParse(req.body);

        if (!result.success) {
          console.error("Invalid user data:", result.error.issues);
          return res.status(400).json({
            error: "Invalid user data",
            details: result.error.issues
          });
        }

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(result.data.password, 10);

        // Create user with hashed password
        const userData = {
          ...result.data,
          password: hashedPassword,
          fullName: `${result.data.firstName} ${result.data.lastName}`
        };

        const user = await storage.createUser(userData);
        console.log("Created user:", user);

        // Remove password from response
        const { password, ...userResponse } = user;
        res.status(201).json(userResponse);
      } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
      }
    });

    // Add this inside registerRoutes function, after the auth routes
    app.post("/api/auth/forgot-password", async (req, res) => {
      const { userName, emailId } = req.body;
      console.log('Password reset requested for:', { userName, emailId });

      try {
        // Validate input
        if (!userName || !emailId) {
          return res.status(400).json({
            error: "Missing required fields",
            details: "Both username and email are required"
          });
        }

        // Find user
        const user = await storage.findUserByEmail(emailId);
        if (!user || user.user_name !== userName) {
          return res.status(404).json({
            error: "User not found",
            details: "No matching user found with provided username and email"
          });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        try {
          // Update user with reset token
          await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
        } catch (dbError) {
          console.error('Database error updating reset token:', dbError);
          throw new Error('Failed to update reset token');
        }

        // Ensure APP_URL is available
        if (!process.env.APP_URL) {
          throw new Error('APP_URL environment variable is not configured');
        }

        // Create reset URL
        const baseUrl = process.env.APP_URL.replace(/\/$/, '');
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

        console.log('Reset URL generated:', {
          baseUrl,
          resetUrl,
          userName: user.user_name,
          email: user.email_id
        });

        // Setup email transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Send email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"TripXL Support" <support@tripxl.com>',
          to: emailId,
          subject: 'Reset Your TripXL Password',
          html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #004990; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Reset Your Password</h1>
          </div>
          <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
            <p>Hello ${user.full_name},</p>
            <p>You have requested to reset your password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #004990; border-radius: 4px; padding: 0;">
                    <a href="${resetUrl}" 
                       target="_blank"
                       style="color: white;
                              padding: 12px 24px;
                              text-decoration: none;
                              display: inline-block;
                              font-weight: bold;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
            </div>
            <p style="background-color: #f5f5f5; padding: 15px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #004990; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
          </div>
        </div>
      `,
          text: `
Reset Your Password

Hello ${user.full_name},

You have requested to reset your password. Click the link below:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.
      `
        });

        console.log('Password reset email sent successfully');

        res.json({
          message: "If an account exists with that email, you will receive password reset instructions."
        });

      } catch (error: any) {
        console.error('Error in forgot password flow:', error);
        res.status(500).json({
          error: "Failed to process password reset request",
          details: error.message
        });
      }
    });

    // Update the reset password endpoint
    app.post("/api/auth/reset-password", async (req, res) => {
      try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
          return res.status(400).json({
            error: "Missing required fields"
          });
        }

        // Find user by reset token
        const user = await storage.findUserByResetToken(token);
        if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
          return res.status(400).json({
            error: "Invalid or expired reset token"
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and clear reset token
        await storage.updateUserPassword(user.id, hashedPassword);

        res.json({
          message: "Password reset successful"
        });

      } catch (error: any) {
        console.error('Error resetting password:', error);
        res.status(500).json({
          error: "Failed to reset password",
          details: error.message
        });
      }
    });

    log("All routes registered successfully");
    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}