import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { PermissionsMap } from "@/components/permissions-map";

export default function PermissionsMapPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/auth/users"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Permissions Map</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Permissions Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionsMap users={users || []} />
        </CardContent>
      </Card>
    </div>
  );
}
