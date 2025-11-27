import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { messageStyleHelpers } from "../lib/db-helpers.js";
import { validateRequest } from "../lib/validation.js";

const router = Router();

/**
 * GET /api/message-styles
 * Get all active message styles (public for authenticated users)
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const styles = await messageStyleHelpers.findActive();
    res.json(styles);
  } catch (error) {
    console.error("Get message styles error:", error);
    res.status(500).json({ error: "Failed to fetch message styles" });
  }
});

/**
 * GET /api/message-styles/:id
 * Get a specific message style by ID
 */
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const style = await messageStyleHelpers.findById(parseInt(id));

    if (!style) {
      return res.status(404).json({ error: "Message style not found" });
    }

    res.json(style);
  } catch (error) {
    console.error("Get message style error:", error);
    res.status(500).json({ error: "Failed to fetch message style" });
  }
});

// Admin-only routes
router.use(requireAdmin);

/**
 * GET /api/message-styles/admin/all
 * Get all message styles including inactive (admin only)
 */
router.get("/admin/all", async (req: Request, res: Response) => {
  try {
    const styles = await messageStyleHelpers.findAll();
    res.json(styles);
  } catch (error) {
    console.error("Get all message styles error:", error);
    res.status(500).json({ error: "Failed to fetch message styles" });
  }
});

/**
 * POST /api/message-styles
 * Create a new message style (admin only)
 */
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .matches(/^[a-z0-9_-]+$/)
      .withMessage("Name must be lowercase alphanumeric with hyphens/underscores"),
    body("displayName").trim().notEmpty().withMessage("Display name is required"),
    body("prompt").trim().notEmpty().withMessage("Prompt is required"),
    body("description").optional().trim(),
    body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be a positive integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, displayName, prompt, description, sortOrder } = req.body;

      // Check if name already exists
      const existing = await messageStyleHelpers.findByName(name);
      if (existing) {
        return res.status(409).json({ error: "Message style with this name already exists" });
      }

      const style = await messageStyleHelpers.create({
        name,
        displayName,
        prompt,
        description,
        sortOrder,
      });

      res.status(201).json(style);
    } catch (error) {
      console.error("Create message style error:", error);
      res.status(500).json({ error: "Failed to create message style" });
    }
  }
);

/**
 * PUT /api/message-styles/:id
 * Update a message style (admin only)
 */
router.put(
  "/:id",
  [
    body("displayName").optional().trim().notEmpty().withMessage("Display name cannot be empty"),
    body("prompt").optional().trim().notEmpty().withMessage("Prompt cannot be empty"),
    body("description").optional().trim(),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be a positive integer"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { displayName, prompt, description, isActive, sortOrder } = req.body;

      const existing = await messageStyleHelpers.findById(parseInt(id));
      if (!existing) {
        return res.status(404).json({ error: "Message style not found" });
      }

      const updated = await messageStyleHelpers.update(parseInt(id), {
        displayName,
        prompt,
        description,
        isActive,
        sortOrder,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update message style error:", error);
      res.status(500).json({ error: "Failed to update message style" });
    }
  }
);

/**
 * DELETE /api/message-styles/:id
 * Delete a message style (admin only)
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await messageStyleHelpers.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: "Message style not found" });
    }

    await messageStyleHelpers.delete(parseInt(id));

    res.json({ message: "Message style deleted successfully" });
  } catch (error) {
    console.error("Delete message style error:", error);
    res.status(500).json({ error: "Failed to delete message style" });
  }
});

export default router;
