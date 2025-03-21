import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema, insertVehicleGroupSchema, insertVehicleMasterSchema, insertEmployeeSchema } from "@shared/schema";
import { authService } from "./services/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import multer from "multer";
import vehicleTypeMasterRouter from "./routes/vehicle-type-master";
import { ecoRoutesRouter } from "./routes/eco-routes"; // Add this import
import { log } from "./vite";

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

        // Temporarily skip verification check
        // if (!user.isVerified) {
        //   console.log('User not verified:', email);
        //   return res.status(401).json({ error: "Please verify your account first" });
        // }

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
        res.json({ token, user, employee });
      } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Server error during login" }); 
      }
    });
    log("Auth routes registered");

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

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon/2) * Math.sin(dLon/2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

    // Add this endpoint after other routes
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
          return res.status(400).json({ 
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

    log("All routes registered successfully");
    return httpServer;
  } catch (error: any) {
    log(`Error during route registration: ${error.message}`);
    throw error;
  }
}