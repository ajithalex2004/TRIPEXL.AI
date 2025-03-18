import { Card } from "@/components/ui/card";

export function MapView() {
  return (
    <Card className="p-4">
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">
          Interactive map view would be displayed here
        </p>
      </div>
    </Card>
  );
}
