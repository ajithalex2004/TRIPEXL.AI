/**
 * This module provides a global way to refresh bookings data and switch tabs
 * between booking pages.
 */

// Function type for refreshing bookings
type RefreshFunction = () => Promise<void>;
// Function type for switching to a specific tab
type SetTabFunction = (tab: string) => void;

// Global function references (will be set by the BookingHistory component)
let _globalRefreshBookings: RefreshFunction | null = null;
let _globalSetActiveTab: SetTabFunction | null = null;

/**
 * Register a function that can refresh bookings data
 * This should be called by the BookingHistory component
 */
export const registerRefreshFunction = (refreshFn: RefreshFunction) => {
  _globalRefreshBookings = refreshFn;
  console.log("Booking refresh function registered");
};

/**
 * Register a function that can change the active tab
 * This should be called by the BookingHistory component
 */
export const registerSetTabFunction = (setTabFn: SetTabFunction) => {
  _globalSetActiveTab = setTabFn;
  console.log("Tab switching function registered");
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

/**
 * Switch to a specific tab (history or new)
 * @param tab The tab to switch to ('history' or 'new')
 */
export const switchToTab = (tab: string): void => {
  console.log(`Switching to tab: ${tab}`);
  if (_globalSetActiveTab) {
    _globalSetActiveTab(tab);
    return;
  }
  console.warn("Global tab switching function not available yet");
};