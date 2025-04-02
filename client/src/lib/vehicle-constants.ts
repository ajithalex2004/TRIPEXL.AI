// Common vehicle-related constants and data
// This file ensures consistency across different components

// Default manufacturers list (in case server doesn't provide it)
export const DEFAULT_MANUFACTURERS = [
  "Toyota",
  "Nissan",
  "Mercedes-Benz",
  "BMW",
  "Lexus",
  "Land Rover",
  "Audi",
  "Porsche",
  "Mitsubishi",
  "Chevrolet",
  "Ford",
  "GMC",
  "Honda",
  "Hyundai",
  "Kia",
  "Infiniti",
  "Jeep",
  "Mazda",
  "MG",
  "Volkswagen"
];

// Define the type for model objects
export interface VehicleModelInfo {
  name: string;
  efficiency?: string;
  capacity?: string;
  idleConsumption?: string;
  passengerCapacity?: string;
  categories?: string[];
}

// Define the type for manufacturer entries
export interface ManufacturerModels {
  models: VehicleModelInfo[];
}

// Default vehicle models (organized by manufacturer)
export const DEFAULT_VEHICLE_MODELS: Record<string, ManufacturerModels> = {
  "Toyota": {
    models: [
      { name: "Corolla" },
      { name: "Land Cruiser" },
      { name: "Camry" },
      { name: "Prado" },
      { name: "Fortuner" },
      { name: "Hiace" }
    ]
  },
  "Nissan": {
    models: [
      { name: "Patrol" },
      { name: "Altima" },
      { name: "Sunny" },
      { name: "X-Trail" },
      { name: "Urvan" }
    ]
  },
  "Mercedes-Benz": {
    models: [
      { name: "G-Class" },
      { name: "GLE" },
      { name: "S-Class" },
      { name: "Sprinter" }
    ]
  },
  "BMW": {
    models: [
      { name: "X5" },
      { name: "X7" },
      { name: "7 Series" }
    ]
  },
  "Lexus": {
    models: [
      { name: "LX" },
      { name: "ES" },
      { name: "RX" }
    ]
  }
};

// Generate a list of years from start to current year + 1
export function generateYearsList(startYear = 2010): number[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
}

// Default years list
export const DEFAULT_YEARS = generateYearsList(2010);

// Function to ensure consistent vehicle code generation
export function generateVehicleTypeCode(manufacturer: string, model: string, year: number): string {
  if (!manufacturer || !model || !year) {
    return "";
  }
  const mfr = manufacturer.substring(0, 3);
  const modelPrefix = model.substring(0, 3);
  return `${mfr}-${modelPrefix}-${year}`.toUpperCase();
}