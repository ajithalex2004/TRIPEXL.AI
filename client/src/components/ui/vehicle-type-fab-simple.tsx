import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleTypeFABProps {
  onClick: () => void;
}

export function VehicleTypeFAB({ onClick }: VehicleTypeFABProps) {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col items-end space-y-4">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="rounded-full h-14 w-14 bg-gradient-to-br from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-primary/90 hover:to-primary border-2 border-primary/20"
          onClick={onClick}
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    </div>
  );
}