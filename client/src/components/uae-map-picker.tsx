import React, { useState, useEffect } from 'react';
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
  Bus,
  Building2
} from "lucide-react";

// Use the same Location interface as in booking-form.tsx
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

export interface UAEMapPickerProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
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
  { name: "Sharjah Aquarium", coordinates: { lat: 25.356595, lng: 55.383424 }, address: "Sharjah Aquarium, Sharjah, UAE" },
  // Add more business locations
  { name: "Dubai Media City", coordinates: { lat: 25.0914, lng: 55.1589 }, address: "Dubai Media City, Dubai, UAE" },
  { name: "Dubai Healthcare City", coordinates: { lat: 25.2285, lng: 55.3273 }, address: "Dubai Healthcare City, Dubai, UAE" },
  { name: "Jumeirah Beach Residence", coordinates: { lat: 25.0803, lng: 55.1339 }, address: "JBR, Dubai Marina, Dubai, UAE" },
  { name: "Dubai World Trade Centre", coordinates: { lat: 25.2253, lng: 55.2867 }, address: "Dubai World Trade Centre, Dubai, UAE" },
  { name: "Dubai Internet City", coordinates: { lat: 25.0996, lng: 55.1740 }, address: "Dubai Internet City, Dubai, UAE" },
  { name: "Masdar City", coordinates: { lat: 24.4267, lng: 54.6160 }, address: "Masdar City, Abu Dhabi, UAE" },
  { name: "ADNEC", coordinates: { lat: 24.4181, lng: 54.4339 }, address: "Abu Dhabi National Exhibition Centre, Abu Dhabi, UAE" },
  { name: "Business Bay", coordinates: { lat: 25.1872, lng: 55.2750 }, address: "Business Bay, Dubai, UAE" },
  { name: "DIFC", coordinates: { lat: 25.2149, lng: 55.2783 }, address: "Dubai International Financial Centre, Dubai, UAE" }
];

// Enhanced UAEMapPicker component with custom location selection
export function UAEMapPicker({
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onLocationSelect,
  editable = true
}: UAEMapPickerProps) {
  console.log("UAEMapPicker rendering with:", { pickupLocation, dropoffLocation, waypoints });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<typeof UAE_LOCATIONS>([]);
  const [activeTab, setActiveTab] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapKey, setMapKey] = useState<number>(0); // For forced re-renders

  // Log component mounting
  useEffect(() => {
    console.log("UAEMapPicker mounted");
    return () => console.log("UAEMapPicker unmounted");
  }, []);

  // Force re-render when pickup or dropoff locations change
  useEffect(() => {
    setMapKey(prev => prev + 1);
    console.log("Location changed, forcing map re-render");
  }, [pickupLocation, dropoffLocation]);

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
    console.log(`Found ${results.length} locations matching "${searchQuery}"`);
  };

  // Handle enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to handle selection of a location
  const handleLocationSelect = (location: typeof UAE_LOCATIONS[0], type: 'pickup' | 'dropoff') => {
    if (!onLocationSelect) {
      console.warn("UAEMapPicker: onLocationSelect callback is not provided");
      return;
    }
    
    const selectedLocation: Location = {
      address: location.address,
      coordinates: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      },
      name: location.name,
      place_id: "", // Required placeholder
      formatted_address: location.address
    };
    
    console.log(`UAEMapPicker: Selected ${type} location:`, selectedLocation);
    onLocationSelect(selectedLocation, type);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Function to handle direct address entry
  const handleAddressEntry = (type: 'pickup' | 'dropoff') => {
    if (!onLocationSelect || !searchQuery.trim()) {
      console.warn("UAEMapPicker: Cannot set location - missing callback or empty search query");
      return;
    }
    
    // For simplicity, we'll use UAE coordinates with the entered address
    const defaultCoords = type === 'pickup' ? DUBAI : ABU_DHABI;
    
    // Create a location from the entered address
    const location: Location = {
      address: searchQuery,
      coordinates: {
        lat: defaultCoords.lat,
        lng: defaultCoords.lng
      },
      name: searchQuery,
      place_id: "", // Required placeholder
      formatted_address: searchQuery
    };
    
    console.log(`UAEMapPicker: Setting manual ${type} location:`, location);
    onLocationSelect(location, type);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Get distance between two points in kilometers using Haversine formula
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Generate a static map visualization with improved UI
  const renderStaticMap = () => {
    const hasPickup = !!pickupLocation;
    const hasDropoff = !!dropoffLocation;
    
    // Calculate distance if both points exist
    let distance = 0;
    if (hasPickup && hasDropoff && pickupLocation && dropoffLocation) {
      distance = getDistanceInKm(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng,
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );
    }
    
    return (
      <div key={mapKey} className="relative bg-slate-100 rounded-md overflow-hidden" style={{ width: '100%', height: '400px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 p-4">
          <div className="bg-white rounded-lg shadow-md p-2 text-sm mb-2 border-l-4 border-blue-500">
            <span className="font-medium">UAE Interactive Map</span> - Select locations using the search box below
          </div>
          
          {/* Draw the map visualization */}
          <div className="relative bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-blue-200 h-[300px] overflow-hidden shadow-inner">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="absolute top-10 left-10 w-20 h-32 bg-slate-400 rounded-md transform rotate-12"></div>
              <div className="absolute top-40 left-60 w-16 h-20 bg-slate-400 rounded-md transform -rotate-6"></div>
              <div className="absolute top-20 right-40 w-12 h-24 bg-slate-400 rounded-md transform rotate-3"></div>
              <div className="absolute bottom-10 right-20 w-24 h-16 bg-slate-400 rounded-md transform -rotate-9"></div>
            </div>
            
            {/* Roads */}
            <div className="absolute top-1/3 left-0 right-0 h-[2px] bg-slate-400"></div>
            <div className="absolute top-2/3 left-0 right-0 h-[2px] bg-slate-400"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-[2px] bg-slate-400"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-[2px] bg-slate-400"></div>
            
            {/* City markers */}
            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <Building2 className="text-blue-800 mb-1" size={20} />
                <span className="text-blue-800 font-bold text-xs bg-white/70 px-2 py-0.5 rounded">Dubai</span>
              </div>
            </div>
            <div className="absolute top-3/4 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center">
                <Building2 className="text-blue-800 mb-1" size={20} />
                <span className="text-blue-800 font-bold text-xs bg-white/70 px-2 py-0.5 rounded">Abu Dhabi</span>
              </div>
            </div>
            
            {/* Water */}
            <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-blue-300 opacity-30 rounded-tl-[100px]"></div>
            
            {/* Pickup point */}
            {hasPickup && pickupLocation && (
              <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full shadow-md bg-green-500 text-white animate-pulse">
                    <MapPin size={16} />
                  </div>
                  <div className="mt-1 bg-white px-2 py-0.5 rounded text-xs font-medium shadow-sm max-w-[120px] truncate text-center">
                    {pickupLocation.name || pickupLocation.address.split(',')[0]}
                  </div>
                </div>
              </div>
            )}
            
            {/* Dropoff point */}
            {hasDropoff && dropoffLocation && (
              <div className="absolute top-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full shadow-md bg-red-500 text-white">
                    <Navigation size={16} />
                  </div>
                  <div className="mt-1 bg-white px-2 py-0.5 rounded text-xs font-medium shadow-sm max-w-[120px] truncate text-center">
                    {dropoffLocation.name || dropoffLocation.address.split(',')[0]}
                  </div>
                </div>
              </div>
            )}
            
            {/* Route line */}
            {hasPickup && hasDropoff && (
              <div className="absolute top-1/3 left-1/4 right-3/4 h-[3px] bg-blue-600 z-10"
                style={{
                  width: '50%',
                  backgroundImage: 'linear-gradient(to right, #10B981, #3B82F6, #EF4444)'
                }}
              />
            )}
            
            {/* Distance indicator */}
            {hasPickup && hasDropoff && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 shadow-md border border-blue-100 flex items-center gap-1">
                  <span className="text-blue-500">~{distance.toFixed(1)} km</span>
                  {distance > 0 && (
                    <span className="text-slate-500 text-[10px]">•</span>
                  )}
                  {distance > 0 && (
                    <span className="text-slate-500 text-[10px]">~{Math.round(distance / 50 * 60)} min</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Map features */}
            <div className="absolute bottom-2 right-2 bg-white/80 rounded-full px-2 py-1">
              <div className="flex gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <CarFront size={12} className="text-slate-400" /> 
                  <span className="text-[10px]">Transport</span>
                </span>
                <span className="flex items-center gap-1">
                  <Bus size={12} className="text-slate-400" />
                  <span className="text-[10px]">Transit</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border shadow-md">
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
              type="button"
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
              type="button"
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
                    onKeyPress={handleSearchKeyPress}
                    className="pr-8"
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={handleSearch}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
              <Button
                type="button"
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
                  type="button"
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
}

export default UAEMapPicker;