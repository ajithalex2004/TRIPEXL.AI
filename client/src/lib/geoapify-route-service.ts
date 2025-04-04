// Geoapify Route Planning Service
// This service provides enhanced route planning capabilities using the Geoapify API

// Default API Key
const GEOAPIFY_API_KEY = 'b28769f0b406453aa7d0ef49c7abfcde';
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/routing';

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
    // Format waypoints as lat,lng pairs for the URL
    let waypointsParam = `${origin.lat},${origin.lng}`;
    
    // Add intermediate waypoints if they exist
    if (waypoints && waypoints.length > 0) {
      for (const wp of waypoints) {
        waypointsParam += `|${wp.location.lat},${wp.location.lng}`;
      }
    }
    
    // Add destination
    waypointsParam += `|${destination.lat},${destination.lng}`;
    
    // Construct URL for API call
    const url = new URL(GEOAPIFY_BASE_URL);
    url.searchParams.append('apiKey', GEOAPIFY_API_KEY);
    url.searchParams.append('waypoints', waypointsParam);
    
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

    // Make GET request
    const response = await fetch(url.toString());

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
export function convertToGoogleMapsRoute(geoapifyRoute: any): any {
  try {
    if (!geoapifyRoute || !geoapifyRoute.features || geoapifyRoute.features.length === 0) {
      throw new Error('Invalid Geoapify route data');
    }
    
    // Get the first feature which contains the main route
    const mainFeature = geoapifyRoute.features[0];
    
    if (!mainFeature.geometry || !mainFeature.geometry.coordinates) {
      throw new Error('Missing route coordinates in Geoapify response');
    }
    
    // Extract properties
    const properties = mainFeature.properties || {};
    const totalDistance = properties.distance || 0; // in meters
    const totalTime = properties.time || 0; // in seconds
    const coordinates = mainFeature.geometry.coordinates;
    
    // Create a path that Google Maps can use (convert [lon, lat] to {lat, lng})
    const path = coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
    
    // Create a simplified leg structure if detailed legs are not available
    let legs = [];
    
    if (properties.legs && properties.legs.length > 0) {
      // If we have detailed leg information
      legs = properties.legs.map(leg => ({
        distance: { 
          text: formatDistance(leg.distance || 0),
          value: leg.distance || 0
        },
        duration: { 
          text: formatTime(leg.time || 0),
          value: leg.time || 0
        },
        steps: leg.steps?.map(step => ({
          distance: { text: formatDistance(step.distance || 0), value: step.distance || 0 },
          duration: { text: formatTime(step.time || 0), value: step.time || 0 },
          instructions: step.instruction || "Continue"
        })) || []
      }));
    } else {
      // Create a simple single leg if detailed information is not available
      legs = [{
        distance: { 
          text: formatDistance(totalDistance),
          value: totalDistance
        },
        duration: { 
          text: formatTime(totalTime),
          value: totalTime
        },
        steps: []
      }];
    }
    
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
        origin: path.length > 0 ? { lat: path[0].lat, lng: path[0].lng } : null,
        destination: path.length > 0 ? { lat: path[path.length - 1].lat, lng: path[path.length - 1].lng } : null
      }
    };
  } catch (error) {
    console.error('Error converting Geoapify route to Google Maps format:', error);
    throw error;
  }
}