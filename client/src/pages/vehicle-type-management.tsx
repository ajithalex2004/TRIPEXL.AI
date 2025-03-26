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

export default function VehicleTypeManagement() {
  const [selectedType, setSelectedType] = useState<VehicleTypeMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
    queryKey: ["/api/vehicle-types"],
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
      console.log("Form submitted with data:", data);

      // Ensure all number fields are properly typed
      const formattedData = {
        ...data,
        group_id: Number(data.group_id),
        model_year: Number(data.model_year),
        number_of_passengers: Number(data.number_of_passengers),
        fuel_price_per_litre: Number(data.fuel_price_per_litre),
        cost_per_km: Number(data.cost_per_km),
        alert_before: Number(data.alert_before),
        idle_fuel_consumption: Number(data.idle_fuel_consumption),
        vehicle_capacity: Number(data.vehicle_capacity),
        co2_emission_factor: Number(data.co2_emission_factor)
      };

      console.log("Formatted data:", formattedData);

      if (selectedType) {
        await updateMutation.mutateAsync({ ...formattedData, id: selectedType.id });
      } else {
        await createMutation.mutateAsync(formattedData);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiRequest("GET", "/api/vehicle-types/template");
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-types-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vehicle-types/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import file");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      toast({
        title: "Success",
        description: "Vehicle types imported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import file",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/vehicle-types/export");
      if (!response.ok) throw new Error("Failed to export vehicle types");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-types.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export vehicle types",
        variant: "destructive",
      });
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
        onImport={handleImport}
        onExport={handleExport}
        onDownloadTemplate={handleDownloadTemplate}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] })}
      />
    </div>
  );
}