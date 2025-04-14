import { SimplifiedBookingForm } from "@/components/simplified-booking-form";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function NewBooking() {
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
          <SimplifiedBookingForm />
        </Card>
      </motion.div>
    </div>
  );
}