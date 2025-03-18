import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
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
  CRITICAL: "critical",
  EMERGENCY: "emergency",
  HIGH: "high",
  MEDIUM: "medium",
  NORMAL: "normal",
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
  VIP_TRANSFER: "VIP Transfer"
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

// Base schemas
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

// Table schemas
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  department: text("department").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Extend booking schema with new fields
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").references(() => employees.employeeId),
  bookingType: text("booking_type").notNull(),
  purpose: text("purpose").notNull(),
  priority: text("priority").notNull(),

  // Freight specific fields
  cargoType: text("cargo_type"),
  numBoxes: integer("num_boxes"),
  weight: integer("weight"),
  boxSize: text("box_size").array(),

  // Passenger specific fields
  tripType: text("trip_type"),
  numPassengers: integer("num_passengers"),
  passengerInfo: json("passenger_info").$type<z.infer<typeof contactInfo>[]>(),

  // Location and timing
  pickupLocation: json("pickup_location").$type<z.infer<typeof locations>>().notNull(),
  dropoffLocation: json("dropoff_location").$type<z.infer<typeof locations>>().notNull(),
  pickupWindow: json("pickup_window").$type<z.infer<typeof timeWindow>>().notNull(),
  dropoffWindow: json("dropoff_window").$type<z.infer<typeof timeWindow>>().notNull(),
  estimatedTime: integer("estimated_time"),

  // Reference and notes
  referenceNo: text("reference_no"),
  remarks: text("remarks"),

  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Insert schemas
export const insertBookingSchema = createInsertSchema(bookings)
  .extend({
    bookingType: z.enum([BookingType.FREIGHT, BookingType.PASSENGER, BookingType.AMBULANCE]),
    purpose: z.enum(Object.values(BookingPurpose) as [string, ...string[]]),
    priority: z.enum(Object.values(Priority) as [string, ...string[]]),
    boxSize: z.array(z.enum(Object.values(BoxSize) as [string, ...string[]]))
      .nonempty("At least one box size is required")
      .optional()
      .nullable(),
    tripType: z.enum(Object.values(TripType) as [string, ...string[]])
      .optional()
      .nullable(),
    pickupLocation: z.object({
      address: z.string().nonempty("Pickup address is required"),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    dropoffLocation: z.object({
      address: z.string().nonempty("Dropoff address is required"),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    pickupWindow: z.object({
      start: z.string().nonempty("Pickup start time is required"),
      end: z.string().nonempty("Pickup end time is required")
    }),
    dropoffWindow: z.object({
      start: z.string().nonempty("Dropoff start time is required"),
      end: z.string().nonempty("Dropoff end time is required")
    }),
    // Optional fields
    referenceNo: z.string().optional(),
    remarks: z.string().optional(),
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

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  loadCapacity: integer("load_capacity").notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("available"),
  currentLocation: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  features: text("features").array().default([])
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"),
  avatarUrl: text("avatar_url").notNull(),
  currentLocation: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  specializations: text("specializations").array().default([])
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

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ features: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ specializations: true });

export type Employee = typeof employees.$inferSelect;
export type User = typeof users.$inferSelect;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;