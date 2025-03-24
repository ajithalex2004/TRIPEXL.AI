import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";

const router = Router();

// Keep only login/logout functionality
router.post("/login", async (req, res) => {
  try {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await storage.getUserByEmail(email_id);
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    return res.status(200).json({
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
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An unexpected error occurred during login"
    });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;