# Phase 5 Replacement: Pushover Notification System

> **Replaces:** Phase 5 (Twilio SMS) in REBUILD_PLAN_PHASES_5-7.md
> **Status:** Planned

## Overview

Replace the Twilio SMS notification system with Pushover push notifications using the Groups API. Each user provides their own Pushover API token and user key. The app creates a delivery group for each user, and family members are added to that group via their Pushover user keys.

---

## Pushover Architecture

```
User Signup:
  -> User provides: API Token + User Key
  -> App creates a Pushover Group via API
  -> App adds user to their own group
  -> App stores group key in users table

Adding Family Member:
  -> Family member provides their Pushover User Key
  -> App adds them to the user's group via API
  -> Stored in family_members table

Sending Notification:
  -> Send to group key (not individual user keys)
  -> All group members (user + family) receive notification
```

---

## Files to Modify

| Action | File |
|--------|------|
| DELETE | `backend/src/services/twilioService.ts` |
| CREATE | `backend/src/services/pushoverService.ts` |
| RENAME | `backend/src/routes/sms.ts` -> `backend/src/routes/notifications.ts` |
| MODIFY | `backend/src/index.ts` |
| MODIFY | `backend/src/lib/schema.sql` |
| MODIFY | `backend/src/lib/db-helpers.ts` |
| MODIFY | `backend/src/routes/setup.ts` |
| MODIFY | `backend/src/routes/users.ts` |
| MODIFY | `backend/src/routes/auth.ts` (user registration) |
| MODIFY | `backend/src/types/shared.ts` |
| MODIFY | `backend/src/types/constants.ts` |
| MODIFY | `backend/src/types/index.ts` |
| MODIFY | `backend/src/tests/setup.ts` |
| MODIFY | `backend/package.json` (remove twilio dependency) |

---

## Implementation Steps

### Step 1: Create Pushover Service

Create `backend/src/services/pushoverService.ts`:

**Group Management Functions:**
- `createGroup(apiToken, name)` - Create a new delivery group, returns group key
- `addUserToGroup(apiToken, groupKey, userKey)` - Add a user to a group
- `removeUserFromGroup(apiToken, groupKey, userKey)` - Remove user from group

**Notification Functions:**
- `sendNotification({ apiToken, groupKey, message, title?, priority? })` - Send to group
- `sendTestNotification(apiToken, userKey, message)` - Send test to individual user

**Validation:**
- `validatePushoverUserKey(key)` - Validate 30-char alphanumeric format
- `validateApiToken(token)` - Validate API token format

Uses native `fetch()` - no SDK needed.

### Step 2: Update Database Schema

Update `backend/src/lib/schema.sql`:

**Rename sms_history -> notification_history:**
```sql
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  groupKey TEXT NOT NULL,           -- Pushover group that received notification
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  messageStyle TEXT NOT NULL,
  externalId TEXT UNIQUE,           -- was twilioSid, now Pushover request ID
  errorCode TEXT,
  errorMessage TEXT,
  userId INTEGER NOT NULL,
  eventCount INTEGER DEFAULT 0,
  sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deliveredAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Update family_members:**
```sql
-- Change phoneNumber to pushoverUserKey
pushoverUserKey TEXT NOT NULL,  -- was phoneNumber, family member's Pushover user key
```

**Update users table:**
```sql
-- Remove phoneNumber, add Pushover fields
notificationTime TEXT DEFAULT '07:00',  -- was smsTime
pushoverApiToken TEXT,                  -- user's Pushover API token
pushoverUserKey TEXT,                   -- user's Pushover user key
pushoverGroupKey TEXT,                  -- group key created by app for this user
```

### Step 3: Update Database Helpers

Update `backend/src/lib/db-helpers.ts`:
- Rename `smsHelpers` -> `notificationHelpers`
- Update column names: `phoneNumber` -> `groupKey`, `twilioSid` -> `externalId`
- Update `familyHelpers.create()` to use `pushoverUserKey` instead of `phoneNumber`
- Update `userHelpers` to handle new Pushover fields (apiToken, userKey, groupKey)

### Step 4: Create Notifications Route

Rename `backend/src/routes/sms.ts` -> `backend/src/routes/notifications.ts`:
- Update route paths: `/api/sms/*` -> `/api/notifications/*`
- Import from `pushoverService` instead of `twilioService`
- Send notifications to user's `pushoverGroupKey` (reaches user + family)
- Use `notificationHelpers` instead of `smsHelpers`
- Store Pushover `requestId` as `externalId`

**Endpoints:**
- `POST /api/notifications/test` - Send test notification to user's group
- `GET /api/notifications/history` - Get notification history
- `POST /api/notifications/send-daily-summary` - Send AI-powered daily summary to group

### Step 5: Update Server Entry Point

Update `backend/src/index.ts`:
- Import `notificationsRouter` from `./routes/notifications.js`
- Mount at `/api/notifications`

### Step 6: Update Setup Wizard & Auth

Update `backend/src/routes/setup.ts`:
- Remove Twilio fields (`twilioAccountSid`, `twilioAuthToken`, `twilioPhoneNumber`)
- Admin setup no longer needs Pushover config (each user provides their own)

Update `backend/src/routes/auth.ts` (user registration):
- Add required fields: `pushoverApiToken`, `pushoverUserKey`
- On registration:
  1. Validate the API token and user key
  2. Call `createGroup()` to create a Pushover group for the user
  3. Call `addUserToGroup()` to add user to their own group
  4. Store `pushoverGroupKey` in the user record

### Step 7: Update User Routes

Update `backend/src/routes/users.ts`:
- Remove import of `validatePhoneNumber` from twilioService
- Add import of `validatePushoverUserKey` from pushoverService
- Remove phone number references, user settings for notifications come from Pushover fields

### Step 7b: Create/Update Family Routes

Create or update family member management routes:
- `POST /api/family` - Add family member:
  1. Validate `pushoverUserKey`
  2. Call `addUserToGroup(user.pushoverApiToken, user.pushoverGroupKey, pushoverUserKey)`
  3. Store in `family_members` table
- `DELETE /api/family/:id` - Remove family member:
  1. Call `removeUserFromGroup()` from Pushover API
  2. Delete from `family_members` table

### Step 8: Update Type Definitions

**`backend/src/types/shared.ts`:**
- Rename `SmsHistory` -> `NotificationHistory`
- Rename `SmsStatus` -> `NotificationStatus`
- Update field names: `phoneNumber` -> `groupKey`, `twilioSid` -> `externalId`
- Update `FamilyMember`: `phoneNumber` -> `pushoverUserKey`
- Update `User`:
  - `smsTime` -> `notificationTime`
  - Remove `phoneNumber` (or keep for profile, optional)
  - Add `pushoverApiToken`, `pushoverUserKey`, `pushoverGroupKey`

**`backend/src/types/constants.ts`:**
- Rename `SMS_STATUSES` -> `NOTIFICATION_STATUSES`
- Update `ADMIN_SETTING_KEYS`: remove Twilio keys (no global Pushover keys needed)
- Rename `ERROR_MESSAGES.SMS` -> `ERROR_MESSAGES.NOTIFICATION`
- Rename `SUCCESS_MESSAGES.SMS` -> `SUCCESS_MESSAGES.NOTIFICATION`

**`backend/src/types/index.ts`:**
- Rename `isSmsStatus` -> `isNotificationStatus`

### Step 9: Update Tests

Update `backend/src/tests/setup.ts`:
- Change `sms_history` -> `notification_history` in table cleanup

### Step 10: Remove Twilio Dependency

- Delete `backend/src/services/twilioService.ts`
- Run `npm uninstall twilio` in backend directory

### Step 11: Reset Database

Since this is development, delete the SQLite database and let it recreate on startup.

---

## Pushover API Reference

### Send Message (to group)
**Endpoint:** `POST https://api.pushover.net/1/messages.json`

**Params:**
- `token` - API token
- `user` - Group key (sends to all group members)
- `message` - Message body
- `title` (optional) - Message title

**Response:** `{"status": 1, "request": "uuid-here"}`

### Create Group
**Endpoint:** `POST https://api.pushover.net/1/groups.json`

**Params:**
- `token` - API token
- `name` - Group name

**Response:** `{"status": 1, "group": "group-key-here"}`

### Add User to Group
**Endpoint:** `POST https://api.pushover.net/1/groups/{group_key}/add_user.json`

**Params:**
- `token` - API token
- `user` - User key to add

### Remove User from Group
**Endpoint:** `POST https://api.pushover.net/1/groups/{group_key}/delete_user.json`

**Params:**
- `token` - API token
- `user` - User key to remove

---

## Data Flow Summary

```
USER REGISTRATION:
  Input: email, password, pushoverApiToken, pushoverUserKey
  Process:
    1. Create user record
    2. POST /groups.json -> get groupKey
    3. POST /groups/{groupKey}/add_user.json (add self)
    4. Store groupKey in user record

ADD FAMILY MEMBER:
  Input: name, pushoverUserKey
  Process:
    1. Validate pushoverUserKey format
    2. POST /groups/{user.groupKey}/add_user.json
    3. Store in family_members table

SEND NOTIFICATION:
  Input: message (generated by Claude)
  Process:
    1. POST /messages.json with user's groupKey
    2. All group members receive notification
    3. Store in notification_history
```

---

## Checklist

- [ ] Created Pushover service with group management
- [ ] Updated database schema (notification_history, users, family_members)
- [ ] Updated database helpers
- [ ] Renamed SMS routes to notifications routes
- [ ] Updated server entry point
- [ ] Updated setup wizard (removed Twilio fields)
- [ ] Updated auth routes for Pushover user registration
- [ ] Updated user routes
- [ ] Created/updated family routes with Pushover group integration
- [ ] Updated type definitions
- [ ] Updated tests
- [ ] Removed Twilio dependency
- [ ] Reset database
- [ ] Tested user registration with Pushover group creation
- [ ] Tested adding family members to group
- [ ] Tested sending notifications to group
- [ ] Verified all group members receive notifications
