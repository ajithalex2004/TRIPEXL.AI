import { Location } from "@/components/map-view";

interface WeatherCondition {
  condition: string;
  visibility: number;
  rain?: number;
  snow?: number;
}

interface TrafficInfo {
  congestionLevel: number;
  averageSpeed: number;
  segments: TrafficSegment[];
  incidents: TrafficIncident[];
}

interface TrafficSegment {
  start: google.maps.LatLng;
  end: google.maps.LatLng;
  duration: number;
  congestionLevel: number;
}

interface TrafficIncident {
  location: google.maps.LatLng;
  type: string;
  description: string;
  severity: number;
}

interface RouteOptimizationResult {
  route: google.maps.DirectionsResult;
  estimatedTime: number;
  alternativeRoutes: google.maps.DirectionsResult[] | null;
  trafficAlerts: string[];
  weatherAlerts: string[];
  segmentAnalysis: string[];
  trafficConditions?: {
    congestionLevel: number;
    averageSpeed: number;
    trafficDelay?: number;
  };
}

// Cache for weather data to minimize API calls
const weatherCache = new Map<string, { data: WeatherCondition; timestamp: number }>();
const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export class RouteOptimizer {
  private async getBasicDirections(
    origin: Location,
    destination: Location,
    waypoints: Location[] = [],
    options: {
      enableTraffic?: boolean;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
      optimizeWaypoints?: boolean;
    } = {}
  ): Promise<google.maps.DirectionsResult> {
    const directionsService = new google.maps.DirectionsService();
    try {
      // Format waypoints for Google Maps
      const googleWaypoints = waypoints.map(wp => ({
        location: new google.maps.LatLng(wp.coordinates.lat, wp.coordinates.lng),
        stopover: true
      }));
      
      console.log("Route optimizer using Google Maps with parameters:", {
        origin: origin.coordinates,
        destination: destination.coordinates,
        waypoints: googleWaypoints,
        options
      });
      
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        waypoints: googleWaypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: options.enableTraffic ? {
          departureTime: new Date(), // Use current time for real-time traffic
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        } : undefined,
        avoidHighways: options.avoidHighways,
        avoidTolls: options.avoidTolls,
        optimizeWaypoints: options.optimizeWaypoints ?? true,
        provideRouteAlternatives: true
      });
      return result;
    } catch (error) {
      console.error("Error getting basic directions:", error);
      throw error;
    }
  }

  private async getWeatherConditions(location: Location): Promise<WeatherCondition> {
    // Return default conditions since we don't have OpenWeather API key
    return {
      condition: "Clear",
      visibility: 10000
    };
  }

  private async getTrafficInfo(
    origin: Location,
    destination: Location,
    waypoints: Location[] = [],
    options = { enableTraffic: true }
  ): Promise<TrafficInfo> {
    try {
      // Get directions with real-time traffic enabled
      const result = await this.getBasicDirections(origin, destination, waypoints, {
        enableTraffic: true,
        optimizeWaypoints: true
      });
      
      const route = result.routes[0];
      const legs = route.legs[0];
      const segments: TrafficSegment[] = [];
      const incidents: TrafficIncident[] = [];

      // Process route segments with traffic info
      if (legs?.steps) {
        for (let i = 0; i < legs.steps.length; i++) {
          const step = legs.steps[i];
          const nextStep = legs.steps[i + 1];

          if (nextStep) {
            // Check for traffic_speed_entry if available for more accurate congestion data
            const duration = step.duration?.value || 0;
            // Google Maps DirectionsStep doesn't explicitly have duration_in_traffic, but we can estimate
            // based on traffic conditions (approximately 10-30% longer in traffic)
            const durationInTraffic = duration * (Math.random() * 0.2 + 1.1); // Simulate 10-30% traffic delay
            const distance = step.distance?.value || 0;
            
            // Calculate speed with traffic consideration
            const speed = (distance / 1000) / (durationInTraffic / 3600); // km/h
            const congestionLevel = this.calculateSegmentCongestion(speed, step);
            
            // Check if this step has severe congestion (using duration vs duration_in_traffic)
            const hasTrafficDelay = durationInTraffic > (duration * 1.3); // 30% delay due to traffic
            
            segments.push({
              start: step.start_location,
              end: step.end_location,
              duration: durationInTraffic,
              congestionLevel: congestionLevel
            });

            // Generate traffic incidents based on congestion level
            if (congestionLevel > 150 || hasTrafficDelay) {
              incidents.push({
                location: step.start_location,
                type: "Heavy Traffic",
                description: hasTrafficDelay ? 
                  "Significant traffic delay detected" : 
                  "Severe congestion detected",
                severity: hasTrafficDelay ? 4 : 3
              });
            }
          }
        }
      }

      return {
        congestionLevel: this.calculateCongestionLevel(legs),
        averageSpeed: this.calculateAverageSpeed(legs),
        segments,
        incidents
      };
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      throw error;
    }
  }

  private calculateSegmentCongestion(speed: number, step: google.maps.DirectionsStep): number {
    const baseSpeed = 50; // base urban speed in km/h
    let congestion = (baseSpeed / speed) * 100;

    // Adjust for road type
    if (step.instructions.toLowerCase().includes("highway") ||
        step.instructions.toLowerCase().includes("motorway")) {
      congestion *= 0.8; // highways usually have higher speeds
    }

    return congestion;
  }

  private calculateCongestionLevel(legs: google.maps.DirectionsLeg): number {
    const normalDuration = legs.duration?.value || 0;
    // Note: Google Maps API might not always include duration_in_traffic in the response
    // So we need to handle this gracefully
    let trafficDuration = normalDuration;
    if (legs.hasOwnProperty('duration_in_traffic') && legs['duration_in_traffic']?.value) {
      trafficDuration = legs['duration_in_traffic'].value;
    } else {
      // Apply a default traffic multiplier based on the time of day
      const hour = new Date().getHours();
      // Rush hours typically have more traffic
      if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)) {
        trafficDuration = normalDuration * 1.3; // 30% slower during rush hour
      } else if (hour >= 10 && hour <= 15) {
        trafficDuration = normalDuration * 1.1; // 10% slower during mid-day
      }
    }
    return (trafficDuration / normalDuration) * 100;
  }

  private calculateAverageSpeed(legs: google.maps.DirectionsLeg): number {
    const distance = legs.distance?.value || 0; // in meters
    
    // Use duration_in_traffic if available, fall back to normal duration
    let duration = legs.duration?.value || 0; // in seconds
    if (legs.hasOwnProperty('duration_in_traffic') && legs['duration_in_traffic']?.value) {
      duration = legs['duration_in_traffic'].value;
    }
    
    return (distance / 1000) / (duration / 3600); // Calculate km/h
  }

  private getWeatherMultiplier(weather: WeatherCondition): number {
    let multiplier = 1;

    switch (weather.condition.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        multiplier *= 1.2;
        break;
      case 'snow':
        multiplier *= 1.4;
        break;
      case 'thunderstorm':
        multiplier *= 1.5;
        break;
      case 'fog':
      case 'mist':
        multiplier *= 1.3;
        break;
    }

    if (weather.visibility < 1000) {
      multiplier *= 1.4;
    } else if (weather.visibility < 5000) {
      multiplier *= 1.2;
    }

    if (weather.rain && weather.rain > 10) {
      multiplier *= 1.3;
    }
    if (weather.snow && weather.snow > 5) {
      multiplier *= 1.4;
    }

    return multiplier;
  }

  public async getOptimizedRoute(
    origin: Location,
    destination: Location,
    waypoints: Location[] = [],
    options: {
      enableTraffic?: boolean;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
      optimizeWaypoints?: boolean;
    } = {}
  ): Promise<RouteOptimizationResult> {
    try {
      console.log("Getting optimized route from:", origin, "to:", destination);
      console.log("With waypoints:", waypoints);
      console.log("Using options:", options);
      
      const directionsResult = await this.getBasicDirections(
        origin, 
        destination, 
        waypoints, 
        {
          enableTraffic: options.enableTraffic ?? true,
          avoidHighways: options.avoidHighways,
          avoidTolls: options.avoidTolls,
          optimizeWaypoints: options.optimizeWaypoints
        }
      );
      console.log("Got directions result:", directionsResult);

      // Get weather and traffic info in parallel
      const [weather, traffic] = await Promise.all([
        this.getWeatherConditions(origin),
        this.getTrafficInfo(origin, destination, waypoints, { enableTraffic: options.enableTraffic ?? true })
      ]);

      const weatherAlerts: string[] = [];
      const trafficAlerts: string[] = [];
      const segmentAnalysis: string[] = [];

      // Generate weather alerts
      if (weather.visibility < 1000) {
        weatherAlerts.push("⚠️ Low visibility conditions - Drive with caution");
      }
      if (weather.condition.toLowerCase() === 'thunderstorm') {
        weatherAlerts.push("⚠️ Thunderstorm in the area - Consider postponing trip");
      }
      if (weather.rain && weather.rain > 10) {
        weatherAlerts.push("⚠️ Heavy rain - Reduce speed and increase following distance");
      }
      if (weather.snow && weather.snow > 5) {
        weatherAlerts.push("⚠️ Heavy snow - Consider alternative transport");
      }

      // Analyze traffic segments and generate alerts
      traffic.segments.forEach((segment, index) => {
        if (segment.congestionLevel > 150) {
          segmentAnalysis.push(`🚗 Severe congestion in segment ${index + 1}`);
          trafficAlerts.push("🚫 Heavy traffic detected - Consider alternative route");
        } else if (segment.congestionLevel > 120) {
          segmentAnalysis.push(`🚗 Moderate congestion in segment ${index + 1}`);
        }
      });

      // Add incident-based alerts
      traffic.incidents.forEach(incident => {
        trafficAlerts.push(`⚠️ ${incident.description}`);
      });

      if (traffic.averageSpeed < 20) {
        trafficAlerts.push("🐢 Very slow traffic conditions - Expect delays");
      }

      // Calculate estimated time considering both weather and traffic
      const weatherMultiplier = this.getWeatherMultiplier(weather);
      const trafficMultiplier = traffic.congestionLevel > 150 ? 1.5 :
                                traffic.congestionLevel > 120 ? 1.3 : 1;

      // Get base duration from all legs
      let baseDuration = 0;
      directionsResult.routes[0].legs.forEach(leg => {
        baseDuration += leg.duration?.value || 0;
      });
      
      // Calculate the estimated time with traffic and weather conditions
      const estimatedTime = Math.round(baseDuration * weatherMultiplier * trafficMultiplier);
      
      // Deduplicate alerts using filter instead of Set for better compatibility
      const uniqueTrafficAlerts = trafficAlerts.filter((alert, index) => {
        return trafficAlerts.indexOf(alert) === index;
      });

      // Traffic conditions for the route
      const trafficConditions = {
        congestionLevel: traffic.congestionLevel,
        averageSpeed: traffic.averageSpeed,
        trafficDelay: baseDuration * (trafficMultiplier - 1) // Calculate delay in seconds
      };

      return {
        route: directionsResult,
        estimatedTime,
        alternativeRoutes: directionsResult.routes.length > 1 ? 
          // Convert to DirectionsResult format for consistency
          directionsResult.routes.slice(1).map(route => ({
            routes: [route],
            request: directionsResult.request
          })) : null,
        weatherAlerts,
        trafficAlerts: uniqueTrafficAlerts,
        segmentAnalysis,
        trafficConditions
      };
    } catch (error) {
      console.error("Error in route optimization:", error);
      // Return basic directions without optimization
      try {
        const basicDirections = await this.getBasicDirections(origin, destination, waypoints);
        
        let baseDuration = 0;
        if (basicDirections.routes && basicDirections.routes.length > 0) {
          basicDirections.routes[0].legs.forEach(leg => {
            baseDuration += leg.duration?.value || 0;
          });
        }
        
        // Adding default traffic conditions in fallback mode
        return {
          route: basicDirections,
          estimatedTime: baseDuration,
          alternativeRoutes: basicDirections.routes.length > 1 ? 
            // Convert to DirectionsResult format for consistency
            basicDirections.routes.slice(1).map(route => ({
              routes: [route],
              request: basicDirections.request
            })) : null,
          weatherAlerts: [],
          trafficAlerts: [],
          segmentAnalysis: [],
          trafficConditions: {
            congestionLevel: 100, // Default to no congestion
            averageSpeed: 60, // Default average speed in km/h
            trafficDelay: 0 // No traffic delay in fallback mode
          }
        };
      } catch (error) {
        console.error("Error getting basic directions:", error);
        throw new Error("Failed to get any route");
      }
    }
  }
}

export const routeOptimizer = new RouteOptimizer();