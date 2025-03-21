import { FuelEfficiencyDashboard } from "@/components/fuel-efficiency-dashboard";

export default function FuelEfficiencyPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Fuel Efficiency Analytics</h1>
      <FuelEfficiencyDashboard />
    </div>
  );
}
