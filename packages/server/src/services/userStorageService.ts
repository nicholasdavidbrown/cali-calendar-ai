import { BlobServiceClient } from '@azure/storage-blob';
import { MessageStyle, FamilyMember } from '../models/User';

const CONTAINER_NAME = 'user-backups';
const BLOB_NAME = 'users.json';

// User interface for blob storage (without MongoDB _id, using string id instead)
export interface StoredUser {
  id: string;
  email: string;
  microsoftId: string;
  phone: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string; // ISO string
  timezone: string;
  smsTime: string;
  isActive: boolean;
  messageStyle: MessageStyle;
  familyMembers: FamilyMember[];
  lastSmsSentDate?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * Get Azure Blob Service Client
 */
function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    throw new Error('Azure Storage connection string not configured. Cannot operate without storage.');
  }

  return BlobServiceClient.fromConnectionString(connectionString);
}

/**
 * Helper function to convert stream to string
 */
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}

/**
 * Get all users from blob storage
 */
export async function getAllUsers(): Promise<StoredUser[]> {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);

    // Check if blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.log('ℹ️  No users file found. Returning empty array.');
      return [];
    }

    // Download and parse
    const downloadResponse = await blockBlobClient.download(0);
    const content = await streamToString(downloadResponse.readableStreamBody!);
    const rawUsers = JSON.parse(content);

    if (!Array.isArray(rawUsers)) {
      return [];
    }

    // Migrate old MongoDB format to new format (convert _id to id if needed)
    let needsMigration = false;
    const users = rawUsers.map((user: any) => {
      // If user has _id but not id, migrate it
      if (user._id && !user.id) {
        console.log(`🔄 Migrating user ${user.email} from MongoDB format (_id) to blob format (id)`);
        needsMigration = true;
        const { _id, ...rest } = user;
        return {
          ...rest,
          id: typeof _id === 'object' ? _id.toString() : _id,
        };
      }
      return user;
    });

    // Save migrated users back to blob storage
    if (needsMigration) {
      console.log('💾 Saving migrated users to blob storage...');
      await saveAllUsers(users);
      console.log('✅ Migration saved to blob storage');
    }

    return users;
  } catch (error) {
    console.error('❌ Error reading users from blob:', error);
    return [];
  }
}

/**
 * Save all users to blob storage
 */
async function saveAllUsers(users: StoredUser[]): Promise<void> {
  try {
    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    const usersJson = JSON.stringify(users, null, 2);

    await blockBlobClient.upload(usersJson, usersJson.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
    });

    console.log(`✅ Saved ${users.length} users to blob storage`);
  } catch (error) {
    console.error('❌ Error saving users to blob:', error);
    throw error;
  }
}

/**
 * Find user by microsoftId
 */
export async function findUserByMicrosoftId(microsoftId: string): Promise<StoredUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.microsoftId === microsoftId) || null;
}

/**
 * Find user by id
 */
export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredUser> {
  const users = await getAllUsers();

  // Check if user already exists
  const existing = users.find((u) => u.microsoftId === userData.microsoftId);
  if (existing) {
    throw new Error('User with this Microsoft ID already exists');
  }

  // Generate a unique ID (simple timestamp + random)
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id,
    ...userData,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await saveAllUsers(users);

  console.log(`✅ Created new user: ${newUser.email}`);
  return newUser;
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>): Promise<StoredUser | null> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    console.log(`⚠️  User not found: ${id}`);
    return null;
  }

  // Update the user
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveAllUsers(users);

  console.log(`✅ Updated user: ${users[index].email}`);
  return users[index];
}

/**
 * Update user by microsoftId (for backwards compatibility with auth flow)
 */
export async function updateUserByMicrosoftId(
  microsoftId: string,
  updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>
): Promise<StoredUser | null> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.microsoftId === microsoftId);

  if (index === -1) {
    console.log(`⚠️  User not found with microsoftId: ${microsoftId}`);
    return null;
  }

  // Update the user
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveAllUsers(users);

  console.log(`✅ Updated user: ${users[index].email}`);
  return users[index];
}

/**
 * Delete a user by id
 */
export async function deleteUser(id: string): Promise<boolean> {
  const users = await getAllUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    console.log(`⚠️  User not found: ${id}`);
    return false;
  }

  const deletedUser = users[index];
  users.splice(index, 1);
  await saveAllUsers(users);

  console.log(`✅ Deleted user: ${deletedUser.email}`);
  return true;
}

/**
 * Get user count
 */
export async function getUserCount(): Promise<number> {
  const users = await getAllUsers();
  return users.length;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<{
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}> {
  const users = await getAllUsers();

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    inactiveUsers: users.filter((u) => !u.isActive).length,
  };
}
