import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import { authService } from "../services/auth";

const router = Router();

// Keep existing login/logout functionality
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

// Add forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { emailId } = req.body;
    console.log('Received forgot password request for:', emailId);

    if (!emailId) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    await authService.initiatePasswordReset(emailId);

    // Always return success even if email doesn't exist (security best practice)
    res.json({
      message: "If an account exists with that email, you will receive password reset instructions."
    });
  } catch (error) {
    console.error('Error in forgot-password route:', error);
    res.status(500).json({
      error: "Failed to process password reset request. Please try again later."
    });
  }
});

// Add reset password route
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