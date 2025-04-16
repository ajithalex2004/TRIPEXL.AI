import React, { useState, useEffect } from 'react';
import { Loader2, Cloud, AlertTriangle, Clock, Map, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWeatherForLocation, getEventsNearLocation, WeatherData, EventData } from '@/lib/weather-service';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WeatherEventOverlayProps {
  coordinates?: { lat: number; lng: number } | null;
  className?: string;
}

export function WeatherEventOverlay({ 
  coordinates, 
  className = '' 
}: WeatherEventOverlayProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [activeTab, setActiveTab] = useState('weather');

  useEffect(() => {
    const fetchWeatherAndEvents = async () => {
      if (!coordinates) {
        setWeather(null);
        setEvents([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch weather and events in parallel
        const [weatherData, eventsData] = await Promise.all([
          getWeatherForLocation(coordinates.lat, coordinates.lng),
          getEventsNearLocation(coordinates.lat, coordinates.lng)
        ]);

        setWeather(weatherData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Failed to fetch weather or events:', err);
        setError('Unable to load weather and event information');
        setWeather(null);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherAndEvents();
  }, [coordinates]);

  // Format a date string for display
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-AE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Format a date for event display
  const formatEventTime = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const startStr = startDate.toLocaleTimeString('en-AE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    const endStr = endDate.toLocaleTimeString('en-AE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    const today = new Date();
    
    let datePrefix = '';
    if (startDate.toDateString() === today.toDateString()) {
      datePrefix = 'Today';
    } else if (
      new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString() === 
      startDate.toDateString()
    ) {
      datePrefix = 'Tomorrow';
    } else {
      datePrefix = startDate.toLocaleDateString('en-AE', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return `${datePrefix}, ${startStr} - ${endStr}`;
  };

  // Get impact level badge color
  const getImpactColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return '';
    }
  };

  if (!coordinates) {
    return null;
  }

  return (
    <Card className={`${className} overflow-hidden`}>
      <Tabs defaultValue="weather" onValueChange={setActiveTab}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {activeTab === 'weather' ? 'Weather Conditions' : 'Local Events'}
            </CardTitle>
            <TabsList>
              <TabsTrigger value="weather" className="text-xs px-3">
                <Cloud className="h-3 w-3 mr-1" />
                Weather
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs px-3">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Events {events.length > 0 && `(${events.length})`}
              </TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>
            {weather ? `For ${weather.locationName}, UAE` : 'Loading location data...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-6">
              <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <TabsContent value="weather" className="m-0">
                {weather && (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-4xl mr-2">{weather.icon}</span>
                        <div>
                          <div className="text-2xl font-semibold">{weather.temperature}°C</div>
                          <div className="text-sm text-muted-foreground">{weather.condition}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Humidity: {weather.humidity}%</div>
                        <div className="text-sm">Wind: {weather.windSpeed} km/h</div>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1 inline" />
                      <span>Updated at {formatTime(weather.timestamp)}</span>
                    </div>
                    
                    {events.length > 0 && (
                      <div className="mt-2 pt-2 text-sm">
                        <span className="font-medium text-amber-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {events.length} event{events.length !== 1 ? 's' : ''} may affect travel
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="events" className="m-0">
                {events.length === 0 ? (
                  <div className="py-4 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-muted-foreground">No events affecting this area</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="rounded-lg border p-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium leading-tight">{event.title}</div>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${getImpactColor(event.impactLevel)}`}
                          >
                            {event.impactLevel} impact
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1 mb-2">
                          {event.description}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatEventTime(event.startTime, event.endTime)}</span>
                          </div>
                          <div className="flex items-center">
                            <Map className="h-3 w-3 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <div className="w-full flex justify-end">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Info className="h-3 w-3 mr-1" />
              Travel Advisory
            </Button>
          </div>
        </CardFooter>
      </Tabs>
    </Card>
  );
}