/**
 * Booking Debug Utility
 * 
 * This utility provides enhanced debugging functions for booking operations.
 * It helps isolate and debug issues in the booking creation and update process.
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware for logging booking-related requests
 */
export const bookingDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to booking-related endpoints
  if (req.url.includes('/api/bookings')) {
    const requestId = Date.now().toString();
    console.log(`[BOOKING-REQ-${requestId}] ${req.method} ${req.url}`);
    
    if (req.method === 'POST' && req.body) {
      // For POST requests (creating bookings), analyze the payload
      console.log(`[BOOKING-REQ-${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
      
      // Check if employee_id is present and valid
      if (req.body.employee_id) {
        console.log(`[BOOKING-REQ-${requestId}] employee_id: ${req.body.employee_id} (${typeof req.body.employee_id})`);
        
        // Check if it's a valid number
        if (isNaN(Number(req.body.employee_id))) {
          console.warn(`[BOOKING-REQ-${requestId}] WARNING: employee_id is not a valid number`);
        }
      } else {
        console.warn(`[BOOKING-REQ-${requestId}] WARNING: employee_id is missing from request body`);
      }
    }
    
    // Capture the original response methods to add logging
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Intercept response.send to log responses
    res.send = function(body: any): Response {
      console.log(`[BOOKING-RES-${requestId}] Status: ${res.statusCode}`);
      return originalSend.call(this, body);
    };
    
    // Intercept response.json to log JSON responses
    res.json = function(body: any): Response {
      console.log(`[BOOKING-RES-${requestId}] Status: ${res.statusCode}, Response:`, typeof body === 'object' ? JSON.stringify(body, null, 2) : body);
      return originalJson.call(this, body);
    };
  }
  
  next();
};

/**
 * Logs a detailed diagnostic for booking operations with a unique ID for tracing
 */
export function logBookingDbOperation(id: string, message: string) {
  console.log(`[BOOKING-DEBUG-${id}] ${message}`);
}

/**
 * Logs SQL query for debugging purposes
 */
export function logSqlQuery(id: string, query: string, params?: any) {
  console.log(`[BOOKING-SQL-${id}] Query: ${query}`);
  if (params) {
    console.log(`[BOOKING-SQL-${id}] Params:`, params);
  }
}

/**
 * Analyzes booking data for potential issues before database insertion
 */
export function analyzeBookingData(id: string, bookingData: any) {
  console.log(`[BOOKING-ANALYZE-${id}] ===== BOOKING DATA ANALYSIS =====`);
  
  // Check for required fields
  const requiredFields = ['employee_id', 'booking_type', 'purpose', 'priority', 'pickup_location', 'dropoff_location'];
  for (const field of requiredFields) {
    console.log(`[BOOKING-ANALYZE-${id}] ${field}: ${bookingData[field] ? 'Present' : 'MISSING'}`);
    
    // Special checks for employee_id
    if (field === 'employee_id') {
      console.log(`[BOOKING-ANALYZE-${id}] employee_id details:`, 
        `Value: ${bookingData.employee_id}`,
        `Type: ${typeof bookingData.employee_id}`,
        `Is number: ${!isNaN(Number(bookingData.employee_id))}`
      );
    }
  }
  
  // Check location data structure
  if (bookingData.pickup_location) {
    console.log(`[BOOKING-ANALYZE-${id}] pickup_location structure:`, 
      `Has address: ${bookingData.pickup_location.address ? 'Yes' : 'No'}`,
      `Has coordinates: ${bookingData.pickup_location.coordinates ? 'Yes' : 'No'}`
    );
  }
  
  if (bookingData.dropoff_location) {
    console.log(`[BOOKING-ANALYZE-${id}] dropoff_location structure:`, 
      `Has address: ${bookingData.dropoff_location.address ? 'Yes' : 'No'}`,
      `Has coordinates: ${bookingData.dropoff_location.coordinates ? 'Yes' : 'No'}`
    );
  }
  
  console.log(`[BOOKING-ANALYZE-${id}] ===== END ANALYSIS =====`);
}