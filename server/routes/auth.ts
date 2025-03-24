import { Router } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import { authService } from "../services/auth";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email_id, password } = req.body;
    console.log('Login attempt with email:', email_id);

    if (!email_id || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    try {
      // Get user from storage
      const user = await storage.getUserByEmail(email_id);
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(401).json({
          error: "Invalid credentials"
        });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch ? 'Yes' : 'No');

      if (!isMatch) {
        return res.status(401).json({
          error: "Invalid credentials"
        });
      }

      // Transform user data to match frontend expectations
      const userData = {
        id: user.id,
        emailId: user.email_id,
        userName: user.user_name,
        userType: user.user_type,
        userOperationType: user.user_operation_type,
        userGroup: user.user_group,
        fullName: user.full_name || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        isActive: user.is_active
      };

      console.log('Login successful for user:', userData.userName);

      // Return success response with user data and token
      return res.status(200).json({
        ...userData,
        token: 'dummy-token-for-now', // TODO: Implement proper JWT
        message: "Logged in successfully"
      });

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      throw new Error('Failed to retrieve user data');
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred during login",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Keeping the logout route simple for now
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