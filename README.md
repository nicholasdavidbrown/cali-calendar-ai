# 📅 Cali Calendar AI

> 👍 **Disclaimer**
> 
> This was built in < 12 hrs as part of the [Tanda](https://www.tanda.com.au/) Gen AI hackathon. We do intend on turning it into a proper self-hosted service where you can add your own system API keys. Because we think that it's a fun product that you could leave running all the time. 
> Please note that due to time contraints, much of the core functionality was coded by a Claude agent and has not been thoroughly tested or reviewed.

## 🚀 Roadmap

I would not advise using it in it's current state, but over the next week or so I will do the following:
- Add branch patterns for open source
- Setup releases (version 0.x.x)
- Correct the mongodb backend service
- Create an admin area in the UI to put your AI API token (Anthropic claude initially) & SMS sending token (Twilio initially).
- Create a plan to merge Timetree calendar app into the history (because I use this app shared with my parner) - This may be that we find a Timetree to Outlook merger & use that.
- Other calendar support (or at lease make it modular enough for someone to extend it)
- A guide for those new to self-hosting software, so you can set and forget on your own PC or deploy to your own cloud infrastructure.

# AI-powered calendar assistant that sends personalized daily SMS notifications with your upcoming events

Cali integrates with your Microsoft Outlook calendar to send you and your family members daily SMS summaries of upcoming events. With AI-powered message personalization powered by Claude, each notification is tailored to your chosen style—from professional to witty, sarcastic, or even themed personalities like Steve Irwin or Tanda.

## ✨ Features

### Core Functionality
- 🔐 **Microsoft OAuth Integration** - Secure authentication with Outlook/Microsoft 365
- 📱 **SMS Notifications** - Daily calendar summaries sent via Twilio
- 👨‍👩‍👧‍👦 **Family Sharing** - Add family members to receive notifications
- 🎭 **AI-Powered Messaging** - Multiple personality styles powered by Claude (Anthropic)
- 📅 **Manual Events** - Create events through family join links (stored in JSON)
- 🔄 **Auto-refresh** - Real-time event updates every 5 seconds
- 📊 **SMS History** - Track all sent messages and delivery status

### Personality Styles
- **Professional** - Clear, concise, and business-appropriate
- **Witty** - Clever and humorous
- **Sarcastic** - Playful with a sarcastic edge
- **Mission** - Action-oriented, military-style briefings
- **Irwin** - Enthusiastic, Steve Irwin-inspired wildlife commentary
- **Tanda** - Tanda-specific personality

### Family Features
- Generate shareable join codes with QR codes
- Family members can register themselves via join link
- Optional event creation when joining
- Manage family members (add, edit, activate/deactivate)
- Family members receive personalized SMS notifications

## 🏗️ Architecture

This is a monorepo with three main components:

```
cali-calendar-ai/
├── packages/
│   ├── server/          # Express.js API (TypeScript)
│   ├── client/          # React frontend (TypeScript + Vite)
│   └── mongodb/         # MongoDB data (Docker volume)
├── docker-compose.yml   # Container orchestration
└── README.md
```

### Tech Stack

**Backend:**
- Node.js + Express.js
- TypeScript
- Microsoft Graph API (Calendar integration)
- Azure Blob Storage (JSON user storage)
- Twilio SMS API
- Anthropic Claude API (AI messaging)
- JWT authentication

**Frontend:**
- React 19
- TypeScript
- Vite
- React Router
- Axios
- QR Code generation

**Infrastructure:**
- Docker & Docker Compose
- MongoDB (user sessions)
- Azurite (local Azure Blob Storage emulation)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Microsoft Azure account (for OAuth app registration)
- Twilio account (for SMS)
- Anthropic API key (for AI messaging)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cali-calendar-ai.git
cd cali-calendar-ai
```

### 2. Set Up Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Create a new app registration
3. Add redirect URI: `http://localhost:3001/auth/callback`
4. Add API permissions:
   - `User.Read`
   - `Calendars.Read`
   - `offline_access`
5. Generate a client secret
6. Copy the Client ID, Client Secret, and Tenant ID

### 3. Set Up Twilio

1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number for sending SMS

### 4. Get Anthropic API Key

1. Sign up at [Anthropic](https://www.anthropic.com)
2. Generate an API key from your dashboard

### 5. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp packages/server/.env.example packages/server/.env
```

Edit `packages/server/.env`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb://mongodb:27017/calendar-sms

# JWT Authentication (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_TENANT_ID=common
REDIRECT_URI=http://localhost:3001/auth/callback

# Frontend URL
CLIENT_URL=http://localhost:3000

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Azure Blob Storage (uses Azurite for local dev, or your Azure connection string for production)
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string_here
```

### 6. Start the Application

Using Docker Compose (recommended):

```bash
# Start all services
npm run dev

# Or for a clean build
npm run dev-clean

# Stop services
npm run stop
```

Or run services individually:

```bash
# Terminal 1 - MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# Terminal 2 - Azurite (Azure Storage Emulator)
docker run -d -p 10000:10000 --name azurite mcr.microsoft.com/azure-storage/azurite

# Terminal 3 - Backend
cd packages/server
npm install
npm run dev

# Terminal 4 - Frontend
cd packages/client
npm install
npm run dev
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📖 Usage

### For Calendar Owners

1. **Sign In** - Click "Sign in with Microsoft" to connect your Outlook calendar
2. **Configure Settings** - Set your phone number, timezone, and SMS delivery time
3. **Choose Personality** - Select your preferred message style
4. **Add Family Members** - Generate join codes to invite family members
5. **Test SMS** - Send a test message to verify everything works

### For Family Members

1. **Receive Invite** - Get a join link from the calendar owner
2. **Register** - Enter your name and phone number
3. **Optional Event** - Create an event for the calendar owner
4. **Receive SMS** - Get daily calendar updates at the owner's scheduled time

### Daily SMS Flow

Every day at your configured time (default: 7:00 AM):
1. System fetches your calendar events for the next 24 hours
2. Includes both Outlook events and manually created events
3. Claude AI formats them in your chosen personality style
4. SMS sent to you and all active family members

## 🔑 API Endpoints

### Authentication
- `GET /auth/login` - Initiate Microsoft OAuth flow
- `GET /auth/callback` - OAuth callback handler

### User Management
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/preferences` - Update user preferences

### Family Members
- `GET /api/v1/users/me/family` - List family members
- `POST /api/v1/users/me/family` - Add family member
- `PUT /api/v1/users/me/family/:id` - Update family member
- `DELETE /api/v1/users/me/family/:id` - Remove family member
- `POST /api/v1/users/me/family/invite` - Generate join code
- `POST /api/v1/users/family/join` - Join via code

### Calendar Events
- `GET /api/v1/calendar/events` - Get events (next 24 hours)
- `GET /api/v1/calendar/events/week` - Get events (next 7 days)

### SMS
- `POST /api/v1/sms/test` - Send test SMS
- `GET /api/v1/sms/history` - Get SMS history

## 🏗️ Project Structure

```
packages/
├── server/
│   ├── src/
│   │   ├── config/          # App configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── calendarService.ts    # Microsoft Graph integration
│   │   │   ├── smsService.ts         # Twilio SMS
│   │   │   ├── claudeService.ts      # AI message generation
│   │   │   ├── userStorageService.ts # Azure Blob storage
│   │   │   └── schedulerService.ts   # Daily SMS scheduler
│   │   └── utils/           # Utilities (encryption, etc.)
│   ├── test/
│   └── package.json
│
└── client/
    ├── src/
    │   ├── api/             # API client services
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   │   ├── Events.tsx   # Calendar view
    │   │   ├── Settings.tsx # User settings
    │   │   ├── History.tsx  # SMS history
    │   │   └── FamilyJoin.tsx # Family registration
    │   └── App.tsx
    └── package.json
```

## 🔒 Security Features

- **Encrypted Tokens** - Microsoft access/refresh tokens encrypted at rest
- **JWT Authentication** - Secure session management
- **CORS Protection** - Configured for specific origins
- **Helmet.js** - Security headers
- **Phone Validation** - E.164 format enforcement
- **One-time Join Codes** - Expire after use or 24 hours

## 🧪 Testing

Run tests:

```bash
# Backend tests
cd packages/server
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📝 Manual Event Storage

Events created through family join links are stored in Azure Blob Storage as JSON. The system automatically merges these with Outlook calendar events for a unified view.

**Manual Event Structure:**
```typescript
{
  id: string;
  subject: string;
  start: string;        // ISO date
  end: string;          // ISO date
  location?: string;
  isAllDay: boolean;
  createdBy: string;    // Family member name
  createdAt: string;    // ISO date
}
```

## 🚀 Deployment

### Azure Deployment

See [AZURE_DEPLOYMENT_GUIDE.md](AZURE_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

Quick steps:
1. Create Azure App Service
2. Create Azure Blob Storage account
3. Configure environment variables in Azure
4. Deploy using GitHub Actions or Azure CLI

### Environment Variables for Production

Update these in your production environment:
- Change `JWT_SECRET` to a strong random string
- Set `NODE_ENV=production`
- Update `CLIENT_URL` to your frontend domain
- Update `REDIRECT_URI` to your production callback URL
- Use production MongoDB and Azure Storage

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/) - Calendar integration
- [Twilio](https://www.twilio.com/) - SMS delivery
- [Anthropic Claude](https://www.anthropic.com/) - AI-powered messaging
- [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) - Data persistence

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## 🗺️ Roadmap

- [ ] Support for Google Calendar
- [ ] Mobile app (React Native)
- [ ] Event reminders (30 min before)
- [ ] Custom message templates
- [ ] Multi-language support
- [ ] Event categories and filtering
- [ ] Recurring event management
- [ ] Integration with other calendars (iCal, etc.)

---

**Built with ❤️ using TypeScript, React, and Claude AI**
