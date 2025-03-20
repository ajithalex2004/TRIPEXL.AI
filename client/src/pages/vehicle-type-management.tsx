import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VehicleTypeMaster, InsertVehicleTypeMaster } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleTypeForm } from "@/components/ui/vehicle-type-form";
import { Download, Upload, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      console.error("Create error:", error);
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
      console.error("Update error:", error);
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

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/vehicle-types/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-types-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error: any) {
      console.error("Template download error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/vehicle-types/export");
      if (!response.ok) {
        throw new Error("Failed to export vehicle types");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-types.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Vehicle types exported successfully",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/vehicle-types/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import vehicle types");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types"] });
      
      toast({
        title: "Success",
        description: `Imported ${result.results.success} vehicle types successfully`,
      });

      if (result.results.failed > 0) {
        toast({
          title: "Warning",
          description: `Failed to import ${result.results.failed} vehicle types`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (error) {
    console.error("Query error:", error);
    toast({
      title: "Error",
      description: "Failed to fetch vehicle types",
      variant: "destructive",
    });
  }

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehicle Types List</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Download Template
              </Button>
              <div className="relative">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('excel-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Button>
              </div>
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!vehicleTypes?.length}
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>
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
