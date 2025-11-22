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
    console.warn('⚠️  Azure Storage connection string not configured. Skipping blob operations.');
    return null;
  }

  console.log('🔗 Azure Storage connection string found. Initializing Blob Service Client...');
  try {
    const client = BlobServiceClient.fromConnectionString(connectionString);
    console.log('✅ Blob Service Client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Blob Service Client:', error);
    return null;
  }
}

/**
 * Save all users to Azure Blob Storage as JSON
 */
export async function saveUsersToBlob(): Promise<void> {
  console.log('📤 Starting user save to Azure Blob Storage...');

  const blobServiceClient = getBlobServiceClient();
  if (!blobServiceClient) {
    console.log('⏭️  Skipping user save (no blob service client)');
    return;
  }

  try {
    // Fetch all users from MongoDB
    console.log('📊 Fetching users from MongoDB...');
    const users = await User.find().lean();
    console.log(`📊 Found ${users.length} users in MongoDB`);

    // Convert to JSON
    const usersJson = JSON.stringify(users, null, 2);
    console.log(`📝 Serialized ${usersJson.length} bytes of JSON data`);

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    console.log(`📦 Using container: ${CONTAINER_NAME}`);

    // Create container if it doesn't exist (defaults to private)
    console.log('🔍 Checking if container exists...');
    const createResult = await containerClient.createIfNotExists();
    if (createResult.succeeded) {
      console.log('✨ Created new container');
    } else {
      console.log('✅ Container already exists');
    }

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    console.log(`📄 Uploading to blob: ${BLOB_NAME}`);

    // Upload JSON
    await blockBlobClient.upload(usersJson, usersJson.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
    });

    console.log(`✅ Successfully saved ${users.length} users to Azure Blob Storage`);
  } catch (error) {
    console.error('❌ Error saving users to blob storage:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
  }
}

/**
 * Load users from Azure Blob Storage and populate MongoDB
 */
export async function loadUsersFromBlob(): Promise<void> {
  console.log('📥 Starting user load from Azure Blob Storage...');

  const blobServiceClient = getBlobServiceClient();
  if (!blobServiceClient) {
    console.log('⏭️  No Azure Storage configured. Skipping user load from blob.');
    return;
  }

  try {
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    console.log(`📦 Checking container: ${CONTAINER_NAME}`);

    // Check if container exists
    console.log('🔍 Checking if container exists...');
    const exists = await containerClient.exists();
    if (!exists) {
      console.log('ℹ️  No user backup container found. Starting with empty database.');
      return;
    }
    console.log('✅ Container exists');

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    console.log(`📄 Checking blob: ${BLOB_NAME}`);

    // Check if blob exists
    console.log('🔍 Checking if blob exists...');
    const blobExists = await blockBlobClient.exists();
    if (!blobExists) {
      console.log('ℹ️  No user backup file found. Starting with empty database.');
      return;
    }
    console.log('✅ Blob exists');

    // Download blob
    console.log('⬇️  Downloading blob...');
    const downloadResponse = await blockBlobClient.download(0);
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody!);
    console.log(`📦 Downloaded ${downloadedContent.length} bytes`);

    // Parse JSON
    console.log('🔧 Parsing JSON...');
    const users = JSON.parse(downloadedContent);
    console.log(`📊 Parsed ${Array.isArray(users) ? users.length : 0} users from JSON`);

    if (!Array.isArray(users) || users.length === 0) {
      console.log('ℹ️  No users found in backup file.');
      return;
    }

    // Check if database already has users
    console.log('🔍 Checking existing users in MongoDB...');
    const existingUserCount = await User.countDocuments();
    console.log(`📊 Found ${existingUserCount} existing users in MongoDB`);

    if (existingUserCount > 0) {
      console.log(`⏭️  Database already has ${existingUserCount} users. Skipping import.`);
      return;
    }

    // Insert users into MongoDB
    console.log(`💾 Inserting ${users.length} users into MongoDB...`);
    await User.insertMany(users);

    console.log(`✅ Successfully loaded ${users.length} users from Azure Blob Storage into MongoDB`);
  } catch (error) {
    console.error('❌ Error loading users from blob storage:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
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
