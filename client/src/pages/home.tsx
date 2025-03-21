import { VehicleList } from "@/components/vehicle-list";
import { MapView } from "@/components/map-view";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Car, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004990]/20 via-background to-[#000000]/10">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#004990] to-[#0066cc]">
            Smart Vehicle Management
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience intelligent journey planning with our AI-powered platform
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Calendar, label: "Bookings Today", value: "24" },
            { icon: MapPin, label: "Active Routes", value: "12" },
            { icon: Car, label: "Available Vehicles", value: "38" },
            { icon: BarChart2, label: "Efficiency Score", value: "92%" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6 backdrop-blur-sm bg-white/80 dark:bg-black/50 hover:bg-white/90 dark:hover:bg-black/60 transition-all duration-300 border border-white/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Vehicle List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 p-6">
              <h2 className="text-xl font-semibold mb-4">Available Vehicles</h2>
              <div className="h-[400px] overflow-y-auto">
                <VehicleList />
              </div>
            </Card>
          </motion.div>

          {/* Map View - Spans 8 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8"
          >
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-black/50 border border-white/20 p-6">
              <h2 className="text-xl font-semibold mb-4">Live Fleet Tracking</h2>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <MapView onLocationSelect={() => {}} />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}