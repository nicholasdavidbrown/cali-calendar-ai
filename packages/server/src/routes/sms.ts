import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { sendDailySummary, isTwilioConfigured } from '../services/smsService';

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

    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      messageSid,
      sentTo: req.user.phone,
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

export default router;
