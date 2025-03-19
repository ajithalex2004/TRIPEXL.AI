import { BookingForm } from "@/components/booking-form";
import { VehicleList } from "@/components/vehicle-list";
import { MapView } from "@/components/map-view";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <motion.header 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          Vehicle Booking System
        </h1>
      </motion.header>

      {/* Main Content */}
      <div className="space-y-12">
        {/* Booking Form Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BookingForm />
        </motion.section>

        {/* Vehicles and Map Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t pt-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Vehicles */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Available Vehicles</h2>
              <VehicleList />
            </div>

            {/* Map View */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Location Map</h2>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <MapView onLocationSelect={() => {}} />
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}