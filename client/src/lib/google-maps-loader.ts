// Optimized Google Maps API loader utility
// This utility provides a reliable way to load the Google Maps API with performance optimizations

const LIBRARIES = ["places", "geometry"] as any[];
let googleMapsPromise: Promise<any> | null = null;
const SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_AUTH_ERROR_TEXT = "This page didn't load Google Maps correctly";
const LOAD_TIMEOUT = 20000; // Increased timeout to 20 seconds for slower connections

// Custom event for Maps load state
const MAPS_LOAD_EVENT = 'google-maps-loaded';

// For handling API key errors and authentication issues
const addGlobalErrorListener = (reject: (reason: any) => void) => {
  const originalConsoleError = console.error;
  const errorHandler = (event: ErrorEvent) => {
    // Check if the error is from Google Maps
    if (event.message && 
        (event.message.includes(GOOGLE_MAPS_AUTH_ERROR_TEXT) || 
         event.message.includes("Google Maps JavaScript API error") ||
         event.message.includes("InvalidKeyMapError") ||
         event.message.includes("MissingKeyMapError"))) {
      
      console.error("Google Maps API authentication error detected:", event.message);
      // Clean up
      window.removeEventListener('error', errorHandler);
      googleMapsPromise = null;
      
      // Reject with a clear error message
      reject(new Error(`Google Maps API authentication error. Please check your API key: ${event.message}`));
    }
  };

  // Add global error listener
  window.addEventListener('error', errorHandler);
  
  // Return a function to clean up the listener
  return () => {
    window.removeEventListener('error', errorHandler);
    console.error = originalConsoleError;
  };
};

// This function is called by the Google Maps API when it's loaded
// It must be defined as a global function
window.initMap = function() {
  console.log("initMap function called - Maps API initialized successfully");
  
  // Dispatch custom event
  const event = new CustomEvent(MAPS_LOAD_EVENT);
  window.dispatchEvent(event);
  
  // Call the callback if defined
  if (typeof window.googleMapsCallback === 'function') {
    window.googleMapsCallback();
  }
};

// Load Google Maps using a deferred approach
export function loadGoogleMaps(apiKey: string): Promise<any> {
  // Return existing promise if already loading or loaded
  if (googleMapsPromise) {
    console.log("Google Maps loading already in progress, returning existing promise");
    return googleMapsPromise;
  }

  // Check if Google Maps is already loaded
  if (window.google && window.google.maps) {
    console.log("Google Maps already loaded, returning existing instance");
    return Promise.resolve(window.google.maps);
  }

  // Check if script tag already exists but failed
  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    console.log("Google Maps script tag already exists, removing it to try again");
    existingScript.remove();
  }

  // Clear any previous Google Maps auth errors
  if (window.gm_authFailure) {
    console.log("Clearing previous gm_authFailure handler");
    delete window.gm_authFailure;
  }

  console.log("Starting Google Maps API load with key length:", apiKey ? apiKey.length : 0);

  // Create a new promise to load Google Maps
  googleMapsPromise = new Promise((resolve, reject) => {
    try {
      // Validate API key
      if (!apiKey || apiKey.trim() === "") {
        const error = new Error("Google Maps API key is missing or empty. Please add your API key to the .env file as VITE_GOOGLE_MAPS_KEY.");
        console.error(error);
        reject(error);
        googleMapsPromise = null;
        return;
      }
      
      console.log("Using Google Maps API key:", `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

      // Set up custom event listener
      const mapsLoadHandler = () => {
        console.log("Google Maps API loaded successfully (via custom event)");
        clearTimeout(timeoutId);
        cleanupErrorListener();
        
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps API loaded but window.google.maps is not available"));
        }
        
        // Remove event listener after successful load
        window.removeEventListener(MAPS_LOAD_EVENT, mapsLoadHandler);
      };
      
      window.addEventListener(MAPS_LOAD_EVENT, mapsLoadHandler);

      // Define global callback for Google Maps (fallback)
      window.googleMapsCallback = () => {
        console.log("Google Maps API loaded successfully (via callback)");
        
        // Only resolve if not already resolved by the event
        if (googleMapsPromise) {
          clearTimeout(timeoutId);
          cleanupErrorListener();
          
          if (window.google && window.google.maps) {
            resolve(window.google.maps);
          }
        }
      };
      
      // Set up auth failure handling
      window.gm_authFailure = () => {
        console.error("Google Maps authentication failed - invalid API key");
        reject(new Error("Google Maps API key is invalid or has restrictions that prevent it from being used."));
        // Clean up
        googleMapsPromise = null;
      };

      // Set up error listeners
      const cleanupErrorListener = addGlobalErrorListener(reject);

      // Intelligently decide whether to use browser idle callback for non-critical loading
      const loadMapsScript = () => {
        // Create the script element
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${LIBRARIES.join(",")}&callback=initMap&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;
        
        // Add the script to the page
        document.head.appendChild(script);
        console.log("Google Maps script added to document head");
      };
      
      // Use requestIdleCallback for deferred loading if available, otherwise use a short timeout
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => loadMapsScript(), { timeout: 2000 });
      } else {
        // Minor delay to let critical resources load first
        setTimeout(loadMapsScript, 100);
      }
      
      // Define loading timeout (20 seconds)
      const timeoutId = setTimeout(() => {
        console.error(`Google Maps API loading timed out after ${LOAD_TIMEOUT/1000} seconds`);
        cleanupErrorListener();
        window.removeEventListener(MAPS_LOAD_EVENT, mapsLoadHandler);
        reject(new Error("Google Maps API loading timed out. Please check your internet connection and API key."));
        // Clean up
        delete window.googleMapsCallback;
        googleMapsPromise = null;
      }, LOAD_TIMEOUT);
      
    } catch (error) {
      console.error("Error setting up Google Maps API load:", error);
      reject(error);
      googleMapsPromise = null;
    }
  });

  return googleMapsPromise;
}

// Reset the promise (useful for testing or retrying after failure)
export function resetGoogleMapsLoader(): void {
  googleMapsPromise = null;
  // Remove any existing Google Maps script tags
  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    existingScript.remove();
  }
  // Clean up global callbacks
  delete window.googleMapsCallback;
  // Clear any previous Google Maps auth errors
  if (window.gm_authFailure) {
    delete window.gm_authFailure;
  }
}

// Define requestIdleCallback for TypeScript
declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
    googleMapsCallback?: () => void;
    initMap: () => void;
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
    [key: string]: any;
  }
}