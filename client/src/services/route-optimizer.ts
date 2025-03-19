import { Location } from "@/components/map-view";

interface TrafficInfo {
  congestionLevel: number;
  averageSpeed: number;
}

interface RouteOptimizationResult {
  route: google.maps.DirectionsResult;
  estimatedTime: number;
  alternativeRoutes?: google.maps.DirectionsResult[];
  trafficAlerts?: string[];
}

export class RouteOptimizer {
  private async getTrafficInfo(
    origin: Location,
    destination: Location
  ): Promise<TrafficInfo> {
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      });

      // Extract traffic information from the route
      const route = result.routes[0];
      const legs = route.legs[0];

      return {
        congestionLevel: this.calculateCongestionLevel(legs),
        averageSpeed: this.calculateAverageSpeed(legs)
      };
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      throw new Error("Failed to fetch traffic data");
    }
  }

  private calculateCongestionLevel(legs: google.maps.DirectionsLeg): number {
    // Calculate congestion level based on duration in traffic vs normal duration
    const normalDuration = legs.duration?.value || 0;
    const trafficDuration = legs.duration_in_traffic?.value || normalDuration;
    return (trafficDuration / normalDuration) * 100;
  }

  private calculateAverageSpeed(legs: google.maps.DirectionsLeg): number {
    // Calculate average speed in km/h
    const distance = legs.distance?.value || 0; // in meters
    const duration = legs.duration_in_traffic?.value || legs.duration?.value || 0; // in seconds
    return (distance / 1000) / (duration / 3600);
  }

  private async optimizeRoute(
    origin: Location,
    destination: Location,
    traffic: TrafficInfo
  ): Promise<RouteOptimizationResult> {
    const directionsService = new google.maps.DirectionsService();
    const trafficAlerts: string[] = [];

    // Check for traffic conditions
    if (traffic.congestionLevel > 150) {
      trafficAlerts.push("Heavy traffic congestion detected");
    } else if (traffic.congestionLevel > 120) {
      trafficAlerts.push("Moderate traffic congestion");
    }

    if (traffic.averageSpeed < 20) {
      trafficAlerts.push("Very slow traffic conditions");
    }

    try {
      // Request multiple routes
      const result = await directionsService.route({
        origin: origin.coordinates,
        destination: destination.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      });

      // Calculate estimated time considering traffic
      const estimatedTime = this.calculateEstimatedTime(
        result.routes[0],
        traffic
      );

      return {
        route: result,
        estimatedTime,
        alternativeRoutes: result.routes.slice(1),
        trafficAlerts
      };
    } catch (error) {
      console.error("Error optimizing route:", error);
      throw new Error("Failed to optimize route");
    }
  }

  private calculateEstimatedTime(
    route: google.maps.DirectionsRoute,
    traffic: TrafficInfo
  ): number {
    const baseDuration = route.legs[0].duration?.value || 0;
    let multiplier = 1;

    // Adjust for traffic conditions
    if (traffic.congestionLevel > 150) multiplier *= 1.5;
    else if (traffic.congestionLevel > 120) multiplier *= 1.3;

    return Math.round(baseDuration * multiplier);
  }

  public async getOptimizedRoute(
    origin: Location,
    destination: Location
  ): Promise<RouteOptimizationResult> {
    try {
      const traffic = await this.getTrafficInfo(origin, destination);
      return await this.optimizeRoute(origin, destination, traffic);
    } catch (error) {
      console.error("Error in route optimization:", error);
      throw new Error("Failed to get optimized route");
    }
  }
}

export const routeOptimizer = new RouteOptimizer();