import { Router, Request, Response } from 'express';
import { db } from '../db';
import { bookings } from '@shared/schema';
import { verifyToken } from '../auth/token-service';
import { sql } from 'drizzle-orm';

const bookingManagementRouter = Router();

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
    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      console.log(`[BOOKINGS-DELETE] ERROR: Invalid token`);
      return res.status(401).json({ error: "Authentication failed. Please login again." });
    }
    
    console.log(`[BOOKINGS-DELETE] User ${payload.userId} requested to delete all bookings`);
    
    // Count bookings before deletion
    const countResult = await db.select({ count: sql`count(*)` }).from(bookings);
    const beforeCount = parseInt(countResult[0].count.toString());
    
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