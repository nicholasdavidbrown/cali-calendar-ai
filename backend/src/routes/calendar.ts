import { Request, Response, Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../lib/validation.js";
import { eventHelpers } from "../lib/db-helpers.js";
import { db } from "../lib/database.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all events for authenticated user
router.get("/events", async (req, res) => {
  try {
    const userId = req.user!.id;
    const events = await eventHelpers.findByUserId(userId);
    res.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get upcoming events
router.get("/events/upcoming", async (req, res) => {
  try {
    const userId = req.user!.id;
    const hours = parseInt(req.query.hours as string) || 24;
    const events = await eventHelpers.findUpcoming(userId, hours);
    res.json(events);
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

// Get events by date range
router.get("/events/range", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start and end dates required" });
    }

    const events = await db.all(
      `SELECT * FROM calendar_events
       WHERE userId = ? AND startTime >= ? AND startTime <= ?
       ORDER BY startTime ASC`,
      [userId, startDate, endDate]
    );

    res.json(events);
  } catch (error) {
    console.error("Get events by range error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create new event
router.post(
  "/events",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("startTime").isISO8601().withMessage("Valid start time required"),
    body("endTime").isISO8601().withMessage("Valid end time required"),
    body("description").optional().trim(),
    body("location").optional().trim(),
    body("isAllDay").optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { title, description, startTime, endTime, location, isAllDay } =
        req.body;

      // Validate times
      if (new Date(endTime) <= new Date(startTime)) {
        return res
          .status(400)
          .json({ error: "End time must be after start time" });
      }

      const event = await eventHelpers.create({
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        isAllDay: isAllDay || false,
        source: "manual",
        userId,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  }
);

// Update event
router.put(
  "/events/:id",
  [
    body("title").optional().trim().notEmpty(),
    body("startTime").optional().isISO8601(),
    body("endTime").optional().isISO8601(),
    body("description").optional().trim(),
    body("location").optional().trim(),
    body("isAllDay").optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const eventId = parseInt(req.params.id);

      // Check if event exists and belongs to user
      const existingEvent = await db.get(
        "SELECT * FROM calendar_events WHERE id = ? AND userId = ?",
        [eventId, userId]
      );

      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Only allow updating manual events
      if ((existingEvent as any).source !== "manual") {
        return res.status(403).json({ error: "Cannot update synced events" });
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (req.body.title) {
        updates.push("title = ?");
        params.push(req.body.title);
      }
      if (req.body.description !== undefined) {
        updates.push("description = ?");
        params.push(req.body.description);
      }
      if (req.body.location !== undefined) {
        updates.push("location = ?");
        params.push(req.body.location);
      }
      if (req.body.isAllDay !== undefined) {
        updates.push("isAllDay = ?");
        params.push(req.body.isAllDay ? 1 : 0);
      }
      if (req.body.startTime) {
        updates.push("startTime = ?");
        params.push(new Date(req.body.startTime).toISOString());
      }
      if (req.body.endTime) {
        updates.push("endTime = ?");
        params.push(new Date(req.body.endTime).toISOString());
      }

      updates.push("updatedAt = CURRENT_TIMESTAMP");
      params.push(eventId);

      await db.run(
        `UPDATE calendar_events SET ${updates.join(", ")} WHERE id = ?`,
        params
      );

      const event = await db.get(
        "SELECT * FROM calendar_events WHERE id = ?",
        [eventId]
      );

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  }
);

// Delete event
router.delete("/events/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const eventId = parseInt(req.params.id);

    // Check if event exists and belongs to user
    const existingEvent = await db.get(
      "SELECT * FROM calendar_events WHERE id = ? AND userId = ?",
      [eventId, userId]
    );

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow deleting manual events
    if ((existingEvent as any).source !== "manual") {
      return res.status(403).json({ error: "Cannot delete synced events" });
    }

    await db.run("DELETE FROM calendar_events WHERE id = ?", [eventId]);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
