import { pgTable, text, serial, integer, timestamp, json, boolean, index, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add before other enums
export const Emirates = {
  AUH: "Abu Dhabi (AUH)",
  DXB: "Dubai (DXB)", 
  SHJ: "Sharjah (SHJ)",
  AJM: "Ajman (AJM)",
  RAK: "Ras Al Khaimah (RAK)",
  FUJ: "Fujairah (FUJ)",
  UAQ: "Umm Al Quwain (UAQ)"
} as const;

// Add after Emirates enum
export const EmiratesPlateInfo = {
  "Abu Dhabi (AUH)": {
    categories: ["Private", "Commercial", "Government", "Diplomatic"],
    plateCodes: {
      "Private": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
      "Commercial": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
      "Government": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "50"],
      "Diplomatic": ["1", "2", "3", "4", "5"]
    }
  },
  "Dubai (DXB)": {
    categories: ["Private", "Commercial", "Government", "Diplomatic"],
    plateCodes: {
      "Private": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
      "Commercial": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
      "Government": ["A", "B", "C", "D", "E"],
      "Diplomatic": ["CD"]
    }
  },
  "Sharjah (SHJ)": {
    categories: ["Private", "Commercial", "Government"],
    plateCodes: {
      "Private": ["1", "2", "3", "white"],
      "Commercial": ["1", "2", "3", "green"],
      "Government": ["1", "2", "3", "blue"]
    }
  },
  "Ajman (AJM)": {
    categories: ["Private", "Commercial", "Government"],
    plateCodes: {
      "Private": ["A", "B", "C", "D"],
      "Commercial": ["E", "F"],
      "Government": ["G", "H"]
    }
  },
  "Ras Al Khaimah (RAK)": {
    categories: ["Private", "Commercial", "Government"],
    plateCodes: {
      "Private": ["A", "B"],
      "Commercial": ["C"],
      "Government": ["D"]
    }
  },
  "Fujairah (FUJ)": {
    categories: ["Private", "Commercial", "Government"],
    plateCodes: {
      "Private": ["1", "2"],
      "Commercial": ["3", "4"],
      "Government": ["5"]
    }
  },
  "Umm Al Quwain (UAQ)": {
    categories: ["Private", "Commercial", "Government"],
    plateCodes: {
      "Private": ["A", "B", "white"],
      "Commercial": ["C", "green"],
      "Government": ["D"]
    }
  }
} as const;

// Add Region enum at the top with other enums
export const Region = {
  ABU_DHABI: "Abu Dhabi",
  DUBAI: "Dubai",
  SHARJAH: "Sharjah",
  FUJAIRAH: "Fujairah",
  AJMAN: "Ajman",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  UMM_AL_QUWAIN: "Umm Al Quwain"
} as const;

// Add after existing enums, before table definitions
export const EmployeeType = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERN: "Intern"
} as const;

// Vehicle Status Enum
export const VehicleStatus = {
  AVAILABLE: "Available",
  IN_SERVICE: "In Service",
  MAINTENANCE: "Under Maintenance",
  OUT_OF_SERVICE: "Out of Service"
} as const;

// Driver Status Enum
export const DriverStatus = {
  AVAILABLE: "Available",
  ON_DUTY: "On Duty",
  OFF_DUTY: "Off Duty",
  ON_LEAVE: "On Leave"
} as const;

// Department Enum
export const Department = {
  OPERATIONS: "Operations",
  LOGISTICS: "Logistics",
  MEDICAL: "Medical",
  ADMINISTRATION: "Administration",
  MAINTENANCE: "Maintenance",
  SECURITY: "Security"
} as const;

// Update Vehicle Group Type
export const VehicleGroupType = {
  LIGHT_VEHICLE: "LIGHT VEHICLE",
  HEAVY_VEHICLE: "HEAVY VEHICLE"
} as const;

// Keep existing enums
export const BookingType = {
  FREIGHT: "freight",
  PASSENGER: "passenger",
  AMBULANCE: "ambulance",
} as const;

export const BoxSize = {
  UNDER_12: "< 12\"",
  BETWEEN_12_18: "> 12\" < 18\"",
  BETWEEN_18_24: "> 18\" < 24\"",
  BETWEEN_24_36: "> 24\" < 36\"",
  OVER_36: "> 36\""
} as const;

export const TripType = {
  ONE_WAY: "one-way",
  ROUND_TRIP: "round-trip",
} as const;

export const Priority = {
  CRITICAL: "Critical",
  EMERGENCY: "Emergency",
  HIGH: "High",
  MEDIUM: "Medium",
  NORMAL: "Normal",
} as const;

export const BookingPurpose = {
  HOSPITAL_VISIT: "Hospital Visit",
  BLOOD_BANK: "Blood Bank",
  BLOOD_SAMPLES: "Blood Samples Collection/Delivery",
  AIRPORT_PICKUP: "Airport Pickup",
  AIRPORT_DROP: "Airport Drop Off",
  BANK_VISIT: "Bank Visit",
  DRUG_COLLECTION: "Drug Collection",
  MEETING: "Meeting",
  EVENTS_SEMINAR: "Events/Seminar",
  ON_CALL: "On Call",
  MARKETING: "Marketing",
  STAFF_TRANSPORTATION: "Staff Transportation",
  TRAINING: "Training",
  STORE_ITEMS: "Store Items Collection/Delivery",
  EQUIPMENT: "Instrument & Equipment Collection/Delivery",
  DOCUMENT: "Document Collection/Delivery",
  PATIENT: "Patient Pick Up/Drop Off",
  MEDICINE: "Medicine Collection/Delivery",
  VISA_MEDICAL: "Visa Medical",
  MAINTENANCE: "Maintenance",
  VACCINE: "Vaccine Collection/Delivery",
  AMBULANCE: "Ambulance",
  MORTUARY: "Mortuary",
  ONCOLOGY: "Oncology Patient Pick Up/ Drop off",
  GUEST: "Guest",
  VIP_TRANSFER: "VIP Transfer",
  FREIGHT_TRANSPORT: "Freight Transport"
} as const;

// Add back the CargoType enum before VehicleFuelType
export const CargoType = {
  GENERAL: "General Cargo",
  TEMPERATURE_CONTROLLED: "Temperature Controlled",
  HAZARDOUS: "Hazardous Materials",
  FRAGILE: "Fragile Items",
  PERISHABLE: "Perishable Goods",
  MEDICAL_SUPPLIES: "Medical Supplies",
  DOCUMENTS: "Documents",
  ELECTRONICS: "Electronics",
  HEAVY_EQUIPMENT: "Heavy Equipment",
  LIVESTOCK: "Livestock"
} as const;

// Add after other enums
export const VehicleFuelType = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  CNG: "CNG",
  LPG: "LPG"
} as const;

// Add at the top with other imports
export const TransmissionType = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
  SEMI_AUTOMATIC: "Semi-Automatic",
  CVT: "CVT"
} as const;

export const PlateCategory = {
  PRIVATE: "Private",
  COMMERCIAL: "Commercial",
  GOVERNMENT: "Government",
  DIPLOMATIC: "Diplomatic",
  SPECIAL: "Special"
} as const;

// Add the YesNo enum type for highlighted fields
export const YesNo = {
  YES: "YES",
  NO: "NO"
} as const;

// Add after other enums
export const AssetType = {
  MOVEABLE: "Moveable",
  NON_MOVEABLE: "Non-Moveable"
} as const;


// Add after the other imports
import { relations } from "drizzle-orm";

// Update the BookingStatus enum
export const BookingStatus = {
  NEW: "new",
  PENDING: "pending",
  APPROVED: "approved", // Add approved status
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const locations = z.object({
  address: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  })
});

export const timeWindow = z.object({
  start: z.string(),
  end: z.string()
});

export const contactInfo = z.object({
  name: z.string(),
  countryCode: z.string(),
  number: z.string()
});


// Vehicle Groups table
export const vehicleGroups = pgTable("vehicle_groups", {
  id: serial("id").primaryKey(),
  groupCode: text("group_code").notNull().unique(),
  region: text("region").notNull(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  department: text("department").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Vehicle group relations
export const vehicleGroupsRelations = relations(vehicleGroups, ({ many }) => ({
  vehicleTypes: many(vehicleTypeMaster),
  vehicles: many(vehicles)
}));

// Update vehicleTypeMaster table schema
export const vehicleTypeMaster = pgTable("vehicle_type_master", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => vehicleGroups.id).notNull(),
  vehicleTypeCode: text("vehicle_type_code").notNull().unique(),
  vehicleTypeName: text("vehicle_type_name").notNull(), // Added this field
  manufacturer: text("manufacturer").notNull(),
  modelYear: integer("model_year").notNull(),
  numberOfPassengers: integer("number_of_passengers").notNull(),
  region: text("region").notNull(),
  fuelEfficiency: decimal("fuel_efficiency", { precision: 10, scale: 2 }).notNull(),
  fuelPricePerLitre: decimal("fuel_price_per_litre", { precision: 10, scale: 2 }).notNull(),
  fuelType: text("fuel_type").notNull(),
  servicePlan: text("service_plan").notNull(),
  costPerKm: decimal("cost_per_km", { precision: 10, scale: 2 }).notNull(),
  vehicleType: text("vehicle_type").notNull(),
  department: text("department").notNull(),
  unit: text("unit"),
  alertBefore: integer("alert_before").notNull(),
  idleFuelConsumption: decimal("idle_fuel_consumption", { precision: 10, scale: 2 }).notNull(),
  vehicleCapacity: integer("vehicle_capacity").notNull(),
  co2EmissionFactor: decimal("co2_emission_factor", { precision: 10, scale: 2 }).notNull().default('0'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Vehicle type master relations
export const vehicleTypeMasterRelations = relations(vehicleTypeMaster, ({ one }) => ({
  group: one(vehicleGroups, {
    fields: [vehicleTypeMaster.groupId],
    references: [vehicleGroups.id]
  })
}));

// Vehicles table with relations
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => vehicleGroups.id),
  typeId: integer("type_id").references(() => vehicleTypeMaster.id),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  name: text("name").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  loadCapacity: integer("load_capacity").notNull(),
  passengerCapacity: integer("passenger_capacity"),
  status: text("status").notNull().default("Available"),
  currentLocation: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  features: text("features").array().default([]),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => {
  return {
    groupIdIdx: index("vehicles_group_id_idx").on(table.groupId),
    typeIdIdx: index("vehicles_type_id_idx").on(table.typeId),
    statusIdx: index("vehicles_status_idx").on(table.status)
  };
});

// Vehicle relations
export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  group: one(vehicleGroups, {
    fields: [vehicles.groupId],
    references: [vehicleGroups.id]
  }),
  type: one(vehicleTypeMaster, {
    fields: [vehicles.typeId],
    references: [vehicleTypeMaster.id]
  })
}));

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  licenseType: text("license_type").notNull(),
  licenseExpiry: timestamp("license_expiry").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("Available"),
  currentLocation: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  specializations: text("specializations").array().default([]),
  preferredVehicleTypes: text("preferred_vehicle_types").array(),
  rating: integer("rating"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Update employees table schema
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  employeeName: text("employee_name").notNull(),
  employeeType: text("employee_type").notNull(),
  designation: text("designation").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  emailId: text("email_id").notNull().unique(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  nationality: text("nationality").notNull(),
  region: text("region").notNull(),
  department: text("department").notNull(),
  communicationLanguage: text("communication_language").notNull(),
  unit: text("unit").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const locationsMaster = pgTable("locations_master", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>().notNull(),
  type: text("type").notNull(),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  operatingHours: json("operating_hours").$type<{ open: string; close: string }[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Update the bookings table schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.employeeId),
  bookingType: text("booking_type").notNull(),
  purpose: text("purpose").notNull(),
  priority: text("priority").notNull(),

  // Cargo details
  cargoType: text("cargo_type"),
  numBoxes: integer("num_boxes"),
  weight: integer("weight"),
  boxSize: text("box_size").array(),

  // Trip details
  tripType: text("trip_type"),
  numPassengers: integer("num_passengers"),
  withDriver: boolean("with_driver").default(false),
  bookingForSelf: boolean("booking_for_self").default(false),
  passengerDetails: json("passenger_details").$type<{ name: string; contact: string }[]>(),

  // Location details
  pickupLocation: json("pickup_location").$type<z.infer<typeof locations>>().notNull(),
  dropoffLocation: json("dropoff_location").$type<z.infer<typeof locations>>().notNull(),
  pickupTime: text("pickup_time").notNull(),
  dropoffTime: text("dropoff_time").notNull(),

  // Reference and tracking
  referenceNo: text("reference_no").unique(),
  remarks: text("remarks"),
  status: text("status").notNull().default("new"),

  // Vehicle assignment
  assignedVehicleId: integer("assigned_vehicle_id").references(() => vehicles.id),
  assignedDriverId: integer("assigned_driver_id").references(() => drivers.id),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),

  // Booking metadata
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  co2Emissions: decimal("co2_emissions", { precision: 10, scale: 2 }),

  // Feedback and rating
  rating: integer("rating"),
  feedback: text("feedback"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.employeeId),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phoneNumber: text("phone_number"),
  isVerified: boolean("is_verified").notNull().default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  otp: text("otp").notNull(),
  type: text("type").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Add booking relations
export const bookingsRelations = relations(bookings, ({ one }) => ({
  employee: one(employees, {
    fields: [bookings.employeeId],
    references: [employees.employeeId],
  }),
  vehicle: one(vehicles, {
    fields: [bookings.assignedVehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [bookings.assignedDriverId],
    references: [drivers.id],
  }),
}));

export const vehicleMaster = pgTable("vehicle_master", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id").notNull().unique(), 
  emirate: text("emirate").notNull(), 
  registrationNumber: text("registration_number").notNull(), 
  plateCode: text("plate_code").notNull(), 
  plateNumber: text("plate_number").notNull(), 
  currentOdometer: decimal("current_odometer", { precision: 10, scale: 2 }).notNull(), 
  plateCategory: text("plate_category").notNull(),
  vehicleTypeCode: text("vehicle_type_code").references(() => vehicleTypeMaster.vehicleTypeCode).notNull(),
  vehicleTypeName: text("vehicle_type_name").notNull(),
  stopRunModeCommFreq: decimal("stop_run_mode_comm_freq", { precision: 10, scale: 2 }), 
  maxSpeed: decimal("max_speed", { precision: 10, scale: 2 }),
  vehicleModel: text("vehicle_model").notNull(),
  fuelType: text("fuel_type").notNull(), 
  transmissionType: text("transmission_type").notNull(), 
  region: text("region").notNull(), 
  department: text("department").notNull(), 
  chassisNumber: text("chassis_number").notNull(), 
  engineNumber: text("engine_number").notNull(), 
  unit: text("unit").notNull(),
  modelYear: integer("model_year").notNull(), 
  assetType: text("asset_type").notNull(), 
  tyreSize: text("tyre_size"),
  manufacturer: text("manufacturer").notNull(), 
  numberOfPassengers: integer("number_of_passengers"),
  vehicleColor: text("vehicle_color"),
  salikTagNumber: text("salik_tag_number"),
  salikAccountNumber: text("salik_account_number"),
  deviceId: text("device_id"),
  simCardNumber: text("sim_card_number"),
  vehicleUsage: text("vehicle_usage").notNull(), 

  // Yellow/Blue highlighted fields as YES/NO text fields
  isCanConnected: text("is_can_connected").notNull(), 
  isWeightSensorConnected: text("is_weight_sensor_connected").notNull(), 
  isTemperatureSensorConnected: text("is_temperature_sensor_connected").notNull(), 
  isPtoConnected: text("is_pto_connected").notNull(), 

  // Document tracking
  documentNo: text("document_no"),
  issuedOn: timestamp("issued_on"),
  expiresOn: timestamp("expires_on"),
  attachment: text("attachment"),
  isValid: boolean("is_valid").default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Add the relation
export const vehicleMasterRelations = relations(vehicleMaster, ({ one }) => ({
  vehicleType: one(vehicleTypeMaster, {
    fields: [vehicleMaster.vehicleTypeCode],
    references: [vehicleTypeMaster.vehicleTypeCode],
  }),
}));

// Update the insertBookingSchema to be more flexible
export const insertBookingSchema = createInsertSchema(bookings)
  .extend({
    bookingType: z.enum([BookingType.FREIGHT, BookingType.PASSENGER, BookingType.AMBULANCE]),
    purpose: z.enum(Object.values(BookingPurpose) as [string, ...string[]]),
    priority: z.enum(Object.values(Priority) as [string, ...string[]]),
    tripType: z.enum(Object.values(TripType) as [string, ...string[]]).optional(),
    status: z.enum(["new", "pending", "approved", "confirmed", "in_progress", "completed", "cancelled"] as [string, ...string[]]).optional(),
    cargoType: z.enum(Object.values(CargoType) as [string, ...string[]]).optional(),
    boxSize: z.array(z.enum(Object.values(BoxSize) as [string, ...string[]])).optional(),

    // Make location objects more flexible
    pickupLocation: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    dropoffLocation: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),

    // Optional fields
    withDriver: z.boolean().optional(),
    bookingForSelf: z.boolean().optional(),
    passengerDetails: z.array(
      z.object({
        name: z.string(),
        contact: z.string()
      })
    ).optional(),
    referenceNo: z.string().optional(),
    remarks: z.string().optional(),
    assignedVehicleId: z.number().optional(),
    assignedDriverId: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional(),
    totalDistance: z.number().optional(),
    estimatedCost: z.number().optional(),
    co2Emissions: z.number().optional(),
    numPassengers: z.number().optional(),
    numBoxes: z.number().optional(),
    weight: z.number().optional()
  });

export const insertEmployeeSchema = createInsertSchema(employees)
  .extend({
    employeeType: z.enum(Object.values(EmployeeType) as [string, ...string[]]),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    mobileNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid mobile number"),
    emailId: z.string().email("Invalid email address"),
    dateOfBirth: z.string().transform(str => new Date(str)),
  });

export const insertUserSchema = createInsertSchema(users).omit({
  passwordHash: true,
  isVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true
});
export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  isUsed: true,
  createdAt: true
});

export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertLocationMasterSchema = createInsertSchema(locationsMaster);

// Update insert schema for Vehicle Groups
export const insertVehicleGroupSchema = createInsertSchema(vehicleGroups)
  .extend({
    type: z.enum(Object.values(VehicleGroupType) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    groupCode: z.string().min(1, "Vehicle group code is required")
      .max(20, "Vehicle group code cannot exceed 20 characters"),
    region: z.string().min(1, "Region is required"),
    name: z.string().min(1, "Vehicle group name is required")
      .max(100, "Vehicle group name cannot exceed 100 characters"),
    imageUrl: z.string().optional(),
    description: z.string().optional()
  });

// Update the insertVehicleTypeMasterSchema to make servicePlan and alertBefore optional
export const insertVehicleTypeMasterSchema = createInsertSchema(vehicleTypeMaster)
  .extend({
    groupId: z.number().min(1, "Vehicle group is required"),
    vehicleTypeCode: z.string().min(1, "Vehicle type code is required"),
    vehicleTypeName: z.string().min(1, "Vehicle type name is required"),
    manufacturer: z.string().min(1, "Manufacturer is required"),
    modelYear: z.number().min(1900, "Invalid model year").max(new Date().getFullYear() + 1, "Future model year not allowed"),
    numberOfPassengers: z.number().min(0, "Number of passengers must be positive"),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    fuelEfficiency: z.number().min(0, "Fuel efficiency must be positive"),
    fuelPricePerLitre: z.number().min(0, "Fuel price per litre must be positive"),
    fuelType: z.enum(Object.values(VehicleFuelType) as [string, ...string[]]),
    servicePlan: z.string().optional(),
    costPerKm: z.number().min(0, "Cost per KM must be positive"),
    vehicleType: z.string().min(1, "Vehicle type is required"),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    unit: z.string().optional(),
    alertBefore: z.number().min(0, "Alert before must be positive").optional(),
    idleFuelConsumption: z.number().min(0, "Idle fuel consumption must be positive"),
    vehicleCapacity: z.number().min(0, "Vehicle capacity must be positive"),
    co2EmissionFactor: z.number().min(0, "CO2 emission factor must be positive")
  });

// Update the vehicle master table definition to use text for highlighted fields

// Update the insert schema to use Emirates enum and AssetType enum
export const insertVehicleMasterSchema = createInsertSchema(vehicleMaster)
  .extend({
    plateCategory: z.enum(Object.values(PlateCategory) as [string, ...string[]]),
    transmissionType: z.enum(Object.values(TransmissionType) as [string, ...string[]]),
    fuelType: z.enum(Object.values(VehicleFuelType) as [string, ...string[]]),
    emirate: z.enum(Object.values(Emirates) as [string, ...string[]]), 
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    assetType: z.enum(Object.values(AssetType) as [string, ...string[]]), 
    // Add YES/NO validation for highlighted fields
    isCanConnected: z.enum(Object.values(YesNo) as [string, ...string[]]),
    isWeightSensorConnected: z.enum(Object.values(YesNo) as [string, ...string[]]),
    isTemperatureSensorConnected: z.enum(Object.values(YesNo) as [string, ...string[]]),
    isPPtoConnected: z.enum(Object.values(YesNo) as [string, ...string[]]),
  });

export type Employee = typeof employees.$inferSelect;
export type User = typeof users.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type LocationMaster = typeof locationsMaster.$inferSelect;
export type VehicleGroup = typeof vehicleGroups.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertLocationMaster = z.infer<typeof insertLocationMasterSchema>;
export type InsertVehicleGroup = z.infer<typeof insertVehicleGroupSchema>;

// Add after other type exports
export type VehicleTypeMaster = typeof vehicleTypeMaster.$inferSelect;
export type InsertVehicleTypeMaster = z.infer<typeof insertVehicleTypeMasterSchema>;
export type VehicleMaster = typeof vehicleMaster.$inferSelect;
export type InsertVehicleMaster = typeof vehicleMaster.$inferInsert;