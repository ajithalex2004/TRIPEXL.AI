import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Building, MapPin, Store, Landmark } from 'lucide-react';
import { Location } from './map-view-new';
import { useToast } from '@/hooks/use-toast';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

// Define common UAE cities and areas for quicker access
const UAE_COMMON_LOCATIONS = [
  { name: "Dubai", coordinates: { lat: 25.276987, lng: 55.296249 } },
  { name: "Abu Dhabi", coordinates: { lat: 24.466667, lng: 54.366667 } },
  { name: "Sharjah", coordinates: { lat: 25.357119, lng: 55.391068 } },
  { name: "Al Ain", coordinates: { lat: 24.191651, lng: 55.760343 } },
  { name: "Ajman", coordinates: { lat: 25.411130, lng: 55.435307 } },
  { name: "Ras Al Khaimah", coordinates: { lat: 25.789295, lng: 55.942479 } },
  { name: "Fujairah", coordinates: { lat: 25.123082, lng: 56.326787 } },
  { name: "Umm Al Quwain", coordinates: { lat: 25.565895, lng: 55.553185 } },
];

// UAE popular landmarks
const UAE_LANDMARKS = [
  // Dubai landmarks
  { name: "Dubai Mall", coordinates: { lat: 25.197197, lng: 55.274376 }, area: "Downtown Dubai", city: "Dubai" },
  { name: "Burj Khalifa", coordinates: { lat: 25.197304, lng: 55.274136 }, area: "Downtown Dubai", city: "Dubai" },
  { name: "Mall of the Emirates", coordinates: { lat: 25.117591, lng: 55.200055 }, area: "Al Barsha", city: "Dubai" },
  { name: "Dubai Marina", coordinates: { lat: 25.0762, lng: 55.1388 }, area: "Dubai Marina", city: "Dubai" },
  { name: "Palm Jumeirah", coordinates: { lat: 25.116911, lng: 55.138180 }, area: "Jumeirah", city: "Dubai" },
  { name: "Dubai Airport (DXB)", coordinates: { lat: 25.252777, lng: 55.364445 }, area: "Al Garhoud", city: "Dubai" },
  
  // Abu Dhabi landmarks
  { name: "Sheikh Zayed Grand Mosque", coordinates: { lat: 24.412315, lng: 54.475241 }, area: "Abu Dhabi", city: "Abu Dhabi" },
  { name: "Al Wahda Mall", coordinates: { lat: 24.4800, lng: 54.3755 }, area: "Al Wahda", city: "Abu Dhabi" },
  { name: "Abu Dhabi Mall", coordinates: { lat: 24.497345, lng: 54.380612 }, area: "Tourist Club Area", city: "Abu Dhabi" },
  { name: "Yas Mall", coordinates: { lat: 24.4858, lng: 54.6079 }, area: "Yas Island", city: "Abu Dhabi" },
  { name: "Abu Dhabi Airport", coordinates: { lat: 24.443588, lng: 54.651487 }, area: "Khalifa City", city: "Abu Dhabi" },
  
  // Sharjah landmarks  
  { name: "Sharjah City Centre", coordinates: { lat: 25.328608, lng: 55.424537 }, area: "Sharjah", city: "Sharjah" },
  { name: "Al Majaz Waterfront", coordinates: { lat: 25.3248, lng: 55.3827 }, area: "Al Majaz", city: "Sharjah" },
];

interface UAELocationSearchProps {
  onLocationSelect: (location: Location) => void;
  className?: string;
  placeholder?: string;
}

export function UAELocationSearch({ 
  onLocationSelect, 
  className = '',
  placeholder = 'Search for UAE locations...'
}: UAELocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Load Google Maps API and initialize autocomplete
  useEffect(() => {
    // Load recent locations from localStorage
    try {
      const stored = localStorage.getItem('recentMapLocations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentLocations(parsed.slice(0, 5)); // Only keep top 5
        }
      }
    } catch (err) {
      console.error('Error loading recent locations:', err);
    }
    
    // Load Google Maps API
    if (!window.google?.maps?.places) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        toast({
          title: 'Configuration Error',
          description: 'Maps API key is missing. Please contact support.',
          variant: 'destructive'
        });
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        console.log('Google Maps API loaded');
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        toast({
          title: 'Error',
          description: 'Failed to load location services',
          variant: 'destructive'
        });
      };
    }
    
    // Set initial search results
    const allLocations = [...UAE_COMMON_LOCATIONS, ...UAE_LANDMARKS];
    setSearchResults(allLocations);
  }, [toast]);
  
  // Update search results based on query
  useEffect(() => {
    if (!query.trim()) {
      // When empty, show all locations
      const allLocations = [...UAE_COMMON_LOCATIONS, ...UAE_LANDMARKS];
      setSearchResults(allLocations);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    
    // Filter common locations and landmarks
    const filteredCommon = UAE_COMMON_LOCATIONS.filter(
      loc => loc.name.toLowerCase().includes(lowerQuery)
    );
    
    const filteredLandmarks = UAE_LANDMARKS.filter(
      loc => loc.name.toLowerCase().includes(lowerQuery) || 
             loc.area.toLowerCase().includes(lowerQuery) ||
             loc.city.toLowerCase().includes(lowerQuery)
    );
    
    // Prioritize exact matches
    const results = [...filteredCommon, ...filteredLandmarks].sort((a, b) => {
      // Exact name match gets highest priority
      if (a.name.toLowerCase() === lowerQuery) return -1;
      if (b.name.toLowerCase() === lowerQuery) return 1;
      
      // Then partial name matches
      const aNameMatch = a.name.toLowerCase().includes(lowerQuery);
      const bNameMatch = b.name.toLowerCase().includes(lowerQuery);
      if (aNameMatch && !bNameMatch) return -1;
      if (bNameMatch && !aNameMatch) return 1;
      
      // Priority for Al Wahda Mall
      if (lowerQuery.includes('al wahd')) {
        if (a.name === 'Al Wahda Mall') return -1;
        if (b.name === 'Al Wahda Mall') return 1;
      }
      
      // Default ordering
      return a.name.localeCompare(b.name);
    });
    
    setSearchResults(results);
  }, [query]);
  
  // Function to handle location selection
  const handleLocationSelect = (location: any) => {
    // Transform to proper Location type
    const selectedLocation: Location = {
      address: location.name + (location.area ? `, ${location.area}` : '') + (location.city ? `, ${location.city}` : '') + ', UAE',
      coordinates: location.coordinates,
      place_id: '', // Not provided by static data
      name: location.name,
      formatted_address: location.name + (location.area ? `, ${location.area}` : '') + (location.city ? `, ${location.city}` : '') + ', UAE',
      district: location.city || undefined,
      city: location.city || undefined,
      area: location.area || undefined
    };
    
    // Save to recent locations
    saveRecentLocation(selectedLocation);
    
    // Call the handler
    onLocationSelect(selectedLocation);
    setOpen(false);
    setQuery(''); // Reset search field
  };
  
  // Save a selected location to localStorage
  const saveRecentLocation = (location: Location) => {
    try {
      // Get existing locations
      const stored = localStorage.getItem('recentMapLocations');
      const existing = stored ? JSON.parse(stored) : [];
      
      // Remove duplicates
      const filtered = existing.filter((loc: Location) => 
        loc.address !== location.address
      );
      
      // Add new location to beginning
      const updated = [location, ...filtered].slice(0, 5);
      
      // Save back to localStorage and state
      localStorage.setItem('recentMapLocations', JSON.stringify(updated));
      setRecentLocations(updated);
    } catch (err) {
      console.error('Error saving recent location:', err);
    }
  };
  
  // Function to get appropriate icon for location type
  const getLocationIcon = (location: any) => {
    // City icon
    if (UAE_COMMON_LOCATIONS.some(city => city.name === location.name)) {
      return <Building className="mr-2 h-4 w-4" />;
    }
    
    // Landmark icon
    if (location.area && location.city) {
      return <Landmark className="mr-2 h-4 w-4" />;
    }
    
    // Default icon
    return <MapPin className="mr-2 h-4 w-4" />;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative w-full">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pr-8"
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {query ? (
              <X
                className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                }}
              />
            ) : (
              <Search 
                className="h-4 w-4 text-muted-foreground"
                onClick={() => setOpen(true)}
              />
            )}
          </div>
        </div>
        
        <PopoverTrigger asChild>
          <div className="hidden">
            {/* Hidden trigger element */}
            <button />
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="p-0 w-[300px] max-h-[400px] overflow-auto" align="start">
          <Command>
            <CommandInput 
              placeholder="Search UAE locations..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No locations found</CommandEmpty>
              
              {recentLocations.length > 0 && (
                <CommandGroup heading="Recent Locations">
                  {recentLocations.map((location, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      value={`recent-${location.name}`}
                      onSelect={() => onLocationSelect(location)}
                    >
                      <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                      <span>{location.name}</span>
                      {location.area && <span className="ml-1 text-muted-foreground text-xs">{location.area}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {searchResults.length > 0 && (
                <CommandGroup heading="Locations">
                  {searchResults.map((location, index) => (
                    <CommandItem
                      key={`result-${index}`}
                      value={location.name}
                      onSelect={() => handleLocationSelect(location)}
                    >
                      {getLocationIcon(location)}
                      <span>{location.name}</span>
                      {location.area && (
                        <span className="ml-1 text-muted-foreground text-xs">
                          {location.area}, {location.city}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default UAELocationSearch;