import express, { type Request, Response, NextFunction } from "express";
import { log } from "./vite";
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

// Basic error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error handler caught: ${err.message}`);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Test database connection
async function testDbConnection() {
  try {
    log("Testing database connection...");
    const result = await db.execute(sql`SELECT 1`);
    log("Database connection successful");
    return true;
  } catch (error: any) {
    log(`Database connection error: ${error.message}`);
    return false;
  }
}

// Basic health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy" });
});

(async () => {
  try {
    log("Starting minimal test server...");

    // Test database connection first
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to database");
    }

    const server = createServer(app);

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server successfully started and listening on port ${port}`);
    });

  } catch (error: any) {
    log(`Fatal error during startup: ${error.message}`);
    log(error.stack || "No stack trace available");
    process.exit(1);
  }
})();