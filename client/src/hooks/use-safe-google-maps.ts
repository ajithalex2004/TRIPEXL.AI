import { useState, useEffect, useRef, useCallback } from 'react';
import { getGoogleMapsApiKey, MAP_CONFIG } from '@/lib/map-config';

// Configuration constants
const SCRIPT_ID = 'google-maps-script';
const CALLBACK_NAME = 'initGoogleMapsAPI';
const LOADING_TIMEOUT = 12000; // 12 seconds timeout
const RETRY_ATTEMPTS = 2; // Number of retry attempts
const RETRY_DELAY = 3000; // 3 seconds between retries
const LIBRARIES = MAP_CONFIG.libraries;

interface GoogleMapsState {
  isLoaded: boolean;
  isError: boolean;
  errorMessage: string;
  apiInstance: typeof google | null;
  retryCount?: number;
  isRetrying?: boolean;
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
    apiInstance: null,
    retryCount: 0,
    isRetrying: false
  });
  
  // Reference to track if component is mounted
  const isMountedRef = useRef(true);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Set up mounted state tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Function to load the Google Maps script
  const loadMapsScript = useCallback((key: string, currentRetryCount: number = 0) => {
    console.log(`Loading Google Maps API (attempt ${currentRetryCount + 1}/${RETRY_ATTEMPTS + 1})...`);
    
    // Clear any existing script and timeouts
    if (scriptRef.current && document.head.contains(scriptRef.current)) {
      document.head.removeChild(scriptRef.current);
      scriptRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Skip if already loaded
    if (window.google?.maps) {
      if (isMountedRef.current) {
        setState({
          isLoaded: true,
          isError: false,
          errorMessage: '',
          apiInstance: window.google,
          retryCount: currentRetryCount,
          isRetrying: false
        });
      }
      return;
    }
    
    // Set retrying state
    if (isMountedRef.current && currentRetryCount > 0) {
      setState(prev => ({ 
        ...prev, 
        isRetrying: true,
        errorMessage: `Retrying (${currentRetryCount}/${RETRY_ATTEMPTS})...`,
        retryCount: currentRetryCount
      }));
    }
    
    // Create the script element
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=${LIBRARIES.join(',')}&callback=${CALLBACK_NAME}&v=weekly`;
    script.async = true;
    script.defer = true;
    
    // Set up the callback
    window[CALLBACK_NAME] = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (isMountedRef.current) {
        setState({
          isLoaded: true,
          isError: false,
          errorMessage: '',
          apiInstance: window.google,
          retryCount: currentRetryCount,
          isRetrying: false
        });
      }
      
      delete window[CALLBACK_NAME];
    };
    
    // Handle errors
    script.onerror = (event) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      console.error(`Google Maps API loading failed (attempt ${currentRetryCount + 1}/${RETRY_ATTEMPTS + 1})`);
      
      // Retry logic
      if (currentRetryCount < RETRY_ATTEMPTS) {
        console.log(`Will retry in ${RETRY_DELAY/1000} seconds...`);
        setTimeout(() => {
          if (isMountedRef.current) {
            loadMapsScript(key, currentRetryCount + 1);
          }
        }, RETRY_DELAY);
      } else {
        // All retries failed
        const error = new Error(`Failed to load Google Maps API after ${RETRY_ATTEMPTS + 1} attempts`);
        if (isMountedRef.current) {
          setState({
            isLoaded: false,
            isError: true,
            errorMessage: error.message,
            apiInstance: null,
            retryCount: currentRetryCount,
            isRetrying: false
          });
        }
        
        if (onError) onError(error);
      }
      
      delete window[CALLBACK_NAME];
    };
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      const error = new Error(`Google Maps API loading timed out (attempt ${currentRetryCount + 1}/${RETRY_ATTEMPTS + 1})`);
      
      // Retry logic for timeouts too
      if (currentRetryCount < RETRY_ATTEMPTS) {
        console.log(`Timeout - will retry in ${RETRY_DELAY/1000} seconds...`);
        if (isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) {
              loadMapsScript(key, currentRetryCount + 1);
            }
          }, RETRY_DELAY);
        }
      } else {
        // All retries failed
        if (isMountedRef.current) {
          setState({
            isLoaded: false,
            isError: true,
            errorMessage: error.message,
            apiInstance: null,
            retryCount: currentRetryCount,
            isRetrying: false
          });
        }
        
        if (onError) onError(error);
      }
      
      delete window[CALLBACK_NAME];
    }, LOADING_TIMEOUT);
    
    // Add script to document
    document.head.appendChild(script);
    scriptRef.current = script;
  }, [onError]);
  
  // Main effect to load the script
  useEffect(() => {
    // Skip if already loaded or loading
    if (
      state.isLoaded || 
      state.isRetrying ||
      scriptRef.current || 
      document.getElementById(SCRIPT_ID) ||
      window.google?.maps
    ) {
      // If the API is already available, set the state accordingly
      if (window.google?.maps) {
        setState(prev => ({
          ...prev,
          isLoaded: true,
          isError: false,
          errorMessage: '',
          apiInstance: window.google
        }));
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
        apiInstance: null,
        retryCount: 0,
        isRetrying: false
      });
      if (onError) onError(error);
      return;
    }
    
    // Start loading with our new retry mechanism
    loadMapsScript(apiKey, 0);
    
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
  }, [apiKey, onError, state.isLoaded, loadMapsScript]);
  
  return state;
}