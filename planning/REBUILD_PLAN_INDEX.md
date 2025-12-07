# Cali Calendar AI - Complete Rebuild Plan Index

## 📚 Documentation Structure

This rebuild plan is divided into 4 comprehensive documents:

### Part 1: REBUILD_PLAN_PHASES_1-4.md
**Foundation & Core Setup**
- **Phase 1:** Project Setup with SERN Template (monorepo, TypeScript, packages)
- **Phase 2:** Database Setup (SQLite with Prisma - 8 tables)
- **Phase 3:** Authentication System (Email/password with JWT & bcrypt)
- **Phase 4:** Manual Calendar Events (Full CRUD operations)

### Part 2: REBUILD_PLAN_PHASES_5-7.md
**Core Features**
- **Phase 5:** ~~SMS Notification System (Twilio integration)~~ **REPLACED** -> See PHASE_5_PUSHOVER_REPLACEMENT.md
- **Phase 5 (NEW):** Pushover Notification System (Push notifications with Groups API)
- **Phase 6:** AI Messaging with Claude (Anthropic API with personality styles)
- **Phase 7:** Family Sharing Features (Invite codes, QR codes, family management)

### Part 3: REBUILD_PLAN_PHASES_8-11.md
**Admin & Advanced Features**
- **Phase 8:** Admin Dashboard (User management, system stats)
- **Phase 9:** Admin Settings UI (API key management, connection testing)
- **Phase 10:** Scheduler Service (Automated daily SMS with node-cron)
- **Phase 11:** Navigation and Layout (Consistent UI, mobile navigation)

### Part 4: REBUILD_PLAN_PHASES_12-15.md
**Integrations & Polish**
- **Phase 12:** TimeTree Calendar Integration (Puppeteer web scraping)
- **Phase 13:** Google Calendar API Integration (Official OAuth API)
- **Phase 14:** Microsoft Graph Integration (Optional Outlook/Office 365)
- **Phase 15:** Style Randomizer & Final Polish (Rate limiting, logging, error handling)

---

## 🎯 How to Use This Plan

1. **Start with Part 1** (REBUILD_PLAN_PHASES_1-4.md)
2. **Work sequentially** through each phase
3. **Complete all steps** in each phase before moving to the next
4. **Test thoroughly** using the provided test commands
5. **Check off items** in each phase's checklist
6. **Continue to next part** when phase group is complete

## 📊 Complete Feature Set

By the end of all 15 phases, you will have:

### Authentication & User Management
- ✅ Email/password authentication with JWT
- ✅ Admin dashboard with user management
- ✅ Role-based access control (admin vs. regular users)
- ✅ First-time setup wizard

### Calendar Features
- ✅ Manual event creation/editing/deletion
- ✅ TimeTree calendar sync (Puppeteer)
- ✅ Google Calendar sync (Official API)
- ✅ Microsoft Calendar sync (Official API)
- ✅ Multi-source event aggregation
- ✅ Automatic sync scheduling

### Push Notifications (Pushover)
- ✅ Pushover push notification integration (replaces Twilio SMS)
- ✅ Per-user Pushover API token and group management
- ✅ AI-powered message generation with Claude
- ✅ 6 personality styles + daily random rotation
- ✅ Automated daily summaries
- ✅ Manual test notification capability
- ✅ Notification history tracking
- ✅ Family members added to user's Pushover group

### Family Sharing
- ✅ Family member management
- ✅ Invite codes with QR generation
- ✅ Public join page (no auth required)
- ✅ Family member activation/deactivation
- ✅ Group notifications (all family members via Pushover group)

### Admin Features
- ✅ System statistics dashboard
- ✅ User management interface
- ✅ API key configuration UI
- ✅ Connection testing for services
- ✅ Settings management
- ✅ SMS history monitoring

### Technical Features
- ✅ SQLite database with Prisma ORM
- ✅ TypeScript monorepo structure
- ✅ React with Vite (client)
- ✅ Express API (server)
- ✅ Rate limiting
- ✅ Request logging (Winston)
- ✅ Error handling middleware
- ✅ Docker support
- ✅ Health check endpoints

---

## 🏗️ Architecture Overview

```
cali-calendar-ai/
├── apps/
│   ├── server/          # Express API (TypeScript)
│   │   ├── src/
│   │   │   ├── lib/            # Utilities (prisma, jwt, password, etc.)
│   │   │   ├── middleware/     # Auth, rate limiting, error handling
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic (SMS, Claude, calendars)
│   │   │   └── index.ts        # Server entry point
│   │   └── package.json
│   └── client/          # React frontend (TypeScript + Vite)
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── contexts/       # React contexts (Auth)
│       │   ├── hooks/          # Custom hooks
│       │   ├── pages/          # Page components
│       │   └── App.tsx         # App entry point
│       └── package.json
├── packages/
│   └── shared/          # Shared types and constants
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration history
├── REBUILD_PLAN_PHASES_1-4.md
├── REBUILD_PLAN_PHASES_5-7.md
├── REBUILD_PLAN_PHASES_8-11.md
├── REBUILD_PLAN_PHASES_12-15.md
└── package.json         # Root package with workspace config
```

---

## 📝 Database Schema Summary

### 8 Core Tables

1. **User** - User accounts with auth and preferences
2. **CalendarEvent** - All calendar events (manual + synced)
3. **FamilyMember** - Family members receiving SMS
4. **SmsHistory** - Track all sent messages
5. **JoinCode** - Invitation codes for family members
6. **CalendarIntegration** - OAuth tokens for calendar APIs
7. **AdminSettings** - System-wide configuration
8. **SystemSetup** - First-time setup tracking

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment
cp apps/server/.env.example apps/server/.env

# Initialize database
npx prisma migrate dev --name init
npm run db:seed --workspace=apps/server

# Start development
npm run dev

# Access application
# Frontend: http://localhost:5173
# API: http://localhost:3001
# Default admin: admin@localhost / admin123
```

---

## 📦 Key Dependencies

### Server
- **express** - Web framework
- **@prisma/client** - Database ORM
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **@anthropic-ai/sdk** - Claude AI
- **pushover** - Push notifications (native fetch, no SDK)
- **googleapis** - Google Calendar API
- **@microsoft/microsoft-graph-client** - Microsoft Calendar API
- **puppeteer** - TimeTree scraping
- **node-cron** - Automated scheduling
- **winston** - Logging

### Client
- **react** - UI framework
- **react-router-dom** - Routing
- **@tanstack/react-query** - Data fetching
- **axios** - HTTP client
- **date-fns** - Date formatting
- **qrcode.react** - QR code generation
- **lucide-react** - Icons

---

## 🎓 Learning Path

If you're new to any of these technologies, we recommend learning them in this order:

1. **TypeScript basics** - Variables, types, interfaces
2. **React fundamentals** - Components, hooks, state
3. **Express.js** - Routes, middleware
4. **Prisma ORM** - Schema, queries, migrations
5. **JWT authentication** - Token generation, verification
6. **React Query** - Data fetching, caching
7. **External APIs** - REST APIs, OAuth flows

---

## ⚠️ Important Notes

### Security
- Change default admin credentials immediately
- Use strong JWT_SECRET in production
- Encrypt sensitive database fields
- Configure CORS properly
- Use HTTPS in production
- Enable rate limiting

### Development
- Test each phase before proceeding
- Use TypeScript strictly
- Follow the provided code examples exactly
- Check off completed items in checklists
- Keep dependencies up to date

### Production
- Set NODE_ENV=production
- Configure proper logging
- Set up database backups
- Use environment variables for secrets
- Monitor system health
- Test all integrations thoroughly

---

## 🆘 Troubleshooting

### Common Issues

**Database connection fails**
- Check DATABASE_URL in .env
- Run `npx prisma generate`
- Verify migrations: `npx prisma migrate status`

**Authentication not working**
- Verify JWT_SECRET is set
- Check cookie settings (httpOnly, sameSite)
- Ensure CORS credentials: true

**Notifications not sending**
- Verify Pushover API token and user key on user account
- Check Pushover group was created during registration
- Test via Pushover app on device

**Claude AI not responding**
- Test API key in Admin Settings
- Verify Anthropic account has credits
- Check fallback message generation

---

## 📖 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Pushover API](https://pushover.net/api)
- [Google Calendar API](https://developers.google.com/calendar)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)

---

## ✅ Success Criteria

You'll know the rebuild is successful when:

- [ ] All 15 phases completed
- [ ] All phase checklists checked off
- [ ] Can create and manage calendar events
- [ ] Can send SMS successfully
- [ ] Family sharing works end-to-end
- [ ] Admin dashboard functional
- [ ] At least one calendar integration working
- [ ] Automated daily SMS sending
- [ ] All tests passing
- [ ] No console errors in production

---

**Ready to build? Start with REBUILD_PLAN_PHASES_1-4.md!** 🚀
