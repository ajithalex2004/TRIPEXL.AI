import { Request, Response } from 'express';
import { storage } from '../storage';
import * as schema from '../../shared/schema';
import { verifyToken } from '../auth/token-service';
import express from 'express';

// Create an Express router
const router = express.Router();

// Simple test endpoint to check authentication
router.get('/auth-status', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({
      authenticated: false,
      tokenPresent: false,
      message: 'No token provided'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    return res.json({
      authenticated: true,
      tokenPresent: true,
      decodedToken: {
        userId: decoded.userId,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat
      },
      tokenValidity: 'valid',
      message: 'Token is valid'
    });
  } catch (err: any) {
    return res.json({
      authenticated: false,
      tokenPresent: true,
      tokenValidity: 'invalid',
      error: err.message || 'Unknown token validation error',
      message: 'Invalid token'
    });
  }
});

// Test endpoint to check if booking payload is valid
router.post('/validate-payload', (req, res) => {
  console.log('Booking payload validation test');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Check for required fields
  const requiredFields = [
    'employee_id', 'booking_type', 'purpose', 'priority',
    'pickup_location', 'dropoff_location', 'pickup_time', 'dropoff_time'
  ];
  
  const missingFields = requiredFields.filter(field => {
    return req.body[field] === undefined || req.body[field] === null;
  });
  
  // Check location structures
  let locationErrors: string[] = [];
  
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
  }
  
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
  }
  
  // Validate employee ID specifically
  let employeeIdValue = req.body.employee_id !== undefined ? req.body.employee_id : req.body.employeeId;
  let employeeIdError = null;
  
  if (employeeIdValue === undefined || employeeIdValue === null) {
    employeeIdError = 'Employee ID is missing';
  } else if (typeof employeeIdValue === 'string') {
    const parsedId = parseInt(employeeIdValue.trim(), 10);
    if (isNaN(parsedId)) {
      employeeIdError = `Invalid employee ID format: "${employeeIdValue}" cannot be converted to a number`;
    }
  }
  
  return res.json({
    payload: req.body,
    isValid: missingFields.length === 0 && locationErrors.length === 0 && !employeeIdError,
    missingFields,
    locationErrors,
    employeeIdError,
    message: missingFields.length === 0 && locationErrors.length === 0 && !employeeIdError 
      ? 'Payload is valid'
      : 'Payload has validation errors'
  });
});

// Test endpoint for employee ID validation
router.get('/validate-employee/:id', async (req, res) => {
  const employeeId = req.params.id;
  
  try {
    // Try to convert to number
    const employeeIdNum = parseInt(employeeId, 10);
    
    if (isNaN(employeeIdNum)) {
      return res.json({
        isValid: false,
        message: `Invalid employee ID format: "${employeeId}" is not a number`,
        original: employeeId,
        parsed: null
      });
    }
    
    // Check if employee exists in database
    // First try as internal ID
    let employee = await storage.getEmployeeById(employeeIdNum);
    
    if (employee) {
      return res.json({
        isValid: true,
        message: 'Employee found by internal ID',
        employee: {
          id: employee.id,
          employee_id: employee.employee_id,
          name: employee.employee_name,
          email: employee.email_id
        },
        matchType: 'internal_id'
      });
    }
    
    // If not found by internal ID, try by display ID
    const employeeByDisplayId = await storage.findEmployeeByEmployeeId(employeeId);
    
    if (employeeByDisplayId) {
      return res.json({
        isValid: true,
        message: 'Employee found by display ID',
        employee: {
          id: employeeByDisplayId.id,
          employee_id: employeeByDisplayId.employee_id,
          name: employeeByDisplayId.employee_name,
          email: employeeByDisplayId.email_id
        },
        matchType: 'display_id'
      });
    }
    
    return res.json({
      isValid: false,
      message: `No employee found with ID ${employeeId}`,
      original: employeeId,
      parsed: employeeIdNum
    });
  } catch (err: any) {
    return res.status(500).json({
      isValid: false,
      message: 'Error validating employee ID',
      error: err.message || 'Unknown employee validation error'
    });
  }
});

console.log("Booking debug trace router created");

// Export the router
export default router;