import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import {
  sendSMS,
  formatPhoneNumber,
  validatePhoneNumber,
} from "../services/twilioService.js";
import { smsHelpers, eventHelpers, userHelpers } from "../lib/db-helpers.js";

const router = Router();
router.use(authenticate);

// Send test SMS
router.post(
  "/test",
  [
    body("phoneNumber")
      .optional()
      .custom((value) => {
        if (!validatePhoneNumber(value)) {
          throw new Error("Invalid phone number format");
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

      const phoneNumber = req.body.phoneNumber || user.phoneNumber;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
      }

      const formatted = formatPhoneNumber(phoneNumber);
      const message = `🧪 Test SMS from Cali Calendar AI\n\nThis is a test message to verify your SMS configuration is working correctly.`;

      const result = await sendSMS({ to: formatted, message });

      if (!result.success) {
        return res.status(500).json({
          error: "Failed to send SMS",
          details: result.error,
        });
      }

      await smsHelpers.create({
        phoneNumber: formatted,
        message,
        status: result.status || "sent",
        messageStyle: "professional",
        userId,
        twilioSid: result.sid,
      });

      res.json({
        success: true,
        message: "Test SMS sent successfully",
        sid: result.sid,
      });
    } catch (error) {
      console.error("Test SMS error:", error);
      res.status(500).json({ error: "Failed to send test SMS" });
    }
  }
);

// Get SMS history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await smsHelpers.findByUserId(userId, limit);
    res.json(history);
  } catch (error) {
    console.error("Get SMS history error:", error);
    res.status(500).json({ error: "Failed to fetch SMS history" });
  }
});

// Send daily summary
router.post("/send-daily-summary", async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await userHelpers.findById(userId);

    if (!user || !user.phoneNumber) {
      return res.status(400).json({ error: "Phone number not configured" });
    }

    const events = await eventHelpers.findUpcoming(userId, 24);

    let message = `📅 Good morning! Here's your schedule for today:\n\n`;

    if (events.length === 0) {
      message += `No events scheduled. Enjoy your free day!`;
    } else {
      events.forEach((event, index) => {
        const start = new Date(event.startTime);
        const timeStr = event.isAllDay
          ? "All Day"
          : start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });

        message += `${index + 1}. ${timeStr} - ${event.title}`;
        if (event.location) message += ` (${event.location})`;
        message += `\n`;
      });
    }

    const formatted = formatPhoneNumber(user.phoneNumber);
    const result = await sendSMS({ to: formatted, message });

    if (!result.success) {
      return res.status(500).json({
        error: "Failed to send SMS",
        details: result.error,
      });
    }

    await smsHelpers.create({
      phoneNumber: formatted,
      message,
      status: result.status || "sent",
      messageStyle: user.messageStyle,
      userId,
      eventCount: events.length,
      twilioSid: result.sid,
    });

    res.json({
      success: true,
      message: "Daily summary sent successfully",
      eventCount: events.length,
      sid: result.sid,
    });
  } catch (error) {
    console.error("Send daily summary error:", error);
    res.status(500).json({ error: "Failed to send daily summary" });
  }
});

export default router;
