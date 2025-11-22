import { Router, Request, Response } from 'express';
import User, { MessageStyle } from '../models/User';
import { authenticateJWT } from '../middleware/auth';
import { saveUsersToBlob } from '../services/azureBlobService';

const router = Router();

/**
 * GET /api/v1/users
 * Fetches all users from MongoDB (for demo purposes)
 * In production, this would be protected and filtered
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users, excluding sensitive fields
    const users = await User.find()
      .select('-accessToken -refreshToken') // Exclude sensitive tokens
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(50); // Limit to 50 users

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users from database',
    });
  }
});

/**
 * GET /api/v1/users/stats
 * Returns statistics about users in the database
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
    });
  }
});

/**
 * PUT /api/v1/users/preferences
 * Updates user preferences (protected route)
 */
router.put('/preferences', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const { phone, timezone, smsTime, isActive, messageStyle } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Update fields if provided
    if (phone !== undefined) user.phone = phone;
    if (timezone !== undefined) user.timezone = timezone;
    if (smsTime !== undefined) user.smsTime = smsTime;
    if (isActive !== undefined) user.isActive = isActive;
    if (messageStyle !== undefined) {
      // Validate messageStyle
      const validStyles: MessageStyle[] = ['professional', 'witty', 'sarcastic', 'mission'];
      if (!validStyles.includes(messageStyle)) {
        res.status(400).json({
          success: false,
          error: 'Invalid message style. Must be: professional, witty, sarcastic, or mission',
        });
        return;
      }
      user.messageStyle = messageStyle;
    }

    await user.save();

    // Save users to Azure Blob Storage
    saveUsersToBlob().catch((err) => console.error('Failed to save users to blob:', err));

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        phone: user.phone,
        timezone: user.timezone,
        smsTime: user.smsTime,
        isActive: user.isActive,
        messageStyle: user.messageStyle,
      },
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

/**
 * GET /api/v1/users/me
 * Gets current user's profile (protected route)
 */
router.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    const user = await User.findById(userId).select('-accessToken -refreshToken');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

export default router;
