# Phase 5 Adjustment: Admin Setup Wizard

> **Status**: Planning Complete - Ready for Implementation
>
> **Integration Point**: This adjustment modifies Phase 5 to include compulsory admin setup before the SMS notification system can be used.

## Overview

This document describes the adjustment to Phase 5 that adds a compulsory admin setup wizard when there are no users in the database. This ensures that all API tokens and integration credentials are stored in the database rather than environment variables, making the system easier to deploy and configure.

## What Changes in Phase 5

### Original Phase 5 Plan
- Install Twilio SDK
- Create Twilio service reading from environment variables
- Create SMS routes
- Test SMS functionality

### Adjusted Phase 5 Plan
1. **Add Admin Setup System** (NEW - Do First)
   - Setup wizard that appears on fresh install (zero users)
   - Stores Twilio credentials in `admin_settings` database table
   - Blocks all operations until setup complete

2. **Install Twilio SDK** (Same as before)

3. **Create Twilio Service** (Modified)
   - Already reads from `admin_settings` via `adminHelpers.getSetting()` ✅
   - No changes needed - existing implementation is correct

4. **Create SMS Routes** (Same as before)

5. **Test SMS Functionality** (Modified)
   - First complete setup wizard to configure Twilio
   - Then test SMS endpoints

## Integration with Existing Phases

### Phase 1-4 (Already Complete)
No changes needed. These phases are complete as-is.

### Phase 5 (Current - Adjusted)
**Before starting Phase 5 SMS implementation, implement the admin setup system:**

1. Backend: Setup wizard API (3 hours)
2. Backend: Admin settings management (1 hour)
3. Testing: Setup flow (30 min)
4. Then proceed with original Phase 5 tasks

### Phase 6: AI Messaging (Future)
**Adjustment**: Anthropic API key will be configured via setup wizard or admin settings panel instead of environment variables.

**Change in Phase 6**:
- Remove references to `ANTHROPIC_API_KEY` environment variable
- Use `adminHelpers.getSetting("anthropic_api_key")` (same pattern as Twilio)

### Phase 7: Family Sharing (Future)
No changes needed.

### Phase 12-14: Calendar Integrations (Future)
**Adjustment**: Google and Microsoft OAuth credentials (Client ID/Secret) will be stored in database.

**Changes in Phases 12-14**:
- Store `google_client_id` and `google_client_secret` in admin_settings
- Store `microsoft_client_id` and `microsoft_client_secret` in admin_settings
- Read from database instead of environment variables
- Admin can update OAuth credentials via settings panel

## Updated Environment Variables Strategy

### Still in Environment Variables (Infrastructure)
```bash
NODE_ENV=development          # Runtime environment
PORT=8080                      # Server port
DB_PATH=./data/cali.db        # Database location
JWT_SECRET=your-secret-key    # JWT signing key
CLIENT_URL=http://localhost:5173  # CORS configuration
```

### Now in Database (admin_settings table)
```
twilio_account_sid
twilio_auth_token
twilio_phone_number
anthropic_api_key
google_client_id
google_client_secret
microsoft_client_id
microsoft_client_secret
```

## Implementation Priority for Phase 5

### Week 1: Admin Setup System
**Priority**: HIGH - Must complete before Twilio integration can be tested

1. Backend setup wizard API
2. Admin settings management API
3. Seed script adjustment (NODE_ENV check)
4. Registration blocking until setup complete
5. Testing setup flow

### Week 2: SMS Notification System
**Priority**: HIGH - Original Phase 5 goals

1. Install Twilio SDK
2. Verify Twilio service (already reads from database ✅)
3. Create SMS routes
4. Test SMS functionality with configured credentials

## API Credentials Flow

### Setup Wizard (First Run)
1. User visits fresh installation
2. Frontend checks `/api/setup/status` → `setupRequired: true`
3. Setup wizard form appears
4. Admin enters:
   - Email, password, first name, last name
   - Twilio Account SID (optional)
   - Twilio Auth Token (optional)
   - Twilio Phone Number (optional)
   - Anthropic API Key (optional)
   - Google OAuth credentials (optional)
   - Microsoft OAuth credentials (optional)
5. Submit to `/api/setup/initialize`
6. Backend creates admin user and stores all credentials in `admin_settings`
7. System marked as setup complete
8. Redirect to login

### Post-Setup Configuration
Admins can update credentials via:
- `GET /api/admin/settings` - List all settings (secrets masked)
- `GET /api/admin/settings/:key` - Get specific value (unmasked)
- `PUT /api/admin/settings/:key` - Update value
- `DELETE /api/admin/settings/:key` - Remove credential

## Database Schema (Already Exists)

### admin_settings Table
```sql
CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  isSecret INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### system_setup Table
```sql
CREATE TABLE system_setup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isCompleted INTEGER DEFAULT 0,
  adminEmail TEXT,
  setupCompletedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Testing Strategy

### Before Phase 5 Implementation
1. Test fresh install setup wizard
2. Test admin settings CRUD
3. Test registration blocking
4. Test migration path (existing users)

### During Phase 5 Implementation
1. Configure Twilio via setup wizard
2. Test SMS with database credentials
3. Verify Twilio service reads from admin_settings
4. Test SMS routes with configured credentials

### After Phase 5 Implementation
1. Test reconfiguring Twilio credentials via admin panel
2. Test SMS with updated credentials
3. Verify settings persistence across restarts

## Migration Notes

### Existing Development Installations
- Seed script creates admin@example.com and marks setup complete
- No disruption to development workflow
- Developers can still use `yarn db:seed`

### Existing Production Installations (If Any)
- Middleware auto-completes setup if users exist
- Sets `adminEmail = 'migration'`
- No user disruption
- Admin can manually configure credentials via `/api/admin/settings`

### Fresh Production Installations
- Setup wizard required on first boot
- All credentials configured via UI
- No need to edit .env files or redeploy

## Success Criteria

- [ ] Fresh install shows setup wizard
- [ ] Setup wizard creates admin user
- [ ] Setup wizard stores Twilio credentials in database
- [ ] Twilio service reads credentials from database
- [ ] SMS functionality works with database credentials
- [ ] Admin can update credentials via settings panel
- [ ] Registration blocked until setup complete
- [ ] Development seed script still works
- [ ] Production deployments don't use seed script

## Updated Phase 5 Checklist

### Setup System (NEW)
- [ ] Created setup helper functions in db-helpers.ts
- [ ] Created setup middleware (requireSetupComplete, requireSetupIncomplete)
- [ ] Created setup API routes (GET /status, POST /initialize)
- [ ] Created admin settings routes (CRUD endpoints)
- [ ] Updated auth routes to block registration until setup
- [ ] Updated seed script to check NODE_ENV
- [ ] Updated server to initialize setup on boot
- [ ] Tested fresh install setup flow
- [ ] Tested admin settings management

### SMS System (Original Phase 5)
- [ ] Installed Twilio SDK
- [ ] Verified Twilio service reads from admin_settings
- [ ] Created SMS routes (test, history, daily summary)
- [ ] Integrated SMS routes into server
- [ ] Created SMS History page
- [ ] Tested sending test SMS
- [ ] Tested sending daily summary
- [ ] Verified SMS delivery and history logging

## Timeline Adjustment

**Original Phase 5 Estimate**: 2-3 days

**Adjusted Phase 5 Estimate**: 4-5 days
- Day 1: Admin setup backend (setup wizard API + middleware)
- Day 2: Admin settings management + testing
- Day 3: SMS notification system (original Phase 5)
- Day 4: Integration testing + frontend setup wizard (optional)
- Day 5: Buffer for polish and documentation

## Next Steps

1. Review and approve this plan adjustment
2. Implement admin setup system (backend priority)
3. Test setup flow thoroughly
4. Proceed with original Phase 5 SMS implementation
5. Update Phase 6 plan to use database credentials for Anthropic

---

**Related Documents**:
- Main implementation plan: `C:\Users\ndb\.claude\plans\dynamic-tumbling-truffle.md`
- Original Phase 5 plan: `planning/REBUILD_PLAN_PHASES_5-7.md`
- Database schema: `backend/src/lib/schema.sql`
