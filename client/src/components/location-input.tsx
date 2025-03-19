import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Location } from "./map-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search } from "lucide-react";

interface LocationInputProps {
  value: string;
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  onSearchChange?: (query: string) => void;
  onFocus?: () => void;
}

export function LocationInput({
  value,
  placeholder,
  onLocationSelect,
  onSearchChange,
  onFocus
}: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "AE" },
      fields: ["place_id", "name", "formatted_address", "geometry"],
      types: ["address", "establishment", "point_of_interest"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (place?.geometry?.location) {
        const location: Location = {
          address: place.formatted_address || place.name || "",
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          place_id: place.place_id || "",
          name: place.name || "",
          formatted_address: place.formatted_address || ""
        };
        onLocationSelect(location);
        setError(null);
      } else {
        setError("Please select a valid location from the dropdown");
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onLocationSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setError(null);
    onSearchChange?.(newValue);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={onFocus}
          className={error ? "border-destructive" : ""}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}