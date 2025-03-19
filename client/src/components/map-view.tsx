import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface MarkerAnimation {
  scale: number;
  opacity: number;
  dropOffset: number;
}

// Simplified building shapes for the city silhouette
const BUILDINGS = [
  { width: 40, height: 120, spacing: 60 },
  { width: 30, height: 180, spacing: 50 },
  { width: 50, height: 150, spacing: 70 },
  { width: 35, height: 200, spacing: 55 },
  { width: 45, height: 160, spacing: 65 }
];

export function MapView({
  pickupLocation,
  dropoffLocation,
  onLocationSelect
}: MapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number>();
  const [pickupAnimation, setPickupAnimation] = useState<MarkerAnimation>({ scale: 0, opacity: 0, dropOffset: -50 });
  const [dropoffAnimation, setDropoffAnimation] = useState<MarkerAnimation>({ scale: 0, opacity: 0, dropOffset: -50 });
  const [lineProgress, setLineProgress] = useState(0);

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

  // Draw city silhouette
  const drawCitySilhouette = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1b26');
    gradient.addColorStop(1, '#2c2e3e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * (CANVAS_HEIGHT * 0.7);
      const size = Math.random() * 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw buildings
    ctx.fillStyle = '#000000';
    let x = 0;
    while (x < CANVAS_WIDTH) {
      const building = BUILDINGS[Math.floor(Math.random() * BUILDINGS.length)];
      const height = building.height * (0.8 + Math.random() * 0.4);
      ctx.fillRect(x, CANVAS_HEIGHT - height, building.width, height);
      x += building.width + building.spacing;
    }
  };

  // Reset animations when locations change
  useEffect(() => {
    if (pickupLocation) {
      setPickupAnimation({ scale: 0, opacity: 0, dropOffset: -50 });
    }
    if (dropoffLocation) {
      setDropoffAnimation({ scale: 0, opacity: 0, dropOffset: -50 });
      setLineProgress(0);
    }
  }, [pickupLocation, dropoffLocation]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      // Update pickup animation
      if (pickupLocation) {
        setPickupAnimation(prev => ({
          scale: Math.min(1, prev.scale + 0.1),
          opacity: Math.min(1, prev.opacity + 0.1),
          dropOffset: Math.max(0, prev.dropOffset + 5)
        }));
      }

      // Update dropoff animation
      if (dropoffLocation) {
        setDropoffAnimation(prev => ({
          scale: Math.min(1, prev.scale + 0.1),
          opacity: Math.min(1, prev.opacity + 0.1),
          dropOffset: Math.max(0, prev.dropOffset + 5)
        }));
      }

      // Update line progress
      if (pickupLocation && dropoffLocation) {
        setLineProgress(prev => Math.min(1, prev + 0.05));
      }

      // Continue animation if not complete
      if (
        pickupAnimation.scale < 1 ||
        dropoffAnimation.scale < 1 ||
        lineProgress < 1
      ) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pickupLocation, dropoffLocation, pickupAnimation, dropoffAnimation, lineProgress]);

  // Draw the map
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw city silhouette background
    drawCitySilhouette(ctx);

    // Draw grid lines with reduced opacity
    ctx.strokeStyle = 'rgba(229, 231, 235, 0.2)';
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

    // Draw route line with glow effect
    if (pickupLocation && dropoffLocation && lineProgress > 0) {
      const pickup = toCanvasCoordinates(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      );
      const dropoff = toCanvasCoordinates(
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );

      const dx = dropoff.x - pickup.x;
      const dy = dropoff.y - pickup.y;
      const endX = pickup.x + dx * lineProgress;
      const endY = pickup.y + dy * lineProgress;

      // Draw glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pickup.x, pickup.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
    }

    // Draw pickup point with animation
    if (pickupLocation) {
      const { x, y } = toCanvasCoordinates(
        pickupLocation.coordinates.lat,
        pickupLocation.coordinates.lng
      );

      // Pulsing effect
      const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
      const finalScale = pickupAnimation.scale * pulseScale;

      // Draw glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#22c55e';
      ctx.fillStyle = `rgba(34, 197, 94, ${pickupAnimation.opacity})`;
      ctx.beginPath();
      ctx.arc(x, y + pickupAnimation.dropOffset, 8 * finalScale, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw label with animation
      ctx.fillStyle = `rgba(255, 255, 255, ${pickupAnimation.opacity})`;
      ctx.font = '12px sans-serif';
      ctx.fillText('Pickup', x + 12, y + pickupAnimation.dropOffset);
    }

    // Draw dropoff point with animation
    if (dropoffLocation) {
      const { x, y } = toCanvasCoordinates(
        dropoffLocation.coordinates.lat,
        dropoffLocation.coordinates.lng
      );

      // Pulsing effect
      const pulseScale = 1 + Math.sin(Date.now() / 500) * 0.1;
      const finalScale = dropoffAnimation.scale * pulseScale;

      // Draw glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = `rgba(239, 68, 68, ${dropoffAnimation.opacity})`;
      ctx.beginPath();
      ctx.arc(x, y + dropoffAnimation.dropOffset, 8 * finalScale, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw label with animation
      ctx.fillStyle = `rgba(255, 255, 255, ${dropoffAnimation.opacity})`;
      ctx.font = '12px sans-serif';
      ctx.fillText('Dropoff', x + 12, y + dropoffAnimation.dropOffset);
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

  // Continuous map redraw for animations
  useEffect(() => {
    const animate = () => {
      drawMap();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pickupLocation, dropoffLocation, pickupAnimation, dropoffAnimation, lineProgress]);

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