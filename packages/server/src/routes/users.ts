import { Router, Request, Response } from 'express';
import { MessageStyle } from '../models/User';
import { authenticateJWT } from '../middleware/auth';
import * as userStorage from '../services/userStorageService';
import * as joinCodeService from '../services/joinCodeService';

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
      const validStyles: MessageStyle[] = ['professional', 'witty', 'sarcastic', 'mission', 'irwin', 'tanda'];
      if (!validStyles.includes(messageStyle)) {
        res.status(400).json({
          success: false,
          error: 'Invalid message style. Must be: professional, witty, sarcastic, mission, irwin, or tanda',
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
 * GET /api/v1/users/me/family
 * Gets current user's family members (protected route)
 */
router.get('/me/family', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      data: user.familyMembers || [],
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch family members',
    });
  }
});

/**
 * POST /api/v1/users/me/family
 * Adds a family member to current user (protected route)
 */
router.post('/me/family', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, phone } = req.body;

    // Validation
    if (!name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Name and phone are required',
      });
      return;
    }

    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Create new family member
    const newFamilyMember = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      phone: phone.trim(),
      isActive: true,
    };

    // Add to family members array
    const familyMembers = [...(user.familyMembers || []), newFamilyMember];

    // Update user
    const updatedUser = await userStorage.updateUser(userId, { familyMembers });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to add family member',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Family member added successfully',
      data: newFamilyMember,
    });
  } catch (error) {
    console.error('Error adding family member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add family member',
    });
  }
});

/**
 * PUT /api/v1/users/me/family/:familyMemberId
 * Updates a family member (protected route)
 */
router.put('/me/family/:familyMemberId', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { familyMemberId } = req.params;
    const { name, phone, isActive } = req.body;

    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Find family member
    const familyMembers = user.familyMembers || [];
    const memberIndex = familyMembers.findIndex((m) => m.id === familyMemberId);

    if (memberIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Family member not found',
      });
      return;
    }

    // Update family member
    if (name !== undefined) familyMembers[memberIndex].name = name.trim();
    if (phone !== undefined) familyMembers[memberIndex].phone = phone.trim();
    if (isActive !== undefined) familyMembers[memberIndex].isActive = isActive;

    // Update user
    const updatedUser = await userStorage.updateUser(userId, { familyMembers });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to update family member',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Family member updated successfully',
      data: familyMembers[memberIndex],
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update family member',
    });
  }
});

/**
 * DELETE /api/v1/users/me/family/:familyMemberId
 * Deletes a family member (protected route)
 */
router.delete('/me/family/:familyMemberId', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { familyMemberId } = req.params;

    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Filter out the family member
    const familyMembers = (user.familyMembers || []).filter((m) => m.id !== familyMemberId);

    if (familyMembers.length === (user.familyMembers || []).length) {
      res.status(404).json({
        success: false,
        error: 'Family member not found',
      });
      return;
    }

    // Update user
    const updatedUser = await userStorage.updateUser(userId, { familyMembers });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete family member',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Family member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting family member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete family member',
    });
  }
});

/**
 * POST /api/v1/users/me/family/invite
 * Generate a join code for family members (protected route)
 */
router.post('/me/family/invite', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { expirationMinutes = 1440 } = req.body; // Default 24 hours

    // Generate join code
    const code = joinCodeService.createJoinCode(userId, expirationMinutes);

    // Build join URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const joinUrl = `${clientUrl}/join?code=${code}`;

    res.json({
      success: true,
      data: {
        code,
        joinUrl,
        expiresIn: expirationMinutes,
      },
    });
  } catch (error) {
    console.error('Error generating join code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate join code',
    });
  }
});

/**
 * GET /api/v1/users/family/join/:code
 * Validate a join code (public endpoint)
 */
router.get('/family/join/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const userId = joinCodeService.validateJoinCode(code);

    if (!userId) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired join code',
      });
      return;
    }

    // Get user info (without sensitive data)
    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        userEmail: user.email,
      },
    });
  } catch (error) {
    console.error('Error validating join code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate join code',
    });
  }
});

/**
 * POST /api/v1/users/family/join
 * Join as a family member using a code (public endpoint)
 * Optionally creates a calendar event for the parent
 */
router.post('/family/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, phone, createEvent, eventTitle, eventDate, eventTime, eventDuration } = req.body;

    // Validation
    if (!code || !name || !phone) {
      res.status(400).json({
        success: false,
        error: 'Code, name, and phone are required',
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(phone.trim().replace(/[\s\-\(\)]/g, ''))) {
      res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Please use format: +1234567890',
        field: 'phone',
      });
      return;
    }

    // Validate join code
    const userId = joinCodeService.validateJoinCode(code);

    if (!userId) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired join code',
      });
      return;
    }

    // Get user
    const user = await userStorage.findUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Create family member
    const newFamilyMember = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      phone: phone.trim(),
      isActive: true,
    };

    // Add to family members array
    const familyMembers = [...(user.familyMembers || []), newFamilyMember];

    // Update user
    const updatedUser = await userStorage.updateUser(userId, { familyMembers });

    if (!updatedUser) {
      res.status(500).json({
        success: false,
        error: 'Failed to add family member',
      });
      return;
    }

    // Handle optional event creation
    let eventCreated = false;
    let eventError = null;

    if (createEvent && eventTitle && eventDate && eventTime) {
      try {
        // Parse event details
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        const durationMinutes = eventDuration || 60; // Default 1 hour
        const endDateTime = new Date(eventDateTime.getTime() + durationMinutes * 60 * 1000);

        // Create manual event in JSON storage
        const manualEvent = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          subject: eventTitle,
          start: eventDateTime.toISOString(),
          end: endDateTime.toISOString(),
          location: `Created by ${name}`,
          isAllDay: false,
          createdBy: name,
          createdAt: new Date().toISOString(),
        };

        // Add event to user's manual events
        const manualEvents = [...(updatedUser.manualEvents || []), manualEvent];
        const userWithEvent = await userStorage.updateUser(userId, { manualEvents });

        if (userWithEvent) {
          eventCreated = true;
          console.log(`✅ Manual event created in storage for ${user.email} by family member ${name}`);
        } else {
          throw new Error('Failed to update user with manual event');
        }
      } catch (eventErr: any) {
        // Don't fail the join if event creation fails
        console.error(`⚠️  Failed to create manual event, but join succeeded:`, eventErr);
        eventError = 'Event failed to add but user was added';
      }
    }

    // Delete the join code (one-time use)
    joinCodeService.deleteJoinCode(code);

    res.json({
      success: true,
      message: 'Successfully joined as family member',
      data: {
        name: newFamilyMember.name,
        phone: newFamilyMember.phone,
        eventCreated,
        eventError,
      },
    });
  } catch (error) {
    console.error('Error joining as family member:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join as family member',
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
