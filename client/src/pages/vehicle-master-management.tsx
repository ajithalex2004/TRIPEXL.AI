import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { VehicleMaster } from "@shared/schema";
import { VehicleMasterForm } from "@/components/ui/vehicle-master-form";
import { VehicleManagementFAB } from "@/components/ui/vehicle-management-fab";
import { useToast } from "@/hooks/use-toast";

const columns = [
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
];

export default function VehicleMasterManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vehicle master data
  const { data: vehicles, isLoading } = useQuery<VehicleMaster[]>({
    queryKey: ["/api/vehicle-master"],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/vehicle-master"] });
    toast({
      title: "Refreshed",
      description: "Vehicle list has been refreshed",
    });
  };

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
        onAddVehicle={() => setIsAddModalOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Add Vehicle Form Modal */}
      <VehicleMasterForm 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}