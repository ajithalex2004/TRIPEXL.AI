import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleGroup, InsertVehicleGroup } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleGroupForm } from "@/components/ui/vehicle-group-form";

export default function VehicleGroupManagement() {
  const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
  const { toast } = useToast();

  const { data: vehicleGroups, isLoading } = useQuery<VehicleGroup[]>({
    queryKey: ["/api/vehicle-groups"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleGroup) => {
      const response = await apiRequest("POST", "/api/vehicle-groups", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
      setSelectedGroup(null);
      toast({
        title: "Success",
        description: "Vehicle group created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertVehicleGroup & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/vehicle-groups/${id}`, updateData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
      setSelectedGroup(null);
      toast({
        title: "Success",
        description: "Vehicle group updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InsertVehicleGroup) => {
    if (selectedGroup) {
      await updateMutation.mutateAsync({ ...data, id: selectedGroup.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{selectedGroup ? "Edit Vehicle Group" : "Create Vehicle Group"}</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleGroupForm
            onSubmit={handleSubmit}
            initialData={selectedGroup || undefined}
            isEditing={!!selectedGroup}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Groups List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : vehicleGroups?.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.groupCode}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.region}</TableCell>
                  <TableCell>{group.type}</TableCell>
                  <TableCell>{group.department}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}