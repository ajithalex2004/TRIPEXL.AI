import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";
import { 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Search, 
  CarFront, 
  Check,
  Bus
} from "lucide-react";

// Simple interface for location
interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

interface SimpleGoogleMapsProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff' | 'waypoint') => void;
  editable?: boolean;
}

// Dubai coordinates
const DUBAI = { lat: 25.276987, lng: 55.296249 };
// Abu Dhabi coordinates
const ABU_DHABI = { lat: 24.466667, lng: 54.366667 };

// List of popular UAE locations with coordinates
const UAE_LOCATIONS = [
  { name: "Dubai Mall", coordinates: { lat: 25.197197, lng: 55.274376 }, address: "Dubai Mall, Downtown Dubai, UAE" },
  { name: "Burj Khalifa", coordinates: { lat: 25.197304, lng: 55.274136 }, address: "Burj Khalifa, Downtown Dubai, UAE" },
  { name: "Abu Dhabi Mall", coordinates: { lat: 24.497345, lng: 54.380612 }, address: "Abu Dhabi Mall, Tourist Club Area, Abu Dhabi, UAE" },
  { name: "Dubai Airport (DXB)", coordinates: { lat: 25.252777, lng: 55.364445 }, address: "Dubai International Airport, Dubai, UAE" },
  { name: "Abu Dhabi Airport", coordinates: { lat: 24.443588, lng: 54.651487 }, address: "Abu Dhabi International Airport, Abu Dhabi, UAE" },
  { name: "Palm Jumeirah", coordinates: { lat: 25.116911, lng: 55.138180 }, address: "Palm Jumeirah, Dubai, UAE" },
  { name: "Sheikh Zayed Grand Mosque", coordinates: { lat: 24.412315, lng: 54.475241 }, address: "Sheikh Zayed Grand Mosque, Abu Dhabi, UAE" },
  { name: "Ferrari World", coordinates: { lat: 24.483667, lng: 54.607161 }, address: "Ferrari World, Yas Island, Abu Dhabi, UAE" },
  { name: "Mall of the Emirates", coordinates: { lat: 25.117591, lng: 55.200055 }, address: "Mall of the Emirates, Al Barsha, Dubai, UAE" },
  { name: "Sharjah City Centre", coordinates: { lat: 25.328608, lng: 55.424537 }, address: "Sharjah City Centre, Sharjah, UAE" },
  { name: "Ajman City Centre", coordinates: { lat: 25.410352, lng: 55.479776 }, address: "Ajman City Centre, Ajman, UAE" },
  { name: "Ras Al Khaimah Mall", coordinates: { lat: 25.794100, lng: 55.975180 }, address: "RAK Mall, Ras Al Khaimah, UAE" },
  { name: "Fujairah Mall", coordinates: { lat: 25.123335, lng: 56.327890 }, address: "Fujairah Mall, Fujairah, UAE" },
  { name: "Umm Al Quwain Mall", coordinates: { lat: 25.576537, lng: 55.550917 }, address: "Umm Al Quwain Mall, Umm Al Quwain, UAE" },
  { name: "Global Village", coordinates: { lat: 25.069551, lng: 55.305202 }, address: "Global Village, Dubai, UAE" },
  { name: "Dubai Marina", coordinates: { lat: 25.075094, lng: 55.132759 }, address: "Dubai Marina, Dubai, UAE" },
  { name: "Al Ain Zoo", coordinates: { lat: 24.175926, lng: 55.740697 }, address: "Al Ain Zoo, Al Ain, UAE" },
  { name: "Dubai Miracle Garden", coordinates: { lat: 25.062319, lng: 55.248203 }, address: "Dubai Miracle Garden, Dubailand, Dubai, UAE" },
  { name: "Jebel Jais", coordinates: { lat: 25.937967, lng: 56.131822 }, address: "Jebel Jais, Ras Al Khaimah, UAE" },
  { name: "Sharjah Aquarium", coordinates: { lat: 25.356595, lng: 55.383424 }, address: "Sharjah Aquarium, Sharjah, UAE" }
];

// Enhanced SimpleGoogleMaps component with custom location selection
const SimpleGoogleMaps: React.FC<SimpleGoogleMapsProps> = ({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof UAE_LOCATIONS>([]);
  const [activeTab, setActiveTab] = useState<'pickup' | 'dropoff'>('pickup');

  // Function to handle searching UAE locations
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = UAE_LOCATIONS.filter(location => 
      location.name.toLowerCase().includes(query) || 
      location.address.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
  };

  // Function to handle selection of a location
  const handleLocationSelect = (location: typeof UAE_LOCATIONS[0], type: 'pickup' | 'dropoff') => {
    if (!onLocationSelect) return;
    
    const selectedLocation: Location = {
      address: location.address,
      coordinates: location.coordinates,
      name: location.name
    };
    
    onLocationSelect(selectedLocation, type);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Function to handle direct address entry
  const handleAddressEntry = (type: 'pickup' | 'dropoff') => {
    if (!onLocationSelect || !searchQuery.trim()) return;
    
    // For simplicity, we'll use UAE coordinates with the entered address
    const defaultCoords = type === 'pickup' ? DUBAI : ABU_DHABI;
    
    // Create a location from the entered address
    const location: Location = {
      address: searchQuery,
      coordinates: defaultCoords
    };
    
    onLocationSelect(location, type);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Get distance between two points in kilometers using Haversine formula
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  // Convert degrees to radians
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Generate a static map visualization
  const renderStaticMap = () => {
    const hasPickup = !!pickupLocation;
    const hasDropoff = !!dropoffLocation;
    const mapWidth = 600;
    const mapHeight = 400;
    
    // Create virtual coordinates for visualization
    const virtualPoints: {x: number, y: number, type: string, label: string}[] = [];
    
    if (hasPickup) {
      virtualPoints.push({
        x: mapWidth * 0.25,
        y: mapHeight * 0.5,
        type: 'pickup',
        label: pickupLocation!.address.split(',')[0]
      });
    }
    
    if (hasDropoff) {
      virtualPoints.push({
        x: mapWidth * 0.75,
        y: mapHeight * 0.5,
        type: 'dropoff',
        label: dropoffLocation!.address.split(',')[0]
      });
    }
    
    // Calculate distance if both points exist
    let distance = 0;
    if (hasPickup && hasDropoff) {
      distance = getDistanceInKm(
        pickupLocation!.coordinates.lat,
        pickupLocation!.coordinates.lng,
        dropoffLocation!.coordinates.lat,
        dropoffLocation!.coordinates.lng
      );
    }
    
    return (
      <div className="relative bg-slate-100 rounded-md overflow-hidden" style={{ width: '100%', height: '400px' }}>
        <div className="absolute inset-0 bg-slate-200 p-4">
          <div className="bg-white rounded-lg shadow-md p-2 text-sm mb-2">
            This is a representative map view. Select locations using the controls below.
          </div>
          
          {/* Draw the map visualization */}
          <div className="relative bg-blue-50 rounded-lg border border-blue-200 h-[300px] overflow-hidden">
            {/* Map title */}
            <div className="absolute top-2 left-0 right-0 text-center text-sm font-semibold text-blue-700">
              UAE Interactive Map
            </div>
            
            {/* City labels */}
            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-blue-800 font-bold">
              Dubai
            </div>
            <div className="absolute top-3/4 right-1/3 transform -translate-x-1/2 -translate-y-1/2 text-blue-800 font-bold">
              Abu Dhabi
            </div>
            
            {/* Water */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-blue-300 opacity-50"></div>
            
            {/* Draw route if both points exist */}
            {hasPickup && hasDropoff && (
              <>
                <div className="absolute"
                  style={{
                    top: `${virtualPoints[0].y}px`,
                    left: `${virtualPoints[0].x}px`,
                    width: `${virtualPoints[1].x - virtualPoints[0].x}px`,
                    height: '4px',
                    background: 'linear-gradient(90deg, #10B981 0%, #EF4444 100%)',
                    transformOrigin: 'left center'
                  }}
                />
                
                {/* Distance label */}
                <div className="absolute bg-white px-2 py-1 rounded-full text-xs font-medium text-slate-700 shadow-sm"
                  style={{
                    top: `${(virtualPoints[0].y + virtualPoints[1].y) / 2 - 15}px`,
                    left: `${(virtualPoints[0].x + virtualPoints[1].x) / 2 - 40}px`,
                  }}
                >
                  ~{distance.toFixed(1)} km
                </div>
              </>
            )}
            
            {/* Draw the markers */}
            {virtualPoints.map((point, index) => (
              <div key={index} className="absolute"
                style={{
                  top: `${point.y - 20}px`,
                  left: `${point.x - 10}px`,
                }}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full shadow-md text-white
                  ${point.type === 'pickup' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                  {point.type === 'pickup' ? <MapPin size={14} /> : <Navigation size={14} />}
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs font-medium shadow-sm whitespace-nowrap">
                  {point.label}
                </div>
              </div>
            ))}
            
            {/* Map features */}
            <div className="absolute bottom-2 right-2 flex gap-1 text-xs text-slate-500">
              <Bus size={12} /> <CarFront size={12} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
          <VehicleLoadingIndicator />
        </div>
      )}
      
      {/* Map area */}
      {renderStaticMap()}
      
      {/* Location selection interface */}
      {editable && (
        <div className="p-4 space-y-4">
          {/* Tabs for pickup/dropoff */}
          <div className="flex border-b">
            <button
              className={`flex-1 pb-2 font-medium text-sm flex items-center justify-center gap-1 ${
                activeTab === 'pickup' 
                  ? 'text-green-600 border-b-2 border-green-500' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('pickup')}
            >
              <MapPin size={16} />
              Set Pickup
            </button>
            <button
              className={`flex-1 pb-2 font-medium text-sm flex items-center justify-center gap-1 ${
                activeTab === 'dropoff' 
                  ? 'text-red-600 border-b-2 border-red-500' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab('dropoff')}
            >
              <Navigation size={16} />
              Set Dropoff
            </button>
          </div>
          
          {/* Search and current location */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="location-search" className="sr-only">Search for a location</Label>
                <div className="relative">
                  <Input
                    id="location-search"
                    type="text"
                    placeholder={`Search for ${activeTab === 'pickup' ? 'pickup' : 'dropoff'} location`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8"
                  />
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={handleSearch}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
              <Button
                variant="outline"
                className={`shrink-0 ${
                  activeTab === 'pickup' 
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                onClick={() => handleAddressEntry(activeTab)}
              >
                {activeTab === 'pickup' ? 'Set Pickup' : 'Set Dropoff'}
              </Button>
            </div>
            
            {/* Current location display */}
            {activeTab === 'pickup' && pickupLocation && (
              <div className="bg-green-50 p-2 rounded-md border border-green-200 flex items-start gap-2">
                <MapPin className="text-green-600 shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Pickup Location</p>
                  <p className="text-xs text-green-700">{pickupLocation.address}</p>
                </div>
                <Check className="text-green-600 shrink-0" size={16} />
              </div>
            )}
            
            {activeTab === 'dropoff' && dropoffLocation && (
              <div className="bg-red-50 p-2 rounded-md border border-red-200 flex items-start gap-2">
                <Navigation className="text-red-600 shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Dropoff Location</p>
                  <p className="text-xs text-red-700">{dropoffLocation.address}</p>
                </div>
                <Check className="text-red-600 shrink-0" size={16} />
              </div>
            )}
          </div>
          
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto border rounded-md">
              <div className="p-2 bg-slate-50 border-b text-xs font-medium text-slate-500">
                {searchResults.length} locations found
              </div>
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2 border-b last:border-b-0"
                  onClick={() => handleLocationSelect(result, activeTab)}
                >
                  {activeTab === 'pickup' ? (
                    <MapPin className="text-green-600 shrink-0 mt-0.5" size={16} />
                  ) : (
                    <Navigation className="text-red-600 shrink-0 mt-0.5" size={16} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{result.name}</p>
                    <p className="text-xs text-slate-500">{result.address}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          )}
          
          <div className="text-xs text-slate-500">
            <p>Select locations using the search box above, then continue with booking</p>
          </div>
        </div>
      )}
    </Card>
  );
};

// Define global interface for window with Google Maps-related properties
declare global {
  interface Window {
    initGoogleMap?: () => void;
    initMap?: () => void;
    google?: any;
  }
}

export default SimpleGoogleMaps;