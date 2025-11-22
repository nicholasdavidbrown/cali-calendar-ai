import crypto from 'crypto';

/**
 * Token Encryption Utilities
 *
 * These utilities handle encryption and decryption of Microsoft access/refresh tokens
 * before storing them in MongoDB. This provides an additional layer of security.
 *
 * Note: For production, consider using a proper key management service (KMS)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT = process.env.JWT_SECRET || 'fallback-encryption-salt';

// Derive a 32-byte key from the salt
const getEncryptionKey = (): Buffer => {
  return crypto.scryptSync(SALT, 'salt', 32);
};

/**
 * Encrypt a token string
 * @param token - Plain text token to encrypt
 * @returns Encrypted token in format: iv:authTag:encryptedData (hex encoded)
 */
export const encryptToken = (token: string): string => {
  if (!token) {
    throw new Error('Token is required for encryption');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt an encrypted token
 * @param encryptedToken - Encrypted token in format: iv:authTag:encryptedData
 * @returns Decrypted plain text token
 */
export const decryptToken = (encryptedToken: string): string => {
  if (!encryptedToken) {
    throw new Error('Encrypted token is required for decryption');
  }

  try {
    const parts = encryptedToken.split(':');

    // If there are no colons, this might be an unencrypted token from before encryption was implemented
    if (parts.length === 1) {
      console.warn('⚠️ Token appears to be unencrypted. This should only happen for legacy tokens.');
      return encryptedToken;
    }

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivHex, authTagHex, encryptedData] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If decryption fails, it's likely due to:
    // 1. JWT_SECRET changed
    // 2. Corrupted data
    // 3. Token encrypted with different key
    console.error('❌ Token decryption failed:', errorMessage);
    console.error('💡 This usually means JWT_SECRET has changed or token was encrypted with a different key');
    console.error('💡 User needs to re-authenticate to get new tokens');

    throw new Error(`Failed to decrypt token: ${errorMessage}. User must re-authenticate.`);
  }
};
