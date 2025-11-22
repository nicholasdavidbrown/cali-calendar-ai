import cron from 'node-cron';
import * as userStorage from './userStorageService';
import { sendDailySummary } from './smsService';

/**
 * Scheduler Service for Automated Daily SMS Summaries
 *
 * This service runs a cron job every hour to check if any users
 * need to receive their daily calendar summary via SMS.
 */

/**
 * Checks if it's time to send SMS to a user based on their preferred time
 * @param user - User document with timezone and smsTime preferences
 * @returns true if current time matches user's preferred SMS time
 */
const checkIfTimeToSend = (user: any): boolean => {
  try {
    // Get current time in user's timezone
    const now = new Date();
    const userTimeString = now.toLocaleTimeString('en-US', {
      timeZone: user.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    // Extract hour from user's preferred SMS time (format: "07:00")
    const [preferredHour] = user.smsTime.split(':');
    const [currentHour] = userTimeString.split(':');

    // Check if current hour matches user's preferred hour
    return currentHour === preferredHour;
  } catch (error) {
    console.error(`Error checking time for user ${user.email}:`, error);
    return false;
  }
};

/**
 * Checks if SMS was already sent today to avoid duplicate sends
 * @param user - User document with lastSmsSentDate field
 * @returns true if SMS was already sent today
 */
const sentToday = (user: any): boolean => {
  if (!user.lastSmsSentDate) {
    return false;
  }

  const lastSent = new Date(user.lastSmsSentDate);
  const today = new Date();

  // Convert to user's timezone for accurate day comparison
  const lastSentDay = lastSent.toLocaleDateString('en-US', {
    timeZone: user.timezone,
  });
  const todayDay = today.toLocaleDateString('en-US', {
    timeZone: user.timezone,
  });

  return lastSentDay === todayDay;
};

/**
 * Initializes and starts the scheduler cron job
 * Runs every hour at the top of the hour (0 * * * *)
 */
export const initializeScheduler = (): void => {
  console.log('📅 Initializing SMS scheduler...');

  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Scheduler running - checking for users to send SMS...');

    try {
      // Find all active users
      const allUsers = await userStorage.getAllUsers();
      const users = allUsers.filter((u) => u.isActive);
      console.log(`Found ${users.length} active user(s)`);

      for (const user of users) {
        try {
          // Check if it's time to send and hasn't been sent today
          const shouldSend = checkIfTimeToSend(user);
          const alreadySent = sentToday(user);

          if (shouldSend && !alreadySent) {
            console.log(`📤 Sending daily summary to ${user.email}...`);
            await sendDailySummary(user);
            console.log(`✅ Successfully sent SMS to ${user.email}`);
          } else if (shouldSend && alreadySent) {
            console.log(`⏭️  Skipping ${user.email} - already sent today`);
          }
        } catch (error) {
          console.error(`❌ Error processing user ${user.email}:`, error);
          // Continue with next user even if one fails
        }
      }

      console.log('✓ Scheduler check complete');
    } catch (error) {
      console.error('❌ Error in scheduler job:', error);
    }
  });

  console.log('✓ SMS scheduler initialized - running every hour');
};

/**
 * Manual trigger for testing the scheduler logic
 * This can be called from an API endpoint for testing purposes
 */
export const runSchedulerManually = async (): Promise<void> => {
  console.log('🧪 Manual scheduler trigger initiated...');

  try {
    const allUsers = await userStorage.getAllUsers();
    const users = allUsers.filter((u) => u.isActive);
    console.log(`Found ${users.length} active user(s)`);

    for (const user of users) {
      try {
        const shouldSend = checkIfTimeToSend(user);
        const alreadySent = sentToday(user);

        console.log(`User: ${user.email}`);
        console.log(`  - Should send: ${shouldSend}`);
        console.log(`  - Already sent today: ${alreadySent}`);
        console.log(`  - SMS Time: ${user.smsTime}`);
        console.log(`  - Timezone: ${user.timezone}`);

        if (shouldSend && !alreadySent) {
          console.log(`📤 Sending daily summary to ${user.email}...`);
          await sendDailySummary(user);
          console.log(`✅ Successfully sent SMS to ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log('✓ Manual trigger complete');
  } catch (error) {
    console.error('❌ Error in manual trigger:', error);
    throw error;
  }
};
