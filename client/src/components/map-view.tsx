import { Card } from "@/components/ui/card";

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
  return (
    <Card className="p-4">
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">
          Interactive map view will be displayed here
        </p>
      </div>
    </Card>
  );
}