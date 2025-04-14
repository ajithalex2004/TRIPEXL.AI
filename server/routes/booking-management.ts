import { Router, Request, Response } from 'express';
import { db } from '../db';
import { bookings } from '@shared/schema';
import { verifyToken } from '../auth/token-service';
import { sql } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

// Define payload interface for type safety
interface TokenPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

const bookingManagementRouter = Router();

// Get all bookings
bookingManagementRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log(`[BOOKINGS-GET] ERROR: No authorization token provided`);
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token) as TokenPayload;
    
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      console.log(`[BOOKINGS-GET] ERROR: Invalid token`);
      return res.status(401).json({ error: "Authentication failed. Please login again." });
    }
    
    console.log(`[BOOKINGS-GET] DEBUG: Token to verify: ${token.substring(0, 15)}...`);
    console.log(`[BOOKINGS-GET] DEBUG: Using improved token-service`);
    console.log(`[BOOKINGS-GET] User authenticated with ID: ${payload.userId}`);
    
    // Fetch all bookings
    const allBookings = await db.select().from(bookings);
    
    // Sample log to verify structure
    if (allBookings.length > 0) {
      console.log(`[BOOKINGS-GET] First booking sample: ${JSON.stringify(allBookings[0])}`);
      console.log(`[BOOKINGS-GET] Pickup location type: ${typeof allBookings[0].pickup_location}`);
    }
    
    console.log(`[BOOKINGS-GET] Returning ${allBookings.length} bookings`);
    
    return res.status(200).json(allBookings);
  } catch (error: any) {
    console.error(`[BOOKINGS-GET] Error fetching bookings:`, error);
    return res.status(500).json({ 
      error: "Failed to fetch bookings", 
      message: error.message 
    });
  }
});

// Delete all bookings
bookingManagementRouter.delete('/delete-all', async (req: Request, res: Response) => {
  try {
    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log(`[BOOKINGS-DELETE] ERROR: No authorization token provided`);
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token) as TokenPayload;
    
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      console.log(`[BOOKINGS-DELETE] ERROR: Invalid token`);
      return res.status(401).json({ error: "Authentication failed. Please login again." });
    }
    
    console.log(`[BOOKINGS-DELETE] User ${payload.userId} requested to delete all bookings`);
    
    // Count bookings before deletion
    const countResult = await db.select({ count: sql`count(*)` }).from(bookings);
    const count = countResult[0]?.count;
    const beforeCount = typeof count === 'number' ? count : 
                        typeof count === 'string' ? parseInt(count) : 0;
    
    // Delete all bookings
    await db.delete(bookings);
    
    console.log(`[BOOKINGS-DELETE] Successfully deleted ${beforeCount} bookings`);
    
    return res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${beforeCount} bookings`,
      deletedCount: beforeCount
    });
  } catch (error: any) {
    console.error(`[BOOKINGS-DELETE] Error deleting bookings:`, error);
    return res.status(500).json({ 
      error: "Failed to delete bookings", 
      message: error.message 
    });
  }
});

export default bookingManagementRouter;