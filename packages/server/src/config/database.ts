import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/calendar-sms';

export const connectDatabase = async (): Promise<boolean> => {
  console.log(`🔗 Attempting to connect to MongoDB at: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    if (mongoose.connection.db) {
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    }
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`📍 Port: ${mongoose.connection.port}`);
    return true;
  } catch (error) {
    console.warn('⚠️  ========================================');
    console.warn('⚠️  MongoDB connection failed (non-fatal)');
    console.warn('⚠️  ========================================');
    console.warn('⚠️  Application will use Azure Blob Storage only');
    console.warn('⚠️  Error details:', error instanceof Error ? error.message : error);
    console.warn('⚠️  ========================================');
    return false;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT - shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed through app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM - shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed through app termination');
  process.exit(0);
});
