import { BookingForm } from "@/components/booking-form";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import ErrorBoundary from "@/components/error-boundary";
import { useToast } from "@/hooks/use-toast";

export default function NewBooking() {
  const { toast } = useToast();
  
  const handleErrorReset = () => {
    // Inform the user that the form has been reset due to an error
    toast({
      title: "Form reset",
      description: "The booking form has been reset due to an error. Please try again.",
      variant: "default",
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004990] to-[#0066cc]">
          New Booking Request
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Create a new vehicle booking request with our intelligent system
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 p-6">
          <ErrorBoundary onReset={handleErrorReset}>
            <BookingForm />
          </ErrorBoundary>
        </Card>
      </motion.div>
    </div>
  );
}