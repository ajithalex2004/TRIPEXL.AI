import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Location } from "./map-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HISTORY_KEY = "locationSearchHistory";
const MAX_HISTORY_ITEMS = 5;

interface LocationInputProps {
  value: string;
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  onSearchChange?: (query: string) => void;
  onFocus?: () => void;
}

interface SavedLocation extends Location {
  timestamp: number;
}

export function LocationInput({
  value,
  placeholder,
  onLocationSelect,
  onSearchChange,
  onFocus
}: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SavedLocation[]>([]);
  const [inputValue, setInputValue] = useState(value);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as SavedLocation[];
        setSearchHistory(parsed.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Error loading search history:", error);
      }
    }
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Save location to history
  const saveToHistory = (location: Location) => {
    const newHistory = [
      { ...location, timestamp: Date.now() },
      ...searchHistory.filter(item => item.address !== location.address)
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        // Retry initialization if Places API is not yet loaded
        setTimeout(initializeAutocomplete, 1000);
        return;
      }

      try {
        const abuDhabiCenter = new google.maps.LatLng(24.4539, 54.3773);
        const defaultBounds = {
          north: 24.6,
          south: 24.3,
          east: 54.5,
          west: 54.2,
        };

        const options: google.maps.places.AutocompleteOptions = {
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(defaultBounds.south, defaultBounds.west),
            new google.maps.LatLng(defaultBounds.north, defaultBounds.east)
          ),
          componentRestrictions: { country: "AE" },
          fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
          strictBounds: false,
          types: ["establishment", "geocode", "address", "point_of_interest"],
        };

        // Clean up previous instance
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        const listener = autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          console.log("Selected place:", place);

          if (place?.geometry?.location) {
            const location: Location = {
              address: place.formatted_address || place.name || "",
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            };
            onLocationSelect(location);
            saveToHistory(location);
            setError(null);
            setIsOpen(false);
            setInputValue(location.address);
          } else {
            setError("Please select a location from the dropdown.");
          }
        });

        return () => {
          if (listener) {
            google.maps.event.removeListener(listener);
          }
          if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
        };
      } catch (error) {
        console.error("Error initializing Places Autocomplete:", error);
        setError("Unable to initialize location search. Please try again.");
      }
    };

    initializeAutocomplete();
  }, [onLocationSelect]);

  const handleHistorySelect = (location: Location) => {
    onLocationSelect(location);
    saveToHistory(location);
    setIsOpen(false);
    setInputValue(location.address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError(null);

    // Notify parent component about search change for map update
    onSearchChange?.(newValue);

    // If Places service is available, try to get predictions
    if (window.google?.maps?.places) {
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      placesService.textSearch({
        query: newValue,
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          const firstResult = results[0];
          if (firstResult.geometry?.location) {
            const location: Location = {
              address: firstResult.formatted_address || firstResult.name || "",
              coordinates: {
                lat: firstResult.geometry.location.lat(),
                lng: firstResult.geometry.location.lng()
              }
            };
            // Update map without selecting the location
            onSearchChange?.(location.address);
          }
        }
      });
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onFocus={(e) => {
              setIsOpen(true);
              onFocus?.();
            }}
            className={error ? "border-destructive" : ""}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
        {searchHistory.length > 0 && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setIsOpen(true)}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup heading="Recent Locations">
                    {searchHistory.map((location, index) => (
                      <CommandItem
                        key={`${location.address}-${index}`}
                        onSelect={() => handleHistorySelect(location)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>{location.address}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                <CommandEmpty>No recent locations</CommandEmpty>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}