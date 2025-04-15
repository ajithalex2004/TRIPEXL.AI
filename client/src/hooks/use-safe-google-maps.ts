import { useState, useEffect, useRef } from 'react';
import { getGoogleMapsApiKey, MAP_CONFIG } from '@/lib/map-config';

const SCRIPT_ID = 'google-maps-script';
const CALLBACK_NAME = 'initGoogleMapsAPI';
const LOADING_TIMEOUT = 8000; // 8 seconds timeout
const LIBRARIES = MAP_CONFIG.libraries;

interface GoogleMapsState {
  isLoaded: boolean;
  isError: boolean;
  errorMessage: string;
  apiInstance: typeof google | null;
}

/**
 * Safely loads Google Maps API with error handling and timeout protection
 * to prevent page freezing.
 * 
 * @param apiKey The Google Maps API key
 * @param onError Optional callback for handling errors
 * @returns State object with loading status and error information
 */
export function useSafeGoogleMaps(
  providedApiKey?: string,
  onError?: (error: Error) => void
): GoogleMapsState {
  // Use the provided API key or get the default one from our config
  const apiKey = providedApiKey || getGoogleMapsApiKey();
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    isError: false,
    errorMessage: '',
    apiInstance: null
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  useEffect(() => {
    // Skip if already loaded or loading
    if (
      state.isLoaded || 
      scriptRef.current || 
      document.getElementById(SCRIPT_ID) ||
      window.google?.maps
    ) {
      // If the API is already available, set the state accordingly
      if (window.google?.maps) {
        setState({
          isLoaded: true,
          isError: false,
          errorMessage: '',
          apiInstance: window.google
        });
      }
      return;
    }
    
    // Only load if we have an API key
    if (!apiKey) {
      const error = new Error('Google Maps API key is required');
      setState({
        isLoaded: false,
        isError: true,
        errorMessage: error.message,
        apiInstance: null
      });
      if (onError) onError(error);
      return;
    }
    
    // Define the callback function that will be called when the script loads
    window[CALLBACK_NAME] = () => {
      // Clear the timeout since the script loaded successfully
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Update state to indicate successful loading
      setState({
        isLoaded: true,
        isError: false,
        errorMessage: '',
        apiInstance: window.google
      });
      
      // Clean up the global callback
      delete window[CALLBACK_NAME];
    };
    
    // Create the script tag
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${LIBRARIES.join(',')}&callback=${CALLBACK_NAME}`;
    script.async = true;
    script.defer = true;
    
    // Handle script load error
    script.onerror = (event) => {
      // Clear the timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const error = new Error('Failed to load Google Maps API script');
      setState({
        isLoaded: false,
        isError: true,
        errorMessage: error.message,
        apiInstance: null
      });
      
      if (onError) onError(error);
      
      // Clean up
      delete window[CALLBACK_NAME];
    };
    
    // Set a timeout to prevent hanging if the script fails to load or initialize
    timeoutRef.current = setTimeout(() => {
      const error = new Error('Google Maps API loading timed out');
      setState({
        isLoaded: false,
        isError: true,
        errorMessage: error.message,
        apiInstance: null
      });
      
      if (onError) onError(error);
      
      // Clean up
      delete window[CALLBACK_NAME];
    }, LOADING_TIMEOUT);
    
    // Add the script to the document
    document.head.appendChild(script);
    scriptRef.current = script;
    
    // Clean up function
    return () => {
      // Clear timeout if component unmounts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Remove the script tag if it exists and component unmounts
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      
      // Clean up global callback
      delete window[CALLBACK_NAME];
    };
  }, [apiKey, onError, state.isLoaded]);
  
  return state;
}