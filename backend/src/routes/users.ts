import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import { userHelpers } from "../lib/db-helpers.js";
import { validatePhoneNumber } from "../services/twilioService.js";

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
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("SMS time must be in HH:MM format"),
    body("messageStyle")
      .optional()
      .isIn([
        "professional",
        "witty",
        "sarcastic",
        "mission",
        "irwin",
        "tanda",
        "random",
      ])
      .withMessage("Invalid message style"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { phoneNumber, timezone, smsTime, messageStyle } = req.body;

      // Validate phone number if provided
      if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      const updateData: any = {};
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (timezone) updateData.timezone = timezone;
      if (smsTime) updateData.smsTime = smsTime;
      if (messageStyle) updateData.messageStyle = messageStyle;

      const user = await userHelpers.update(userId, updateData);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        phoneNumber: user.phoneNumber,
        timezone: user.timezone,
        smsTime: user.smsTime,
        messageStyle: user.messageStyle,
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

export default router;
