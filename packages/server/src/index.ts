import app from './app';
import { connectDatabase } from './config/database';
import { initializeScheduler } from './services/schedulerService';
import { loadUsersFromBlob } from './services/azureBlobService';

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Load users from Azure Blob Storage
    console.log('Loading users from Azure Blob Storage...');
    await loadUsersFromBlob();

    // Initialize SMS scheduler
    initializeScheduler();

    // Start Express server
    app.listen(port, () => {
      /* eslint-disable no-console */
      console.log(`Listening: http://localhost:${port}`);
      /* eslint-enable no-console */
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
