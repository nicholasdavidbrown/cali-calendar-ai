import { Router, Request, Response } from 'express';
import { MessageStyle } from '../models/User';
import { authenticateJWT } from '../middleware/auth';
import * as userStorage from '../services/userStorageService';

const router = Router();

/**
 * GET /api/v1/users
 * Fetches all users from blob storage (for demo purposes)
 * In production, this would be protected and filtered
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users
    const allUsers = await userStorage.getAllUsers();

    // Exclude sensitive fields and sort by newest first
    const users = allUsers
      .map(({ accessToken, refreshToken, ...user }) => user)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50); // Limit to 50 users

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users from storage',
    });
  }
});

/**
 * GET /api/v1/users/stats
 * Returns statistics about users in storage
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await userStorage.getUserStats();

    res.json({
      success: true,
      data: stats,
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
    const userId = req.user!.id;
    const { phone, timezone, smsTime, isActive, messageStyle } = req.body;

    // Validate messageStyle if provided
    if (messageStyle !== undefined) {
      const validStyles: MessageStyle[] = ['professional', 'witty', 'sarcastic', 'mission'];
      if (!validStyles.includes(messageStyle)) {
        res.status(400).json({
          success: false,
          error: 'Invalid message style. Must be: professional, witty, sarcastic, or mission',
        });
        return;
      }
    }

    // Build updates object
    const updates: any = {};
    if (phone !== undefined) updates.phone = phone;
    if (timezone !== undefined) updates.timezone = timezone;
    if (smsTime !== undefined) updates.smsTime = smsTime;
    if (isActive !== undefined) updates.isActive = isActive;
    if (messageStyle !== undefined) updates.messageStyle = messageStyle;

    // Update user
    const user = await userStorage.updateUser(userId, updates);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

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
    const userId = req.user!.id;

    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Exclude sensitive fields
    const { accessToken, refreshToken, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

/**
 * DELETE /api/v1/users/:id
 * Deletes a user from blob storage
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    console.log(`🗑️  Attempting to delete user: ${userId}`);

    // Get user before deleting (to return email in response)
    const user = await userStorage.findUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Delete the user
    const deleted = await userStorage.deleteUser(userId);

    if (!deleted) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
      });
      return;
    }

    console.log(`✅ Deleted user from storage: ${user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

export default router;
