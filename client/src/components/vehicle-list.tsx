import { useQuery } from "@tanstack/react-query";
import { Vehicle } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function VehicleList() {
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  if (isLoading) {
    return <VehicleListSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles?.map((vehicle) => (
        <Card key={vehicle.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{vehicle.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video mb-4 rounded-lg overflow-hidden">
              <img
                src={vehicle.imageUrl}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between">
              <Badge
                variant={vehicle.status === "available" ? "default" : "secondary"}
              >
                {vehicle.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {vehicle.loadCapacity}kg capacity
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VehicleListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-[80px]" />
              <Skeleton className="h-5 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
