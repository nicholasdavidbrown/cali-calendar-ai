import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import {
  getEventsForNext24Hours,
  getEventsForNext7Days,
  formatEventForSMS,
} from '../services/calendarService';

const router = Router();

/**
 * GET /api/v1/calendar/events
 * Fetches calendar events for the next 24 hours
 * Protected route - requires authentication
 */
router.get('/events', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Fetch events for next 24 hours
    const events = await getEventsForNext24Hours(req.user);

    res.json({
      success: true,
      count: events.length,
      events: events.map((event) => ({
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        isAllDay: event.isAllDay,
        formattedTime: event.formattedTime,
        description: formatEventForSMS(event),
      })),
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);

    // Handle token decryption errors (JWT_SECRET changed or corrupted tokens)
    if (error instanceof Error && error.message.includes('TOKEN_DECRYPTION_ERROR')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Your session is invalid. Please sign in again.',
      });
      return;
    }

    if (error instanceof Error && error.message.includes('re-authenticate')) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your Microsoft access token has expired. Please log in again.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to fetch events',
      message: 'An error occurred while fetching your calendar events',
    });
  }
});

/**
 * GET /api/v1/calendar/events/week
 * Fetches calendar events for the next 7 days
 * Protected route - requires authentication
 */
router.get('/events/week', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Fetch events for next 7 days
    const events = await getEventsForNext7Days(req.user);

    res.json({
      success: true,
      count: events.length,
      events: events.map((event) => ({
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        isAllDay: event.isAllDay,
        formattedTime: event.formattedTime,
        description: formatEventForSMS(event),
      })),
    });
  } catch (error) {
    console.error('Error fetching weekly calendar events:', error);

    // Handle token decryption errors (JWT_SECRET changed or corrupted tokens)
    if (error instanceof Error && error.message.includes('TOKEN_DECRYPTION_ERROR')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Your session is invalid. Please sign in again.',
      });
      return;
    }

    if (error instanceof Error && error.message.includes('re-authenticate')) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your Microsoft access token has expired. Please log in again.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to fetch events',
      message: 'An error occurred while fetching your calendar events',
    });
  }
});

/**
 * GET /api/v1/calendar/events/custom
 * Fetches calendar events for a custom date range
 * Protected route - requires authentication
 * Query params: startDate (ISO string), endDate (ISO string)
 */
router.get('/events/custom', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        error: 'Bad request',
        message: 'startDate and endDate query parameters are required',
      });
      return;
    }

    // Validate dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Invalid date format. Use ISO 8601 format.',
      });
      return;
    }

    if (start >= end) {
      res.status(400).json({
        error: 'Bad request',
        message: 'startDate must be before endDate',
      });
      return;
    }

    // Note: For custom date ranges, we could create a new service function
    // For now, return a message indicating this is a placeholder
    res.status(501).json({
      error: 'Not implemented',
      message: 'Custom date range is not yet implemented',
    });
  } catch (error) {
    console.error('Error fetching custom range calendar events:', error);

    res.status(500).json({
      error: 'Failed to fetch events',
      message: 'An error occurred while fetching your calendar events',
    });
  }
});

export default router;
