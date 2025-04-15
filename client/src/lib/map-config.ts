/**
 * Google Maps API configuration
 * This file centralizes the Google Maps API key configuration
 * for consistent use across the application
 */

// Development keys for testing purposes only
// These are very limited and should not be used in production
const DEV_KEYS = [
  // Key 1: Basic functionality with domain restrictions
  "AIzaSyDrQ86QJRiJlyPcLFYdBDVrjFnR7lMRWU0",
  // Key 2: Alternative with low quotas
  "AIzaSyB3u7II7-BxLM_xO-BDPrQ9-6lkIQku6U0"
];

/**
 * Gets the active Google Maps API key
 * Tries multiple sources in this order:
 * 1. Environment variable (most preferred, set by user)
 * 2. Locally stored developer keys (limited functionality)
 */
export const getGoogleMapsApiKey = (): string => {
  // First try: Environment variable
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (envKey) {
    console.log("Using environment Google Maps API key");
    return envKey;
  }
  
  // Second try: One of our development keys (very limited usage)
  // Note: We rotate through available keys to reduce chance of quota limits
  const randomDevKey = DEV_KEYS[Math.floor(Math.random() * DEV_KEYS.length)];
  console.log("Using development Google Maps API key (limited functionality)");
  return randomDevKey;
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
  libraries: ['places', 'geometry', 'drawing'],
  // Additional options for improved performance
  options: {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true
  }
};