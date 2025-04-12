import { Router, Request, Response } from 'express';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const bookingDebugTraceRouter = Router();

// This route will attempt to insert a bare-minimum booking record
// to identify any issues with the database schema, constraints or validation
bookingDebugTraceRouter.post('/insert-minimal-booking', async (req: Request, res: Response) => {
  const debugId = Date.now().toString();
  console.log(`[BOOKING-DEBUG-${debugId}] Attempting to insert minimal booking`);

  // Verify auth token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as { userId: number, email: string };
    console.log(`[BOOKING-DEBUG-${debugId}] Request from authenticated user: ${user.email}`);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    // Get a valid employee_id from the database
    console.log(`[BOOKING-DEBUG-${debugId}] Fetching first available employee`);
    const employees = await db.select().from(schema.employees).limit(1);
    
    if (employees.length === 0) {
      return res.status(500).json({ 
        error: "No employees found in database",
        message: "Cannot create test booking without employee records" 
      });
    }

    // Use the employee's internal ID for the foreign key
    const employeeId = employees[0].id;
    console.log(`[BOOKING-DEBUG-${debugId}] Using employee ID ${employeeId}`);

    // Create minimal booking data
    const minimalBooking = {
      employee_id: employeeId,
      booking_type: "passenger",
      purpose: "general",
      priority: "Normal",
      pickup_location: {
        address: "Test Address 1",
        coordinates: { lat: 25.1234, lng: 55.1234 }
      },
      pickup_latitude: 25.1234,
      pickup_longitude: 55.1234,
      dropoff_location: {
        address: "Test Address 2",
        coordinates: { lat: 25.5678, lng: 55.5678 }
      },
      dropoff_latitude: 25.5678,
      dropoff_longitude: 55.5678,
      pickup_time: new Date(),
      dropoff_time: new Date(Date.now() + 3600000), // 1 hour later
      reference_no: `DEBUG-${debugId}`,
      status: "new",
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log(`[BOOKING-DEBUG-${debugId}] Inserting minimal booking:`, JSON.stringify(minimalBooking, null, 2));

    try {
      // Attempt the insert
      const [booking] = await db
        .insert(schema.bookings)
        .values(minimalBooking)
        .returning();

      console.log(`[BOOKING-DEBUG-${debugId}] SUCCESS - Created booking:`, booking.id);
      
      return res.status(201).json({
        success: true,
        message: "Successfully created debug booking",
        booking
      });
    } catch (insertError) {
      console.error(`[BOOKING-DEBUG-${debugId}] INSERT ERROR:`, insertError);
      
      // Enhanced error reporting for database errors
      if (insertError.code) {
        console.error(`[BOOKING-DEBUG-${debugId}] SQL Error Code:`, insertError.code);
        console.error(`[BOOKING-DEBUG-${debugId}] SQL Error Detail:`, insertError.detail || "No details");
        console.error(`[BOOKING-DEBUG-${debugId}] SQL Error Constraint:`, insertError.constraint || "No constraint info");
      }
      
      return res.status(500).json({
        error: "Database insert failed",
        message: insertError.message,
        code: insertError.code,
        details: insertError.detail,
        constraint: insertError.constraint
      });
    }
  } catch (error) {
    console.error(`[BOOKING-DEBUG-${debugId}] ERROR:`, error);
    return res.status(500).json({
      error: "Error during debug process",
      message: error.message
    });
  }
});

// This endpoint will help test database connectivity
bookingDebugTraceRouter.get('/check-database', async (req: Request, res: Response) => {
  try {
    // Check if we can query the database
    const [dbResult] = await db.execute(sql`SELECT 1 as value`);
    
    // Check if we can access the employees table
    const employeeCount = await db.select({ count: sql`count(*)` }).from(schema.employees);
    
    // Check if we can access the bookings table
    const bookingCount = await db.select({ count: sql`count(*)` }).from(schema.bookings);
    
    return res.status(200).json({
      database_connected: true,
      employee_count: parseInt(employeeCount[0].count.toString()),
      booking_count: parseInt(bookingCount[0].count.toString())
    });
  } catch (error) {
    console.error("Database check error:", error);
    return res.status(500).json({
      database_connected: false,
      error: error.message
    });
  }
});

// Add database helper for examining bookings
bookingDebugTraceRouter.get('/last-bookings', async (req: Request, res: Response) => {
  try {
    // Get the most recent bookings
    const bookings = await db
      .select()
      .from(schema.bookings)
      .orderBy(sql`${schema.bookings.created_at} DESC`)
      .limit(5);
    
    return res.status(200).json({
      bookings_found: bookings.length,
      bookings
    });
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    return res.status(500).json({
      error: "Failed to fetch bookings",
      message: error.message
    });
  }
});

export { bookingDebugTraceRouter };