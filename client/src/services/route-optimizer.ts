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
  alternativeRoutes?: google.maps.DirectionsResult[];
  trafficAlerts: string[];
  weatherAlerts: string[];
  segmentAnalysis: string[];
}

export class RouteOptimizer {
  private async getWeatherConditions(location: Location): Promise<WeatherCondition> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.coordinates.lat}&lon=${location.coordinates.lng}&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data = await response.json();
      return {
        condition: data.weather[0].main,
        visibility: data.visibility,
        rain: data.rain?.["1h"],
        snow: data.snow?.["1h"]
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return {
        condition: "Clear",
        visibility: 10000
      };
    }
  }

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
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      });

      const route = result.routes[0];
      const legs = route.legs[0];
      const segments: TrafficSegment[] = [];
      const incidents: TrafficIncident[] = [];

      // Analyze each step of the route for traffic conditions
      legs.steps.forEach((step, index) => {
        const nextStep = legs.steps[index + 1];
        if (nextStep) {
          const duration = step.duration?.value || 0;
          const distance = step.distance?.value || 0;
          const speed = (distance / 1000) / (duration / 3600); // km/h

          // Calculate congestion for this segment
          const congestionLevel = this.calculateSegmentCongestion(speed, step);

          segments.push({
            start: step.start_location,
            end: step.end_location,
            duration: duration,
            congestionLevel: congestionLevel
          });

          // Check for traffic incidents
          if (congestionLevel > 150) {
            incidents.push({
              location: step.start_location,
              type: "Heavy Traffic",
              description: "Severe congestion detected",
              severity: 3
            });
          }
        }
      });

      return {
        congestionLevel: this.calculateCongestionLevel(legs),
        averageSpeed: this.calculateAverageSpeed(legs),
        segments,
        incidents
      };
    } catch (error) {
      console.error("Error fetching traffic data:", error);
      throw new Error("Failed to fetch traffic data");
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
    const trafficDuration = legs.duration_in_traffic?.value || normalDuration;
    return (trafficDuration / normalDuration) * 100;
  }

  private calculateAverageSpeed(legs: google.maps.DirectionsLeg): number {
    const distance = legs.distance?.value || 0; // in meters
    const duration = legs.duration_in_traffic?.value || legs.duration?.value || 0; // in seconds
    return (distance / 1000) / (duration / 3600);
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

  private async optimizeRoute(
    origin: Location,
    destination: Location,
    weather: WeatherCondition,
    traffic: TrafficInfo
  ): Promise<RouteOptimizationResult> {
    const directionsService = new google.maps.DirectionsService();
    const trafficAlerts: string[] = [];
    const weatherAlerts: string[] = [];
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
      trafficAlerts.push(`⚠️ ${incident.description} near ${incident.location.toString()}`);
    });

    if (traffic.averageSpeed < 20) {
      trafficAlerts.push("🐢 Very slow traffic conditions - Expect delays");
    }

    try {
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

      // Calculate estimated time considering both weather and traffic
      const weatherMultiplier = this.getWeatherMultiplier(weather);
      const trafficMultiplier = traffic.congestionLevel > 150 ? 1.5 : 
                               traffic.congestionLevel > 120 ? 1.3 : 1;

      const baseDuration = result.routes[0].legs[0].duration?.value || 0;
      const estimatedTime = Math.round(baseDuration * weatherMultiplier * trafficMultiplier);

      return {
        route: result,
        estimatedTime,
        alternativeRoutes: result.routes.slice(1),
        weatherAlerts,
        trafficAlerts,
        segmentAnalysis
      };
    } catch (error) {
      console.error("Error optimizing route:", error);
      throw new Error("Failed to optimize route");
    }
  }

  public async getOptimizedRoute(
    origin: Location,
    destination: Location
  ): Promise<RouteOptimizationResult> {
    try {
      const [weather, traffic] = await Promise.all([
        this.getWeatherConditions(origin),
        this.getTrafficInfo(origin, destination)
      ]);

      return await this.optimizeRoute(origin, destination, weather, traffic);
    } catch (error) {
      console.error("Error in route optimization:", error);
      throw new Error("Failed to get optimized route");
    }
  }
}

export const routeOptimizer = new RouteOptimizer();