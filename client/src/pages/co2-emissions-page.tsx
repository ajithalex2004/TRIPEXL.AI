import { CO2EmissionsHeatmap } from "@/components/co2-emissions-heatmap";

export default function CO2EmissionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">CO2 Emissions Analysis</h1>
        <p className="text-muted-foreground">
          Interactive visualization of CO2 emissions across the vehicle fleet
        </p>
      </div>
      <CO2EmissionsHeatmap />
    </div>
  );
}
