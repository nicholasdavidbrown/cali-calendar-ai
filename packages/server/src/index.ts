import app from './app';
import { connectDatabase } from './config/database';
import { initializeScheduler } from './services/schedulerService';

const port = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🚀 ========================================');
  console.log('🚀 Starting Calendar SMS Server');
  console.log('🚀 ========================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Port: ${port}`);
  console.log(`📍 MongoDB URI: ${process.env.MONGODB_URI || 'not set'}`);
  console.log(`📍 Azure Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured ✅' : 'not configured ❌'}`);
  console.log(`📍 Primary Data Store: Azure Blob Storage`);
  console.log('🚀 ========================================\n');

  try {
    // Attempt to connect to MongoDB (optional, non-blocking)
    console.log('🔌 Step 1/3: Attempting MongoDB connection (optional)...');
    const mongoConnected = await connectDatabase();
    if (mongoConnected) {
      console.log('✅ MongoDB connected (backup database available)\n');
    } else {
      console.log('⏭️  Continuing without MongoDB (using Azure Blob Storage only)\n');
    }

    // Initialize SMS scheduler
    console.log('⏰ Step 2/3: Initializing SMS scheduler...');
    initializeScheduler();
    console.log('✅ SMS scheduler initialized\n');

    // Start Express server
    console.log('🌐 Step 3/3: Starting Express server...');
    app.listen(port, () => {
      /* eslint-disable no-console */
      console.log('✅ Express server started successfully');
      console.log(`🌐 Server listening on: http://localhost:${port}`);
      console.log('🚀 ========================================');
      console.log('🚀 Server is ready to accept requests!');
      console.log('🚀 Data source: Azure Blob Storage');
      if (mongoConnected) {
        console.log('🚀 MongoDB: Available as backup');
      }
      console.log('🚀 ========================================\n');
      /* eslint-enable no-console */
    });
  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ FATAL ERROR: Failed to start server');
    console.error('❌ ========================================');
    console.error('❌ Error details:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    console.error('❌ ========================================\n');
    process.exit(1);
  }
};

startServer();
