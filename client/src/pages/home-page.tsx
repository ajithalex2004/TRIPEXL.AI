import { BookingForm } from "@/components/booking-form";
import { VehicleList } from "@/components/vehicle-list";
import { MapView } from "@/components/map-view";

export default function HomePage() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Vehicles and Map */}
        <div className="space-y-4">
          {/* Available Vehicles */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Available Vehicles</h2>
            <div className="h-[200px] overflow-y-auto">
              <VehicleList />
            </div>
          </div>

          {/* Map View */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Location Map</h2>
            <div className="h-[300px]">
              <MapView onLocationSelect={() => {}} />
            </div>
          </div>
        </div>

        {/* Booking Form - Takes up 2 columns on desktop */}
        <div className="lg:col-span-2">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}