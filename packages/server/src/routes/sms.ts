import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { sendDailySummary, isTwilioConfigured } from '../services/smsService';
import { runSchedulerManually } from '../services/schedulerService';
import * as userStorage from '../services/userStorageService';

const router = Router();

/**
 * POST /api/v1/sms/send-test
 * Sends a test SMS with calendar summary to the authenticated user
 * Protected route - requires authentication
 */
router.post('/send-test', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'SMS service is not configured. Please contact administrator.',
      });
      return;
    }

    // Check if user has a phone number
    if (!req.user.phone) {
      res.status(400).json({
        error: 'Bad request',
        message: 'No phone number registered. Please add a phone number to your profile.',
      });
      return;
    }

    // Send the daily summary SMS
    const messageSid = await sendDailySummary(req.user);

    // Format the message style for display
    const styleDisplay = req.user.messageStyle.charAt(0).toUpperCase() + req.user.messageStyle.slice(1);

    res.json({
      success: true,
      message: 'SMS sent successfully',
      messageSid,
      sentTo: req.user.phone,
      messageStyle: styleDisplay,
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);

    if (error instanceof Error && error.message.includes('re-authenticate')) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Your Microsoft access token has expired. Please log in again.',
      });
      return;
    }

    if (error instanceof Error && error.message.includes('Twilio')) {
      res.status(503).json({
        error: 'SMS service error',
        message: 'Failed to send SMS. Please check Twilio configuration or try again later.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to send SMS',
      message: 'An error occurred while sending the test SMS',
    });
  }
});

/**
 * GET /api/v1/sms/status
 * Checks the SMS service configuration status
 * Protected route - requires authentication
 */
router.get('/status', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const configured = isTwilioConfigured();
    const hasPhone = !!req.user.phone;
    const lastSent = req.user.lastSmsSentDate;

    res.json({
      success: true,
      status: {
        configured,
        phoneNumberSet: hasPhone,
        phoneNumber: hasPhone ? req.user.phone : null,
        lastSmsSent: lastSent || null,
        ready: configured && hasPhone,
      },
    });
  } catch (error) {
    console.error('Error checking SMS status:', error);

    res.status(500).json({
      error: 'Failed to check status',
      message: 'An error occurred while checking SMS service status',
    });
  }
});

/**
 * POST /api/v1/sms/trigger-scheduler
 * Manually triggers the scheduler to check and send SMS to eligible users
 * Protected route - requires authentication
 * Useful for testing the scheduler logic without waiting for the hourly cron
 */
router.post('/trigger-scheduler', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'SMS service is not configured. Please contact administrator.',
      });
      return;
    }

    // Manually trigger the scheduler
    await runSchedulerManually();

    res.json({
      success: true,
      message: 'Scheduler triggered successfully. Check server logs for details.',
    });
  } catch (error) {
    console.error('Error triggering scheduler:', error);

    res.status(500).json({
      error: 'Failed to trigger scheduler',
      message: 'An error occurred while manually triggering the scheduler',
    });
  }
});

/**
 * POST /api/v1/sms/test-scheduler-direct
 * Test endpoint without authentication for quick scheduler testing
 * TEMPORARY - Remove in production
 */
router.post('/test-scheduler-direct', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🧪 Direct scheduler test triggered via API...');

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'SMS service is not configured.',
      });
      return;
    }

    // Manually trigger the scheduler
    await runSchedulerManually();

    res.json({
      success: true,
      message: 'Scheduler test completed. Check server logs for details.',
    });
  } catch (error) {
    console.error('Error in test scheduler:', error);

    res.status(500).json({
      error: 'Failed to test scheduler',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/sms/send-demo
 * Send a demo SMS showing what the daily summary looks like
 * Body: { phoneNumber: string }
 */
router.post('/send-demo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Phone number is required',
      });
      return;
    }

    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'SMS service is not configured.',
      });
      return;
    }

    // Create mock calendar events
    const mockEvents = [
      {
        title: 'Team Standup',
        start: new Date('2025-11-22T09:00:00'),
        end: new Date('2025-11-22T09:30:00'),
        location: 'Zoom Meeting Room',
        isAllDay: false,
        formattedTime: '9:00 AM - 9:30 AM',
      },
      {
        title: 'Project Planning Session',
        start: new Date('2025-11-22T11:00:00'),
        end: new Date('2025-11-22T12:00:00'),
        location: 'Conference Room A',
        isAllDay: false,
        formattedTime: '11:00 AM - 12:00 PM',
      },
      {
        title: 'Client Meeting',
        start: new Date('2025-11-22T14:00:00'),
        end: new Date('2025-11-22T15:00:00'),
        location: 'Microsoft Teams',
        isAllDay: false,
        formattedTime: '2:00 PM - 3:00 PM',
      },
      {
        title: 'Code Review',
        start: new Date('2025-11-22T16:00:00'),
        end: new Date('2025-11-22T16:30:00'),
        location: '',
        isAllDay: false,
        formattedTime: '4:00 PM - 4:30 PM',
      },
    ];

    // Format the message
    let message = 'Good morning! Here\'s your schedule for today:\n\n';

    mockEvents.forEach((event) => {
      message += `${event.formattedTime} - ${event.title}`;
      if (event.location) {
        message += ` (${event.location})`;
      }
      message += '\n';
    });

    message += '\nHave a great day!';

    // Send the SMS
    const { sendSMS } = require('../services/smsService');
    const messageSid = await sendSMS(phoneNumber, message);

    res.json({
      success: true,
      message: 'Demo SMS sent successfully',
      messageSid,
      sentTo: phoneNumber,
      preview: message,
    });
  } catch (error) {
    console.error('Error sending demo SMS:', error);

    res.status(500).json({
      error: 'Failed to send demo SMS',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/sms/history
 * Fetches SMS history for the authenticated user
 * Protected route - requires authentication
 * Query params: limit (optional, default 50)
 */
router.get('/history', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    // Get limit from query params (default 50, max 100)
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    // Fetch SMS history
    const history = await userStorage.getSmsHistory(req.user.id, limit);

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Error fetching SMS history:', error);

    res.status(500).json({
      error: 'Failed to fetch history',
      message: 'An error occurred while fetching SMS history',
    });
  }
});

export default router;
