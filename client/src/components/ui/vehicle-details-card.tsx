import React from 'react';
import { Car, Fuel, Building2, BoxesIcon, Users, Bell, Home, Factory, Wrench, Tag, CircleDollarSign, BarChart, LineChart, PieChart } from "lucide-react";

interface VehicleDetailsCardProps {
  vehicleData: any;
}

interface DetailRowProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, icon }) => (
  <div className="grid grid-cols-2 py-3 border-b last:border-b-0">
    <div className="flex items-center gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="text-sm">{value}</div>
  </div>
);

export function VehicleDetailsCard({ vehicleData }: VehicleDetailsCardProps) {
  // Format currency values
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(2)} AED`;
  };

  // Get performance data if available
  const hasPerformanceData = vehicleData.performance !== undefined;

  // Get performance rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-600";
    if (rating >= 6) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {vehicleData.name || vehicleData.vehicle_type_name || "Vehicle Details"}
        </h3>
        {hasPerformanceData && (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">Overall:</span>
            <span className={`text-sm font-bold ${getRatingColor(vehicleData.performance.overallScore)}`}>
              {vehicleData.performance.overallScore}/10
            </span>
          </div>
        )}
      </div>
      
      {/* Performance Metrics Section (if available) */}
      {hasPerformanceData && (
        <div className="mb-4 bg-muted/30 p-3 rounded-md">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <BarChart size={14} className="text-primary" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-card rounded border">
              <span className="text-xs text-muted-foreground">Efficiency</span>
              <span className={`text-lg font-bold ${getRatingColor(vehicleData.performance.efficiencyRating)}`}>
                {vehicleData.performance.efficiencyRating}/10
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-card rounded border">
              <span className="text-xs text-muted-foreground">Cost</span>
              <span className={`text-lg font-bold ${getRatingColor(vehicleData.performance.costRating)}`}>
                {vehicleData.performance.costRating}/10
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-card rounded border">
              <span className="text-xs text-muted-foreground">Emissions</span>
              <span className={`text-lg font-bold ${getRatingColor(vehicleData.performance.emissionsRating)}`}>
                {vehicleData.performance.emissionsRating}/10
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-1">
          <DetailRow 
            label="Vehicle Group" 
            value={vehicleData.group_name || "Not specified"} 
            icon={<BoxesIcon size={16} />} 
          />
          <DetailRow 
            label="Manufacturer" 
            value={vehicleData.manufacturer || "Not specified"} 
            icon={<Factory size={16} />} 
          />
          <DetailRow 
            label="Model Year" 
            value={vehicleData.model_year || new Date().getFullYear()} 
            icon={<Car size={16} />} 
          />
          <DetailRow 
            label="Fuel Type" 
            value={vehicleData.fuel_type || "Not specified"} 
            icon={<Fuel size={16} />} 
          />
          <DetailRow 
            label="Fuel Efficiency (km/l)" 
            value={vehicleData.fuel_efficiency || vehicleData.fuelEfficiency || 0} 
            icon={<Fuel size={16} />} 
          />
          <DetailRow 
            label="Idle Fuel Consumption" 
            value={vehicleData.idle_fuel_consumption || vehicleData.idleFuelConsumption || 0} 
            icon={<Fuel size={16} />} 
          />
          <DetailRow 
            label="Number of Passengers" 
            value={vehicleData.number_of_passengers || vehicleData.passengerCapacity || 0} 
            icon={<Users size={16} />} 
          />
        </div>
        
        {/* Right Column */}
        <div className="space-y-1">
          <DetailRow 
            label="Vehicle Type Code" 
            value={vehicleData.vehicle_type_code || vehicleData.code || "N/A"} 
            icon={<Tag size={16} />} 
          />
          <DetailRow 
            label="Service Plan" 
            value={vehicleData.service_plan || "Standard"} 
            icon={<Wrench size={16} />} 
          />
          <DetailRow 
            label="Region" 
            value={vehicleData.region || "Not specified"} 
            icon={<Home size={16} />} 
          />
          <DetailRow 
            label="Department" 
            value={vehicleData.department || "Not specified"} 
            icon={<Building2 size={16} />} 
          />
          <DetailRow 
            label="Fuel Price Per Litre" 
            value={formatCurrency(vehicleData.fuel_price_per_litre || (vehicleData.fuelTypeDetails?.price) || 0)} 
            icon={<CircleDollarSign size={16} />} 
          />
          <DetailRow 
            label="Cost Per KM" 
            value={formatCurrency(vehicleData.cost_per_km || vehicleData.costPerKm || 0)} 
            icon={<CircleDollarSign size={16} />} 
          />
          <DetailRow 
            label="CO2 Emission Factor" 
            value={vehicleData.co2_emission_factor || vehicleData.co2EmissionFactor || 0} 
            icon={<Fuel size={16} />} 
          />
        </div>
      </div>
    </div>
  );
}