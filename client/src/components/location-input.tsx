import { useEffect, useState } from "react";
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
  onFocus?: () => void;
}

interface SavedLocation extends Location {
  timestamp: number;
}

export function LocationInput({
  value,
  placeholder,
  onLocationSelect,
  onFocus
}: LocationInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SavedLocation[]>([]);

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

  // Save location to history
  const saveToHistory = (location: Location) => {
    const newHistory = [
      { ...location, timestamp: Date.now() },
      ...searchHistory.filter(item => item.address !== location.address)
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleHistorySelect = (location: Location) => {
    onLocationSelect(location);
    saveToHistory(location);
    setIsOpen(false);
  };

  const handleInputSubmit = () => {
    if (!value) return;

    const location: Location = {
      address: value,
      coordinates: {
        // Default to Dubai center if coordinates not provided
        lat: 25.2048,
        lng: 55.2708
      }
    };

    onLocationSelect(location);
    saveToHistory(location);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            placeholder={placeholder}
            onFocus={(e) => {
              setIsOpen(true);
              onFocus?.();
            }}
            onChange={(e) => {
              const newLocation: Location = {
                address: e.target.value,
                coordinates: {
                  lat: 25.2048,
                  lng: 55.2708
                }
              };
              onLocationSelect(newLocation);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputSubmit();
              }
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