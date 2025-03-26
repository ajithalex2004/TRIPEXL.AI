import { useState, useCallback, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleGroup, InsertVehicleGroup, Region, VehicleGroupType, Department } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VehicleGroupForm } from "@/components/ui/vehicle-group-form";
import { VehicleGroupFAB } from "@/components/ui/vehicle-group-fab";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VehicleGroupManagement() {
  const [selectedGroup, setSelectedGroup] = useState<VehicleGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<VehicleGroup | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { toast } = useToast();

  // Query for fetching vehicle groups
  const { data: vehicleGroups, isLoading, error } = useQuery<VehicleGroup[]>({
    queryKey: ["/api/vehicle-groups"],
    queryFn: async () => {
      console.log("Fetching vehicle groups");
      const response = await apiRequest("GET", "/api/vehicle-groups");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch vehicle groups");
      }
      const data = await response.json();
      console.log("Fetched vehicle groups:", data);
      return data;
    },
    staleTime: 0,
    retry: 3,
  });

  // Filter vehicle groups based on search and filters
  const filteredGroups = useMemo(() => {
    if (!vehicleGroups) return [];

    return vehicleGroups.filter(group => {
      const matchesSearch = searchTerm === "" || 
        group.group_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = selectedRegion === "all" || group.region === selectedRegion;
      const matchesType = selectedType === "all" || group.type === selectedType;
      const matchesDepartment = selectedDepartment === "all" || group.department === selectedDepartment;

      return matchesSearch && matchesRegion && matchesType && matchesDepartment;
    });
  }, [vehicleGroups, searchTerm, selectedRegion, selectedType, selectedDepartment]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleGroup) => {
      console.log("Creating vehicle group:", data);
      const response = await apiRequest("POST", "/api/vehicle-groups", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vehicle group");
      }
      return response.json();
    },
    onSuccess: () => {
      console.log("Vehicle group created successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
      setSelectedGroup(null);
      setFormDialogOpen(false);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/vehicle-groups/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete vehicle group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
      toast({
        title: "Success",
        description: "Vehicle group deleted successfully",
      });
      setGroupToDelete(null);
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = useCallback((group: VehicleGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (groupToDelete) {
      deleteMutation.mutate(groupToDelete.id);
    }
  }, [groupToDelete, deleteMutation]);

  const handleSubmit = useCallback(async (data: InsertVehicleGroup) => {
    console.log("Handling form submission:", data);
    try {
      if (selectedGroup) {
        // Handle update
        console.log("Updating vehicle group:", selectedGroup.id, data);
        await apiRequest("PATCH", `/api/vehicle-groups/${selectedGroup.id}`, data);
        queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
        setSelectedGroup(null);
        setFormDialogOpen(false);
        toast({
          title: "Success",
          description: "Vehicle group updated successfully",
        });
      } else {
        // Handle create
        await createMutation.mutateAsync(data);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [selectedGroup, createMutation, toast]);

  const handleImport = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/vehicle-groups/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import vehicle groups');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-groups'] });
      toast({
        title: 'Success',
        description: 'Vehicle groups imported successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleExport = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/vehicle-groups/export");
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await apiRequest("GET", "/api/vehicle-groups/template");
      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vehicle-groups-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/vehicle-groups"] });
  }, []);

  const handleEdit = useCallback((group: VehicleGroup) => {
    setSelectedGroup(group);
    setFormDialogOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/90 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-xl bg-background/60 border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle>Vehicle Groups List</CardTitle>
            <div className="mt-4 space-y-4">
              {/* Search and Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicle groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {Object.values(Region).map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(VehicleGroupType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRegion("all");
                    setSelectedType("all");
                    setSelectedDepartment("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  ) : !filteredGroups.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vehicle groups found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGroups.map((group) => (
                      <motion.tr
                        key={group.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-background/40"
                      >
                        <TableCell className="font-medium">{group.group_code}</TableCell>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.region}</TableCell>
                        <TableCell>{group.type}</TableCell>
                        <TableCell>{group.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(group)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(group)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <VehicleGroupFAB
          onAddClick={() => {
            setSelectedGroup(null);
            setFormDialogOpen(true);
          }}
          onImport={handleImport}
          onExport={handleExport}
          onDownloadTemplate={handleDownloadTemplate}
          onRefresh={handleRefresh}
        />

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedGroup ? "Edit Vehicle Group" : "Create Vehicle Group"}</DialogTitle>
            </DialogHeader>
            <VehicleGroupForm
              onSubmit={handleSubmit}
              initialData={selectedGroup}
              isEditing={!!selectedGroup}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this vehicle group?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the vehicle group
                {groupToDelete && ` "${groupToDelete.name}"`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}