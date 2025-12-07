import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import {
  sendNotification,
  sendTestNotification,
  validatePushoverUserKey,
} from "../services/pushoverService.js";
import { generateCalendarMessage } from "../services/claudeService.js";
import { notificationHelpers, eventHelpers, userHelpers, messageStyleHelpers } from "../lib/db-helpers.js";
import type { MessagePersonality } from "../types/index.js";

const router = Router();
router.use(authenticate);

// Send test notification
router.post(
  "/test",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const user = await userHelpers.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.pushoverApiToken || !user.pushoverUserKey) {
        return res.status(400).json({
          error: "Pushover not configured",
          details: "Please configure your Pushover API token and user key in settings"
        });
      }

      const message = `🧪 Test Notification from Cali Calendar AI\n\nThis is a test message to verify your Pushover configuration is working correctly.`;

      // Send directly to user (not via group) for testing
      const result = await sendTestNotification(
        user.pushoverApiToken,
        user.pushoverUserKey,
        message,
        "Cali Calendar Test"
      );

      if (!result.success) {
        return res.status(500).json({
          error: "Failed to send notification",
          details: result.error,
        });
      }

      // Store in history if user has a group key
      if (user.pushoverGroupKey) {
        await notificationHelpers.create({
          groupKey: user.pushoverGroupKey,
          message,
          status: "sent",
          messageStyle: "professional",
          userId,
          externalId: result.requestId,
        });
      }

      res.json({
        success: true,
        message: "Test notification sent successfully",
        requestId: result.requestId,
      });
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  }
);

// Get notification history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await notificationHelpers.findByUserId(userId, limit);
    res.json(history);
  } catch (error) {
    console.error("Get notification history error:", error);
    res.status(500).json({ error: "Failed to fetch notification history" });
  }
});

// Send daily summary
router.post("/send-daily-summary", async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await userHelpers.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pushoverApiToken || !user.pushoverGroupKey) {
      return res.status(400).json({
        error: "Pushover not configured",
        details: "Please configure your Pushover credentials and ensure a group is set up"
      });
    }

    const events = await eventHelpers.findUpcoming(userId, 24);

    // Determine which message style to use
    let selectedStyle = user.messageStyle;

    // If user selected "random", pick a random active style (excluding "random" itself)
    if (selectedStyle === "random") {
      const activeStyles = await messageStyleHelpers.findActive();
      // Filter out the "random" option itself
      const nonRandomStyles = activeStyles.filter((style: any) => style.name !== "random");

      if (nonRandomStyles.length > 0) {
        const randomIndex = Math.floor(Math.random() * nonRandomStyles.length);
        selectedStyle = nonRandomStyles[randomIndex].name;
        console.log(`📝 Random style selected: ${selectedStyle}`);
      } else {
        // Fallback to professional if no other styles available
        selectedStyle = "professional";
      }
    }

    // Generate AI-powered message using Claude
    const message = await generateCalendarMessage(
      events,
      user.firstName,
      selectedStyle as MessagePersonality
    );

    // Send notification to group (reaches user + all family members)
    const result = await sendNotification({
      apiToken: user.pushoverApiToken,
      groupKey: user.pushoverGroupKey,
      message,
      title: "Daily Calendar Summary",
    });

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to send notification",
        details: result.error,
      });
    }

    // Store the actual style used (not "random" but the selected one)
    await notificationHelpers.create({
      groupKey: user.pushoverGroupKey,
      message,
      status: "sent",
      messageStyle: selectedStyle,
      userId,
      eventCount: events.length,
      externalId: result.requestId,
    });

    res.json({
      success: true,
      message: "Daily summary sent successfully",
      eventCount: events.length,
      requestId: result.requestId,
      styleUsed: selectedStyle, // Include which style was used
    });
  } catch (error) {
    console.error("Send daily summary error:", error);
    res.status(500).json({ error: "Failed to send daily summary" });
  }
});

export default router;
