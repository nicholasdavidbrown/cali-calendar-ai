import app from './app';
// import { connectDatabase } from './config/database';

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    // await connectDatabase();

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
