import React from 'react';
import { MapViewNew as OriginalMapViewNew } from './map-view-new';
import { MapViewNew as FixedMapViewNew, MapViewProps, Location } from './map-view-new-fixed';

/**
 * Proxy component that conditionally renders either the old or new map component
 * This allows us to easily switch between implementations without changing all references
 */
export function MapViewNew(props: MapViewProps) {
  // Set to true to use the new implementation, false to use the original
  const useNewImplementation = true;
  
  return useNewImplementation ? (
    <FixedMapViewNew {...props} />
  ) : (
    // Need to ensure apiKey is provided for original implementation
    <OriginalMapViewNew {...props} apiKey={props.apiKey || getDefaultApiKey()} />
  );
}

// Helper function to get a default API key if none provided
function getDefaultApiKey(): string {
  // Try to use window.__ENV__.GOOGLE_MAPS_API_KEY if available
  if (window.__ENV__ && window.__ENV__.GOOGLE_MAPS_API_KEY) {
    return window.__ENV__.GOOGLE_MAPS_API_KEY;
  }
  // Fallback to empty string
  return "";
}

// Add global env declaration
declare global {
  interface Window {
    __ENV__?: {
      GOOGLE_MAPS_API_KEY?: string;
    };
  }
}

// Re-export the Location interface and MapViewProps for convenience
export type { Location, MapViewProps } from './map-view-new-fixed';

export default MapViewNew;