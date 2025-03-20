import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleGroup, InsertVehicleGroup } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleGroupForm } from "@/components/ui/vehicle-group-form";
import { Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function VehicleGroupManagement() {
  const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
  const { toast } = useToast();

  const { data: vehicleGroups, isLoading, error } = useQuery<VehicleGroup[]>({
    queryKey: ["/api/vehicle-groups"],
    staleTime: 0,
    retry: 3,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleGroup) => {
      const response = await apiRequest("POST", "/api/vehicle-groups", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle group");
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
      console.error("Create error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: InsertVehicleGroup & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/vehicle-groups/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update vehicle group");
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
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/vehicle-groups/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import vehicle groups");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
      toast({
        title: "Success",
        description: "Vehicle groups imported successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: InsertVehicleGroup) => {
    try {
      if (selectedGroup) {
        await updateMutation.mutateAsync({ ...data, id: selectedGroup.id });
        setSelectedGroup(null); // Reset selected group after update
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/vehicle-groups/export");
      if (!response.ok) {
        throw new Error("Failed to export vehicle groups");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-groups.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Vehicle groups exported successfully",
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

    try {
      await importMutation.mutateAsync(file);
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  if (error) {
    console.error("Query error:", error);
    toast({
      title: "Error",
      description: "Failed to fetch vehicle groups",
      variant: "destructive",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle>{selectedGroup ? "Edit Vehicle Group" : "Create Vehicle Group"}</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleGroupForm
              onSubmit={handleSubmit}
              initialData={selectedGroup}
              isEditing={!!selectedGroup}
            />
          </CardContent>
        </Card>

        <Card className="mt-6 backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vehicle Groups List</CardTitle>
            <div className="flex items-center gap-4">
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
                disabled={!vehicleGroups?.length}
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
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-background/40">
                    <TableHead className="text-primary/80">Group Code</TableHead>
                    <TableHead className="text-primary/80">Name</TableHead>
                    <TableHead className="text-primary/80">Region</TableHead>
                    <TableHead className="text-primary/80">Type</TableHead>
                    <TableHead className="text-primary/80">Department</TableHead>
                    <TableHead className="text-primary/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                            className="flex justify-center"
                          >
                            Loading...
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    ) : !vehicleGroups?.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No vehicle groups found
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicleGroups?.map((group) => (
                        <motion.tr
                          key={group.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-background/40"
                        >
                          <TableCell className="font-medium">{group.groupCode}</TableCell>
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
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}