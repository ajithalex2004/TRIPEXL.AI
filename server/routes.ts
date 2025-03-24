import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema, employees, bookings } from "@shared/schema";
import { authService } from "./services/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import multer from "multer";
import vehicleTypeMasterRouter from "./routes/vehicle-type-master";
import { ecoRoutesRouter } from "./routes/eco-routes";
import { log } from "./vite";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import {insertVehicleGroupSchema, insertVehicleMasterSchema, insertEmployeeSchema} from "@shared/schema";

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

    // Initialize default user
    log("Initializing default user...");
    await authService.initializeDefaultUser();
    log("Default user initialized");

    // Add vehicle type master routes
    log("Registering vehicle type master routes...");
    app.use(vehicleTypeMasterRouter);
    log("Vehicle type master routes registered");

    // Add this route with the existing vehicle master routes
    app.get("/api/vehicle-type-master", async (_req, res) => {
      try {
        console.log("Fetching all vehicle type master records");
        const vehicleTypes = await storage.getAllVehicleTypes();
        console.log("Retrieved vehicle type master records:", vehicleTypes);
        res.json(vehicleTypes);
      } catch (error: any) {
        console.error("Error fetching vehicle type master records:", error);
        res.status(500).json({ error: "Failed to fetch vehicle type master records" });
      }
    });


    // Auth routes
    log("Registering auth routes...");
    app.post("/api/login", async (req, res) => {
      const { emailId, password } = req.body;
      console.log('Login attempt initiated for:', emailId);

      try {
        // Input validation
        if (!emailId || !password) {
          return res.status(400).json({
            error: "Email and password are required"
          });
        }

        // Find user
        const user = await storage.findUserByEmail(emailId);
        if (!user) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Generate test hash for comparison
        const testHash = await bcrypt.hash('Admin@123', '$2a$10$XHaK5MpJ8jyZK0k4z9kFn.2ZyLWXZE5qWnl3olBxVVXVrpnUxZmEi'.slice(0, 29));
        console.log('Test hash:', testHash);
        console.log('Stored hash:', user.password);

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isValidPassword);

        if (!isValidPassword) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }

        // Generate token
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.emailId,
            userType: user.userType
          },
          process.env.JWT_SECRET || 'dev-secret-key',
          { expiresIn: '24h' }
        );

        // Update last login
        await storage.updateUserLastLogin(user.id);

        // Send response
        console.log('Login successful for:', emailId);
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

        // Generate token for immediate login
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email_id,
            userType: user.user_type
          },
          process.env.JWT_SECRET || 'dev-secret-key',
          { expiresIn: '24h' }
        );

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

    // Update the booking creation route
    app.post("/api/bookings", async (req, res) => {
      console.log("Received booking request:", JSON.stringify(req.body, null, 2));

      try {
        const result = insertBookingSchema.safeParse(req.body);

        if (!result.success) {
          console.error("Validation errors:", result.error.issues);
          return res.status(400).json({
            error: "Invalid booking data",
            details: result.error.issues
          });
        }

        // Determine initial status based on priority
        const isHighPriority = ["Critical", "Emergency", "High"].includes(result.data.priority);
        const initialStatus = isHighPriority ? "approved" : "new";

        // Prepare booking data
        const bookingData = {
          ...result.data,
          referenceNo: result.data.referenceNo || `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status: initialStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        console.log("Creating booking with data:", JSON.stringify(bookingData, null, 2));

        // Create the booking
        const booking = await storage.createBooking(bookingData);
        console.log("Successfully created booking:", JSON.stringify(booking, null, 2));

        // Calculate and update metadata
        const totalDistance = calculateTotalDistance(booking.pickupLocation, booking.dropoffLocation);
        const estimatedCost = calculateEstimatedCost(booking);
        const co2Emissions = calculateCO2Emissions(booking);

        console.log("Calculated metadata:", { totalDistance, estimatedCost, co2Emissions });

        // Update booking with metadata
        const updatedBooking = await storage.updateBookingMetadata(booking.id, {
          totalDistance,
          estimatedCost,
          co2Emissions
        });

        res.status(201).json(updatedBooking);
      } catch (error: any) {
        console.error("Error creating booking:", error);
        res.status(500).json({
          error: "Failed to create booking",
          details: error.message
        });
      }
    });

    // Helper functions for calculating booking metadata
    function calculateTotalDistance(pickup: any, dropoff: any): number {
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
    }

    function calculateEstimatedCost(booking: any): number {
      // Basic cost calculation
      const baseRate = 2.5; // Base rate per km
      const distance = calculateTotalDistance(booking.pickupLocation, booking.dropoffLocation);
      let estimatedCost = distance * baseRate;

      // Add surcharges based on booking type and priority
      if (booking.bookingType === "ambulance") estimatedCost *= 1.5;
      if (booking.priority === "CRITICAL" || booking.priority === "EMERGENCY") estimatedCost *= 1.3;

      return parseFloat(estimatedCost.toFixed(2));
    }

    function calculateCO2Emissions(booking: any): number {
      // Average CO2 emissions calculation (in kg)
      const distance = calculateTotalDistance(booking.pickupLocation, booking.dropoffLocation);
      const avgEmissionRate = 0.12; // kg CO2 per km (average)
      return parseFloat((distance * avgEmissionRate).toFixed(2));
    }

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
        if (!user || !user.employeeId) {
          return res.status(404).json({ error: "Employee not found" });
        }

        // Get employee details
        const employee = await storage.findEmployeeByIdAndEmail(user.employeeId, user.email);
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }

        // Set strong caching headers
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
        res.json({
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email
        });
      } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: "Failed to fetch employee information" });
      }
    });

    // Vehicle Group routes
    app.get("/api/vehicle-groups", async (_req, res) => {
      try {
        console.log("Fetching all vehicle groups");
        const groups = await storage.getAllVehicleGroups();
        console.log("Retrieved vehicle groups:", groups);
        res.json(groups);
      } catch (error: any) {
        console.error("Error fetching vehicle groups:", error);
        res.status(500).json({ error: "Failed to fetch vehicle groups" });
      }
    });

    app.get("/api/vehicle-groups/export", async (_req, res) => {
      try {
        const groups = await storage.getAllVehicleGroups();

        // Transform data for Excel export (include only mandatory fields)
        const exportData = groups.map(group => ({
          'Group Code': group.groupCode,
          'Name': group.name,
          'Region': group.region,
          'Type': group.type,
          'Department': group.department,
          'Status': group.isActive ? 'Active' : 'Inactive',
          'Created Date': new Date(group.createdAt).toLocaleDateString(),
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Vehicle Groups");

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=vehicle-groups.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buf);
      } catch (error: any) {
        console.error("Error exporting vehicle groups:", error);
        res.status(500).json({ error: "Failed to export vehicle groups" });
      }
    });

    // New route for importing Excel file
    app.post("/api/vehicle-groups/import", upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Read Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const results = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        for (const row of data) {
          try {
            const vehicleGroup = {
              groupCode: row['Group Code'],
              name: row['Name'],
              region: row['Region'],
              type: row['Type'],
              department: row['Department'],
            };

            // Validate data using schema
            const validationResult = insertVehicleGroupSchema.safeParse(vehicleGroup);

            if (validationResult.success) {
              await storage.createVehicleGroup(validationResult.data);
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
          results,
        });
      } catch (error: any) {
        console.error("Error importing vehicle groups:", error);
        res.status(500).json({ error: "Failed to import vehicle groups" });
      }
    });

    app.post("/api/vehicle-groups", async (req, res) => {
      console.log("Creating vehicle group with data:", req.body);
      const result = insertVehicleGroupSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Invalid vehicle group data:", result.error.issues);
        return res.status(400).json({
          error: "Invalid vehicle group data",
          details: result.error.issues
        });
      }

      try {
        const group = await storage.createVehicleGroup(result.data);
        console.log("Created vehicle group:", group);
        res.status(201).json(group);
      } catch (error: any) {
        console.error("Error creating vehicle group:", error);
        res.status(500).json({ error: "Failed to create vehicle group" });
      }
    });

    app.patch("/api/vehicle-groups/:id", async (req, res) => {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      try {
        const group = await storage.getVehicleGroup(id);
        if (!group) {
          return res.status(404).json({ error: "Vehicle group not found" });
        }

        const result = insertVehicleGroupSchema.partial().safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid update data",
            details: result.error.issues
          });
        }

        const updatedGroup = await storage.updateVehicleGroup(id, result.data);
        res.json(updatedGroup);
      } catch (error: any) {
        console.error("Error updating vehicle group:", error);
        res.status(500).json({ error: "Failed to update vehicle group" });
      }
    });

    // Add this new endpoint after the other vehicle-groups routes
    app.get("/api/vehicle-groups/template", async (_req, res) => {
      try {
        // Create a template with mandatory fields
        const templateData = [{
          'Group Code': '',
          'Name': '',
          'Region': '',
          'Type': 'LIGHT VEHICLE or HEAVY VEHICLE',
          'Department': 'Operations, Logistics, Medical, Administration, Maintenance, or Security'
        }];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Add column widths
        const colWidths = [
          { wch: 15 }, // Group Code
          { wch: 20 }, // Name
          { wch: 15 }, // Region
          { wch: 25 }, // Type
          { wch: 40 }, // Department
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Template");

        // Generate buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=vehicle-groups-template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.send(buf);
      } catch (error: any) {
        console.error("Error generating template:", error);
        res.status(500).json({ error: "Failed to generate template" });
      }
    });

    // Add eco-routes router
    log("Registering eco-routes...");
    app.use(ecoRoutesRouter);
    log("Eco-routes registered");

    // Add this new endpoint to handle employee data
    app.get("/api/employees", async (_req, res) => {
      try {
        console.log("Fetching all employees");
        const employees = await storage.getAllEmployees();
        console.log("Retrieved employees:", employees);
        res.json(employees);
      } catch (error: any) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
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

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(result.data.password, 10);

        // Create employee with hashed password
        const employeeData = {
          ...result.data,
          password: hashedPassword
        };

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

    // Add after other employee routes
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

        res.json(employee);

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
            details: "No matching user found with provided usernameand email"
          });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Update user with reset token
        await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);

        // Create reset URL with full host information
        let appHost = req.get('host');
        // If we're behind a proxy, try to get the actual host
        if (req.headers['x-forwarded-host']) {
          appHost = req.headers['x-forwarded-host'] as string;
        }
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const resetUrl = `${protocol}://${appHost}/auth/reset-password?token=${resetToken}`;

        console.log('Generated reset URL details:', {
          protocol,
          host: appHost,
          fullUrl: resetUrl
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

        // Send email with simple, reliable template
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"TripXL Support" <support@tripxl.com>',
          to: emailId,
          subject: 'Reset Your TripXL Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #004990; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0;">Reset Your Password</h1>
              </div>
              <div style="background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e0e0e0;">
                <p style="margin-bottom: 20px;">Hello ${user.full_name},</p>
                <p style="margin-bottom: 20px;">You have requested to reset your password. Click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background-color: #004990;
                            color: white;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 4px;
                            font-weight: bold;
                            display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <div style="background-color: #f5f5f5; padding: 15px; margin-top: 20px; border-radius: 4px;">
                  <p style="margin: 0;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #004990; word-break: break-all;">${resetUrl}</a>
                  </p>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
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

        console.log('Password reset email sent successfully to:', emailId);

        res.json({
          message: "If an account exists with that email, you will receive password reset instructions."
        });

      } catch (error: any) {
        console.error('Error sending password reset email:', error);
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

    // Vehicle Master routes
    app.get("/api/vehicle-master", async (_req, res) => {
      try {
        console.log("Fetching all vehicle master records");
        const vehicles = await storage.getAllVehicleMaster();
        console.log("Retrieved vehicle master records:", vehicles);
        res.json(vehicles);
      } catch (error: any) {
        console.error("Error fetching vehicle master records:", error);
        res.status(500).json({ error: "Failed to fetch vehicle master records" });
      }
    });

    app.get("/api/vehicle-master/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        console.log("Fetching vehicle master record with ID:", id);
        const vehicle = await storage.getVehicleMaster(id);
        if (!vehicle) {
          console.log("Vehicle master record not found with ID:", id);
          return res.status(404).json({ message: "Vehicle master record not found" });
        }
        console.log("Retrieved vehicle master record:", vehicle);
        res.json(vehicle);
      } catch (error: any) {
        console.error("Error fetching vehicle master record:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/vehicle-master", async (req, res) => {
      try {
        console.log("Creating vehicle master record with data:", req.body);
        const result = insertVehicleMasterSchema.safeParse(req.body);
        if (!result.success) {
          console.error("Invalid vehicle master data:", result.error.issues);
          return res.status(40).json({
            error: "Invalid vehicle master data",
            details: result.error.issues
          });
        }

        const vehicle = await storage.createVehicleMaster(result.data);
        console.log("Created vehicle master record:", vehicle);
        res.status(201).json(vehicle);
      } catch (error: any) {
        console.error("Error creating vehicle master record:", error);
        res.status(400).json({ message: error.message });
      }
    });

    app.patch("/api/vehicle-master/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = insertVehicleMasterSchema.partial().safeParse(req.body);

        if (!result.success) {
          return res.status(400).json({
            error: "Invalid vehicle master data",
            details: result.error.issues
          });
        }

        const updatedVehicle = await storage.updateVehicleMaster(id, result.data);
        res.json(updatedVehicle);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    });

    // Add this new endpoint after the other vehicle-groups routes
    app.get("/api/fuel-prices", (_req, res) => {
      // These would typically come from a database or external API
      // Using static values for demonstration
      const currentPrices = {
        petrol: 3.15,
        diesel: 2.95,
        electric: 0.50, // Cost per kWh
        hybrid: 3.00,
        cng: 2.25,
        lpg: 2.45
      };

      res.json(currentPrices);
    });

    log("All routes registered successfully");
    return httpServer;
  } catch (error: any) {
    log(`Error during route registration: ${error.message}`);
    throw error;
  }
}