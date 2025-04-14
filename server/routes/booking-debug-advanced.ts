import { Router } from 'express';
import { verifyToken } from '../auth/token-service';
import { storage } from '../storage';
import { bookings } from '@shared/schema';

// Create a dedicated router for advanced booking debugging
const bookingDebugAdvancedRouter = Router();

// Test endpoint for booking creation - shows exactly what would be inserted without modifying the DB
bookingDebugAdvancedRouter.post("/test-create", async (req, res) => {
  console.log("[BOOKING-DEBUG-ADVANCED] Received test booking creation request");
  console.log("[BOOKING-DEBUG-ADVANCED] Request body:", JSON.stringify(req.body, null, 2));
  
  try {
    // Check auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("[BOOKING-DEBUG-ADVANCED] No authorization header");
      return res.status(401).json({ error: "No authorization token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("[BOOKING-DEBUG-ADVANCED] Token:", token.substring(0, 10) + "...");
    
    // Verify token
    try {
      const decoded = verifyToken(token);
      console.log("[BOOKING-DEBUG-ADVANCED] Decoded token:", decoded);
      
      // Check request body
      const { 
        employee_id, 
        booking_type, 
        purpose, 
        priority,
        pickup_location,
        dropoff_location,
        pickup_time,
        dropoff_time
      } = req.body;
      
      // Log each required field
      console.log("[BOOKING-DEBUG-ADVANCED] Field check:");
      console.log("- employee_id:", employee_id, typeof employee_id);
      console.log("- booking_type:", booking_type);
      console.log("- purpose:", purpose);
      console.log("- priority:", priority);
      console.log("- pickup_location:", pickup_location ? "Present" : "Missing", pickup_location);
      console.log("- dropoff_location:", dropoff_location ? "Present" : "Missing", dropoff_location);
      console.log("- pickup_time:", pickup_time);
      console.log("- dropoff_time:", dropoff_time);
      
      // Check location format
      if (pickup_location) {
        console.log("[BOOKING-DEBUG-ADVANCED] Pickup location format check:");
        console.log("- Has address:", !!pickup_location.address);
        console.log("- Has coordinates:", !!pickup_location.coordinates);
        if (pickup_location.coordinates) {
          console.log("- Coordinates type:", typeof pickup_location.coordinates);
          console.log("- Lat:", pickup_location.coordinates.lat, "Type:", typeof pickup_location.coordinates.lat);
          console.log("- Lng:", pickup_location.coordinates.lng, "Type:", typeof pickup_location.coordinates.lng);
        }
      }
      
      // Validate against schema requirements
      const missingFields = [];
      if (!employee_id) missingFields.push('employee_id');
      if (!booking_type) missingFields.push('booking_type');
      if (!purpose) missingFields.push('purpose');
      if (!priority) missingFields.push('priority');
      if (!pickup_location) missingFields.push('pickup_location');
      if (!dropoff_location) missingFields.push('dropoff_location');
      if (!pickup_time) missingFields.push('pickup_time');
      if (!dropoff_time) missingFields.push('dropoff_time');
      
      if (missingFields.length > 0) {
        console.log("[BOOKING-DEBUG-ADVANCED] Missing required fields:", missingFields);
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: missingFields 
        });
      }
      
      // Check if employee exists
      const employee = await storage.getEmployeeById(Number(employee_id));
      console.log("[BOOKING-DEBUG-ADVANCED] Employee found:", !!employee, employee);
      
      if (!employee) {
        return res.status(404).json({ 
          error: "Employee not found", 
          details: `No employee with ID ${employee_id}` 
        });
      }
      
      // Success - return what would be inserted without modifying the DB
      const now = new Date();
      const referenceNo = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const bookingData = {
        ...req.body,
        employee_id: Number(employee_id),
        reference_no: referenceNo,
        status: "new",
        created_at: now,
        updated_at: now
      };
      
      console.log("[BOOKING-DEBUG-ADVANCED] Book data that would be inserted:", bookingData);
      
      return res.status(200).json({
        success: true,
        message: "Booking validation successful - would insert this data",
        data: bookingData
      });
      
    } catch (tokenError) {
      console.log("[BOOKING-DEBUG-ADVANCED] Token verification failed:", tokenError);
      return res.status(401).json({ error: "Invalid token", details: tokenError.message });
    }
    
  } catch (error) {
    console.error("[BOOKING-DEBUG-ADVANCED] Error:", error);
    return res.status(500).json({ 
      error: "Server error during booking validation", 
      details: error.message 
    });
  }
});

// Test endpoint to get employee by ID
bookingDebugAdvancedRouter.get("/employee/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`[BOOKING-DEBUG-ADVANCED] Looking up employee with ID: ${id}`);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid employee ID format" });
    }
    
    const employee = await storage.getEmployeeById(id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    return res.json({ employee });
  } catch (error) {
    console.error("[BOOKING-DEBUG-ADVANCED] Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Test endpoint to get booking schema definition
bookingDebugAdvancedRouter.get("/schema", (req, res) => {
  try {
    // Get booking schema structure
    const schemaInfo = {
      name: bookings.name,
      columns: Object.keys(bookings.columns).map(columnName => {
        const column = bookings.columns[columnName];
        return {
          name: columnName,
          dataType: column.dataType,
          isNullable: !column.notNull,
          hasDefault: column.hasDefault,
          isPrimaryKey: column.isPrimaryKey
        };
      })
    };
    
    return res.json({
      schema: schemaInfo,
      requiredFields: [
        'employee_id', 
        'booking_type', 
        'purpose', 
        'priority',
        'pickup_location',
        'dropoff_location',
        'pickup_time',
        'dropoff_time'
      ]
    });
  } catch (error) {
    console.error("[BOOKING-DEBUG-ADVANCED] Error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

export { bookingDebugAdvancedRouter };