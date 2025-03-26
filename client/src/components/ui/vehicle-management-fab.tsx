import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Upload,
  Download,
  X,
  Car
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { insertVehicleMasterSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface VehicleManagementFABProps {
  onAddVehicle: () => void;
  onRefresh: () => void;
}

export function VehicleManagementFAB({ onAddVehicle, onRefresh }: VehicleManagementFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and import each vehicle
          const importResults = await Promise.all(
            jsonData.map(async (vehicle: any) => {
              const validationResult = insertVehicleMasterSchema.safeParse(vehicle);
              if (!validationResult.success) {
                return {
                  success: false,
                  error: `Validation failed for vehicle ${vehicle.vehicleId}: ${validationResult.error.message}`
                };
              }

              try {
                const response = await apiRequest("POST", "/api/vehicle-master", validationResult.data);
                if (!response.ok) {
                  const error = await response.json();
                  return { success: false, error: error.message };
                }
                return { success: true };
              } catch (error: any) {
                return { success: false, error: error.message };
              }
            })
          );

          const successful = importResults.filter(r => r.success).length;
          const failed = importResults.filter(r => !r.success).length;

          toast({
            title: "Import Complete",
            description: `Successfully imported ${successful} vehicles. ${failed} failed.`,
            variant: failed > 0 ? "destructive" : "default"
          });

          if (failed > 0) {
            console.error("Import errors:", importResults.filter(r => !r.success));
          }

          // Refresh the vehicle list
          onRefresh();
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message,
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: "Failed to process file",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/vehicle-master");
      const vehicles = await response.json();

      const worksheet = XLSX.utils.json_to_sheet(vehicles);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
      XLSX.writeFile(workbook, "vehicle_master_export.xlsx");

      toast({
        title: "Export Complete",
        description: "Vehicle data has been exported successfully"
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 space-y-2"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="default"
              className="bg-primary text-white shadow-lg hover:bg-primary/90 w-40 justify-start"
              onClick={onAddVehicle}
            >
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Car className="h-5 w-5" />
                <span>Add Vehicle</span>
              </motion.div>
            </Button>

            <Button
              variant="secondary"
              className="shadow-lg w-40 justify-start"
              onClick={onRefresh}
            >
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh</span>
              </motion.div>
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-40 justify-start"
              >
                <motion.div
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="h-5 w-5" />
                  <span>Import</span>
                </motion.div>
              </Button>
            </div>

            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-40 justify-start"
              onClick={handleExport}
            >
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="h-5 w-5" />
                <span>Export</span>
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="default"
          size="lg"
          className="h-12 w-12 rounded-full shadow-xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}