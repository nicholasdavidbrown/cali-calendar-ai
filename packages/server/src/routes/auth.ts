import { Router, Request, Response } from 'express';
import { CryptoProvider } from '@azure/msal-node';
import confidentialClientApp, { SCOPES, REDIRECT_URI } from '../config/auth';
import { generateToken } from '../utils/jwt';
import { encryptToken, decryptToken } from '../utils/encryption';
import { authenticateJWT } from '../middleware/auth';
import User from '../models/User';
import { saveUsersToBlob } from '../services/azureBlobService';

const router = Router();
const cryptoProvider = new CryptoProvider();

// Store for PKCE verifiers (in production, use Redis or similar)
const pkceStore = new Map<string, string>();

/**
 * GET /auth/login
 * Initiates Microsoft OAuth 2.0 flow
 */
router.get('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== Auth Login Initiated ===');
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Scopes:', SCOPES);

    // Generate PKCE codes
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Generate state for CSRF protection
    const state = cryptoProvider.createNewGuid();

    // Store verifier temporarily (in production, use Redis with TTL)
    pkceStore.set(state, verifier);
    console.log('Generated state:', state);
    console.log('PKCE store size:', pkceStore.size);

    // Build authorization URL
    const authCodeUrlParameters = {
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256' as 'S256',
      state,
      prompt: 'select_account',
    };

    const authUrl = await confidentialClientApp.getAuthCodeUrl(authCodeUrlParameters);
    console.log('Generated auth URL:', authUrl);

    // Redirect user to Microsoft login
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating login:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to initiate login',
    });
  }
});

/**
 * GET /auth/callback
 * Handles OAuth callback from Microsoft
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== Auth Callback Debug ===');
    console.log('Full URL:', req.url);
    console.log('Query params:', req.query);
    console.log('Code present:', !!req.query.code);
    console.log('State present:', !!req.query.state);
    console.log('Error in query:', req.query.error);
    console.log('Error description:', req.query.error_description);

    const { code, state } = req.query;

    if (!code || !state) {
      console.error('Missing required parameters');
      res.status(400).json({
        error: 'Invalid callback',
        message: 'Missing authorization code or state',
        received: {
          code: !!code,
          state: !!state,
          queryParams: Object.keys(req.query),
        },
      });
      return;
    }

    // Retrieve PKCE verifier
    const verifier = pkceStore.get(state as string);
    if (!verifier) {
      res.status(400).json({
        error: 'Invalid state',
        message: 'State parameter does not match',
      });
      return;
    }

    // Clean up verifier
    pkceStore.delete(state as string);

    // Exchange authorization code for tokens
    const tokenRequest = {
      code: code as string,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      codeVerifier: verifier,
    };

    const tokenResponse = await confidentialClientApp.acquireTokenByCode(tokenRequest);

    if (!tokenResponse) {
      throw new Error('Failed to acquire token');
    }

    const { accessToken, idToken, expiresOn, account } = tokenResponse;

    if (!accessToken || !account) {
      throw new Error('Invalid token response');
    }

    // Extract user information
    const microsoftId = account.homeAccountId;
    const email = account.username;

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken);
    // Note: MSAL handles refresh tokens internally, we store the access token as both
    const encryptedRefreshToken = encryptedAccessToken;

    // Find or create user
    let user = await User.findOne({ microsoftId });

    if (user) {
      // Update existing user
      user.email = email;
      user.accessToken = encryptedAccessToken;
      user.refreshToken = encryptedRefreshToken;
      user.tokenExpiresAt = expiresOn || new Date(Date.now() + 3600 * 1000);
      await user.save();
    } else {
      // Create new user (phone number required later)
      user = await User.create({
        email,
        microsoftId,
        phone: '',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: expiresOn || new Date(Date.now() + 3600 * 1000),
        timezone: 'Australia/Brisbane',
        smsTime: '07:00',
        isActive: true,
      });
    }

    // Generate JWT
    const jwtToken = generateToken(user._id.toString());

    // Set JWT in httpOnly cookie
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Save users to Azure Blob Storage
    saveUsersToBlob().catch((err) => console.error('Failed to save users to blob:', err));

    console.log('✅ Authentication successful, redirecting to client');

    // Redirect to frontend home page with success indicator
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}?auth=success`);
  } catch (error) {
    console.error('Error in auth callback:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}?error=auth_failed`);
  }
});

/**
 * GET /auth/logout
 * Clears authentication cookie
 */
router.get('/logout', (req: Request, res: Response): void => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    message: 'Logged out successfully',
  });
});

/**
 * Check if user is an admin based on ADMIN_EMAILS environment variable
 */
const isAdmin = (email: string): boolean => {
  const adminEmails = process.env.ADMIN_EMAILS || '';
  const adminList = adminEmails.split(',').map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
};

/**
 * GET /auth/status
 * Returns current authenticated user
 */
router.get('/status', authenticateJWT, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Not authenticated',
      message: 'No user found',
    });
    return;
  }

  // Return safe user data (no tokens)
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      phone: req.user.phone,
      timezone: req.user.timezone,
      smsTime: req.user.smsTime,
      isActive: req.user.isActive,
      isAdmin: isAdmin(req.user.email),
      createdAt: req.user.createdAt,
    },
  });
});

export default router;
