import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    // Log the incoming request data
    console.log("Registration request received:", {
      ...req.body,
      password: '[REDACTED]'
    });

    // Validate the request data
    const validationResult = insertUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.format());
      return res.status(400).json({
        message: "Invalid registration data",
        errors: validationResult.error.errors
      });
    }

    // Log the validated data
    console.log("Validated registration data:", {
      ...validationResult.data,
      password: '[REDACTED]'
    });

    try {
      const user = await storage.createUser(validationResult.data);

      console.log("User created successfully:", {
        id: user.id,
        email_id: user.email_id,
        user_name: user.user_name
      });

      // Return success response without sensitive data
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