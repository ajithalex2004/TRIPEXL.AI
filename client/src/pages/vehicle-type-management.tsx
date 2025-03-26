import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

  const { data: vehicleTypes, isLoading } = useQuery<VehicleTypeMaster[]>({
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
      setIsFormOpen(false);
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
      setIsFormOpen(false);
      setSelectedType(null);
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
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Submit error:", error);
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
                        <TableCell>{type.vehicleGroup}</TableCell>
                        <TableCell>{type.vehicleTypeCode}</TableCell>
                        <TableCell>{type.vehicleType}</TableCell>
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