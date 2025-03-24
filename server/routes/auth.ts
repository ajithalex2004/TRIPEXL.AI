import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const generateToken = (userId: number) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h',
    });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

router.post("/login", async (req, res) => {
  try {
    console.log('=== Login Request Received ===');

    // Extract credentials
    const { email_id, password } = req.body;
    console.log('Received login attempt for:', email_id);

    // Input validation
    if (!email_id || !password) {
      console.log('Missing credentials:', { hasEmail: !!email_id, hasPassword: !!password });
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Find user
    const user = await storage.getUserByEmail(email_id);
    console.log('User lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Verify password
    console.log('Verifying password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isValid ? 'Valid' : 'Invalid');

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last login timestamp
    await storage.updateUserLastLogin(user.id);
    console.log('Updated last login timestamp');

    // Return success
    console.log('Login successful, sending response');
    return res.status(200).json({
      id: user.id,
      email_id: user.email_id,
      userName: user.user_name,
      token
    });

  } catch (error) {
    console.error('=== Login Error ===');
    console.error('Error details:', error);
    return res.status(500).json({
      error: "An error occurred during login"
    });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;