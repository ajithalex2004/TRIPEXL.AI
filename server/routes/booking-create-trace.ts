import { Request, Response } from 'express';
import { storage } from '../storage';
import * as schema from '../../shared/schema';
import { verifyToken } from '../auth/token-service';
import express from 'express';

// Create an Express router
const router = express.Router();

// Test endpoint to directly create a booking with detailed tracing
router.post('/create-test', async (req, res) => {
  console.log('🔍 BOOKING CREATION TEST - Starting booking creation test');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Step 1: Check authentication
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    let userEmail = null;
    
    console.log('🔑 Step 1: Checking authentication');
    if (!token) {
      console.log('❌ No authentication token provided');
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    try {
      const decoded = verifyToken(token) as { userId: number, email: string };
      userId = decoded.userId;
      userEmail = decoded.email;
      console.log(`✅ Token verified - User ID: ${userId}, Email: ${userEmail}`);
    } catch (err: any) {
      console.log(`❌ Token verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Invalid authentication token', details: err.message });
    }
    
    // Step 2: Verify required fields
    console.log('📋 Step 2: Verifying required fields');
    const requiredFields = [
      'employee_id', 'booking_type', 'purpose', 'priority',
      'pickup_location', 'dropoff_location', 'pickup_time', 'dropoff_time'
    ];
    
    const missingFields = requiredFields.filter(field => {
      return req.body[field] === undefined || req.body[field] === null;
    });
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }
    console.log('✅ All required fields are present');
    
    // Step 3: Verify location data
    console.log('🗺️ Step 3: Verifying location data');
    let locationErrors: string[] = [];
    
    // Check pickup location
    if (req.body.pickup_location) {
      if (!req.body.pickup_location.address) {
        locationErrors.push('pickup_location.address is missing');
      }
      if (!req.body.pickup_location.coordinates) {
        locationErrors.push('pickup_location.coordinates is missing');
      } else {
        if (typeof req.body.pickup_location.coordinates.lat !== 'number') {
          locationErrors.push('pickup_location.coordinates.lat must be a number');
        }
        if (typeof req.body.pickup_location.coordinates.lng !== 'number') {
          locationErrors.push('pickup_location.coordinates.lng must be a number');
        }
      }
    } else {
      locationErrors.push('pickup_location is missing');
    }
    
    // Check dropoff location
    if (req.body.dropoff_location) {
      if (!req.body.dropoff_location.address) {
        locationErrors.push('dropoff_location.address is missing');
      }
      if (!req.body.dropoff_location.coordinates) {
        locationErrors.push('dropoff_location.coordinates is missing');
      } else {
        if (typeof req.body.dropoff_location.coordinates.lat !== 'number') {
          locationErrors.push('dropoff_location.coordinates.lat must be a number');
        }
        if (typeof req.body.dropoff_location.coordinates.lng !== 'number') {
          locationErrors.push('dropoff_location.coordinates.lng must be a number');
        }
      }
    } else {
      locationErrors.push('dropoff_location is missing');
    }
    
    if (locationErrors.length > 0) {
      console.log(`❌ Location data errors: ${locationErrors.join(', ')}`);
      return res.status(400).json({ 
        error: 'Invalid location data',
        locationErrors
      });
    }
    console.log('✅ Location data is valid');
    
    // Step 4: Validate employee ID
    console.log('👤 Step 4: Validating employee ID');
    const employeeId = req.body.employee_id;
    console.log(`   Employee ID from request: ${employeeId} (${typeof employeeId})`);
    
    let employeeIdNum: number;
    
    // If employee ID is a string, try to convert to number
    if (typeof employeeId === 'string') {
      employeeIdNum = parseInt(employeeId.trim(), 10);
      if (isNaN(employeeIdNum)) {
        console.log(`❌ Invalid employee ID format: "${employeeId}" cannot be converted to a number`);
        return res.status(400).json({
          error: 'Invalid employee ID format',
          details: `"${employeeId}" cannot be converted to a number`
        });
      }
      console.log(`   Converted string employee ID "${employeeId}" to number: ${employeeIdNum}`);
    } else if (typeof employeeId === 'number') {
      employeeIdNum = employeeId;
      console.log(`   Employee ID is already a number: ${employeeIdNum}`);
    } else {
      console.log(`❌ Invalid employee ID type: ${typeof employeeId}`);
      return res.status(400).json({
        error: 'Invalid employee ID type',
        details: `Expected string or number, got ${typeof employeeId}`
      });
    }
    
    // Check if employee exists
    console.log(`   Looking up employee with ID: ${employeeIdNum}`);
    let employee = await storage.getEmployeeById(employeeIdNum);
    
    // If not found by internal ID, try by display ID
    if (!employee) {
      console.log(`   No employee found with internal ID ${employeeIdNum}, trying display ID lookup`);
      employee = await storage.findEmployeeByEmployeeId(employeeId.toString());
    }
    
    if (!employee) {
      console.log(`❌ No employee found with ID ${employeeId}`);
      return res.status(400).json({
        error: 'Employee not found',
        details: `No employee found with ID ${employeeId}`
      });
    }
    
    console.log(`✅ Employee found: ${employee.employee_name} (ID: ${employee.id}, Employee ID: ${employee.employee_id})`);
    
    // Step 5: Prepare booking data
    console.log('📝 Step 5: Preparing booking data');
    
    // Keep the pickup_location and dropoff_location as objects
    // We'll pass them directly to the database
    const pickupLocation = req.body.pickup_location;
    const dropoffLocation = req.body.dropoff_location;
    
    // Parse dates
    const pickupTime = new Date(req.body.pickup_time);
    const dropoffTime = new Date(req.body.dropoff_time);
    
    if (isNaN(pickupTime.getTime())) {
      console.log(`❌ Invalid pickup time format: ${req.body.pickup_time}`);
      return res.status(400).json({
        error: 'Invalid pickup time format',
        details: `"${req.body.pickup_time}" is not a valid date`
      });
    }
    
    if (isNaN(dropoffTime.getTime())) {
      console.log(`❌ Invalid dropoff time format: ${req.body.dropoff_time}`);
      return res.status(400).json({
        error: 'Invalid dropoff time format',
        details: `"${req.body.dropoff_time}" is not a valid date`
      });
    }
    
    console.log(`   Pickup time: ${pickupTime.toISOString()}`);
    console.log(`   Dropoff time: ${dropoffTime.toISOString()}`);
    
    // Create a booking reference number
    const referenceNo = `BK${Date.now().toString().substring(6)}`;
    console.log(`   Generated reference number: ${referenceNo}`);
    
    // Create the booking data object
    const bookingData = {
      booking_type: req.body.booking_type,
      purpose: req.body.purpose,
      priority: req.body.priority,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      pickup_time: pickupTime,
      dropoff_time: dropoffTime,
      reference_no: referenceNo,
      remarks: req.body.remarks || '',
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date(),
      employee_id: employee.id, // Using the internal ID, not the display ID
      // Optional fields
      cargo_type: req.body.cargo_type || null,
      num_boxes: req.body.num_boxes || null,
      weight: req.body.weight || null,
      box_size: req.body.box_size || null,
      trip_type: req.body.trip_type || null,
      num_passengers: req.body.num_passengers || null,
      with_driver: req.body.with_driver || false,
      booking_for_self: req.body.booking_for_self || true,
      passenger_details: req.body.passenger_details ? req.body.passenger_details : [],
      waypoints: req.body.waypoints || null
    };
    
    console.log('✅ Booking data prepared');
    console.log('📊 Booking data summary:');
    console.log(`   Type: ${bookingData.booking_type}`);
    console.log(`   Purpose: ${bookingData.purpose}`);
    console.log(`   Priority: ${bookingData.priority}`);
    console.log(`   Employee: ${employee.employee_name} (ID: ${employee.id})`);
    console.log(`   Status: ${bookingData.status}`);
    
    // Step 6: Create the booking in the database
    console.log('💾 Step 6: Creating booking in database');
    
    try {
      const booking = await storage.createBooking(bookingData);
      console.log(`✅ Booking created successfully with ID: ${booking.id}`);
      
      // Return the created booking
      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          id: booking.id,
          reference_no: booking.reference_no,
          status: booking.status,
          created_at: booking.created_at
        },
        details: 'Full booking data stored in database'
      });
    } catch (error: any) {
      console.log(`❌ Error creating booking: ${error.message}`);
      console.log(`   Error stack: ${error.stack}`);
      
      return res.status(500).json({
        error: 'Failed to create booking',
        details: error.message,
        bookingData: bookingData
      });
    }
  } catch (error: any) {
    console.log(`❌ Unexpected error: ${error.message}`);
    console.log(`   Error stack: ${error.stack}`);
    
    return res.status(500).json({
      error: 'Unexpected error occurred',
      details: error.message
    });
  }
});

console.log("Booking create trace router created");

// Export the router
export default router;