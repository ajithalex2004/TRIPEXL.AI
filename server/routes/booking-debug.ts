import { Router, Request, Response } from 'express';
import { bookingDebugManager } from '../debug/booking-debug';

const bookingDebugRouter = Router();

// Get all debug sessions
bookingDebugRouter.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = bookingDebugManager.getAllSessions();
    res.json({
      total: sessions.length,
      sessions: sessions
    });
  } catch (error) {
    console.error('Error fetching booking debug sessions:', error);
    res.status(500).json({ error: 'Failed to fetch booking debug sessions' });
  }
});

// Get a specific debug session
bookingDebugRouter.get('/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    const session = bookingDebugManager.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Debug session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching booking debug session:', error);
    res.status(500).json({ error: 'Failed to fetch booking debug session' });
  }
});

// Diagnostic endpoint to test booking submission issues
bookingDebugRouter.post('/test-booking', (req: Request, res: Response) => {
  try {
    // Log the incoming test request
    console.log('[DEBUG-TEST] Received test booking request:', {
      headers: req.headers,
      body: req.body
    });
    
    // Check what fields might be missing or incorrect
    const requiredFields = [
      'employee_id', 'booking_type', 'purpose', 'priority',
      'pickup_location', 'dropoff_location', 'pickup_time', 'dropoff_time'
    ];
    
    const missingFields = requiredFields.filter(field => {
      if (field === 'pickup_location' || field === 'dropoff_location') {
        const locationValue = req.body[field];
        return !locationValue || 
               !locationValue.address || 
               !locationValue.coordinates || 
               locationValue.coordinates.lat === undefined || 
               locationValue.coordinates.lng === undefined;
      }
      return req.body[field] === undefined || req.body[field] === null || req.body[field] === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields,
        receivedBody: req.body
      });
    }
    
    // If all required fields are present, respond with a success message
    res.json({
      success: true,
      message: 'Test booking data looks valid',
      receivedData: {
        employee_id: req.body.employee_id,
        booking_type: req.body.booking_type,
        purpose: req.body.purpose,
        priority: req.body.priority,
        pickup_location: {
          address: req.body.pickup_location.address,
          coordinates: req.body.pickup_location.coordinates
        },
        dropoff_location: {
          address: req.body.dropoff_location.address,
          coordinates: req.body.dropoff_location.coordinates
        },
        pickup_time: req.body.pickup_time,
        dropoff_time: req.body.dropoff_time
      }
    });
  } catch (error) {
    console.error('Error in test booking endpoint:', error);
    res.status(500).json({
      error: 'Error processing test booking',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default bookingDebugRouter;