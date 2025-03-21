import { motion } from "framer-motion";
import { Check, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BookingConfirmationAnimationProps {
  bookingDetails?: {
    vehicleType: string;
    date: string;
    location: string;
  };
}

export function BookingConfirmationAnimation({ bookingDetails }: BookingConfirmationAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8"
    >
      {/* Success checkmark animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="rounded-full bg-green-100 p-3 mb-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Check className="w-8 h-8 text-green-600" />
        </motion.div>
      </motion.div>

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-6"
      >
        <h3 className="text-xl font-semibold text-green-600 mb-2">
          Booking Confirmed!
        </h3>
        <p className="text-sm text-muted-foreground">
          Your journey has been successfully scheduled
        </p>
      </motion.div>

      {/* Booking details card with staggered animation */}
      {bookingDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 bg-white/50 backdrop-blur-sm">
            <motion.div className="space-y-4">
              {/* Vehicle Type */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bookingDetails.vehicleType}</p>
                  <p className="text-xs text-muted-foreground">Vehicle Type</p>
                </div>
              </motion.div>

              {/* Date */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bookingDetails.date}</p>
                  <p className="text-xs text-muted-foreground">Booking Date</p>
                </div>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{bookingDetails.location}</p>
                  <p className="text-xs text-muted-foreground">Pickup Location</p>
                </div>
              </motion.div>
            </motion.div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
