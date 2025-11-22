import { BlobServiceClient } from '@azure/storage-blob';
import User, { IUser } from '../models/User';

const CONTAINER_NAME = 'user-backups';
const BLOB_NAME = 'users.json';

/**
 * Get Azure Blob Service Client
 */
function getBlobServiceClient(): BlobServiceClient | null {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!connectionString) {
    console.warn('Azure Storage connection string not configured. Skipping blob operations.');
    return null;
  }

  return BlobServiceClient.fromConnectionString(connectionString);
}

/**
 * Save all users to Azure Blob Storage as JSON
 */
export async function saveUsersToBlob(): Promise<void> {
  const blobServiceClient = getBlobServiceClient();
  if (!blobServiceClient) return;

  try {
    // Fetch all users from MongoDB
    const users = await User.find().lean();

    // Convert to JSON
    const usersJson = JSON.stringify(users, null, 2);

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Create container if it doesn't exist (defaults to private)
    await containerClient.createIfNotExists();

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);

    // Upload JSON
    await blockBlobClient.upload(usersJson, usersJson.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
    });

    console.log(`✅ Saved ${users.length} users to Azure Blob Storage`);
  } catch (error) {
    console.error('Error saving users to blob storage:', error);
  }
}

/**
 * Load users from Azure Blob Storage and populate MongoDB
 */
export async function loadUsersFromBlob(): Promise<void> {
  const blobServiceClient = getBlobServiceClient();
  if (!blobServiceClient) {
    console.log('No Azure Storage configured. Skipping user load from blob.');
    return;
  }

  try {
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Check if container exists
    const exists = await containerClient.exists();
    if (!exists) {
      console.log('No user backup container found. Starting with empty database.');
      return;
    }

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);

    // Check if blob exists
    const blobExists = await blockBlobClient.exists();
    if (!blobExists) {
      console.log('No user backup file found. Starting with empty database.');
      return;
    }

    // Download blob
    const downloadResponse = await blockBlobClient.download(0);
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody!);

    // Parse JSON
    const users = JSON.parse(downloadedContent);

    if (!Array.isArray(users) || users.length === 0) {
      console.log('No users found in backup file.');
      return;
    }

    // Check if database already has users
    const existingUserCount = await User.countDocuments();
    if (existingUserCount > 0) {
      console.log(`Database already has ${existingUserCount} users. Skipping import.`);
      return;
    }

    // Insert users into MongoDB
    await User.insertMany(users);

    console.log(`✅ Loaded ${users.length} users from Azure Blob Storage into MongoDB`);
  } catch (error) {
    console.error('Error loading users from blob storage:', error);
  }
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
