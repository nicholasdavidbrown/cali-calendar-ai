import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { setupHelpers, adminHelpers, userHelpers } from "../lib/db-helpers.js";
import { requireSetupIncomplete } from "../middleware/setup.js";
import { validateRequest } from "../lib/validation.js";
import { hashPassword, validatePasswordStrength } from "../lib/password.js";

const router = Router();

/**
 * GET /api/setup/status
 * Check if system setup is required
 * PUBLIC - No auth required
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const status = await setupHelpers.getSetupStatus();
    res.json({
      setupRequired: !status.isCompleted && !status.hasUsers,
      setupComplete: status.isCompleted,
      hasUsers: status.hasUsers,
    });
  } catch (error) {
    console.error("Setup status error:", error);
    res.status(500).json({ error: "Failed to check setup status" });
  }
});

/**
 * POST /api/setup/initialize
 * Complete the admin setup wizard
 * Creates admin user and stores integration credentials
 * PUBLIC - No auth required (protected by requireSetupIncomplete)
 */
router.post(
  "/initialize",
  requireSetupIncomplete,
  [
    // Admin user fields
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty().withMessage("First name required"),
    body("lastName").trim().notEmpty().withMessage("Last name required"),

    // Integration credentials (all optional)
    // Note: Pushover credentials are per-user, not global admin settings
    body("anthropicApiKey").optional().trim(),
    body("googleClientId").optional().trim(),
    body("googleClientSecret").optional().trim(),
    body("microsoftClientId").optional().trim(),
    body("microsoftClientSecret").optional().trim(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        anthropicApiKey,
        googleClientId,
        googleClientSecret,
        microsoftClientId,
        microsoftClientSecret,
      } = req.body;

      // Double-check no users exist
      const hasUsers = await setupHelpers.hasUsers();
      if (hasUsers) {
        return res.status(400).json({
          error: "Users already exist. Setup cannot be run.",
        });
      }

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ errors: passwordCheck.errors });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const admin = await userHelpers.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isAdmin: true,
      });

      // Store integration credentials in admin_settings
      // Note: Pushover credentials are per-user (stored in users table), not global
      const credentials = [
        { key: "anthropic_api_key", value: anthropicApiKey, category: "ai" },
        { key: "google_client_id", value: googleClientId, category: "oauth" },
        { key: "google_client_secret", value: googleClientSecret, category: "oauth" },
        { key: "microsoft_client_id", value: microsoftClientId, category: "oauth" },
        { key: "microsoft_client_secret", value: microsoftClientSecret, category: "oauth" },
      ];

      // Only store credentials that were provided
      for (const cred of credentials) {
        if (cred.value) {
          const isSecret = cred.key.includes("secret") ||
                          cred.key.includes("token") ||
                          cred.key.includes("key");
          await adminHelpers.setSetting(cred.key, cred.value, cred.category, isSecret);
        }
      }

      // Mark setup as complete
      await setupHelpers.completeSetup(email);

      console.log(`✅ Admin setup completed for: ${email}`);

      res.status(201).json({
        message: "Admin setup completed successfully",
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
      });
    } catch (error) {
      console.error("Setup initialization error:", error);
      res.status(500).json({ error: "Failed to complete setup" });
    }
  }
);

export default router;
