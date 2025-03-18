import { BookingForm } from "@/components/booking-form";
import { VehicleList } from "@/components/vehicle-list";
import { ScheduleView } from "@/components/schedule-view";
import { MapView } from "@/components/map-view";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Vehicle Booking System</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MapView />
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Available Vehicles</h2>
            <VehicleList />
          </div>
        </div>
        <div>
          <BookingForm />
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Schedule</h2>
        <ScheduleView />
      </section>
    </div>
  );
}
