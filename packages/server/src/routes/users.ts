import { Router, Request, Response } from 'express';
import User from '../models/User';

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

export default router;
