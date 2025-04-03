// Geoapify Route Planning Service
// This service provides enhanced route planning capabilities using the Geoapify API

// Default API Key
const GEOAPIFY_API_KEY = 'b28769f0b406453aa7d0ef49c7abfcde';
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/routeplanner';

// Types for Geoapify API
export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface RouteWaypoint {
  location: GeoLocation;
  name?: string;
}

export interface RouteOptions {
  mode?: 'drive' | 'walk' | 'bicycle' | 'scooter' | 'transit';
  traffic?: boolean;
  avoid?: ('toll' | 'motorway' | 'ferry' | 'tunnel' | 'unpaved' | 'cash_only_tolls')[];
  details?: ('instruction' | 'elevation' | 'nodes' | 'time' | 'distance')[];
  optimize?: 'time' | 'distance' | 'priority';
}

export interface RouteResponse {
  type: string;
  features: RouteFeature[];
  properties: {
    mode: string;
    waypoints: number[][];
    units: string;
    distance: number;
    distance_units: string;
    time: number;
  };
}

export interface RouteFeature {
  type: string;
  properties: {
    mode: string;
    waypoints: number[][];
    units: string;
    distance: number;
    distance_units: string;
    time: number;
    legs: RouteLeg[];
  };
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

export interface RouteLeg {
  distance: number;
  time: number;
  steps?: RouteStep[];
}

export interface RouteStep {
  distance: number;
  time: number;
  instruction: string;
}

/**
 * Calculate a route using the Geoapify Route Planning API
 * @param origin Starting location
 * @param destination Ending location
 * @param waypoints Optional intermediate stops
 * @param options Route calculation options
 * @returns Promise with the route data
 */
export async function calculateRoute(
  origin: GeoLocation,
  destination: GeoLocation,
  waypoints: RouteWaypoint[] = [],
  options: RouteOptions = {}
): Promise<RouteResponse> {
  try {
    // Prepare waypoints in the format expected by Geoapify API
    const waypointList = [
      [origin.lng, origin.lat],
      ...waypoints.map(wp => [wp.location.lng, wp.location.lat]),
      [destination.lng, destination.lat]
    ];

    // Construct URL for API call
    const url = new URL(GEOAPIFY_BASE_URL);
    url.searchParams.append('apiKey', GEOAPIFY_API_KEY);
    
    // Set mode (default to drive if not specified)
    const mode = options.mode || 'drive';
    url.searchParams.append('mode', mode);
    
    // Add traffic option if specified
    if (options.traffic) {
      url.searchParams.append('traffic', 'true');
    }
    
    // Add avoid options
    if (options.avoid && options.avoid.length > 0) {
      url.searchParams.append('avoid', options.avoid.join('|'));
    }
    
    // Add details
    if (options.details && options.details.length > 0) {
      url.searchParams.append('details', options.details.join('|'));
    }
    
    // Add optimize option
    if (options.optimize) {
      url.searchParams.append('optimize', options.optimize);
    }

    // Make POST request with waypoints
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "waypoints": waypointList
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Geoapify API returned error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating route with Geoapify:', error);
    throw error;
  }
}

/**
 * Format distance from meters to a human-readable string
 * @param meters Distance in meters
 * @returns Formatted distance (e.g., "1.5 km" or "400 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format time from seconds to a human-readable string
 * @param seconds Time in seconds
 * @returns Formatted time (e.g., "1 hr 15 mins" or "5 mins")
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes > 0 ? `${minutes} min${minutes !== 1 ? 's' : ''}` : ''}`;
  }
  
  return `${minutes} min${minutes !== 1 ? 's' : ''}`;
}

/**
 * Convert Geoapify route to Google Maps-compatible format
 * This helps us use the route with our existing Google Maps components
 */
export function convertToGoogleMapsRoute(geoapifyRoute: RouteResponse): any {
  if (!geoapifyRoute || !geoapifyRoute.features || geoapifyRoute.features.length === 0) {
    throw new Error('Invalid Geoapify route data');
  }
  
  const mainFeature = geoapifyRoute.features[0];
  const totalDistance = mainFeature.properties.distance; // in meters
  const totalTime = mainFeature.properties.time; // in seconds
  const coordinates = mainFeature.geometry.coordinates;
  
  // Create a path that Google Maps can use
  const path = coordinates.map(coord => ({
    lat: coord[1],
    lng: coord[0]
  }));
  
  // Format legs information
  const legs = mainFeature.properties.legs.map(leg => ({
    distance: { 
      text: formatDistance(leg.distance),
      value: leg.distance 
    },
    duration: { 
      text: formatTime(leg.time),
      value: leg.time 
    },
    steps: leg.steps?.map(step => ({
      distance: { text: formatDistance(step.distance), value: step.distance },
      duration: { text: formatTime(step.time), value: step.time },
      instructions: step.instruction
    })) || []
  }));
  
  // Create a Google Maps-compatible structure
  return {
    routes: [{
      overview_path: path,
      legs: legs,
      overview_polyline: {
        points: '' // We don't need this as we'll pass the coordinates directly
      }
    }],
    status: 'OK',
    request: {
      origin: { lat: path[0].lat, lng: path[0].lng },
      destination: { lat: path[path.length - 1].lat, lng: path[path.length - 1].lng }
    }
  };
}