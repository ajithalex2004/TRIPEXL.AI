import { EmiratesSpinner } from "@/components/ui/emirates-spinner";
import { motion } from "framer-motion";

export function LoadingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    >
      <div className="text-center">
        <EmiratesSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg font-medium text-muted-foreground"
        >
          Loading...
        </motion.p>
      </div>
    </motion.div>
  );
}