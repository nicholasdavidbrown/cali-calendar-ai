import { Router, Request, Response } from "express";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../lib/password.js";
import { generateToken } from "../lib/jwt.js";
import { userHelpers } from "../lib/db-helpers.js";
import {
  registerValidation,
  loginValidation,
  validateRequest,
} from "../lib/validation.js";
import { authenticate } from "../middleware/auth.js";
import { db } from "../lib/database.js";

const router = Router();

// Check if system needs initial setup (no users exist)
router.get("/setup-status", async (req: Request, res: Response) => {
  try {
    const result = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );
    const userCount = result?.count || 0;
    res.json({
      needsSetup: userCount === 0,
      hasUsers: userCount > 0,
    });
  } catch (error) {
    console.error("Setup status error:", error);
    res.status(500).json({ error: "Failed to check setup status" });
  }
});

// Register new user
router.post(
  "/register",
  registerValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user exists
      const existingUser = await userHelpers.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ errors: passwordCheck.errors });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await userHelpers.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin: false,
      });

      // Generate JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      });

      // Set cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (without password)
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

// Login
router.post("/login", loginValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await userHelpers.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await userHelpers.updateLastLogin(user.id);

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    // Set cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return user data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await userHelpers.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      timezone: user.timezone,
      smsTime: user.smsTime,
      messageStyle: user.messageStyle,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Verify token
router.get("/verify", authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

export default router;
