import { Request, Response, NextFunction } from "express";
import { setupHelpers } from "../lib/db-helpers.js";

/**
 * Middleware to enforce setup completion
 * Blocks access to protected routes if setup is not complete
 * Allows setup routes to pass through
 */
export const requireSetupComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = await setupHelpers.getSetupStatus();

    // If setup is complete, allow request
    if (status.isCompleted) {
      return next();
    }

    // If no users exist, system needs setup
    if (!status.hasUsers) {
      return res.status(403).json({
        error: "System setup required",
        setupRequired: true,
        message: "Please complete the admin setup wizard before accessing this resource",
      });
    }

    // Setup is incomplete but users exist (migration scenario)
    // Mark as complete automatically
    await setupHelpers.completeSetup("migration");
    return next();
  } catch (error) {
    console.error("Setup check error:", error);
    return res.status(500).json({ error: "Failed to verify setup status" });
  }
};

/**
 * Middleware to block access if setup IS complete
 * Used to prevent re-running setup wizard
 */
export const requireSetupIncomplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = await setupHelpers.getSetupStatus();

    if (status.isCompleted) {
      return res.status(403).json({
        error: "Setup already complete",
        setupComplete: true,
      });
    }

    next();
  } catch (error) {
    console.error("Setup check error:", error);
    return res.status(500).json({ error: "Failed to verify setup status" });
  }
};
