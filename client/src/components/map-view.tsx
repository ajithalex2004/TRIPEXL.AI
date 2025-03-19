import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VehicleLoadingIndicator } from "@/components/ui/vehicle-loading-indicator";

export interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface MapViewProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  onLocationSelect?: (location: Location, type: 'pickup' | 'dropoff') => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

// Dubai coordinates bounds
const MAP_BOUNDS = {
  lat: { min: 25.0, max: 25.4 }, // Dubai latitude range
  lng: { min: 55.1, max: 55.5 }  // Dubai longitude range
};

export function MapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect
}: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert geo coordinates to canvas coordinates
  const toCanvasCoordinates = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.lng.min) / (MAP_BOUNDS.lng.max - MAP_BOUNDS.lng.min)) * CANVAS_WIDTH;
    const y = ((MAP_BOUNDS.lat.max - lat) / (MAP_BOUNDS.lat.max - MAP_BOUNDS.lat.min)) * CANVAS_HEIGHT;
    return { x, y };
  };

  // Convert canvas coordinates to geo coordinates
  const toGeoCoordinates = (x: number, y: number) => {
    const lng = (x / CANVAS_WIDTH) * (MAP_BOUNDS.lng.max - MAP_BOUNDS.lng.min) + MAP_BOUNDS.lng.min;
    const lat = MAP_BOUNDS.lat.max - (y / CANVAS_HEIGHT) * (MAP_BOUNDS.lat.max - MAP_BOUNDS.lat.min);
    return { lat, lng };
  };

  // Draw the map
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw pickup point
    if (pickupLocation) {
      const { x, y } = toCanvasCoordinates(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      );
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText('Pickup', x + 12, y);
    }

    // Draw dropoff point
    if (dropoffLocation) {
      const { x, y } = toCanvasCoordinates(
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText('Dropoff', x + 12, y);
    }

    // Draw route line
    if (pickupLocation && dropoffLocation) {
      const pickup = toCanvasCoordinates(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      );
      const dropoff = toCanvasCoordinates(
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pickup.x, pickup.y);
      ctx.lineTo(dropoff.x, dropoff.y);
      ctx.stroke();
    }
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onLocationSelect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const { lat, lng } = toGeoCoordinates(x, y);

    const newLocation: Location = {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      coordinates: { lat, lng }
    };

    // Determine which location to update
    if (!pickupLocation) {
      onLocationSelect(newLocation, 'pickup');
    } else if (!dropoffLocation) {
      onLocationSelect(newLocation, 'dropoff');
    }
  };

  // Draw map when locations change
  useEffect(() => {
    drawMap();
  }, [pickupLocation, dropoffLocation]);

  return (
    <Card className="p-4 h-full relative">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Click on the map to set pickup and dropoff locations
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="border rounded-lg cursor-crosshair"
        style={{ width: '100%', height: 'auto' }}
      />

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pickupLocation && dropoffLocation && (
        <div className="mt-4 p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Route Information</h3>
          <p className="text-sm text-muted-foreground">
            Pickup: {pickupLocation?.address}
          </p>
          <p className="text-sm text-muted-foreground">
            Dropoff: {dropoffLocation?.address}
          </p>
        </div>
      )}
    </Card>
  );
}