import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-form";
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
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function VehicleTypeManagement() {
  const [selectedType, setSelectedType] = useState<VehicleTypeMaster | null>(null);
  const { toast } = useToast();

  const { data: vehicleTypes, isLoading, error } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
    staleTime: 0,
    retry: 3,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleTypeMaster) => {
      const response = await apiRequest("POST", "/api/vehicle-types", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Success",
        description: "Vehicle type created successfully",
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
    mutationFn: async ({ id, ...data }: InsertVehicleTypeMaster & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/vehicle-types/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Success",
        description: "Vehicle type updated successfully",
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

  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      if (selectedType) {
        await updateMutation.mutateAsync({ ...data, id: selectedType.id });
        setSelectedType(null);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle>{selectedType ? "Update Vehicle Type" : "Create Vehicle Type"}</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleTypeForm
              onSubmit={handleSubmit}
              initialData={selectedType}
              isEditing={!!selectedType}
            />
          </CardContent>
        </Card>

        <Card className="mt-6 backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle>Vehicle Types List</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Group</TableHead>
                    <TableHead>Type Code</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {vehicleTypes?.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>{type.vehicleGroup}</TableCell>
                        <TableCell>{type.vehicleTypeCode}</TableCell>
                        <TableCell>{type.vehicleType}</TableCell>
                        <TableCell>{type.region}</TableCell>
                        <TableCell>{type.department}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedType(type)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}