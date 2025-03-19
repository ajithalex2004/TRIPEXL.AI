import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Location } from "./map-view";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LocationInputProps {
  value: string;
  placeholder: string;
  onLocationSelect: (location: Location) => void;
  onFocus?: () => void;
}

export function LocationInput({
  value,
  placeholder,
  onLocationSelect,
  onFocus
}: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    try {
      const options: google.maps.places.AutocompleteOptions = {
        componentRestrictions: { country: "AE" }, // Restrict to UAE
        fields: ["formatted_address", "geometry", "name", "place_id"],
        types: ["establishment", "geocode"],
        strictBounds: false
      };

      // Clean up previous instance if it exists
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      const listener = autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();

        if (place?.geometry?.location) {
          const location: Location = {
            address: place.formatted_address || place.name || "",
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          };
          onLocationSelect(location);
          setError(null);
        } else {
          setError("Please select a location from the dropdown.");
        }
      });

      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (error) {
      console.error("Error initializing Places Autocomplete:", error);
      setError("Unable to initialize location search. Please try again.");
    }
  }, [onLocationSelect]);

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={() => {}} // Let Places API handle the input
        className={error ? "border-destructive" : ""}
      />
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}