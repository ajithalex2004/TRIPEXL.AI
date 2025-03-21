import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

// Define columns for the vehicle master table
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

  // Fetch vehicle master data
  const { data: vehicles, isLoading } = useQuery<VehicleMaster[]>({
    queryKey: ["/api/vehicle-master"],
  });

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Master Management</h1>
          <p className="text-muted-foreground">
            Manage and view all vehicle master records
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
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

      {/* Add Vehicle Form Modal */}
      <VehicleMasterForm 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}