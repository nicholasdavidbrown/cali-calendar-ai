import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { adminHelpers } from "../lib/db-helpers.js";
import { validateRequest } from "../lib/validation.js";
import { db } from "../lib/database.js";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/settings
 * Get all admin settings (secrets are masked)
 */
router.get("/settings", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    let settings;
    if (category) {
      settings = await adminHelpers.getSettingsByCategory(category);
    } else {
      settings = await db.all("SELECT * FROM admin_settings ORDER BY category, key");
    }

    // Mask secret values
    const maskedSettings = settings.map((setting: any) => ({
      ...setting,
      value: setting.isSecret === 1 ? "********" : setting.value,
      isSecret: setting.isSecret === 1,
    }));

    res.json(maskedSettings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * GET /api/admin/settings/:key
 * Get a specific setting value (secrets are NOT masked - admin only)
 */
router.get("/settings/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const value = await adminHelpers.getSetting(key);

    if (value === null) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({ key, value });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

/**
 * PUT /api/admin/settings/:key
 * Update a setting value
 */
router.put(
  "/settings/:key",
  [
    body("value").notEmpty().withMessage("Value is required"),
    body("category").optional().trim(),
    body("isSecret").optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, category, isSecret } = req.body;

      await adminHelpers.setSetting(
        key,
        value,
        category || "system",
        isSecret !== undefined ? isSecret : false
      );

      res.json({ message: "Setting updated successfully", key });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  }
);

/**
 * DELETE /api/admin/settings/:key
 * Delete a setting
 */
router.delete("/settings/:key", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    await db.run("DELETE FROM admin_settings WHERE key = ?", [key]);

    res.json({ message: "Setting deleted successfully" });
  } catch (error) {
    console.error("Delete setting error:", error);
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

export default router;
