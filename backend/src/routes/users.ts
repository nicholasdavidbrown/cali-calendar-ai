import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import { userHelpers } from "../lib/db-helpers.js";
import {
  validatePushoverUserKey,
  validateApiToken,
  verifyCredentials,
  createGroup,
  addUserToGroup,
} from "../services/pushoverService.js";

const router = Router();
router.use(authenticate);

// Update user settings
router.put(
  "/settings",
  [
    body("phoneNumber").optional().trim(),
    body("timezone").optional().trim(),
    body("notificationTime")
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage("Notification time must be in HH:MM format"),
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
      const { phoneNumber, timezone, notificationTime, messageStyle } = req.body;

      const updateData: any = {};
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (timezone) updateData.timezone = timezone;
      if (notificationTime) updateData.notificationTime = notificationTime;
      if (messageStyle) updateData.messageStyle = messageStyle;

      const user = await userHelpers.update(userId, updateData);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        phoneNumber: user.phoneNumber,
        timezone: user.timezone,
        notificationTime: (user as any).notificationTime,
        messageStyle: user.messageStyle,
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  }
);

// Setup/update Pushover credentials
router.put(
  "/pushover",
  [
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
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await userHelpers.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { pushoverApiToken, pushoverUserKey } = req.body;

      // Verify Pushover credentials
      const credentialCheck = await verifyCredentials(pushoverApiToken, pushoverUserKey);
      if (!credentialCheck.success) {
        return res.status(400).json({
          error: "Invalid Pushover credentials",
          details: credentialCheck.error,
        });
      }

      // Check if user already has a group
      let groupKey = (user as any).pushoverGroupKey;

      // If no group exists, create one
      if (!groupKey) {
        const groupResult = await createGroup(
          pushoverApiToken,
          `${user.firstName} ${user.lastName} - Cali Calendar`
        );

        if (!groupResult.success || !groupResult.groupKey) {
          return res.status(500).json({
            error: "Failed to create Pushover group",
            details: groupResult.error,
          });
        }

        groupKey = groupResult.groupKey;

        // Add user to their own group
        const addResult = await addUserToGroup(pushoverApiToken, groupKey, pushoverUserKey);
        if (!addResult.success) {
          return res.status(500).json({
            error: "Failed to add user to Pushover group",
            details: addResult.error,
          });
        }
      }

      // Update user with Pushover credentials
      await userHelpers.update(userId, {
        pushoverApiToken,
        pushoverUserKey,
        pushoverGroupKey: groupKey,
      });

      res.json({
        success: true,
        message: "Pushover credentials updated successfully",
        pushoverConfigured: true,
      });
    } catch (error) {
      console.error("Update Pushover settings error:", error);
      res.status(500).json({ error: "Failed to update Pushover settings" });
    }
  }
);

export default router;
