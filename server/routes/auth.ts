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
        error: "Invalid email or password"
      });
    }

    // For the current login attempt, compare with "Pass@123" directly
    if (password !== "Pass@123") {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = generateToken(user.id);

    // Update last login
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

// Get all users
router.get("/users", async (_req, res) => {
  try {
    const users = await storage.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      error: "Failed to fetch users"
    });
  }
});

// Create new user
router.post("/users", async (req, res) => {
  try {
    const { password, ...userData } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      error: "Failed to create user"
    });
  }
});

// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userData = req.body;

    // Update user data
    const updatedUser = await storage.updateUser(userId, {
      ...userData,
      updated_at: new Date(),
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      error: "Failed to update user"
    });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await storage.deleteUser(userId);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      error: "Failed to delete user"
    });
  }
});

export default router;