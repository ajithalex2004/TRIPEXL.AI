import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-form";
import { VehicleTypeFAB } from "@/components/ui/vehicle-type-fab";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function VehicleTypeManagement() {
  const [selectedType, setSelectedType] = useState<VehicleTypeMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query vehicle types
  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleTypeMaster) => {
      console.log("Creating vehicle type with data:", data);
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
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating vehicle type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vehicle type",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: InsertVehicleTypeMaster & { id: number }) => {
      console.log("Updating vehicle type:", id, "with data:", data);
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
      setIsFormOpen(false);
      setSelectedType(null);
    },
    onError: (error: Error) => {
      console.error("Error updating vehicle type:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle type",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InsertVehicleTypeMaster) => {
    try {
      if (selectedType) {
        await updateMutation.mutateAsync({ ...data, id: selectedType.id });
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
            <CardTitle>Vehicle Types</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-border" />
              </div>
            ) : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {vehicleTypes?.map((type) => (
                        <TableRow
                          key={type.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => {
                            setSelectedType(type);
                            setIsFormOpen(true);
                          }}
                        >
                          <TableCell>{type.group_id}</TableCell>
                          <TableCell>{type.vehicle_type_code}</TableCell>
                          <TableCell>{type.vehicle_type}</TableCell>
                          <TableCell>{type.region}</TableCell>
                          <TableCell>{type.department}</TableCell>
                        </TableRow>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={isFormOpen} 
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedType(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? "Edit Vehicle Type" : "Add Vehicle Type"}
            </DialogTitle>
          </DialogHeader>
          <VehicleTypeForm
            onSubmit={handleSubmit}
            initialData={selectedType}
            isEditing={!!selectedType}
          />
        </DialogContent>
      </Dialog>

      <VehicleTypeFAB
        onAddClick={() => {
          setSelectedType(null);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}