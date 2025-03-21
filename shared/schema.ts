import { pgTable, text, serial, integer, timestamp, json, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Update vehicleTypeMaster table by removing roadSpeedThreshold
export const vehicleTypeMaster = pgTable("vehicle_type_master", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => vehicleGroups.id).notNull(),
  vehicleTypeCode: text("vehicle_type_code").notNull().unique(),
  manufacturer: text("manufacturer").notNull(), // Added manufacturer
  modelYear: integer("model_year").notNull(), // Added model year
  numberOfPassengers: integer("number_of_passengers").notNull(),
  region: text("region").notNull(),
  section: text("section"),
  fuelEfficiency: integer("fuel_efficiency").notNull(), // KM/L
  fuelPricePerLitre: integer("fuel_price_per_litre").notNull(), // Price per litre
  fuelType: text("fuel_type").notNull(),
  servicePlan: text("service_plan").notNull(),
  costPerKm: integer("cost_per_km").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  department: text("department").notNull(),
  unit: text("unit"),
  alertBefore: integer("alert_before").notNull(),
  idleFuelConsumption: integer("idle_fuel_consumption").notNull(),
  vehicleCapacity: integer("vehicle_capacity").notNull(),
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

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  location: json("location").$type<z.infer<typeof locations>>(),
  supervisor: text("supervisor").references(() => employees.employeeId),
  emergencyContact: text("emergency_contact"),
  joiningDate: timestamp("joining_date").notNull(),
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

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.employeeId),
  bookingType: text("booking_type").notNull(),
  purpose: text("purpose").notNull(),
  priority: text("priority").notNull(),

  cargoType: text("cargo_type"),
  numBoxes: integer("num_boxes"),
  weight: integer("weight"),
  boxSize: text("box_size").array(),

  tripType: text("trip_type"),
  numPassengers: integer("num_passengers"),
  withDriver: boolean("with_driver").default(false),
  bookingForSelf: boolean("booking_for_self").default(false),
  passengerDetails: json("passenger_details").$type<{ name: string; contact: string }[]>(),

  pickupLocation: json("pickup_location").$type<z.infer<typeof locations>>().notNull(),
  dropoffLocation: json("dropoff_location").$type<z.infer<typeof locations>>().notNull(),
  pickupTime: text("pickup_time").notNull(),
  dropoffTime: text("dropoff_time").notNull(),

  referenceNo: text("reference_no"),
  remarks: text("remarks"),

  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow()
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


export const insertBookingSchema = createInsertSchema(bookings)
  .extend({
    bookingType: z.enum([BookingType.FREIGHT, BookingType.PASSENGER, BookingType.AMBULANCE]),
    purpose: z.enum(Object.values(BookingPurpose) as [string, ...string[]]),
    priority: z.enum(Object.values(Priority) as [string, ...string[]]),
    tripType: z.enum(Object.values(TripType) as [string, ...string[]]).optional(),
    withDriver: z.boolean().optional(),
    bookingForSelf: z.boolean().optional(),
    passengerDetails: z.array(
      z.object({
        name: z.string().min(1, "Passenger name is required"),
        contact: z.string().min(1, "Contact details are required")
      })
    ).optional(),
    boxSize: z.array(z.enum(Object.values(BoxSize) as [string, ...string[]]))
      .optional(),
    pickupLocation: z.object({
      address: z.string().min(1, "Pickup address is required"),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    dropoffLocation: z.object({
      address: z.string().min(1, "Dropoff address is required"),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    pickupTime: z.string().min(1, "Pickup time is required"),
    dropoffTime: z.string().min(1, "Dropoff time is required"),
    referenceNo: z.string().optional(),
    remarks: z.string().optional(),
  });

export const insertEmployeeSchema = createInsertSchema(employees);
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

// Update the insert schema validation
export const insertVehicleTypeMasterSchema = createInsertSchema(vehicleTypeMaster)
  .extend({
    groupId: z.number().min(1, "Vehicle group is required"),
    vehicleTypeCode: z.string().min(1, "Vehicle type code is required"),
    manufacturer: z.string().min(1, "Manufacturer is required"),
    modelYear: z.number().min(1900, "Invalid model year").max(new Date().getFullYear() + 1, "Future model year not allowed"),
    numberOfPassengers: z.number().min(0, "Number of passengers must be positive"),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    section: z.string().optional(),
    fuelEfficiency: z.number().min(0, "Fuel efficiency must be positive"),
    fuelPricePerLitre: z.number().min(0, "Fuel price per litre must be positive"),
    fuelType: z.enum(Object.values(VehicleFuelType) as [string, ...string[]]),
    servicePlan: z.string().min(1, "Service plan is required"),
    costPerKm: z.number().min(0, "Cost per KM must be positive"),
    vehicleType: z.string().min(1, "Vehicle type is required"),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    unit: z.string().optional(),
    alertBefore: z.number().min(0, "Alert before must be positive"),
    idleFuelConsumption: z.number().min(0, "Idle fuel consumption must be positive"),
    vehicleCapacity: z.number().min(0, "Vehicle capacity must be positive")
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