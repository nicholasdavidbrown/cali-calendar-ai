import { Router, Request, Response } from "express";
import { body } from "express-validator";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../lib/password.js";
import { generateToken } from "../lib/jwt.js";
import { userHelpers, setupHelpers } from "../lib/db-helpers.js";
import {
  loginValidation,
  validateRequest,
} from "../lib/validation.js";
import { authenticate } from "../middleware/auth.js";
import {
  createGroup,
  addUserToGroup,
  validatePushoverUserKey,
  validateApiToken,
  verifyCredentials,
} from "../services/pushoverService.js";

const router = Router();

// Register validation with Pushover credentials
const registerValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("firstName").trim().notEmpty().withMessage("First name required"),
  body("lastName").trim().notEmpty().withMessage("Last name required"),
  body("pushoverApiToken")
    .trim()
    .notEmpty()
    .withMessage("Pushover API token required")
    .custom((value) => {
      if (!validateApiToken(value)) {
        throw new Error("Invalid Pushover API token format");
      }
      return true;
    }),
  body("pushoverUserKey")
    .trim()
    .notEmpty()
    .withMessage("Pushover user key required")
    .custom((value) => {
      if (!validatePushoverUserKey(value)) {
        throw new Error("Invalid Pushover user key format");
      }
      return true;
    }),
];

// Register new user
router.post(
  "/register",
  registerValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // Check if setup is complete before allowing registration
      const setupStatus = await setupHelpers.getSetupStatus();
      if (!setupStatus.isCompleted) {
        return res.status(403).json({
          error: "System setup required",
          setupRequired: true,
          message: "Admin must complete system setup before users can register",
        });
      }

      const { email, password, firstName, lastName, pushoverApiToken, pushoverUserKey } = req.body;

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

      // Verify Pushover credentials before creating user
      const credentialCheck = await verifyCredentials(pushoverApiToken, pushoverUserKey);
      if (!credentialCheck.success) {
        return res.status(400).json({
          error: "Invalid Pushover credentials",
          details: credentialCheck.error,
        });
      }

      // Create Pushover group for this user
      const groupResult = await createGroup(pushoverApiToken, `${firstName} ${lastName} - Cali Calendar`);
      if (!groupResult.success || !groupResult.groupKey) {
        return res.status(500).json({
          error: "Failed to create Pushover group",
          details: groupResult.error,
        });
      }

      // Add user to their own group
      const addResult = await addUserToGroup(pushoverApiToken, groupResult.groupKey, pushoverUserKey);
      if (!addResult.success) {
        return res.status(500).json({
          error: "Failed to add user to Pushover group",
          details: addResult.error,
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with Pushover credentials
      const user = await userHelpers.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin: false,
      });

      // Update user with Pushover credentials
      await userHelpers.update(user.id, {
        pushoverApiToken,
        pushoverUserKey,
        pushoverGroupKey: groupResult.groupKey,
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
          pushoverConfigured: true,
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
      notificationTime: (user as any).notificationTime || user.smsTime, // Handle both old and new field names
      messageStyle: user.messageStyle,
      isAdmin: user.isAdmin,
      pushoverConfigured: !!(user as any).pushoverGroupKey,
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
