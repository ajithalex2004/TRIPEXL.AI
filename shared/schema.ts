import { pgTable, text, serial, integer, timestamp, json, boolean, index, decimal, varchar, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add actual values for UserType, UserOperationType, and UserGroup
export const UserType = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  OPERATOR: "Operator",
  USER: "User"
} as const;

// Update the UserOperationType enum to match the image
export const UserOperationType = {
  ADMIN: "Admin",
  MANAGEMENT: "Management",
  SUPERVISOR: "Supervisor",
  EMPLOYEE: "Employee",
  OPERATIONS: "Operations"
} as const;

export const UserGroup = {
  GROUP_A: "Group A",
  GROUP_B: "Group B",
  GROUP_C: "Group C",
  GROUP_D: "Group D"
} as const;

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

// Add after Emirates enum
export const Region = {
  ABU_DHABI: "Abu Dhabi",
  DUBAI: "Dubai",
  SHARJAH: "Sharjah",
  FUJAIRAH: "Fujairah",
  AJMAN: "Ajman",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  UMM_AL_QUWAIN: "Umm Al Quwain"
} as const;

export const EmployeeType = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERN: "Intern"
} as const;

export const VehicleStatus = {
  AVAILABLE: "Available",
  IN_SERVICE: "In Service",
  MAINTENANCE: "Under Maintenance",
  OUT_OF_SERVICE: "Out of Service"
} as const;

export const DriverStatus = {
  AVAILABLE: "Available",
  ON_DUTY: "On Duty",
  OFF_DUTY: "Off Duty",
  ON_LEAVE: "On Leave"
} as const;

export const Department = {
  OPERATIONS: "Operations",
  LOGISTICS: "Logistics",
  MEDICAL: "Medical",
  ADMINISTRATION: "Administration",
  MAINTENANCE: "Maintenance",
  SECURITY: "Security"
} as const;

export const VehicleGroupType = {
  LIGHT_VEHICLE: "LIGHT VEHICLE",
  HEAVY_VEHICLE: "HEAVY VEHICLE"
} as const;

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

export const VehicleFuelType = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  CNG: "CNG",
  LPG: "LPG"
} as const;

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

export const YesNo = {
  YES: "YES",
  NO: "NO"
} as const;

export const AssetType = {
  MOVEABLE: "Moveable",
  NON_MOVEABLE: "Non-Moveable"
} as const;

export const BookingStatus = {
  NEW: "new",
  PENDING: "pending",
  APPROVED: "approved",
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


export const EmployeeDesignation = {
  // Regional Level
  REGIONAL_DIRECTOR: "Regional Director",
  REGIONAL_MANAGER: "Regional Manager",

  // Department Level
  DEPARTMENT_HEAD: "Department Head",
  DEPARTMENT_MANAGER: "Department Manager",

  // Unit Level
  UNIT_HEAD: "Unit Head",
  UNIT_SUPERVISOR: "Unit Supervisor",

  // Staff Level
  SENIOR_STAFF: "Senior Staff",
  STAFF: "Staff",
  JUNIOR_STAFF: "Junior Staff"
} as const;

// Update the HierarchyLevel enum
export const HierarchyLevel = {
  LEVEL_1: "Level 1", // Immediate Approval Authority/Dept Head
  LEVEL_2: "Level 2"  // Senior Management
} as const;

// Add new enum for workflow levels before the approvalWorkflows definition
export const WorkflowLevels = {
  LEVEL_1_ONLY: "Level 1",
  BOTH_LEVELS: "Level 1 & 2"
} as const;

// Add after the HierarchyLevel definition
export const ApprovalLevel = {
  LEVEL_1: "Level 1", // Approval Authority/Dept Head
  LEVEL_2: "Level 2"  // Senior Management
} as const;

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").notNull().unique(),
  employee_name: varchar("employee_name", { length: 100 }).notNull(),
  email_id: varchar("email_id", { length: 50 }).notNull(),
  mobile_number: varchar("mobile_number", { length: 15 }).notNull(),
  designation: text("designation").notNull(),
  hierarchy_level: text("hierarchy_level").notNull(),
  employee_type: varchar("employee_type", { length: 50 }),
  region: varchar("region", { length: 50 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  date_of_birth: date("date_of_birth"),
  nationality: text("nationality"),
  password: varchar("password", { length: 50 }),
  communication_language: varchar("communication_language", { length: 50 }),
  supervisor_id: integer("supervisor_id").references(() => employees.id),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

// Update the approvalWorkflows table definition
export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  workflow_name: varchar("workflow_name", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  department: varchar("department", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  level_1_approver_id: integer("level_1_approver_id").references(() => employees.id),
  level_2_approver_id: integer("level_2_approver_id").references(() => employees.id),
  levels_required: varchar("levels_required", { length: 20 }).notNull().default("Level 1"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
}, (table) => {
  return {
    // Create a unique constraint on region, department, and unit combination
    unique_workflow_idx: unique("unique_workflow_idx").on(
      table.region,
      table.department,
      table.unit
    )
  };
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  supervisor: one(employees, {
    fields: [employees.supervisor_id],
    references: [employees.id],
  }),
  subordinates: many(employees),
  bookings: many(bookings)
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  user_name: text("user_name").notNull().unique(),
  user_code: text("user_code").notNull().unique(),
  user_type: text("user_type").notNull(),
  email_id: text("email_id").notNull().unique(),
  user_operation_type: text("user_operation_type").notNull(),
  user_group: text("user_group").notNull(),
  full_name: text("full_name").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  password: text("password").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  reset_token: text("reset_token"),
  reset_token_expiry: timestamp("reset_token_expiry")
});

export const vehicleGroups = pgTable("vehicle_groups", {
  id: serial("id").primaryKey(),
  group_code: text("group_code").notNull().unique(),
  region: text("region").notNull(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(),
  department: text("department").notNull(),
  image_url: text("image_url"),
  description: text("description"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export const vehicleGroupsRelations = relations(vehicleGroups, ({ many }) => ({
  vehicleTypes: many(vehicleTypeMaster),
  vehicles: many(vehicles)
}));

export const vehicleTypeMaster = pgTable("vehicle_type_master", {
  id: serial("id").primaryKey(),
  group_id: integer("group_id").references(() => vehicleGroups.id).notNull(),
  vehicle_type_code: text("vehicle_type_code").notNull().unique(),
  vehicle_type_name: text("vehicle_type_name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  model_year: integer("model_year").notNull(),
  number_of_passengers: integer("number_of_passengers").notNull(),
  region: text("region").notNull(),
  fuel_efficiency: decimal("fuel_efficiency", { precision: 10, scale: 2 }).notNull(),
  fuel_price_per_litre: decimal("fuel_price_per_litre", { precision: 10, scale: 2 }).notNull(),
  fuel_type: text("fuel_type").notNull(),
  service_plan: text("service_plan").notNull(),
  cost_per_km: decimal("cost_per_km", { precision: 10, scale: 2 }).notNull(),
  vehicle_type: text("vehicle_type").notNull(),
  department: text("department").notNull(),
  unit: text("unit"),
  alert_before: integer("alert_before").notNull(),
  idle_fuel_consumption: decimal("idle_fuel_consumption", { precision: 10, scale: 2 }).notNull(),
  vehicle_capacity: integer("vehicle_capacity").notNull(),
  co2_emission_factor: decimal("co2_emission_factor", { precision: 10, scale: 2 }).notNull().default('0'),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export const vehicleTypeMasterRelations = relations(vehicleTypeMaster, ({ one }) => ({
  group: one(vehicleGroups, {
    fields: [vehicleTypeMaster.group_id],
    references: [vehicleGroups.id]
  })
}));

// Add after the vehicleTypeMaster table definition
const vehicleMaster = pgTable("vehicle_master", {});
export const insertVehicleMasterSchema = createInsertSchema(vehicleMaster);

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  group_id: integer("group_id").references(() => vehicleGroups.id),
  type_id: integer("type_id").references(() => vehicleTypeMaster.id),
  vehicle_number: text("vehicle_number").notNull().unique(),
  name: text("name").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  registration_number: text("registration_number").notNull().unique(),
  load_capacity: integer("load_capacity").notNull(),
  passenger_capacity: integer("passenger_capacity"),
  status: text("status").notNull().default("Available"),
  current_location: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  last_maintenance_date: timestamp("last_maintenance_date"),
  next_maintenance_date: timestamp("next_maintenance_date"),
  features: text("features").array().default([]),
  image_url: text("image_url"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
}, (table) => {
  return {
    group_id_idx: index("vehicles_group_id_idx").on(table.group_id),
    type_id_idx: index("vehicles_type_id_idx").on(table.type_id),
    status_idx: index("vehicles_status_idx").on(table.status)
  };
});

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  group: one(vehicleGroups, {
    fields: [vehicles.group_id],
    references: [vehicleGroups.id]
  }),
  type: one(vehicleTypeMaster, {
    fields: [vehicles.type_id],
    references: [vehicleTypeMaster.id]
  })
}));

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  employee_id: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  license_number: text("license_number").notNull().unique(),
  license_type: text("license_type").notNull(),
  license_expiry: timestamp("license_expiry").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("Available"),
  current_location: json("current_location").$type<z.infer<typeof locations>>().notNull(),
  specializations: text("specializations").array().default([]),
  preferred_vehicle_types: text("preferred_vehicle_types").array(),
  rating: integer("rating"),
  avatar_url: text("avatar_url"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export const locationsMaster = pgTable("locations_master", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  coordinates: json("coordinates").$type<{ lat: number; lng: number }>().notNull(),
  type: text("type").notNull(),
  contact_person: text("contact_person"),
  contact_phone: text("contact_phone"),
  operating_hours: json("operating_hours").$type<{ open: string; close: string }[]>(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  employee_id: integer("employee_id").references(() => employees.id),
  booking_type: text("booking_type").notNull(),
  purpose: text("purpose").notNull(),
  priority: text("priority").notNull(),

  // Cargo details
  cargo_type: text("cargo_type"),
  num_boxes: integer("num_boxes"),
  weight: integer("weight"),
  box_size: text("box_size").array(),

  // Trip details
  trip_type: text("trip_type"),
  num_passengers: integer("num_passengers"),
  with_driver: boolean("with_driver").default(false),
  booking_for_self: boolean("booking_for_self").default(false),
  passenger_details: json("passenger_details").$type<{ name: string; contact: string }[]>(),

  // Location details
  pickup_location: json("pickup_location").$type<z.infer<typeof locations>>().notNull(),
  dropoff_location: json("dropoff_location").$type<z.infer<typeof locations>>().notNull(),
  pickup_time: text("pickup_time").notNull(),
  dropoff_time: text("dropoff_time").notNull(),

  // Reference and tracking
  reference_no: text("reference_no").unique(),
  remarks: text("remarks"),
  status: text("status").notNull().default("new"),

  // Vehicle assignment
  assigned_vehicle_id: integer("assigned_vehicle_id").references(() => vehicles.id),
  assigned_driver_id: integer("assigned_driver_id").references(() => drivers.id),

  // Timestamps
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  confirmed_at: timestamp("confirmed_at"),
  completed_at: timestamp("completed_at"),
  cancelled_at: timestamp("cancelled_at"),

  // Booking metadata
  total_distance: decimal("total_distance", { precision: 10, scale: 2 }),
  estimated_cost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actual_cost: decimal("actual_cost", { precision: 10, scale: 2 }),
  co2_emissions: decimal("co2_emissions", { precision: 10, scale: 2 }),

  // Feedback and rating
  rating: integer("rating"),
  feedback: text("feedback"),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  otp: text("otp").notNull(),
  type: text("type").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  is_used: boolean("is_used").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow()
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.user_id],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [bookings.assigned_vehicle_id],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [bookings.assigned_driver_id],
    references: [drivers.id],
  }),
  employee: one(employees, {
    fields: [bookings.employee_id],
    references: [employees.id]
  })
}));


export const insertBookingSchema = createInsertSchema(bookings)
  .extend({
    booking_type: z.enum([BookingType.FREIGHT, BookingType.PASSENGER, BookingType.AMBULANCE]),
    purpose: z.enum(Object.values(BookingPurpose) as [string, ...string[]]),
    priority: z.enum(Object.values(Priority) as [string, ...string[]]),
    trip_type: z.enum(Object.values(TripType) as [string, ...string[]]).optional(),
    status: z.enum(["new", "pending", "approved", "confirmed", "in_progress", "completed", "cancelled"] as [string, ...string[]]).optional(),
    cargo_type: z.enum(Object.values(CargoType) as [string, ...string[]]).optional(),
    box_size: z.array(z.enum(Object.values(BoxSize) as [string, ...string[]])).optional(),

    // Make location objects more flexible
    pickup_location: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),
    dropoff_location: z.object({
      address: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }),

    // Optional fields
    with_driver: z.boolean().optional(),
    booking_for_self: z.boolean().optional(),
    passenger_details: z.array(
      z.object({
        name: z.string(),
        contact: z.string()
      })
    ).optional(),
    reference_no: z.string().optional(),
    remarks: z.string().optional(),
    assigned_vehicle_id: z.number().optional(),
    assigned_driver_id: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional(),
    total_distance: z.number().optional(),
    estimated_cost: z.number().optional(),
    co2_emissions: z.number().optional(),
    num_passengers: z.number().optional(),
    num_boxes: z.number().optional(),
    weight: z.number().optional(),
    employee_id: z.number().optional()
  });

// Update the user insert schema to match database columns exactly
export const insertUserSchema = createInsertSchema(users)
  .extend({
    user_name: z.string().min(3, "Username must be at least 3 characters long"),
    user_code: z.string().min(3, "User code must be at least 3 characters long"),
    user_type: z.enum(Object.values(UserType) as [string, ...string[]]),
    email_id: z.string().email("Invalid email address"),
    user_operation_type: z.enum(Object.values(UserOperationType) as [string, ...string[]]),
    user_group: z.enum(Object.values(UserGroup) as [string, ...string[]]),
    full_name: z.string().min(3, "Full name is required"),
    first_name: z.string().min(2, "First name must be at least 2 characters long"),
    last_name: z.string().min(2, "Last name must be at least 2 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    is_active: z.boolean().optional(),
    created_at: z.date().optional(),
    updated_at: z.date().optional(),
    reset_token: z.string().optional(),
    reset_token_expiry: z.date().optional()
  });

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  is_used: true,
  created_at: true
});

export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertLocationMasterSchema = createInsertSchema(locationsMaster);

// Fix the vehicle group schema validation
export const insertVehicleGroupSchema = createInsertSchema(vehicleGroups)
  .extend({
    type: z.enum(Object.values(VehicleGroupType) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    group_code: z.string().min(1, "Vehicle group code is required")
      .max(20, "Vehicle group code cannot exceed 20 characters"),
    region: z.string().min(1, "Region is required"),
    name: z.string().min(1, "Vehicle group name is required")
      .max(100, "Vehicle group name cannot exceed 100 characters"),
    image_url: z.string().optional(),
    description: z.string().optional()
  });

// Update the insertApprovalWorkflowSchema with proper validations
export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows)
  .extend({
    workflow_name: z.string().min(1, "Workflow name is required"),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    unit: z.string().min(1, "Unit is required"),
    level_1_approver_id: z.number().positive("Level 1 approver is required"),
    level_2_approver_id: z.number().optional(),
    levels_required: z.enum(Object.values(WorkflowLevels) as [string, ...string[]])
  });

// Add back the vehicle type master schema
export const insertVehicleTypeMasterSchema = createInsertSchema(vehicleTypeMaster)
  .extend({
    group_id: z.number().min(1, "Vehicle group is required"),
    vehicle_type_code: z.string().min(1, "Vehicle type code is required"),
    vehicle_type_name: z.string().min(1, "Vehicle type name is required"),
    manufacturer: z.string().min(1, "Manufacturer is required"),
    model_year: z.number().min(1900, "Invalid model year").max(new Date().getFullYear() + 1, "Future model year not allowed"),
    number_of_passengers: z.number().min(0, "Number of passengers must be positive"),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    fuel_efficiency: z.number().min(0, "Fuel efficiency must be positive"),
    fuel_price_per_litre: z.number().min(0, "Fuel price per litre must be positive"),
    fuel_type: z.enum(Object.values(VehicleFuelType) as [string, ...string[]]),
    service_plan: z.string().optional(),
    cost_per_km: z.number().min(0, "Cost per KM must be positive"),
    vehicle_type: z.string().min(1, "Vehicle type is required"),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    unit: z.string().optional(),
    alert_before: z.number().min(0, "Alert before must be positive").optional(),
    idle_fuel_consumption: z.number().min(0, "Idle fuel consumption must be positive"),
    vehicle_capacity: z.number().min(0, "Vehicle capacity must be positive"),
    co2_emission_factor: z.number().min(0,"CO2 emission factor must be positive")
  });

// Add back the employee schema
export const insertEmployeeSchema = createInsertSchema(employees)
  .extend({
    employee_id: z.number().positive("Employee ID must be a positive number"),
    employee_name: z.string().min(1, "Employee name is required").max(100),
    email_id: z.string().email("Invalid email format").max(50),
    mobile_number: z.string().min(8, "Invalid mobile number").max(15),
    designation: z.enum(Object.values(EmployeeDesignation) as [string, ...string[]]),
    hierarchy_level: z.enum(Object.values(HierarchyLevel) as [string, ...string[]]),
    region: z.enum(Object.values(Region) as [string, ...string[]]),
    department: z.enum(Object.values(Department) as [string, ...string[]]),
    unit: z.string().min(1, "Unit is required").max(50),
    date_of_birth: z.date().optional(),
    nationality: z.string().optional(),
    password: z.string().max(50).optional(),
    communication_language: z.string().max(50).optional(),
    supervisor_id: z.number().optional()
  });

// Add back the approval workflow relations
export const approvalWorkflowsRelations = relations(approvalWorkflows, ({ one }) => ({
  level1Approver: one(employees, {
    fields: [approvalWorkflows.level_1_approver_id],
    references: [employees.id],
  }),
  level2Approver: one(employees, {
    fields: [approvalWorkflows.level_2_approver_id],
    references: [employees.id],
  }),
}));

// Keep existing schema exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type LocationMaster = typeof locationsMaster.$inferSelect;
export type VehicleGroup = typeof vehicleGroups.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertLocationMaster = z.infer<typeof insertLocationMasterSchema>;
export type InsertVehicleGroup = z.infer<typeof insertVehicleGroupSchema>;
export type VehicleTypeMaster = typeof vehicleTypeMaster.$inferSelect;
export type InsertVehicleTypeMaster = z.infer<typeof insertVehicleTypeMasterSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type VehicleMaster = typeof vehicleMaster.$inferSelect;
export type InsertVehicleMaster = z.infer<typeof insertVehicleMasterSchema>;