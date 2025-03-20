import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema, insertVehicleGroupSchema } from "@shared/schema";
import { authService } from "./services/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import multer from "multer";
import vehicleTypeMasterRouter from "./routes/vehicle-type-master";

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
  const httpServer = createServer(app);

  // Initialize default user
  await authService.initializeDefaultUser();

  // Add vehicle type master routes
  app.use(vehicleTypeMasterRouter);

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

  return httpServer;
}