import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    // Log raw request body
    console.log("Raw registration request body:", {
      ...req.body,
      password: '[REDACTED]'
    });

    // Validate request body against schema
    const validatedData = insertUserSchema.safeParse(req.body);

    if (!validatedData.success) {
      console.error("Validation failed:", validatedData.error.format());
      return res.status(400).json({ 
        message: "Invalid registration data", 
        errors: validatedData.error.errors 
      });
    }

    // Log validated data
    console.log("Validated registration data:", {
      ...validatedData.data,
      password: '[REDACTED]'
    });

    const user = await storage.createUser(validatedData.data);

    console.log("User created successfully:", {
      id: user.id,
      email_id: user.email_id,
      user_name: user.user_name
    });

    res.status(201).json({
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
    console.error("Registration error:", error);
    if (error instanceof Error) {
      res.status(500).json({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      res.status(500).json({ message: "An unexpected error occurred during registration" });
    }
  }
});

export default router;