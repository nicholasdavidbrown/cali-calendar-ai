import app from './app';
// import { connectDatabase } from './config/database'; // MongoDB disabled
import { initializeScheduler } from './services/schedulerService';

const port = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🚀 ========================================');
  console.log('🚀 Starting Calendar SMS Server');
  console.log('🚀 ========================================');
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Port: ${port}`);
  console.log(`📍 Azure Storage: ${process.env.AZURE_STORAGE_CONNECTION_STRING ? 'configured ✅' : 'not configured ❌'}`);
  console.log(`📍 Primary Data Store: Azure Blob Storage`);
  console.log(`📍 CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('🚀 ========================================\n');

  try {
    // MongoDB connection removed - using Azure Blob Storage only
    console.log('💾 Using Azure Blob Storage as primary data store');
    console.log('⚠️  MongoDB disabled - all data stored in Azure\n');

    // Initialize SMS scheduler
    console.log('⏰ Step 1/2: Initializing SMS scheduler...');
    initializeScheduler();
    console.log('✅ SMS scheduler initialized\n');

    // Start Express server
    console.log('🌐 Step 2/2: Starting Express server...');
    app.listen(port, () => {
      /* eslint-disable no-console */
      console.log('✅ Express server started successfully');
      console.log(`🌐 Server listening on: http://localhost:${port}`);
      console.log('🚀 ========================================');
      console.log('🚀 Server is ready to accept requests!');
      console.log('🚀 Data source: Azure Blob Storage');
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
