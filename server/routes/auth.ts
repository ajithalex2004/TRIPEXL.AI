import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// Generate JWT token
const generateToken = (userId: number) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h',
  });
  console.log('Generated token for user:', userId);
  return token;
};

router.post("/login", async (req, res) => {
  try {
    const { email_id, password } = req.body;
    console.log('Login attempt received for:', email_id);

    // Validate input
    if (!email_id || !password) {
      console.log('Missing credentials:', { hasEmail: !!email_id, hasPassword: !!password });
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Get user from storage
    const user = await storage.getUserByEmail(email_id);
    console.log('Database lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Log stored password hash for debugging
    console.log('Stored password hash:', user.password);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Log successful login
    console.log('Login successful for user:', user.email_id);

    // Return user data and token
    return res.status(200).json({
      id: user.id,
      email_id: user.email_id,
      userName: user.user_name,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "An error occurred during login"
    });
  }
});

// Keep the logout route simple for now
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { emailId, userName } = req.body;
    console.log('Received forgot password request for:', { emailId, userName });

    if (!emailId || !userName) {
      return res.status(400).json({
        error: "Email and username are required"
      });
    }

    const user = await storage.getUserByEmail(emailId);
    if (!user || user.user_name !== userName) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await authService.initiatePasswordReset(emailId);

    res.json({
      message: "If an account exists with that email, you will receive password reset instructions."
    });
  } catch (error) {
    console.error('Error in forgot-password route:', error);
    res.status(500).json({
      error: "Failed to process password reset request",
      details: error.message
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log('Processing password reset for token');

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required"
      });
    }

    // Find user by reset token
    const user = await storage.findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear reset token
    await storage.updateUserPassword(user.id, hashedPassword);

    res.json({
      message: "Password has been reset successfully"
    });
  } catch (error) {
    console.error('Error in reset-password route:', error);
    res.status(500).json({
      error: "Failed to reset password. Please try again later."
    });
  }
});

export default router;