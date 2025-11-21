# Implementation Plan for Calendar-to-SMS Application (Demo)

## Overview
Build a self-hosted calendar-to-SMS application for demonstration purposes. The app reads from Outlook Calendar and sends scheduled SMS summaries. Minimal infrastructure, no backups required at this stage.

**Tech Stack**: Vite + React (client), Node + Express (server), MongoDB, Docker

---

## Phase 1: MongoDB Setup (Minimal)

**Goal**: Set up MongoDB in Docker for storing user authentication data

**Steps**:
1. Add MongoDB service to `docker-compose.yml` (basic config, no persistence needed)
2. Install `mongoose` in server: `yarn workspace server add mongoose`
3. Create `src/models/User.js` with schema:
   - `email` (String, unique, required)
   - `microsoftId` (String, unique)
   - `phone` (String, required)
   - `accessToken` (String, encrypted)
   - `refreshToken` (String, encrypted)
   - `tokenExpiresAt` (Date)
   - `timezone` (String, default: 'America/Los_Angeles')
   - `smsTime` (String, default: '07:00')
   - `isActive` (Boolean, default: true)
   - Timestamps: createdAt, updatedAt
4. Create `src/config/database.js` for MongoDB connection
5. MongoDB URI: `mongodb://mongodb:27017/calendar-sms`

---

## Phase 1.5: Create basic data structure for storing events on dates

**Goal**: We want the client web app to be able to add custom events that were'nt pulled from the calendar API. These events will be stored in MongoDB. But it is important that the calendar sync uses the same date structure.

Create a new Mongoose model `CalendarEvent.js` with the following schema:
- `userId` (ObjectId, ref to User, required)
- `title` (String, required)
- `description` (String)
- `start` (Date, required)
- `end` (Date, required)
- `isAllDay` (Boolean, default: false)
- Timestamps: createdAt, updatedAt
- Indexes on `userId` and `start` for efficient querying
- This will allow us to store both calendar events fetched from Microsoft Graph and custom events created by the user the same way and eventually extend the app to pull from other calendar providers.

---

## Phase 2: Microsoft OAuth 2.0 with JWT Authentication

**Goal**: Allow users to sign in with Microsoft and authorize calendar access using stateless JWT authentication

### Azure AD Setup
- Register app at https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
- Add redirect URI: `http://localhost:3001/auth/callback`
- Required API permissions: `User.Read`, `Calendars.Read`, `offline_access`
- Note Client ID, Tenant ID, create Client Secret

### Server Implementation
1. Install: `yarn workspace server add @azure/msal-node jsonwebtoken cookie-parser`
2. Add to `server/.env`:
   ```
   MICROSOFT_CLIENT_ID=...
   MICROSOFT_CLIENT_SECRET=...
   MICROSOFT_TENANT_ID=common
   REDIRECT_URI=http://localhost:3001/auth/callback
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   ```
3. Create `src/config/auth.js` - MSAL confidential client config
4. Create `src/utils/jwt.js` - JWT token generation and verification utilities:
   - `generateToken(userId)` - Creates signed JWT with user ID
   - `verifyToken(token)` - Validates and decodes JWT
5. Create `src/routes/auth.js`:
   - `GET /auth/login` - Initiates OAuth flow
   - `GET /auth/callback` - Handles callback, saves tokens to MongoDB, generates JWT, sets httpOnly cookie
   - `GET /auth/logout` - Clears JWT cookie
   - `GET /auth/status` - Returns current user from JWT
6. Create `src/middleware/auth.js` - JWT verification middleware:
   - Extracts JWT from httpOnly cookie
   - Verifies token signature
   - Fetches user from database
   - Attaches user to request object
7. Basic token encryption using `crypto` module for Microsoft tokens

### Authentication Flow
1. User clicks "Connect Microsoft Calendar" → redirects to Microsoft OAuth
2. After successful OAuth, server saves Microsoft tokens to MongoDB
3. Server generates JWT containing user ID and sets it in httpOnly cookie
4. Client automatically sends cookie with subsequent requests
5. Server middleware verifies JWT and attaches user to request

### Benefits of JWT over express-session
- **Stateless**: No server-side session storage required
- **Scalable**: Works across multiple server instances without shared session store
- **Performance**: No session lookup on each request
- **Mobile-friendly**: Easier to implement in mobile apps later

---

## Phase 3: Microsoft Graph Calendar Integration

**Goal**: Fetch calendar events from Outlook via Microsoft Graph API

### Implementation
1. Install: `yarn workspace server add @microsoft/microsoft-graph-client isomorphic-fetch`
2. Create `src/services/calendarService.js`:
   - `getGraphClient(accessToken)` - Creates authenticated Graph client
   - `getEventsForNext24Hours(user)` - Fetches events from now to +24 hours
     - Endpoint: `/me/calendarview?startDateTime=...&endDateTime=...`
     - Returns: subject, start, end, location, isAllDay
   - `refreshAccessToken(user)` - Uses refresh token to get new access token
3. Create `src/routes/calendar.js`:
   - `GET /api/v1/calendar/events` (protected) - Returns user's upcoming events
4. Event formatter:
   - Convert UTC times to user's timezone
   - Format: "9:00 AM - Team Standup (Conference Room A)"
   - Handle all-day events: "All Day - Company Holiday"

---

## Phase 4: Twilio SMS Integration

**Goal**: Send formatted SMS messages with calendar summaries

### Twilio Setup
- Create account at https://www.twilio.com
- Get phone number (trial gives you one free number)
- Note Account SID and Auth Token

### Implementation
1. Install: `yarn workspace server add twilio`
2. Add to `server/.env`:
   ```
   TWILIO_ACCOUNT_SID=...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   ```
3. Create `src/services/smsService.js`:
   - `initializeTwilioClient()` - Creates Twilio client
   - `sendSMS(to, message)` - Sends SMS to phone number
   - `formatCalendarSummary(events, userName)` - Creates message:
     ```
     Good morning! Here's your schedule for today:

     9:00 AM - Team Standup
     10:30 AM - Client Meeting (Zoom)
     2:00 PM - Project Review (Room 302)

     Have a great day!
     ```
   - Handle empty calendar: "Good morning! No events scheduled for today."
4. Create `src/routes/sms.js`:
   - `POST /api/v1/sms/send-test` (protected) - Manual trigger for testing

---

## Phase 5: Basic Scheduler

**Goal**: Automatically send daily SMS summaries at user's preferred time

### Implementation
1. Install: `yarn workspace server add node-cron`
2. Create `src/services/schedulerService.js`:
   - Simple cron job that runs every hour
   - Logic:
     ```javascript
     cron.schedule('0 * * * *', async () => {
       const users = await User.find({ isActive: true });

       for (const user of users) {
         const shouldSend = checkIfTimeToSend(user);
         if (shouldSend && !sentToday(user)) {
           await sendDailySummary(user);
         }
       }
     });
     ```
   - `sendDailySummary(user)`:
     1. Refresh token if needed
     2. Fetch next 24 hours of events
     3. Format events into SMS message
     4. Send via Twilio
     5. Update `lastSmsSentDate` in user document
3. Add `lastSmsSentDate` field to User model
4. Initialize scheduler in `src/index.js` when server starts
5. Basic error logging to console

---

## Phase 6: Simple Frontend

**Goal**: Build minimal React UI for authentication and management

### Routing Structure
```
/ → Landing/Login page
/dashboard → Main calendar view (protected)
/settings → User preferences (protected)
```

### Implementation
1. Install: `yarn workspace client add react-router-dom axios`
2. Create `src/contexts/AuthContext.jsx`:
   - Manages authentication state
   - Provides `user`, `login`, `logout`, `isAuthenticated`
3. Create `src/api/client.js`:
   - Axios instance with base URL
   - **Important**: Set `withCredentials: true` to send httpOnly cookies with requests

### Pages

**Login Page** (`src/pages/Login.jsx`):
- Hero section explaining the app
- "Connect Microsoft Calendar" button → redirects to `/auth/login`
- Shows loading state if checking auth

**Dashboard** (`src/pages/Dashboard.jsx`):
- Displays user's email
- Shows today's calendar events from `/api/v1/calendar/events`
- "Send Test SMS" button → calls `/api/v1/sms/send-test`
- Loading states and error messages
- "Refresh" button to reload events

**Settings Page** (`src/pages/Settings.jsx`):
- Form to update phone number
- Timezone selector dropdown
- Preferred SMS time picker
- Toggle to pause/resume daily SMS
- "Disconnect Account" button
- Save button with feedback

### Components
- `src/components/ProtectedRoute.jsx` - Redirects to login if not authenticated
- `src/components/EventList.jsx` - Displays events
- `src/App.jsx` - Router setup with AuthContext

---

## Phase 7: Basic Docker Setup

**Goal**: Containerize application for easy deployment

### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    networks:
      - app-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    env_file:
      - ./server/.env
    networks:
      - app-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    networks:
      - app-network

networks:
  app-network:
```

### Dockerfiles

**server/Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 3001
CMD ["yarn", "start"]
```

**client/Dockerfile**:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Phase 8: Quick Deploy Options

### Option A: Run Locally with Docker
```bash
docker-compose up
```
Access at `localhost:3000`

### Option B: AWS Lightsail (Fastest Cloud Deploy)
- Create container service
- Upload docker-compose
- Get public URL
- ~10 minutes to deploy

### Option C: Single EC2 Instance
- Launch Ubuntu t3.micro (free tier eligible)
- Install Docker and Docker Compose
- Clone repo and run `docker-compose up -d`
- Access via EC2 public IP

---

## Phase 9: Basic Documentation

### README.md should include:
1. **Prerequisites**: Node.js, Docker, Yarn
2. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Fill in Microsoft and Twilio credentials
3. **Running Locally**: `docker-compose up`
4. **Usage**:
   - Visit `localhost:3000`
   - Connect Microsoft account
   - Add phone number
   - Set SMS time
   - Test SMS manually

### Demo Script:
1. Show login and Microsoft OAuth flow
2. Display calendar events on dashboard
3. Configure phone number and SMS time
4. Send test SMS
5. Show formatted SMS message on phone

---

## Environment Variables

### server/.env
```bash
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://mongodb:27017/calendar-sms

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Microsoft OAuth
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
REDIRECT_URI=http://localhost:3001/auth/callback

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### client/.env
```bash
VITE_API_URL=http://localhost:3001
```

---

## What We're Skipping for Demo

- ❌ Backups and restore
- ❌ Admin panel for user management
- ❌ Complex nginx reverse proxy setup
- ❌ SSL certificates
- ❌ Health checks and monitoring
- ❌ Rate limiting
- ❌ Multi-stage optimized Docker builds
- ❌ Production security hardening
- ❌ Automated testing

---

## MVP Feature Checklist

✅ User connects Microsoft account
✅ User adds phone number
✅ User sets SMS time
✅ App fetches calendar events
✅ App sends daily SMS summary
✅ User can test SMS manually
✅ Runs in Docker
✅ Can be deployed to AWS

---

## Architecture Diagram

```
┌──────────────────┐
│   React Client   │ (Port 3000)
│   Vite + React   │
└────────┬─────────┘
         │ HTTP/REST
         │
┌────────▼─────────┐
│  Express Server  │ (Port 3001)
│   Node.js API    │
└────┬──────┬──────┘
     │      │
     │      └──────────────┐
     │                     │
┌────▼─────────┐  ┌───────▼────────┐
│   MongoDB    │  │  External APIs │
│  (Port 27017)│  │                │
└──────────────┘  │ - MS Graph API │
                  │ - Twilio SMS   │
                  └────────────────┘
```

---

## Timeline Estimate

- **Phase 1**: 1-2 hours
- **Phase 2**: 2-3 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 1-2 hours
- **Phase 5**: 1-2 hours
- **Phase 6**: 3-4 hours
- **Phase 7**: 1-2 hours
- **Phase 8**: 1 hour
- **Phase 9**: 1 hour

**Total**: ~15-20 hours for complete demo

---

## Next Steps

1. Start with Phase 1: MongoDB Setup
2. Work through phases sequentially
3. Test each phase before moving to next
4. Deploy for demo once all phases complete
