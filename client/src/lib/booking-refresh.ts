/**
 * This module provides a global way to refresh bookings data
 */

// Function type for refreshing bookings
type RefreshFunction = () => Promise<void>;

// Global function reference (will be set by the BookingHistory component)
let _globalRefreshBookings: RefreshFunction | null = null;

/**
 * Register a function that can refresh bookings data
 * This should be called by the BookingHistory component
 */
export const registerRefreshFunction = (refreshFn: RefreshFunction) => {
  _globalRefreshBookings = refreshFn;
  console.log("Booking refresh function registered");
};

/**
 * Refresh booking data from any component
 * This can be called after a new booking is created
 */
export const refreshBookings = async (): Promise<void> => {
  console.log("Global refresh bookings function called");
  if (_globalRefreshBookings) {
    await _globalRefreshBookings();
    return;
  }
  console.warn("Global refresh function not available yet");
};