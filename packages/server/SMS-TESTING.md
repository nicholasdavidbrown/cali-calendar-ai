# SMS Testing Guide

## Option 1: Quick Direct Test (Recommended)

This method tests Twilio directly without needing authentication.

1. **Navigate to the server directory**:
   ```bash
   cd packages/server
   ```

2. **Run the test script**:
   ```bash
   yarn ts-node test-sms.ts +YOUR_PHONE_NUMBER
   ```

   Example:
   ```bash
   yarn ts-node test-sms.ts +15551234567
   ```

3. **Check your phone** for the test message!

### Important Notes:
- Phone number must be in E.164 format: `+[country code][number]`
- For US numbers: `+1` followed by 10 digits
- **Twilio Trial Accounts**: Can only send SMS to verified phone numbers
  - Verify your phone at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

---

## Option 2: Test via API Endpoints

This method tests the full API including authentication.

### Prerequisites:
1. Server must be running: `yarn dev`
2. You must be logged in via Microsoft OAuth
3. Your user must have a phone number set

### Using curl:

1. **First, log in through the frontend** (http://localhost:3000)

2. **Get your JWT token from browser cookies**:
   - Open Browser Dev Tools (F12)
   - Go to Application → Cookies
   - Copy the value of the `token` cookie

3. **Check SMS status**:
   ```bash
   curl -X GET http://localhost:3001/api/v1/sms/status \
     -H "Cookie: token=YOUR_JWT_TOKEN_HERE"
   ```

4. **Send test SMS**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/sms/send-test \
     -H "Cookie: token=YOUR_JWT_TOKEN_HERE" \
     -H "Content-Type: application/json"
   ```

### Using VS Code REST Client:

1. Install the "REST Client" extension in VS Code
2. Open `test-sms-api.http` (in the root directory)
3. Replace `YOUR_JWT_TOKEN_HERE` with your actual token
4. Click "Send Request" above any request

---

## Option 3: Test from Frontend

Once the frontend is built with a "Send Test SMS" button, you can:

1. Go to http://localhost:3000
2. Log in with Microsoft
3. Navigate to the Dashboard
4. Click "Send Test SMS"

---

## Troubleshooting

### Error: "Missing Twilio credentials"
- Check that `.env` file has all Twilio variables set
- Restart the server after updating `.env`

### Error: "Unable to create record"
- **Phone number format**: Must be E.164 format (`+15551234567`)
- **Trial account**: Verify the recipient phone number in Twilio Console
- **Wrong number**: Double-check the phone number

### Error: "Failed to send SMS"
- Check Twilio account balance
- Verify your Twilio credentials are correct
- Check Twilio Console logs: https://console.twilio.com/us1/monitor/logs/sms

### Success but no SMS received
- Check if the phone number can receive SMS
- Check spam/blocked messages on your phone
- Allow a few minutes for delivery
- Check Twilio Console logs for delivery status

---

## What Gets Sent

The test SMS from Option 1 sends:
```
Hello! This is a test message from your Calendar-to-SMS app.

If you're seeing this, your Twilio integration is working correctly! 🎉

Sent at: [current time]
```

The API test from Option 2 sends your actual calendar events:
```
Good morning [Your Name]! Here's your schedule for today:

9:00 AM - 10:00 AM - Team Standup
10:30 AM - 11:30 AM - Client Meeting (Zoom)

Have a great day!
```

Or if you have no events:
```
Good morning [Your Name]! No events scheduled for today.
```
