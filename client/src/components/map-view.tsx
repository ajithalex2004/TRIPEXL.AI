import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadScriptNext, GoogleMap, Marker, InfoWindow, DirectionsRenderer, Libraries } from "@react-google-maps/api";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Search, Locate, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const defaultCenter = {
  lat: 24.466667,
  lng: 54.366667
};

const defaultZoom = 11;

// Define libraries once outside the component to avoid reloading issues
// Using a constant memoized array to avoid performance warnings
const libraries: Libraries = ["places", "geometry"];

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export interface MapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
  onRouteCalculated?: (duration: number) => void;
}

interface PopupLocation {
  lat: number;
  lng: number;
  address: string;
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

export function MapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect,
  onRouteCalculated
}: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsInitialized, setMapsInitialized] = useState(false);
  const [popupLocation, setPopupLocation] = useState<PopupLocation | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const drawRoute = async () => {
    if (!pickupLocation || !dropoffLocation || !map || !mapsInitialized || typeof google === 'undefined') {
      console.log("Missing location data or Google Maps not initialized:", { pickupLocation, dropoffLocation, googleDefined: typeof google !== 'undefined', mapsInitialized });
      return;
    }

    try {
      setIsLoading(true);
      setMapError(null);

      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: pickupLocation.coordinates,
        destination: dropoffLocation.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        provideRouteAlternatives: false,
        avoidHighways: false,
        avoidTolls: false,
      });

      if (!result.routes.length) {
        throw new Error("No route found");
      }

      setDirectionsResult(result);
      const durationInSeconds = result.routes[0].legs[0].duration?.value || 0;
      console.log("Route duration calculated:", durationInSeconds);

      // Always notify parent component about route duration
      if (onRouteCalculated) {
        onRouteCalculated(durationInSeconds);
      }

      setRouteInfo({
        distance: result.routes[0].legs[0].distance?.text || "Unknown",
        duration: result.routes[0].legs[0].duration?.text || "Unknown"
      });

      // Fit map to show the entire route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupLocation.coordinates);
      bounds.extend(dropoffLocation.coordinates);
      map.fitBounds(bounds);

    } catch (error) {
      console.error("Error calculating route:", error);
      setMapError("Could not calculate route between locations");
      setDirectionsResult(null);
      setRouteInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (map && pickupLocation && dropoffLocation && mapsInitialized && typeof google !== 'undefined') {
      drawRoute();
    }
  }, [pickupLocation, dropoffLocation, map, mapsInitialized]);

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onLocationSelect || !mapsInitialized || typeof google === 'undefined') return;

    try {
      setIsLoading(true);
      setMapError(null);
      
      if (typeof google === 'undefined') {
        throw new Error("Google Maps API is not initialized in handleMapClick");
      }
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat: e.latLng.lat(), lng: e.latLng.lng() } });

      if (result.results[0]) {
        const place = result.results[0];
        setPopupLocation({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          address: place.formatted_address || "",
          place_id: place.place_id,
          name: (place as any).name,
          formatted_address: place.formatted_address
        });
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      setMapError("Failed to get location details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationTypeSelect = (type: 'pickup' | 'dropoff') => {
    if (!popupLocation || !map) return;

    const location: Location = {
      address: popupLocation.address,
      coordinates: {
        lat: popupLocation.lat,
        lng: popupLocation.lng
      },
      name: popupLocation.name || popupLocation.address,
      formatted_address: popupLocation.formatted_address || popupLocation.address,
      place_id: popupLocation.place_id
    };

    onLocationSelect?.(location, type);
    setPopupLocation(null);
  };

  const handleMapLoad = (map: google.maps.Map) => {
    if (typeof google === 'undefined') {
      console.error("Google Maps API not initialized in handleMapLoad");
      return;
    }
    setMap(map);
    setMapsInitialized(true);
    map.setCenter(defaultCenter);
    map.setZoom(defaultZoom);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !map || !mapsInitialized || typeof google === 'undefined') return;

    try {
      setIsLoading(true);
      setMapError(null);
      
      if (typeof google === 'undefined') {
        throw new Error("Google Maps API is not initialized in handleSearch");
      }
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchQuery });
      
      if (result.results.length > 0) {
        const place = result.results[0];
        // Add type casting to handle missing properties in typings
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || searchQuery,
          place_id: place.place_id,
          name: (place as any).name,
          formatted_address: place.formatted_address
        };
        
        // Center the map on the found location
        map.setCenter(location);
        map.setZoom(15);
        
        // Show the location popup
        setPopupLocation(location);
      } else {
        setMapError("No locations found for your search");
      }
    } catch (error) {
      console.error("Error searching for location:", error);
      setMapError("Failed to search for location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  
  const handleGetCurrentLocation = () => {
    if (!map || !mapsInitialized || typeof google === 'undefined') return;
    
    setIsLoading(true);
    setMapError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            if (typeof google === 'undefined') {
              throw new Error("Google Maps API is not initialized");
            }
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ location: coords });
            
            if (result.results.length > 0) {
              const place = result.results[0];
              const location = {
                lat: coords.lat,
                lng: coords.lng,
                address: place.formatted_address || "Your location",
                place_id: place.place_id,
                name: (place as any).name,
                formatted_address: place.formatted_address
              };
              
              // Center the map on the found location
              map.setCenter(coords);
              map.setZoom(15);
              
              // Show the location popup
              setPopupLocation(location);
            } else {
              setPopupLocation({
                lat: coords.lat,
                lng: coords.lng,
                address: "Your location",
              });
              map.setCenter(coords);
              map.setZoom(15);
            }
          } catch (error) {
            console.error("Error reverse geocoding location:", error);
            setPopupLocation({
              lat: coords.lat,
              lng: coords.lng,
              address: "Your location",
            });
            map.setCenter(coords);
            map.setZoom(15);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMapError("Could not access your location. Please check browser permissions.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setMapError("Geolocation is not supported by your browser");
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 h-full relative shadow-lg">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <VehicleLoadingIndicator size="lg" />
        </div>
      )}
      
      {mapError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}
      
      {!MAPS_API_KEY && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Missing</AlertTitle>
          <AlertDescription>Google Maps API key is not configured. Please contact support.</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 space-y-2">
        <h3 className="font-medium text-lg">Interactive Map</h3>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-[10px] text-white font-bold">P</div>
            <span className="text-sm">Pickup</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
            <span className="text-sm">Drop-off</span>
          </div>
        </div>

        <div className="relative mb-2">
          <div className="flex">
            <Input
              ref={searchBoxRef}
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pr-10"
            />
            <Button 
              variant="ghost" 
              size="icon"
              type="button"
              onClick={handleSearch}
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGetCurrentLocation}
            className="w-full flex items-center gap-2 mt-2 text-primary"
          >
            <Locate className="h-4 w-4" />
            <span>Use my current location</span>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Click on the map or search for a location to set pickup and drop-off points
        </p>
      </div>

      <LoadScriptNext
        googleMapsApiKey={MAPS_API_KEY}
        libraries={libraries}
        loadingElement={
          <div className="h-full w-full flex items-center justify-center min-h-[400px]">
            <VehicleLoadingIndicator size="lg" />
          </div>
        }
        onLoad={() => {
          console.log("Google Maps script loaded successfully");
          setMapsInitialized(true);
        }}
        onError={(error) => {
          console.error("Google Maps script failed to load:", error);
          setLoadError(new Error("Failed to load Google Maps"));
        }}
        failureElement={
          <div className="h-[500px] flex flex-col items-center justify-center border border-dashed rounded-md p-5 bg-muted/30">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Google Maps Failed to Load</h3>
            <p className="text-center text-muted-foreground mb-4">
              Unable to load Google Maps. Please check your internet connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload
            </Button>
          </div>
        }
      >
        {loadError ? (
          <div className="h-[500px] flex flex-col items-center justify-center border border-dashed rounded-md p-5 bg-muted/30">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Google Maps Error</h3>
            <p className="text-center text-muted-foreground mb-4">
              {loadError.message || "Failed to load Google Maps. Please check your API key or try again later."}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload
            </Button>
          </div>
        ) : (
          <div className="h-[500px] relative">
            <GoogleMap
              mapContainerStyle={{
                width: '100%',
                height: '100%',
                borderRadius: '8px'
              }}
              center={defaultCenter}
              zoom={defaultZoom}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                clickableIcons: true,
                mapTypeId: typeof google !== 'undefined' ? google.maps.MapTypeId.ROADMAP : 'roadmap',
                styles: [
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "on" }]
                  }
                ]
              }}
            >
              {directionsResult && (
                <DirectionsRenderer
                  directions={directionsResult}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#4F46E5",
                      strokeWeight: 5,
                      strokeOpacity: 0.8
                    }
                  }}
                />
              )}

              {pickupLocation && (
                <Marker
                  position={pickupLocation.coordinates}
                  icon={{
                    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
                    fillColor: "#22c55e",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 12,
                  }}
                  label={{
                    text: "P",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                />
              )}

              {dropoffLocation && (
                <Marker
                  position={dropoffLocation.coordinates}
                  icon={{
                    path: typeof google !== 'undefined' ? google.maps.SymbolPath.CIRCLE : 0,
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    scale: 12,
                  }}
                  label={{
                    text: "D",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}
                />
              )}

              {popupLocation && (
                <InfoWindow
                  position={{ lat: popupLocation.lat, lng: popupLocation.lng }}
                  onCloseClick={() => setPopupLocation(null)}
                  options={{
                    maxWidth: 320,
                    pixelOffset: typeof google !== 'undefined' ? new google.maps.Size(0, -5) : undefined
                  }}
                >
                  <div className="p-2 space-y-3 min-w-[250px]">
                    <div className="border-b pb-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {popupLocation.formatted_address || popupLocation.name || popupLocation.address}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('pickup')}
                        variant="default"
                        disabled={!!pickupLocation}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                      >
                        Set as Pickup
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLocationTypeSelect('dropoff')}
                        variant={pickupLocation && !dropoffLocation ? "default" : "outline"}
                        disabled={!pickupLocation || !!dropoffLocation}
                        className={`w-full sm:w-auto ${pickupLocation && !dropoffLocation ? "bg-red-600 hover:bg-red-700" : ""}`}
                      >
                        Set as Dropoff
                      </Button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        )}
      </LoadScriptNext>

      {mapError && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{mapError}</AlertDescription>
        </Alert>
      )}

      {routeInfo && pickupLocation && dropoffLocation && (
        <div className="mt-4 p-4 border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-lg">Route Information</h3>
            <div className="bg-primary/10 rounded-full px-3 py-1.5 text-sm font-medium text-primary">
              {routeInfo.distance}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Travel Time</p>
              <p className="text-sm text-muted-foreground">{routeInfo.duration}</p>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <div className="flex gap-3">
              <div className="min-w-[24px] flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[10px] text-white font-bold">P</div>
                <div className="h-full border-l-2 border-dashed border-muted-foreground/30 my-1"></div>
              </div>
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">
                  {pickupLocation.formatted_address || pickupLocation.name || pickupLocation.address}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="min-w-[24px]">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold">D</div>
              </div>
              <div>
                <p className="font-medium">Drop-off Location</p>
                <p className="text-sm text-muted-foreground">
                  {dropoffLocation.formatted_address || dropoffLocation.name || dropoffLocation.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}