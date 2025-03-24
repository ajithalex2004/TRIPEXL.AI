import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    console.log("Received registration request with data:", {
      ...req.body,
      password: '[REDACTED]'
    });

    // Validate request body against schema
    const validatedData = insertUserSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      console.error("Validation failed:", validatedData.error);
      return res.status(400).json({ 
        message: "Invalid registration data", 
        errors: validatedData.error.errors 
      });
    }

    const user = await storage.createUser(validatedData.data);
    
    console.log("User created successfully:", {
      id: user.id,
      email_id: user.email_id,
      user_name: user.user_name
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Registration failed"
    });
  }
});

export default router;
