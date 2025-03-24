import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    // Detailed request logging
    console.log("Raw registration request headers:", req.headers);
    console.log("Raw registration request body:", {
      ...req.body,
      password: '[REDACTED]',
      confirm_password: '[REDACTED]'
    });

    // Remove confirm_password before validation
    const { confirm_password, ...registrationData } = req.body;

    // Ensure required fields are present with correct types
    const processedData = {
      ...registrationData,
      user_name: `${req.body.first_name}.${req.body.last_name}`.toLowerCase(),
      user_code: `USR${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: `${req.body.first_name} ${req.body.last_name}`,
      is_active: true
    };

    console.log("Processed registration data:", {
      ...processedData,
      password: '[REDACTED]'
    });

    // Schema validation
    const validationResult = insertUserSchema.safeParse(processedData);
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      console.error("Validation failed:", JSON.stringify(errors, null, 2));
      return res.status(400).json({
        message: "Invalid registration data",
        errors: errors
      });
    }

    const validatedData = validationResult.data;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    try {
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      console.log("User created successfully:", {
        id: user.id,
        email_id: user.email_id,
        user_name: user.user_name
      });

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