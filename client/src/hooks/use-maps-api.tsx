import React, { useState, useEffect } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';

interface MapsApiState {
  isLoaded: boolean;
  loadError: Error | null;
  maps: typeof google.maps | null;
}

// Using named export for consistent component exports
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
        
        // Load the API with our optimized loader
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
    if (!state.isLoaded && apiKey) {
      loadApi();
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [apiKey]); // Only re-run if apiKey changes

  return state;
}

// Maintain compatibility with existing imports
export default useMapsApi;