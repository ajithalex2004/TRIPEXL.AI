// Google Maps API loader utility
// This utility provides a reliable way to load the Google Maps API

const LIBRARIES = ["places", "geometry"] as any[];
let googleMapsPromise: Promise<any> | null = null;
const SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_AUTH_ERROR_TEXT = "This page didn't load Google Maps correctly";

// For handling API key errors and authentication issues
const addGlobalErrorListener = (callbackName: string, reject: (reason: any) => void) => {
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
      delete window[callbackName];
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

export function loadGoogleMaps(apiKey: string): Promise<any> {
  // Return existing promise if already loading or loaded
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Check if Google Maps is already loaded
  if (window.google && window.google.maps) {
    console.log("Google Maps already loaded, returning existing instance");
    return Promise.resolve(window.google.maps);
  }

  // Check if script tag already exists
  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    console.log("Google Maps script tag already exists, removing it first");
    existingScript.remove();
  }

  // Clear any previous Google Maps auth errors
  if (window.gm_authFailure) {
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

      // Create a unique callback name to avoid conflicts
      const callbackName = `googleMapsCallback_${Math.round(Math.random() * 1000000)}`;
      
      // Set up auth failure handling
      window.gm_authFailure = () => {
        console.error("Google Maps authentication failed - invalid API key");
        reject(new Error("Google Maps API key is invalid or has restrictions that prevent it from being used."));
        // Clean up
        delete window[callbackName];
        googleMapsPromise = null;
      };
      
      // Add the callback to the window object
      window[callbackName] = () => {
        console.log("Google Maps API loaded successfully");
        
        // Remove error listeners since load succeeded
        cleanupErrorListener();
        
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps API loaded but window.google.maps is not available"));
        }
        // Clean up
        delete window[callbackName];
      };

      // Set up error listeners
      const cleanupErrorListener = addGlobalErrorListener(callbackName, reject);

      // Create the script element
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${LIBRARIES.join(",")}&callback=${callbackName}&v=quarterly`;
      script.async = true;
      script.defer = true;
      
      // Define loading timeout (15 seconds)
      const timeoutId = setTimeout(() => {
        console.error("Google Maps API loading timed out after 15 seconds");
        cleanupErrorListener();
        reject(new Error("Google Maps API loading timed out. Please check your internet connection and API key."));
        // Clean up
        delete window[callbackName];
        googleMapsPromise = null;
      }, 15000);
      
      // Handle loading errors
      script.onerror = (error) => {
        console.error("Google Maps API script failed to load:", error);
        clearTimeout(timeoutId);
        cleanupErrorListener();
        reject(new Error("Failed to load Google Maps API script. Please check your internet connection."));
        // Clean up
        delete window[callbackName];
        googleMapsPromise = null;
      };

      // Add the script to the page
      document.head.appendChild(script);
      console.log("Google Maps script added to document head");
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
  // Clear any previous Google Maps auth errors
  if (window.gm_authFailure) {
    delete window.gm_authFailure;
  }
}

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
    [key: string]: any;
  }
}