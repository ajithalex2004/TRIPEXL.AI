import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { validateToken } from '../middleware/auth';

const bookingManagementRouter = Router();

// Apply authentication middleware to all routes
bookingManagementRouter.use(validateToken);

// Delete all bookings
bookingManagementRouter.delete('/delete-all', async (req: Request, res: Response) => {
  try {
    console.log('[BOOKINGS-DELETE-ALL] Attempting to delete all bookings');
    
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Fetch all bookings first to get the count
    const allBookings = await storage.getBookings();
    const count = allBookings.length;
    
    // Delete all bookings from the database
    await storage.deleteAllBookings();
    
    console.log(`[BOOKINGS-DELETE-ALL] Successfully deleted ${count} bookings`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${count} bookings`,
      deletedCount: count
    });
  } catch (error: any) {
    console.error('[BOOKINGS-DELETE-ALL] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete bookings',
      error: error.message
    });
  }
});

export default bookingManagementRouter;