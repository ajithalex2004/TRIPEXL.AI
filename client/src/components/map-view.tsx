import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708
};

export interface MapViewProps {
  onLocationSelect: (location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }) => void;
}

export function MapView({ onLocationSelect }: MapViewProps) {
  const [marker, setMarker] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState("");
  const [address, setAddress] = useState("");

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });

    // Get address from coordinates using Geocoding service
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      if (result.results[0]) {
        const newAddress = result.results[0].formatted_address;
        setAddress(newAddress);
        onLocationSelect({
          address: newAddress,
          coordinates: { lat, lng }
        });
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  }, [onLocationSelect]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchQuery });
      if (result.results[0]?.geometry?.location) {
        const lat = result.results[0].geometry.location.lat();
        const lng = result.results[0].geometry.location.lng();
        const newAddress = result.results[0].formatted_address;

        setMarker({ lat, lng });
        setAddress(newAddress);
        onLocationSelect({
          address: newAddress,
          coordinates: { lat, lng }
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  }, [searchQuery, onLocationSelect]);

  return (
    <Card className="p-4">
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap
          mapContainerClassName="aspect-[16/9] rounded-lg"
          center={marker}
          zoom={13}
          onClick={handleMapClick}
        >
          <Marker position={marker} />
        </GoogleMap>
      </LoadScript>
      {address && (
        <p className="mt-2 text-sm text-muted-foreground">
          Selected: {address}
        </p>
      )}
    </Card>
  );
}