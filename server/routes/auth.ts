import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const generateToken = (userId: number) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h',
  });
};

router.post("/login", async (req, res) => {
  try {
    const { email_id, password } = req.body;

    if (!email_id || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = await storage.getUserByEmail(email_id);

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const token = generateToken(user.id);

    // Update last login time
    await storage.updateUserLastLogin(user.id);

    return res.status(200).json({
      token,
      id: user.id,
      email_id: user.email_id,
      userName: user.user_name
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: "An error occurred during login"
    });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;