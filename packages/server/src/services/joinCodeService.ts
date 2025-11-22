/**
 * Join Code Service
 * Manages temporary join codes for family members to register themselves
 */

interface JoinCode {
  code: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory store for join codes (persists only during server runtime)
const joinCodes = new Map<string, JoinCode>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [code, data] of joinCodes.entries()) {
    if (data.expiresAt < now) {
      joinCodes.delete(code);
      console.log(`🧹 Expired join code removed: ${code}`);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a random alphanumeric code
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new join code for a user
 * @param userId - User ID who is creating the invite
 * @param expirationMinutes - How long the code is valid (default 24 hours)
 * @returns The generated join code
 */
export function createJoinCode(userId: string, expirationMinutes: number = 1440): string {
  // Generate unique code
  let code = generateCode();
  while (joinCodes.has(code)) {
    code = generateCode();
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expirationMinutes * 60 * 1000);

  joinCodes.set(code, {
    code,
    userId,
    createdAt,
    expiresAt,
  });

  console.log(`✨ Join code created: ${code} for user ${userId}, expires at ${expiresAt.toISOString()}`);

  return code;
}

/**
 * Validate and get user ID from a join code
 * @param code - The join code to validate
 * @returns User ID if valid, null if invalid or expired
 */
export function validateJoinCode(code: string): string | null {
  const joinCode = joinCodes.get(code.toUpperCase());

  if (!joinCode) {
    console.log(`❌ Invalid join code: ${code}`);
    return null;
  }

  const now = new Date();
  if (joinCode.expiresAt < now) {
    console.log(`⏰ Expired join code: ${code}`);
    joinCodes.delete(code);
    return null;
  }

  console.log(`✅ Valid join code: ${code} for user ${joinCode.userId}`);
  return joinCode.userId;
}

/**
 * Delete a join code (e.g., after successful use)
 * @param code - The join code to delete
 */
export function deleteJoinCode(code: string): void {
  joinCodes.delete(code.toUpperCase());
  console.log(`🗑️  Join code deleted: ${code}`);
}

/**
 * Get join code info (for debugging/admin purposes)
 * @param code - The join code to look up
 */
export function getJoinCodeInfo(code: string): JoinCode | null {
  return joinCodes.get(code.toUpperCase()) || null;
}
