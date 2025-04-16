import React from 'react';
import { MapViewNew as CompatibleMapView } from './map-view-compatible';

/**
 * This is a proxy component that redirects to our compatible implementation.
 * We're using a completely new implementation designed to work seamlessly with the existing codebase.
 */
export function MapViewNew(props: any) {
  return <CompatibleMapView {...props} />;
}

// Re-export the interfaces from the implementation we're using
export type { Location, MapViewProps } from './map-view-compatible';

export default MapViewNew;