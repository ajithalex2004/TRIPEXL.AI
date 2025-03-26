import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleMaster } from "@shared/schema";
import { VehicleMasterForm } from "@/components/ui/vehicle-master-form";
import { VehicleManagementFAB } from "@/components/ui/vehicle-management-fab";
import { useToast } from "@/hooks/use-toast";
import { Pen, Trash2 } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";

export default function VehicleMasterManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleMaster | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<VehicleMaster | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vehicle master data
  const { data: vehicles, isLoading } = useQuery<VehicleMaster[]>({
    queryKey: ["/api/vehicle-master"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/vehicle-master/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete vehicle");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-master"] });
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
      setDeleteVehicle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/vehicle-master"] });
    toast({
      title: "Refreshed",
      description: "Vehicle list has been refreshed",
    });
  }, [queryClient, toast]);

  const handleEdit = useCallback((vehicle: VehicleMaster) => {
    setSelectedVehicle(vehicle);
    setIsAddModalOpen(true);
  }, []);

  const handleDelete = useCallback((vehicle: VehicleMaster) => {
    setDeleteVehicle(vehicle);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteVehicle) {
      deleteMutation.mutate(deleteVehicle.id);
    }
  }, [deleteVehicle, deleteMutation]);

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setSelectedVehicle(null);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setSelectedVehicle(null);
    setIsAddModalOpen(true);
  }, []);

  // Memoize columns definition
  const columns = useMemo(() => [
    {
      header: "Vehicle ID",
      accessorKey: "vehicleId",
    },
    {
      header: "Emirate",
      accessorKey: "emirate",
    },
    {
      header: "Registration",
      accessorKey: "registrationNumber",
    },
    {
      header: "Plate Code",
      accessorKey: "plateCode",
    },
    {
      header: "Plate Number",
      accessorKey: "plateNumber",
    },
    {
      header: "Vehicle Type Code",
      accessorKey: "vehicleTypeCode",
    },
    {
      header: "Vehicle Type Name",
      accessorKey: "vehicleTypeName",
    },
    {
      header: "Model",
      accessorKey: "vehicleModel",
    },
    {
      header: "Manufacturer",
      accessorKey: "manufacturer",
    },
    {
      header: "Fuel Type",
      accessorKey: "fuelType",
    },
    {
      header: "Department",
      accessorKey: "department",
    },
    {
      header: "Status",
      accessorKey: "isValid",
      cell: ({ row }) => (
        <span className={row.original.isValid ? "text-green-600" : "text-red-600"}>
          {row.original.isValid ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEdit(vehicle)}
              className="h-8 w-8 p-0"
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(vehicle)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleEdit, handleDelete]);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Master Management</h1>
          <p className="text-muted-foreground">
            Manage and view all vehicle master records
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Master Records</CardTitle>
          <CardDescription>
            View and manage detailed vehicle information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading vehicle records...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={vehicles || []}
              filterColumn="vehicleId"
              filterPlaceholder="Filter by Vehicle ID..."
            />
          )}
        </CardContent>
      </Card>

      {/* Vehicle Management FAB */}
      <VehicleManagementFAB
        onAddVehicle={handleOpenAddModal}
        onRefresh={handleRefresh}
      />

      {/* Add/Edit Vehicle Form Modal */}
      <VehicleMasterForm 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        initialData={selectedVehicle}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={() => setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle
              with ID: {deleteVehicle?.vehicleId}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}