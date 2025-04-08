import React, { useState, useEffect } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

interface MapsApiState {
  isLoaded: boolean;
  loadError: Error | null;
  maps: typeof google.maps | null;
}

export function useMapsApi(apiKey: string): MapsApiState {
  const [state, setState] = useState<MapsApiState>({
    isLoaded: false,
    loadError: null,
    maps: null
  });

  useEffect(() => {
    let isMounted = true;
    console.log("Map load state:", state);

    const loadApi = async () => {
      try {
        console.log("Attempting to load Google Maps API");
        if (!apiKey) {
          throw new Error('Google Maps API key is missing');
        }
        
        // Load the API - our improved loader will handle duplicate script issues
        const mapsApi = await loadGoogleMaps(apiKey);
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log("Google Maps API load successful");
          setState({
            isLoaded: true,
            loadError: null,
            maps: mapsApi
          });
        }
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
        // Only update state if component is still mounted
        if (isMounted) {
          setState({
            isLoaded: false,
            loadError: error instanceof Error ? error : new Error(String(error)),
            maps: null
          });
        }
      }
    };

    // Only try to load if not already loaded
    if (!state.isLoaded) {
      loadApi();
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [apiKey, state.isLoaded]); // Only re-run if apiKey changes or isLoaded changes

  return state;
}

// We're no longer exporting a default for better compatibility with Fast Refresh