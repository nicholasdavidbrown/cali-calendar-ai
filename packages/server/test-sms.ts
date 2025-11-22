/**
 * Simple SMS Test Script
 *
 * This script allows you to test the SMS functionality directly
 * without needing to go through the full authentication flow.
 *
 * Usage: ts-node test-sms.ts <phone-number>
 * Example: ts-node test-sms.ts +15551234567
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import after loading env vars
import { sendSMS, isTwilioConfigured } from './src/services/smsService';

const testSMS = async () => {
  console.log('\n🧪 Testing Twilio SMS Integration...\n');

  // Check if Twilio is configured
  if (!isTwilioConfigured()) {
    console.error('❌ Error: Twilio is not configured!');
    console.error('Please set the following environment variables in packages/server/.env:');
    console.error('  - TWILIO_ACCOUNT_SID');
    console.error('  - TWILIO_AUTH_TOKEN');
    console.error('  - TWILIO_PHONE_NUMBER');
    process.exit(1);
  }

  console.log('✅ Twilio configuration found');
  console.log(`📱 From: ${process.env.TWILIO_PHONE_NUMBER}`);

  // Get phone number from command line argument
  const toPhoneNumber = process.argv[2];

  if (!toPhoneNumber) {
    console.error('\n❌ Error: No phone number provided!');
    console.error('Usage: ts-node test-sms.ts <phone-number>');
    console.error('Example: ts-node test-sms.ts +15551234567\n');
    process.exit(1);
  }

  console.log(`📱 To: ${toPhoneNumber}\n`);

  // Test message
  const testMessage = `Hello! This is a test message from your Calendar-to-SMS app.

If you're seeing this, your Twilio integration is working correctly! 🎉

Sent at: ${new Date().toLocaleString()}`;

  try {
    console.log('📤 Sending test SMS...\n');
    const messageSid = await sendSMS(toPhoneNumber, testMessage);

    console.log('✅ SUCCESS! SMS sent successfully!');
    console.log(`📬 Message SID: ${messageSid}`);
    console.log(`\n💡 Check your phone (${toPhoneNumber}) for the message.\n`);
  } catch (error) {
    console.error('\n❌ FAILED to send SMS!');
    console.error('Error details:', error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes('Unable to create record')) {
      console.error('\n💡 Possible issues:');
      console.error('  - Phone number format is incorrect (use E.164 format: +1234567890)');
      console.error('  - Twilio trial account can only send to verified numbers');
      console.error('  - Verify your phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
    process.exit(1);
  }
};

// Run the test
testSMS();
