import { BookingForm } from "@/components/booking-form";
import { VehicleList } from "@/components/vehicle-list";
import { MapView } from "@/components/map-view";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="flex justify-between items-center mb-8">
        <motion.h1 
          className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Vehicle Booking System
        </motion.h1>
      </header>

      {/* Booking Form - Takes priority at the top */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <BookingForm />
      </motion.div>

      {/* Map and Vehicles Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Available Vehicles</h2>
            <VehicleList />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Location Map</h2>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapView onLocationSelect={() => {}} />
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}