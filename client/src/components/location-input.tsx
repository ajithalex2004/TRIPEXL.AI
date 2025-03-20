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
  inputId?: string;
}

const MAPS_API_KEY = "AIzaSyAtNTq_ILPC8Y5M_bJAiMORDf02sGoK84I";

export function LocationInput({
  value,
  placeholder,
  onLocationSelect,
  onSearchChange,
  onFocus,
  inputId
}: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = initAutocomplete;
    };

    function initAutocomplete() {
      if (!inputRef.current || !window.google?.maps?.places) {
        return;
      }

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "AE" },
        fields: ["place_id", "name", "formatted_address", "geometry"],
        types: ["establishment", "geocode", "address", "point_of_interest"],
        strictBounds: true,
        bounds: new google.maps.LatLngBounds(
          { lat: 22.6, lng: 51.5 }, // SW bound
          { lat: 26.5, lng: 56.4 }  // NE bound
        )
      });

      autocomplete.addListener("place_changed", () => {
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
    }

    if (!window.google?.maps?.places) {
      loadGoogleMapsScript();
    } else {
      initAutocomplete();
    }

    return () => {
      // Cleanup script if needed
      const script = document.querySelector(`script[src*="${MAPS_API_KEY}"]`);
      if (script) {
        script.remove();
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
          id={inputId}
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