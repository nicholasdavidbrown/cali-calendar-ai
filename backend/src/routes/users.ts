import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import { db } from "../lib/database.js";

const router = Router();
router.use(authenticate);

// Update user settings
router.put(
  "/settings",
  [
    body("phoneNumber").optional().trim(),
    body("timezone").optional().trim(),
    body("smsTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    body("messageStyle")
      .optional()
      .isIn(["professional", "witty", "sarcastic", "mission", "irwin", "tanda"]),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { phoneNumber, timezone, smsTime, messageStyle } = req.body;

      const updates: string[] = [];
      const params: any[] = [];

      if (phoneNumber !== undefined) {
        updates.push("phoneNumber = ?");
        params.push(phoneNumber);
      }
      if (timezone) {
        updates.push("timezone = ?");
        params.push(timezone);
      }
      if (smsTime) {
        updates.push("smsTime = ?");
        params.push(smsTime);
      }
      if (messageStyle) {
        updates.push("messageStyle = ?");
        params.push(messageStyle);
      }

      if (updates.length > 0) {
        updates.push("updatedAt = CURRENT_TIMESTAMP");
        params.push(userId);

        await db.run(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
          params
        );
      }

      const user = await db.get(
        "SELECT id, email, firstName, lastName, phoneNumber, timezone, smsTime, messageStyle, isAdmin FROM users WHERE id = ?",
        [userId]
      );

      res.json(user);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

export default router;
