export const MOCK_LOCATIONS = [
  {
    address: "123 Main St, New York, NY",
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    address: "456 Park Ave, New York, NY",
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  // Add more locations...
];

export const VEHICLE_TYPES = [
  { value: "van", label: "Delivery Van" },
  { value: "truck", label: "Box Truck" },
  { value: "semi", label: "Semi Truck" }
];

export const CARGO_TYPES = [
  { value: "general", label: "General Cargo" },
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "perishables", label: "Perishables" },
  { value: "construction", label: "Construction Materials" }
];

export const PRIORITY_LEVELS = [
  { value: "standard", label: "Standard" },
  { value: "express", label: "Express" },
  { value: "urgent", label: "Urgent" }
];

export const SPECIAL_REQUIREMENTS = [
  { value: "refrigeration", label: "Refrigeration Required" },
  { value: "fragile", label: "Fragile Items" },
  { value: "liftgate", label: "Liftgate Required" },
  { value: "insurance", label: "Extra Insurance" },
  { value: "signature", label: "Signature Required" }
];

export const BOOKING_STATUS_COLORS = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  inProgress: "bg-purple-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500"
};