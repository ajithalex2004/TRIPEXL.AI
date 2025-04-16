/**
 * Weather service to fetch weather data for locations
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  locationName: string;
  timestamp: string;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  category: string;
  impactLevel: 'low' | 'medium' | 'high';
}

// Using UAE's major cities for simulated weather data
const UAE_CITIES = {
  'Dubai': { lat: 25.276987, lng: 55.296249 },
  'Abu Dhabi': { lat: 24.4667, lng: 54.3667 },
  'Sharjah': { lat: 25.3575, lng: 55.3919 },
  'Al Ain': { lat: 24.1302, lng: 55.8048 },
  'Ajman': { lat: 25.4111, lng: 55.4354 },
  'Ras Al Khaimah': { lat: 25.7895, lng: 55.9432 },
  'Fujairah': { lat: 25.1279, lng: 56.3287 }
};

// Weather conditions relevant to the UAE region
const WEATHER_CONDITIONS = [
  { condition: 'Clear', icon: '☀️' },
  { condition: 'Partly Cloudy', icon: '⛅' },
  { condition: 'Cloudy', icon: '☁️' },
  { condition: 'Sandstorm', icon: '🌪️' },
  { condition: 'Haze', icon: '🌫️' },
  { condition: 'Light Rain', icon: '🌦️' },
  { condition: 'Thunderstorm', icon: '⛈️' },
  { condition: 'Hot', icon: '🔥' },
  { condition: 'Windy', icon: '💨' }
];

// Event types that might affect transportation
const EVENT_CATEGORIES = [
  'Road Closure',
  'Construction',
  'Public Event',
  'Traffic Accident',
  'Sports Event',
  'Festival',
  'Concert',
  'Conference'
];

/**
 * Find the closest UAE city to a given coordinate
 */
function findClosestCity(lat: number, lng: number): string {
  let closestCity = 'Dubai'; // Default
  let minDistance = Number.MAX_VALUE;
  
  Object.entries(UAE_CITIES).forEach(([city, coords]) => {
    // Simple Euclidean distance - sufficient for this demo
    const distance = Math.sqrt(
      Math.pow(coords.lat - lat, 2) + 
      Math.pow(coords.lng - lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  });
  
  return closestCity;
}

/**
 * Generate weather data for a specific location
 * This is a simulation function that would be replaced with actual API calls
 */
export async function getWeatherForLocation(
  lat: number, 
  lng: number
): Promise<WeatherData> {
  const closestCity = findClosestCity(lat, lng);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get temperature appropriate for UAE (in Celsius)
  const now = new Date();
  const month = now.getMonth();
  
  // UAE seasonal temperature variations
  let baseTemp = 30; // Default base temperature
  
  // Summer months (May to September)
  if (month >= 4 && month <= 8) {
    baseTemp = 38 + Math.random() * 7; // 38-45°C
  } 
  // Winter months (December to February)
  else if (month >= 11 || month <= 1) {
    baseTemp = 20 + Math.random() * 10; // 20-30°C
  }
  // Spring/Fall
  else {
    baseTemp = 25 + Math.random() * 10; // 25-35°C
  }
  
  // Add small variation based on location
  const temperature = Math.round((baseTemp + (Math.random() * 4 - 2)) * 10) / 10;
  
  // Select a weather condition
  const weatherInfo = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
  
  return {
    temperature,
    condition: weatherInfo.condition,
    humidity: Math.round(40 + Math.random() * 30), // 40-70%
    windSpeed: Math.round(5 + Math.random() * 20), // 5-25 km/h
    icon: weatherInfo.icon,
    locationName: closestCity,
    timestamp: now.toISOString()
  };
}

/**
 * Get events that might impact transportation in a specific area
 * This is a simulation function that would be replaced with actual API calls
 */
export async function getEventsNearLocation(
  lat: number, 
  lng: number, 
  radiusKm: number = 10
): Promise<EventData[]> {
  const closestCity = findClosestCity(lat, lng);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Determine how many events to generate (0-3)
  const eventCount = Math.floor(Math.random() * 3);
  const events: EventData[] = [];
  
  // Generate random events
  for (let i = 0; i < eventCount; i++) {
    const category = EVENT_CATEGORIES[Math.floor(Math.random() * EVENT_CATEGORIES.length)];
    const impactLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const impactLevel = impactLevels[Math.floor(Math.random() * impactLevels.length)];
    
    // Create an event title based on the category
    let title = '';
    let description = '';
    
    switch (category) {
      case 'Road Closure':
        title = `${closestCity} Road Closure`;
        description = `Temporary road closure in ${closestCity} area due to maintenance work`;
        break;
      case 'Construction':
        title = `Construction Zone in ${closestCity}`;
        description = `Ongoing construction affecting traffic flow`;
        break;
      case 'Public Event':
        title = `Public Gathering in ${closestCity}`;
        description = `Large public event causing increased foot and vehicle traffic`;
        break;
      case 'Traffic Accident':
        title = `Traffic Incident in ${closestCity}`;
        description = `Accident reported - expect delays and possible detours`;
        break;
      case 'Sports Event':
        title = `${closestCity} Sports Tournament`;
        description = `Sports event with high attendance causing traffic congestion`;
        break;
      case 'Festival':
        title = `${closestCity} Festival`;
        description = `Cultural festival with road restrictions and high attendance`;
        break;
      case 'Concert':
        title = `Concert in ${closestCity}`;
        description = `Major concert event with traffic management in place`;
        break;
      case 'Conference':
        title = `Business Conference in ${closestCity}`;
        description = `Large business conference causing increased traffic in business district`;
        break;
      default:
        title = `Event in ${closestCity}`;
        description = `Unspecified event affecting traffic conditions`;
    }
    
    // Create a random duration between 1-6 hours
    const now = new Date();
    const startTime = new Date(now.getTime() + Math.random() * 3600000 * 2); // Start within next 2 hours
    const endTime = new Date(startTime.getTime() + (1 + Math.random() * 5) * 3600000); // 1-6 hours duration
    
    events.push({
      id: `event-${closestCity}-${i}-${Date.now()}`,
      title,
      description,
      location: `${closestCity}, UAE`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      category,
      impactLevel
    });
  }
  
  return events;
}