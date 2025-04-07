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
/**
 * Calculate straight-line distance between two points in meters
 * Uses the Haversine formula for accurate Earth-surface calculations
 */
export function calculateHaversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Estimate travel time in seconds based on distance and travel mode
 * Used when API-based calculations are not available
 */
export function estimateTravelTime(
  distanceInMeters: number, 
  mode: string = 'drive'
): number {
  // Average speeds in meters per second
  const speeds: Record<string, number> = {
    'drive': 13.9, // 50 km/h
    'walk': 1.4,   // 5 km/h
    'bicycle': 4.2, // 15 km/h
    'scooter': 5.6, // 20 km/h
    'transit': 8.3  // 30 km/h
  };
  
  const speed = speeds[mode as keyof typeof speeds] || speeds.drive;
  return Math.round(distanceInMeters / speed);
}

/**
 * Create a fallback route when API services are not available
 * Uses direct line calculations with geographic distance formulas
 */
export function calculateFallbackRoute(
  origin: GeoLocation,
  destination: GeoLocation,
  waypoints: RouteWaypoint[] = [],
  options: RouteOptions = {}
): RouteResponse {
  console.log("Using fallback route calculation (no API)");
  
  // Create an array of all points in order
  const allLocations = [
    origin,
    ...waypoints.map(wp => wp.location),
    destination
  ];
  
  let totalDistance = 0;
  let totalTime = 0;
  const legs: RouteLeg[] = [];
  const coordinates: [number, number][] = [];
  
  // Add all points to coordinates array
  allLocations.forEach(loc => {
    coordinates.push([loc.lng, loc.lat]);
  });
  
  // Calculate legs between consecutive points
  for (let i = 0; i < allLocations.length - 1; i++) {
    const pointA = allLocations[i];
    const pointB = allLocations[i + 1];
    
    const segmentDistance = calculateHaversineDistance(
      pointA.lat, pointA.lng, 
      pointB.lat, pointB.lng
    );
    
    const segmentTime = estimateTravelTime(
      segmentDistance, 
      options.mode || 'drive'
    );
    
    totalDistance += segmentDistance;
    totalTime += segmentTime;
    
    // Create a leg for this segment
    legs.push({
      distance: segmentDistance,
      time: segmentTime
    });
  }
  
  // Create a simulated route response
  const fallbackRoute: RouteResponse = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: {
        mode: options.mode || 'drive',
        waypoints: coordinates,
        units: "metric",
        distance: totalDistance,
        distance_units: "meters",
        time: totalTime,
        legs: legs
      },
      geometry: {
        type: "LineString",
        coordinates: coordinates
      }
    }],
    properties: {
      mode: options.mode || 'drive',
      waypoints: coordinates,
      units: "metric",
      distance: totalDistance,
      distance_units: "meters",
      time: totalTime
    }
  };
  
  return fallbackRoute;
}

export async function calculateRoute(
  origin: GeoLocation,
  destination: GeoLocation,
  waypoints: RouteWaypoint[] = [],
  options: RouteOptions = {}
): Promise<RouteResponse> {
  try {
    // Construct URL for API call with correct format
    const url = new URL(GEOAPIFY_BASE_URL);
    url.searchParams.append('apiKey', GEOAPIFY_API_KEY);
    
    // Format all waypoints correctly
    // The API requires waypoints in format: lon1,lat1|lon2,lat2|...
    const allPoints = [
      origin,
      ...waypoints.map(wp => wp.location),
      destination
    ];
    
    // For Geoapify, format is lon,lat (note: longitude first, then latitude)
    const waypointsParam = allPoints.map(point => {
      return `${point.lng},${point.lat}`;
    }).join('|');
    
    url.searchParams.append('waypoints', waypointsParam);
    
    // Set mode (default to drive if not specified)
    const mode = options.mode || 'drive';
    url.searchParams.append('mode', mode);
    
    // Add traffic option if specified
    if (options.traffic) {
      url.searchParams.append('traffic', 'true');
    }
    
    // Add avoid options (pipe separated)
    if (options.avoid && options.avoid.length > 0) {
      url.searchParams.append('avoid', options.avoid.join('|'));
    }
    
    // Add details (pipe separated)
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
      console.warn(`Geoapify API returned error ${response.status}: ${errorText}`);
      console.log("Switching to fallback route calculation");
      return calculateFallbackRoute(origin, destination, waypoints, options);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating route with Geoapify:', error);
    console.log("Using fallback route calculation due to API error");
    return calculateFallbackRoute(origin, destination, waypoints, options);
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
    // Validate input and handle edge cases
    if (!geoapifyRoute || !geoapifyRoute.features || geoapifyRoute.features.length === 0) {
      console.error('Invalid Geoapify route data:', geoapifyRoute);
      throw new Error('Invalid Geoapify route data');
    }
    
    // Get the first feature which contains the main route
    const mainFeature = geoapifyRoute.features[0];
    
    if (!mainFeature.geometry || !mainFeature.geometry.coordinates || !Array.isArray(mainFeature.geometry.coordinates)) {
      console.error('Missing or invalid coordinates in Geoapify response:', mainFeature);
      throw new Error('Missing route coordinates in Geoapify response');
    }
    
    // Extract properties with safe defaults
    const properties = mainFeature.properties || {};
    const totalDistance = properties.distance || 0; // in meters
    const totalTime = properties.time || 0; // in seconds
    const coordinates = mainFeature.geometry.coordinates;
    
    // Log the coordinates for debugging
    console.log(`Received ${coordinates.length} coordinate points from Geoapify`);
    
    // Create a path that Google Maps can use (convert [lon, lat] to {lat, lng})
    // Make sure we handle potentially malformed coordinates
    const path = coordinates.map((coord: any, index: number) => {
      // Ensure coord is an array with at least 2 elements
      if (!Array.isArray(coord) || coord.length < 2) {
        console.warn(`Malformed coordinate at index ${index}:`, coord);
        return null;
      }
      
      return {
        lat: parseFloat(coord[1]),
        lng: parseFloat(coord[0])
      };
    }).filter((point: any): point is {lat: number, lng: number} => point !== null); // Filter out any null values
    
    if (path.length === 0) {
      throw new Error('No valid coordinates found in Geoapify response');
    }
    
    // Log route quality info
    console.log(`Successfully processed ${path.length} valid coordinate points`);
    
    // Create a simplified leg structure if detailed legs are not available
    let legs = [];
    
    if (properties.legs && Array.isArray(properties.legs) && properties.legs.length > 0) {
      // If we have detailed leg information
      legs = properties.legs.map((leg: any) => ({
        distance: { 
          text: formatDistance(leg.distance || 0),
          value: leg.distance || 0
        },
        duration: { 
          text: formatTime(leg.time || 0),
          value: leg.time || 0
        },
        start_location: path[0],
        end_location: path[path.length - 1],
        steps: Array.isArray(leg.steps) ? leg.steps.map((step: any) => ({
          distance: { text: formatDistance(step.distance || 0), value: step.distance || 0 },
          duration: { text: formatTime(step.time || 0), value: step.time || 0 },
          instructions: step.instruction || "Continue",
          path: []
        })) : []
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
        start_location: path[0],
        end_location: path[path.length - 1],
        steps: []
      }];
    }
    
    // Create a Google Maps-compatible structure
    return {
      routes: [{
        bounds: {
          north: Math.max(...path.map((p: {lat: number, lng: number}) => p.lat)),
          south: Math.min(...path.map((p: {lat: number, lng: number}) => p.lat)), 
          east: Math.max(...path.map((p: {lat: number, lng: number}) => p.lng)),
          west: Math.min(...path.map((p: {lat: number, lng: number}) => p.lng))
        },
        legs: legs,
        overview_path: path,
        overview_polyline: {
          points: 'encoded_polyline_placeholder' // Placeholder since this is only used for visualization
        }
      }],
      geocoded_waypoints: [
        { place_id: 'origin_placeholder' },
        { place_id: 'destination_placeholder' }
      ],
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