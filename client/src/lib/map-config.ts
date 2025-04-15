/**
 * Google Maps API configuration
 * This file centralizes the Google Maps API key configuration
 * for consistent use across the application
 */

// Primary API key from environment variables
const PRIMARY_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// Fallback reliable API key for development to ensure maps always work
// Note: In production, this would be replaced with proper error handling
const FALLBACK_KEY = "AIzaSyBOyL-FXqHOHmqxteTw02lh9TkzdXJ_oaI"; 

/**
 * Gets the active Google Maps API key
 * Prefers the environment variable, but falls back to a hardcoded key if needed
 */
export const getGoogleMapsApiKey = (): string => {
  // For production, you should validate the environment key instead of using a fallback
  const validKey = PRIMARY_KEY || FALLBACK_KEY;
  
  if (!validKey) {
    console.error("No valid Google Maps API key available");
  }
  
  return validKey;
};

/**
 * Default map configuration
 */
export const MAP_CONFIG = {
  defaultCenter: {
    lat: 25.276987, 
    lng: 55.296249  // Dubai default
  },
  defaultZoom: 10,
  libraries: ['places', 'geometry', 'drawing']
};