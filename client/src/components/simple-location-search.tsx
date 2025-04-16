import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Location } from "./map-view";
import { Search, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Simplified interface to avoid complex Google Maps dependencies
interface UAELocation {
  name: string;
  coordinates: { lat: number; lng: number };
  area?: string;
  city?: string;
}

// UAE Locations for direct selection
const UAE_LOCATIONS: UAELocation[] = [
  // Dubai
  { name: "Dubai Mall", area: "Downtown Dubai", city: "Dubai", coordinates: { lat: 25.197197, lng: 55.274376 } },
  { name: "Burj Khalifa", area: "Downtown Dubai", city: "Dubai", coordinates: { lat: 25.197197, lng: 55.274376 } },
  { name: "Mall of the Emirates", area: "Al Barsha", city: "Dubai", coordinates: { lat: 25.118984, lng: 55.200276 } },
  { name: "Dubai Marina", area: "Dubai Marina", city: "Dubai", coordinates: { lat: 25.076303, lng: 55.138798 } },
  { name: "Palm Jumeirah", area: "Palm Jumeirah", city: "Dubai", coordinates: { lat: 25.112288, lng: 55.138781 } },
  { name: "Dubai Creek", area: "Deira", city: "Dubai", coordinates: { lat: 25.262474, lng: 55.300651 } },
  { name: "JBR Beach", area: "Dubai Marina", city: "Dubai", coordinates: { lat: 25.080105, lng: 55.133321 } },
  { name: "Dubai International Airport", area: "Al Garhoud", city: "Dubai", coordinates: { lat: 25.252995, lng: 55.365552 } },
  { name: "Jumeirah Beach", area: "Jumeirah", city: "Dubai", coordinates: { lat: 25.204849, lng: 55.263904 } },
  
  // Abu Dhabi
  { name: "Abu Dhabi", city: "Abu Dhabi", coordinates: { lat: 24.466667, lng: 54.366667 } },
  { name: "Sheikh Zayed Grand Mosque", area: "Abu Dhabi", city: "Abu Dhabi", coordinates: { lat: 24.412346, lng: 54.475568 } },
  { name: "Yas Island", area: "Yas Island", city: "Abu Dhabi", coordinates: { lat: 24.499372, lng: 54.607182 } },
  { name: "Al Wahda Mall", area: "Al Wahda", city: "Abu Dhabi", coordinates: { lat: 24.28288, lng: 54.50729 } },
  
  // Sharjah
  { name: "Sharjah", city: "Sharjah", coordinates: { lat: 25.357119, lng: 55.391068 } },
  { name: "Central Souq", area: "Al Jubail", city: "Sharjah", coordinates: { lat: 25.35611, lng: 55.38596 } },
  
  // Other Emirates
  { name: "Al Ain", city: "Al Ain", coordinates: { lat: 24.191651, lng: 55.760343 } },
  { name: "Ajman", city: "Ajman", coordinates: { lat: 25.411130, lng: 55.435307 } },
  { name: "Ras Al Khaimah", city: "Ras Al Khaimah", coordinates: { lat: 25.789295, lng: 55.942479 } },
  { name: "Fujairah", city: "Fujairah", coordinates: { lat: 25.123082, lng: 56.326787 } },
  { name: "Umm Al Quwain", city: "Umm Al Quwain", coordinates: { lat: 25.565895, lng: 55.553185 } },
  
  // Additional useful locations 
  { name: "EXL Solutions", area: "Business Bay", city: "Dubai", coordinates: { lat: 25.186699, lng: 55.283451 } },
  { name: "Emirates Tower", area: "Sheikh Zayed Road", city: "Dubai", coordinates: { lat: 25.218994, lng: 55.282165 } }
];

interface SimpleLocationSearchProps {
  value: string;
  placeholder?: string;
  onLocationSelect: (location: Location) => void;
  onClear?: () => void;
  inputId?: string;
  className?: string;
  allowClear?: boolean;
  isPickup?: boolean;
}

export function SimpleLocationSearch({
  value,
  placeholder = "Search for a location...",
  onLocationSelect,
  onClear,
  inputId,
  className = "",
  allowClear = true,
  isPickup = true,
}: SimpleLocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>(value || "");
  const [open, setOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<UAELocation[]>([]);
  
  // Filter locations when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocations(UAE_LOCATIONS);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = UAE_LOCATIONS.filter(
      location => 
        location.name.toLowerCase().includes(query) ||
        (location.area && location.area.toLowerCase().includes(query)) ||
        (location.city && location.city.toLowerCase().includes(query))
    );
    
    setFilteredLocations(filtered);
  }, [searchQuery]);
  
  // Update search query when value prop changes
  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
  };
  
  // Handle location selection
  const handleSelectLocation = (location: UAELocation) => {
    const fullLocation: Location = {
      address: location.area && location.city 
        ? `${location.name}, ${location.area}, ${location.city}, UAE`
        : `${location.name}, ${location.city || "UAE"}`,
      coordinates: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      },
      name: location.name,
      formatted_address: location.area && location.city 
        ? `${location.name}, ${location.area}, ${location.city}, UAE`
        : `${location.name}, ${location.city || "UAE"}`,
      city: location.city,
      area: location.area,
    };
    
    onLocationSelect(fullLocation);
    setOpen(false);
  };
  
  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery("");
    if (onClear) {
      onClear();
    }
  };
  
  return (
    <div className={`relative w-full ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id={inputId}
              type="text"
              value={searchQuery}
              placeholder={placeholder}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              className="pr-10"
            />
            {value && allowClear ? (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer hover:text-foreground"
                onClick={handleClear}
                aria-label="Clear location"
              />
            ) : (
              <Search 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 cursor-pointer" 
                onClick={() => setOpen(true)}
              />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[350px]" align="start">
          <Card className="border-0">
            <div className="p-3">
              <Input
                type="text"
                placeholder="Search UAE locations..."
                value={searchQuery}
                onChange={handleInputChange}
                className="mb-2"
              />
            </div>
            <ScrollArea className="h-[300px]">
              <div className="px-2 py-1">
                {filteredLocations.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    No locations found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLocations.map((location, index) => (
                      <Button
                        key={`${location.name}-${index}`}
                        variant="ghost"
                        className="w-full justify-start font-normal px-2 py-1.5 h-auto text-left"
                        onClick={() => handleSelectLocation(location)}
                      >
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-medium">{location.name}</span>
                            {(location.area || location.city) && (
                              <span className="text-xs text-muted-foreground">
                                {location.area && `${location.area}, `}{location.city || "UAE"}
                              </span>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}