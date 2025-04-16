import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Location } from "./map-view-new";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Building, Home, Store, Landmark, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

// UAE-specific areas and landmarks
const UAE_COMMON_LANDMARKS = [
  { name: "Dubai Mall", area: "Downtown Dubai", city: "Dubai" },
  { name: "Burj Khalifa", area: "Downtown Dubai", city: "Dubai" },
  { name: "Mall of the Emirates", area: "Al Barsha", city: "Dubai" },
  { name: "Dubai Marina", area: "Dubai Marina", city: "Dubai" },
  { name: "Sheikh Zayed Grand Mosque", area: "Abu Dhabi", city: "Abu Dhabi" },
  { name: "Yas Island", area: "Yas Island", city: "Abu Dhabi" },
  { name: "Central Souq", area: "Al Jubail", city: "Sharjah" },
  { name: "Al Ain Zoo", area: "Al Ain", city: "Al Ain" },
];

interface UAELocationAutocompleteProps {
  value: string;
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  onSearchChange?: (query: string) => void;
  onFocus?: () => void;
  onClear?: () => void; // Add a callback for clearing the location
  inputId?: string;
  className?: string;
  isPickup?: boolean; // To customize display for pickup or dropoff
  allowClear?: boolean; // Whether to show the clear button
}

export function UAELocationAutocomplete({
  value,
  placeholder,
  onLocationSelect,
  onSearchChange,
  onFocus,
  onClear,
  inputId,
  className,
  isPickup = true,
  allowClear = true, // Default to showing clear button
}: UAELocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [recentSelections, setRecentSelections] = useState<Location[]>([]);
  const [suggestedLocations, setSuggestedLocations] = useState<any[]>([]);
  const [query, setQuery] = useState<string>(value || "");
  const { toast } = useToast();

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps API already loaded");
        initAutocomplete();
        return;
      }
      
      const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
      
      console.log("Google Maps API Key available:", MAPS_API_KEY ? "Yes (key length: " + MAPS_API_KEY.length + ")" : "No");
      console.log("Using environment variable:", !!import.meta.env.VITE_GOOGLE_MAPS_KEY);
      
      if (!MAPS_API_KEY) {
        console.error("Google Maps API key is missing from environment variables");
        toast({
          title: "Configuration Error",
          description: "Maps API configuration issue. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if script is already in the DOM
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        console.log("Google Maps script tag already exists");
        // If script exists but Google isn't loaded, wait for it
        if (!window.google || !window.google.maps) {
          existingScript.addEventListener('load', initAutocomplete);
        } else {
          initAutocomplete();
        }
        return;
      }
      
      // Create and add the script
      const script = document.createElement("script");
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places&callback=Function.prototype`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = initAutocomplete;
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        toast({
          title: "Maps Error",
          description: "Failed to load location services. Please try again later.",
          variant: "destructive",
        });
      };
    };

    function initAutocomplete() {
      if (!inputRef.current || !window.google?.maps?.places) {
        return;
      }

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "AE" },
        fields: ["place_id", "name", "formatted_address", "geometry", "types", "address_components"],
        types: ["establishment", "geocode", "address", "point_of_interest"],
        strictBounds: true,
        bounds: new google.maps.LatLngBounds(
          { lat: 22.6, lng: 51.5 }, // SW bound for UAE (expanded for better coverage)
          { lat: 26.5, lng: 56.4 }  // NE bound for UAE
        )
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (place?.geometry?.location) {
          // Extract district, city, and area from address components
          let district = "";
          let city = "";
          let area = "";
          
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes("sublocality") || component.types.includes("neighborhood")) {
                area = component.long_name;
              } else if (component.types.includes("locality")) {
                city = component.long_name;
              } else if (component.types.includes("administrative_area_level_1")) {
                district = component.long_name;
              }
            }
          }
          
          // Create enhanced location object
          const location: Location = {
            address: place.formatted_address || place.name || "",
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            place_id: place.place_id || "",
            name: place.name || "",
            formatted_address: place.formatted_address || "",
            district: district || undefined,
            city: city || undefined,
            area: area || undefined,
            place_types: place.types || []
          };
          
          // Store this selection in recent locations
          saveRecentLocation(location);
          
          onLocationSelect(location);
          setOpen(false);
          setError(null);
        } else {
          setError("Please select a valid location from the dropdown");
        }
      });
    }

    // Try to load Google Maps if not already available
    if (!window.google?.maps?.places) {
      loadGoogleMapsScript();
    } else {
      initAutocomplete();
    }

    // Try to load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const storedLocations = localStorage.getItem("recentLocations");
        if (storedLocations) {
          const locations = JSON.parse(storedLocations);
          setRecentSelections(locations.slice(0, 5)); // Keep only 5 recent locations
        }
      } catch (err) {
        console.error("Error loading recent locations:", err);
      }
    };
    
    loadRecentLocations();

    return () => {
      // No need to remove the script as it should be cached for reuse
    };
  }, [onLocationSelect, toast]);

  // Save a recently selected location
  const saveRecentLocation = (location: Location) => {
    try {
      // Get existing recent locations
      const storedLocations = localStorage.getItem("recentLocations");
      let locations: Location[] = storedLocations ? JSON.parse(storedLocations) : [];
      
      // Remove duplicates (based on place_id or address)
      locations = locations.filter(loc => 
        (location.place_id && loc.place_id !== location.place_id) || 
        (!location.place_id && loc.address !== location.address)
      );
      
      // Add the new location at the beginning
      locations.unshift(location);
      
      // Keep only the 5 most recent
      locations = locations.slice(0, 5);
      
      // Update state and localStorage
      setRecentSelections(locations);
      localStorage.setItem("recentLocations", JSON.stringify(locations));
    } catch (err) {
      console.error("Error saving recent location:", err);
    }
  };

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Update suggestions based on input - show all matches as user types
  useEffect(() => {
    // Always show suggestions when dropdown is open
    if (!query && !open) {
      // When empty and not focused, show nothing
      setSuggestedLocations([]);
      return;
    } else if (!query && open) {
      // When empty but focused, show all available locations
      setSuggestedLocations([...UAE_COMMON_LOCATIONS, ...UAE_COMMON_LANDMARKS]);
      return;
    }

    // When typing, filter based on query
    const queryLower = query.toLowerCase();
    
    // First check common cities and areas - match partial text
    const filteredCommonLocations = UAE_COMMON_LOCATIONS.filter(
      location => location.name.toLowerCase().includes(queryLower)
    );
    
    // Then check landmarks - match partial text in any field
    const filteredLandmarks = UAE_COMMON_LANDMARKS.filter(
      landmark => 
        landmark.name.toLowerCase().includes(queryLower) ||
        landmark.area.toLowerCase().includes(queryLower) ||
        landmark.city.toLowerCase().includes(queryLower)
    );
    
    setSuggestedLocations([...filteredCommonLocations, ...filteredLandmarks]);
  }, [query, open]);

  // Handle selection from suggested locations
  const handleSuggestionSelect = (suggestion: any) => {
    // Handle different types of suggestions
    let location: Location;
    
    if ('coordinates' in suggestion) {
      // This is a common city/area
      location = {
        address: suggestion.name,
        coordinates: suggestion.coordinates,
        name: suggestion.name,
        formatted_address: suggestion.name + ", UAE"
      };
    } else {
      // This is a landmark
      // For landmarks, we need to geocode to get precise coordinates
      // For simplicity, we'll use approximate coordinates here
      location = {
        address: `${suggestion.name}, ${suggestion.area}, ${suggestion.city}, UAE`,
        coordinates: { 
          // Use Dubai's coordinates as fallback if needed
          lat: 25.276987, 
          lng: 55.296249
        },
        name: suggestion.name,
        formatted_address: `${suggestion.name}, ${suggestion.area}, ${suggestion.city}, UAE`,
        district: suggestion.city,
        city: suggestion.city,
        area: suggestion.area
      };
      
      // In a production app, we would geocode this address to get precise coordinates
      // For this demo, we'll manually look up coordinates for some common landmarks
      if (suggestion.name === "Dubai Mall" || suggestion.name === "Burj Khalifa") {
        location.coordinates = { lat: 25.197197, lng: 55.274376 };
      } else if (suggestion.name === "Mall of the Emirates") {
        location.coordinates = { lat: 25.118984, lng: 55.200276 };
      } else if (suggestion.name === "Dubai Marina") {
        location.coordinates = { lat: 25.076303, lng: 55.138798 };
      } else if (suggestion.name === "Sheikh Zayed Grand Mosque") {
        location.coordinates = { lat: 24.412346, lng: 54.475568 };
      } else if (suggestion.name === "Yas Island") {
        location.coordinates = { lat: 24.499372, lng: 54.607182 };
      }
    }
    
    // Call the handler and update state
    onLocationSelect(location);
    saveRecentLocation(location);
    setOpen(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setError(null);
    onSearchChange?.(newValue);
  };

  const renderIcon = (location: any) => {
    // Check if it's a recent location, landmark, or city
    if (location.place_types?.includes('route')) {
      return <MapPin className="mr-2 h-4 w-4" />;
    } else if (location.place_types?.includes('establishment')) {
      return <Building className="mr-2 h-4 w-4" />;
    } else if (location.city && location.name) {
      return <Landmark className="mr-2 h-4 w-4" />;
    } else {
      return <Store className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              value={query}
              placeholder={placeholder}
              onChange={handleInputChange}
              onFocus={() => {
                setOpen(true);
                onFocus?.();
              }}
              className={cn(error ? "border-destructive" : "", "pr-10")}
            />
            {value && allowClear ? (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClear) {
                    onClear();
                  }
                }}
                aria-label="Clear location"
              />
            ) : (
              <Search 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" 
                onClick={() => setOpen(true)}
              />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px]" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search for a location in UAE...`} 
              onValueChange={(value) => {
                setQuery(value);
                onSearchChange?.(value);
              }}
              value={query}
            />
            <CommandList>
              <CommandEmpty>No locations found. Try typing a UAE city, area, or landmark name.</CommandEmpty>
              
              {suggestedLocations.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestedLocations.map((location, index) => (
                    <CommandItem
                      key={`suggestion-${index}`}
                      value={location.name || ""}
                      onSelect={() => handleSuggestionSelect(location)}
                    >
                      {location.coordinates ? (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          <span className="font-medium">{location.name}</span>
                          <span className="ml-1 text-muted-foreground">UAE</span>
                        </>
                      ) : (
                        <>
                          <Landmark className="mr-2 h-4 w-4" />
                          <span className="font-medium">{location.name}</span>
                          <span className="ml-1 text-muted-foreground">{location.area}, {location.city}</span>
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {recentSelections.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Recent Locations">
                    {recentSelections.map((location, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        value={location.address || ""}
                        onSelect={() => {
                          onLocationSelect(location);
                          setOpen(false);
                        }}
                      >
                        {renderIcon(location)}
                        <div className="flex flex-col">
                          <span className="font-medium truncate">{location.name || location.address.split(',')[0]}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {location.formatted_address || location.address}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              
              <CommandSeparator />
              <CommandGroup heading="Common Locations">
                {UAE_COMMON_LOCATIONS.slice(0, 4).map((location, index) => (
                  <CommandItem
                    key={`common-${index}`}
                    value={location.name}
                    onSelect={() => handleSuggestionSelect(location)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{location.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Using the Location interface from map-view.tsx
// which now includes all UAE-specific fields