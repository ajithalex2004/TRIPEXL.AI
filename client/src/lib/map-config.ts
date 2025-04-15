/**
 * Google Maps API configuration
 * This file centralizes the Google Maps API key configuration
 * for consistent use across the application
 */

/**
 * Gets the active Google Maps API key from environment variables
 * For security, we only use environment variables for API keys
 */
export const getGoogleMapsApiKey = (): string => {
  // Get from environment variable
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  
  if (envKey) {
    // Log some information about the key (but not the key itself)
    const keyLength = envKey.length;
    const firstFive = keyLength > 5 ? envKey.substring(0, 5) : envKey;
    const lastFive = keyLength > 5 ? envKey.substring(keyLength - 5) : '';
    
    console.log(`Using Google Maps API key (length: ${keyLength}, starts with: ${firstFive}...${lastFive})`);
    
    return envKey;
  }
  
  // No key found
  console.warn('No Google Maps API key found in environment variables. Maps will be disabled or limited.');
  return '';
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