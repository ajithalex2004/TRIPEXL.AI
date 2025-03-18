import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  phone: z.string(),
  email: z.string().email()
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

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  pickupLocation: json("pickup_location").$type<z.infer<typeof locations>>().notNull(),
  dropoffLocation: json("dropoff_location").$type<z.infer<typeof locations>>().notNull(),
  pickupWindow: json("pickup_window").$type<z.infer<typeof timeWindow>>().notNull(),
  dropoffWindow: json("dropoff_window").$type<z.infer<typeof timeWindow>>().notNull(),
  loadSize: integer("load_size").notNull(),
  cargoType: text("cargo_type").notNull(),
  priority: text("priority").notNull().default("standard"),
  specialRequirements: text("special_requirements").array(),
  senderContact: json("sender_contact").$type<z.infer<typeof contactInfo>>().notNull(),
  receiverContact: json("receiver_contact").$type<z.infer<typeof contactInfo>>().notNull(),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("pending"),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  driverId: integer("driver_id").references(() => drivers.id),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ features: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ specializations: true });
export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ vehicleId: true, driverId: true, createdAt: true });

export type Vehicle = typeof vehicles.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;