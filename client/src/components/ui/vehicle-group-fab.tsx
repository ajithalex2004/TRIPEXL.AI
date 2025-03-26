import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Download, Upload, FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VehicleGroupFABProps {
  onAddClick: () => void;
  onImport: (file: File) => Promise<void>;
  onExport: () => Promise<void>;
  onDownloadTemplate: () => Promise<void>;
  onRefresh: () => void;
}

export function VehicleGroupFAB({
  onAddClick,
  onImport,
  onExport,
  onDownloadTemplate,
  onRefresh
}: VehicleGroupFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      await onImport(file);
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import file",
        variant: "destructive"
      });
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Action failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col items-end space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
                onClick={() => handleAction(onDownloadTemplate)}
              >
                <FileDown className="h-4 w-4" />
                Download Template
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
                onClick={() => handleAction(onExport)}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                />
              </label>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
                onClick={() => {
                  onRefresh();
                  setIsOpen(false);
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
                onClick={() => {
                  onAddClick();
                  setIsOpen(false);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Vehicle Group
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="rounded-full h-14 w-14 bg-primary shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-6 w-6" />
          </motion.div>
        </Button>
      </motion.div>
    </div>
  );
}
