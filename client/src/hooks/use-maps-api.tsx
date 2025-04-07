import React, { useState, useEffect } from 'react';
import { loadGoogleMaps, resetGoogleMapsLoader } from '@/lib/google-maps-loader';

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

    const loadApi = async () => {
      try {
        console.log("Attempting to load Google Maps API");
        if (!apiKey) {
          throw new Error('Google Maps API key is missing');
        }

        // Reset the loader to ensure a clean state
        resetGoogleMapsLoader();
        
        // Load the API
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

    loadApi();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [apiKey]); // Only re-run if apiKey changes

  return state;
}

export default useMapsApi;