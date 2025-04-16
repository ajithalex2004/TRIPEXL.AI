import React, { useEffect, useState } from 'react';
import { Cloudy, CloudRain, Droplets, Wind, SunSnow, ThermometerSun, CloudSun, CalendarRange } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WeatherEventOverlayProps {
  coordinates?: { lat: number; lng: number };
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: React.ReactNode;
}

export function WeatherEventOverlay({ coordinates }: WeatherEventOverlayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coordinates) return;
    
    // Instead of making actual API calls, we'll simulate weather data for UAE
    // This would normally be an API call to a weather service
    const getSimulatedWeather = () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        // Get current month (1-12)
        const month = new Date().getMonth() + 1;
        
        // UAE weather varies by season
        let simulatedWeather: WeatherData;
        
        // Summer (May to September)
        if (month >= 5 && month <= 9) {
          simulatedWeather = {
            temperature: Math.floor(Math.random() * 10) + 35, // 35-45°C
            condition: Math.random() > 0.8 ? 'Hazy' : 'Clear',
            humidity: Math.floor(Math.random() * 20) + 40, // 40-60%
            windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
            icon: <ThermometerSun className="h-5 w-5 text-orange-500" />
          };
        }
        // Winter (December to February)
        else if (month >= 12 || month <= 2) {
          simulatedWeather = {
            temperature: Math.floor(Math.random() * 10) + 20, // 20-30°C
            condition: Math.random() > 0.7 ? 'Partly Cloudy' : 'Clear',
            humidity: Math.floor(Math.random() * 20) + 50, // 50-70%
            windSpeed: Math.floor(Math.random() * 15) + 10, // 10-25 km/h
            icon: <CloudSun className="h-5 w-5 text-blue-500" />
          };
        }
        // Spring/Fall
        else {
          simulatedWeather = {
            temperature: Math.floor(Math.random() * 10) + 25, // 25-35°C
            condition: Math.random() > 0.6 ? 'Partly Cloudy' : 'Clear',
            humidity: Math.floor(Math.random() * 20) + 45, // 45-65%
            windSpeed: Math.floor(Math.random() * 12) + 8, // 8-20 km/h
            icon: <CloudSun className="h-5 w-5 text-blue-400" />
          };
        }
        
        // Simulate nearby events
        let simulatedEvents = [];
        
        // Randomly choose 0-2 events
        const numEvents = Math.floor(Math.random() * 3);
        const possibleEvents = [
          "Road construction on Sheikh Zayed Road",
          "Traffic congestion near Dubai Mall",
          "Lane closure on Al Khail Road",
          "Event at World Trade Centre",
          "Heavy traffic near Mall of the Emirates",
          "Accident on Emirates Road",
          "Traffic diversion near Burj Khalifa",
          "Road maintenance in Jumeirah",
          "Exhibition at Dubai Exhibition Centre",
          "Concert at Coca-Cola Arena"
        ];
        
        for (let i = 0; i < numEvents; i++) {
          const randomIndex = Math.floor(Math.random() * possibleEvents.length);
          simulatedEvents.push(possibleEvents[randomIndex]);
          // Remove the selected event to avoid duplicates
          possibleEvents.splice(randomIndex, 1);
        }
        
        setWeather(simulatedWeather);
        setEvents(simulatedEvents);
        setLoading(false);
      }, 800); // Simulate loading time
    };
    
    getSimulatedWeather();
    
    // In a real implementation, we would clean up API requests here
    return () => {
      // Cancel any pending API requests
    };
  }, [coordinates]);
  
  if (!coordinates) return null;
  
  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 shadow-lg border-white/10">
      <CardContent className="p-3">
        {loading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-8 w-8"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="h-2 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Weather section */}
            {weather && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {weather.icon}
                  <div>
                    <p className="font-medium text-sm">{weather.condition}</p>
                    <p className="text-xs text-muted-foreground">
                      {weather.temperature}°C | Humidity: {weather.humidity}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs">{weather.windSpeed} km/h</span>
                </div>
              </div>
            )}
            
            {/* Area events */}
            {events.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-1 mb-1">
                  <CalendarRange className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs font-medium">Nearby events</p>
                </div>
                <ul className="text-xs space-y-1">
                  {events.map((event, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-amber-500 inline-block mt-0.5">•</span>
                      <span className="text-muted-foreground">{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {events.length === 0 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <CalendarRange className="h-3.5 w-3.5 text-green-500" />
                  <p className="text-xs text-muted-foreground">No traffic events reported nearby</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default WeatherEventOverlay;