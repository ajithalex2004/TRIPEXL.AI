import { BookingForm } from "@/components/booking-form";
import { VehicleList } from "@/components/vehicle-list";
import { MapView } from "@/components/map-view";

export default function HomePage() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form - Takes up full width on mobile, 2 columns on desktop */}
        <div className="lg:col-span-2">
          <BookingForm />
        </div>

        {/* Right Column - Vehicles and Map */}
        <div className="space-y-6">
          {/* Available Vehicles */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Vehicles</h2>
            <VehicleList />
          </div>

          {/* Map View */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Location Map</h2>
            <MapView onLocationSelect={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
