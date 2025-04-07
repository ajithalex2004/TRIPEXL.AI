// Google Maps API loader utility
// This utility provides a reliable way to load the Google Maps API

const LIBRARIES = ["places", "geometry"] as any[];
let googleMapsPromise: Promise<any> | null = null;
const SCRIPT_ID = "google-maps-script";

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

  console.log("Starting Google Maps API load with key length:", apiKey ? apiKey.length : 0);

  // Create a new promise to load Google Maps
  googleMapsPromise = new Promise((resolve, reject) => {
    try {
      // Create a unique callback name to avoid conflicts
      const callbackName = `googleMapsCallback_${Math.round(Math.random() * 1000000)}`;
      
      // Add the callback to the window object
      window[callbackName] = () => {
        console.log("Google Maps API loaded successfully");
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps API loaded but window.google.maps is not available"));
        }
        // Clean up
        delete window[callbackName];
      };

      // Validate API key
      if (!apiKey) {
        reject(new Error("Google Maps API key is required"));
        googleMapsPromise = null;
        return;
      }

      // Create the script element
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${LIBRARIES.join(",")}&callback=${callbackName}&v=quarterly`;
      script.async = true;
      script.defer = true;
      
      // Handle loading errors
      script.onerror = (error) => {
        console.error("Google Maps API script failed to load:", error);
        reject(new Error("Failed to load Google Maps API script"));
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
  const existingScript = document.getElementById("google-maps-script");
  if (existingScript) {
    existingScript.remove();
  }
}

declare global {
  interface Window {
    google?: any;
    [key: string]: any;
  }
}