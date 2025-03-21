import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import ReactConfetti from 'react-confetti';
import { useEffect, useState } from "react";

interface BookingConfirmationAnimationProps {
  bookingDetails?: {
    vehicleType: string;
    date: string;
    location: string;
  };
}

export function BookingConfirmationAnimation({ bookingDetails }: BookingConfirmationAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set dimensions for confetti
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <ReactConfetti
            width={dimensions.width}
            height={dimensions.height}
            numberOfPieces={200}
            recycle={false}
            gravity={0.2}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8"
      >
        {/* Success checkmark animation with pulse effect */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1
          }}
          className="rounded-full bg-green-100 p-3 mb-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              delay: 0.2,
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2
            }}
          >
            <Check className="w-8 h-8 text-green-600" />
          </motion.div>
        </motion.div>

        {/* Success message with gradient and pulse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <motion.h3 
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 mb-2"
            animate={{ 
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2
            }}
          >
            Booking Confirmed!
          </motion.h3>
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
            <Card className="p-6 bg-white/50 backdrop-blur-sm border-2 border-green-100">
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
    </>
  );
}