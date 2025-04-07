import React, { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  place_id?: string;
  name?: string;
  formatted_address?: string;
}

interface MapFallbackProps {
  message?: string;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  waypoints?: Location[];
  onSelectPickup?: () => void;
  onSelectDropoff?: () => void;
}

/**
 * A fallback component to display when the Google Maps API fails to load
 * This provides a basic visual representation of the route
 */
const MapFallback: React.FC<MapFallbackProps> = ({ 
  message = "Using a simplified map view for route planning. All trip functionality is still available.",
  pickupLocation,
  dropoffLocation,
  waypoints = [],
  onSelectPickup,
  onSelectDropoff
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Function to draw a simple map visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = '#f8fafc'; // Tailwind's slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw coordinates grid
    ctx.strokeStyle = '#e2e8f0'; // Tailwind's slate-200
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
    
    // Helper function to map coordinates to canvas
    // In a real app this would use proper geospatial projection
    // Here we just use a simple relative positioning based on available points
    const mapPoints = () => {
      const points = [];
      if (pickupLocation) points.push(pickupLocation.coordinates);
      if (dropoffLocation) points.push(dropoffLocation.coordinates);
      waypoints.forEach(wp => points.push(wp.coordinates));
      
      if (points.length === 0) return { mapCoordToCanvas: () => ({ x: 0, y: 0 }) };
      
      // Find bounds
      const minLat = Math.min(...points.map(p => p.lat));
      const maxLat = Math.max(...points.map(p => p.lat));
      const minLng = Math.min(...points.map(p => p.lng));
      const maxLng = Math.max(...points.map(p => p.lng));
      
      // Add padding
      const padding = 50;
      const mapWidth = canvas.width - padding * 2;
      const mapHeight = canvas.height - padding * 2;
      
      // Function to map a coordinate to canvas position
      return {
        mapCoordToCanvas: (coord: { lat: number, lng: number }) => {
          // If we only have one point, center it
          if (points.length === 1) {
            return { x: canvas.width / 2, y: canvas.height / 2 };
          }
          
          // Map coordinates to canvas position
          const lngRange = maxLng - minLng || 0.01; // Avoid division by zero
          const latRange = maxLat - minLat || 0.01;
          
          const x = padding + ((coord.lng - minLng) / lngRange) * mapWidth;
          // Invert y-axis since canvas 0,0 is top-left, but latitude increases northward
          const y = padding + ((maxLat - coord.lat) / latRange) * mapHeight;
          
          return { x, y };
        }
      };
    };
    
    const { mapCoordToCanvas } = mapPoints();
    
    // Draw pickup, waypoints, and dropoff with enhanced styling
    if (pickupLocation) {
      const { x, y } = mapCoordToCanvas(pickupLocation.coordinates);
      
      // Apply shadow effect for marker
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw white border circle first
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw green marker for pickup
      ctx.fillStyle = '#16a34a'; // Green
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore(); // End shadow effect
      
      // Draw label with background for better visibility
      const label = 'Pickup';
      ctx.font = 'bold 14px sans-serif';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 16; // Approximate height
      const padding = 4;
      
      // Draw label background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(
        x + 12 - padding, 
        y - textHeight/2 - padding, 
        textWidth + padding * 2, 
        textHeight + padding * 2
      );
      
      // Draw label text
      ctx.fillStyle = '#1e3a8a'; // Blue-900
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, x + 12, y + 5);
    }
    
    // Draw waypoints with enhanced styling
    waypoints.forEach((waypoint, index) => {
      const { x, y } = mapCoordToCanvas(waypoint.coordinates);
      
      // Apply shadow effect for marker
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw white border circle first
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw blue marker for waypoint
      ctx.fillStyle = '#3b82f6'; // Blue
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore(); // End shadow effect
      
      // Draw label with background
      const label = `Stop ${index + 1}`;
      ctx.font = '12px sans-serif';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 14; // Approximate height
      const padding = 3;
      
      // Draw label background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(
        x + 10 - padding, 
        y - textHeight/2 - padding, 
        textWidth + padding * 2, 
        textHeight + padding * 2
      );
      
      // Draw label text
      ctx.fillStyle = '#1e3a8a'; // Blue-900
      ctx.font = '12px sans-serif';
      ctx.fillText(label, x + 10, y + 4);
    });
    
    // Draw dropoff with enhanced styling
    if (dropoffLocation) {
      const { x, y } = mapCoordToCanvas(dropoffLocation.coordinates);
      
      // Apply shadow effect for marker
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      // Draw white border circle first
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw red marker for dropoff
      ctx.fillStyle = '#ef4444'; // Red
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore(); // End shadow effect
      
      // Draw label with background for better visibility
      const label = 'Dropoff';
      ctx.font = 'bold 14px sans-serif';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 16; // Approximate height
      const padding = 4;
      
      // Draw label background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(
        x + 12 - padding, 
        y - textHeight/2 - padding, 
        textWidth + padding * 2, 
        textHeight + padding * 2
      );
      
      // Draw label text
      ctx.fillStyle = '#7f1d1d'; // Red-900
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, x + 12, y + 5);
    }
    
    // Draw route lines between points with shadow for better visibility
    if (pickupLocation) {
      // Apply shadow effect
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.strokeStyle = '#0033CC'; // Dark blue
      ctx.lineWidth = 4;
      ctx.beginPath();
      
      // Start at pickup
      const pickup = mapCoordToCanvas(pickupLocation.coordinates);
      ctx.moveTo(pickup.x, pickup.y);
      
      // Draw through each waypoint
      waypoints.forEach(waypoint => {
        const point = mapCoordToCanvas(waypoint.coordinates);
        ctx.lineTo(point.x, point.y);
      });
      
      // End at dropoff
      if (dropoffLocation) {
        const dropoff = mapCoordToCanvas(dropoffLocation.coordinates);
        ctx.lineTo(dropoff.x, dropoff.y);
      }
      
      ctx.stroke();
      ctx.restore(); // Remove shadow effect
    }
    
  }, [pickupLocation, dropoffLocation, waypoints]);

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Map Information</AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>
        
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400} 
            className="w-full h-[400px] border rounded-md"
          />
          
          {(!pickupLocation || !dropoffLocation) && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <div className="bg-white/80 p-4 rounded-md shadow-sm text-center">
                <p className="text-sm text-slate-600 mb-3">
                  {!pickupLocation && !dropoffLocation ? 'Select pickup and dropoff locations' : 
                   !pickupLocation ? 'Select a pickup location' : 'Select a dropoff location'}
                </p>
                
                <div className="flex gap-2 justify-center">
                  {!pickupLocation && onSelectPickup && (
                    <Button size="sm" onClick={onSelectPickup} variant="outline">
                      <MapPin className="mr-1 h-4 w-4 text-green-600" />
                      Set Pickup
                    </Button>
                  )}
                  
                  {!dropoffLocation && onSelectDropoff && (
                    <Button size="sm" onClick={onSelectDropoff} variant="outline">
                      <MapPin className="mr-1 h-4 w-4 text-red-600" />
                      Set Dropoff
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-slate-500">
          <p>This is a simplified map view. Actual routes and distances may vary.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapFallback;