import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createServer } from "http";

// Add global error handlers
process.on("uncaughtException", (error) => {
  log(`UNCAUGHT EXCEPTION: ${error.message}`);
  log(error.stack || "No stack trace available");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log(`UNHANDLED REJECTION at ${promise}`);
  log(`Reason: ${reason}`);
  process.exit(1);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error handler caught: ${err.message}`);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Test database connection with better error handling
async function testDbConnection() {
  try {
    log("Testing database connection...");
    const result = await db.execute(sql`SELECT 1`);
    log("Database connection successful");
    return true;
  } catch (error: any) {
    log(`Database connection error: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
    return false;
  }
}

// Initialize server with proper error handling
async function initializeServer() {
  try {
    log("Starting application...");

    // Test database connection first
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to database");
    }

    // Create HTTP server first
    const server = createServer(app);

    // Register API routes
    log("Registering routes...");
    await registerRoutes(app, server);
    log("Routes registered successfully");

    // Set up Vite or static serving
    if (app.get("env") === "development") {
      log("Setting up Vite for development...");
      await setupVite(app, server);
      log("Vite setup complete");
    } else {
      log("Setting up static serving for production...");
      serveStatic(app);
      log("Static serving setup complete");
    }

    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server successfully started and listening on port ${port}`);
    });

    return server;
  } catch (error: any) {
    log(`Fatal error during startup: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Start the server
initializeServer().catch((error) => {
  log(`Failed to initialize server: ${error.message}`);
  process.exit(1);
});