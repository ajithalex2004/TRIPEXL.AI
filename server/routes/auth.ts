import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    // Log raw request data
    console.log("Raw registration request:", {
      ...req.body,
      password: '[REDACTED]'
    });

    // Schema validation
    const validationResult = insertUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      console.error("Validation failed:", JSON.stringify(errors, null, 2));
      return res.status(400).json({
        message: "Invalid registration data",
        errors: errors
      });
    }

    // Log validated data
    const validatedData = validationResult.data;
    console.log("Validated data:", {
      ...validatedData,
      password: '[REDACTED]'
    });

    try {
      // Attempt user creation
      const user = await storage.createUser(validatedData);
      console.log("User created:", {
        id: user.id,
        email_id: user.email_id,
        user_name: user.user_name
      });

      // Return success without sensitive data
      return res.status(201).json({
        id: user.id,
        email_id: user.email_id,
        user_name: user.user_name,
        user_type: user.user_type,
        user_operation_type: user.user_operation_type,
        user_group: user.user_group,
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active
      });
    } catch (error) {
      console.error("Database error during user creation:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      return res.status(500).json({
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
    return res.status(500).json({
      message: "An unexpected error occurred during registration"
    });
  }
});

export default router;