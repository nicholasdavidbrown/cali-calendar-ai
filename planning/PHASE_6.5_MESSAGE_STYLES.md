# Phase 6.5: Configurable Message Styles

## Overview
This phase adds a database-backed message style system that allows administrators to create, edit, and manage AI message personalities through the UI. Users can select from active styles, and the "random" option picks a different style each day.

## Backend Implementation ✅ COMPLETE

### Database Schema
**Table: `message_styles`**
```sql
CREATE TABLE IF NOT EXISTS message_styles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  displayName TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### User Endpoints (Authenticated)
- `GET /api/message-styles` - Get all active message styles
- `GET /api/message-styles/:id` - Get specific style by ID

#### Admin Endpoints (Admin Only)
- `GET /api/message-styles/admin/all` - Get all styles (including inactive)
- `POST /api/message-styles` - Create new message style
- `PUT /api/message-styles/:id` - Update existing style
- `DELETE /api/message-styles/:id` - Delete style

### Database Helpers
**File: `backend/src/lib/db-helpers.ts`**

Added `messageStyleHelpers`:
- `findAll()` - Get all styles
- `findActive()` - Get only active styles
- `findByName(name)` - Find by unique name
- `findById(id)` - Find by ID
- `create(data)` - Create new style
- `update(id, data)` - Update existing style
- `delete(id)` - Delete style

### Auto-Seeding
**File: `backend/src/lib/migrate.ts`**

Default styles seeded on first migration:
1. **Professional** - Clear, concise, business-appropriate
2. **Witty & Fun** - Clever wordplay and tasteful humor
3. **Sarcastic** - Playful sarcasm with dry humor
4. **Mission Briefing** - Military-style tactical format
5. **Steve Irwin** - Enthusiastic wildlife expert personality
6. **Workforce Manager** - Scheduling and shift focus
7. **Random (Daily Surprise)** - System picks random style each day

### Claude Service Updates
**File: `backend/src/services/claudeService.ts`**

- ✅ Removed hardcoded `PERSONALITY_PROMPTS` object
- ✅ Updated `generateCalendarMessage()` to fetch prompts from database
- ✅ Falls back to "professional" if requested style not found

### Random Style Selection
**File: `backend/src/routes/sms.ts`**

When user's `messageStyle` is "random":
1. Fetches all active styles from database
2. Filters out "random" option itself
3. Randomly selects one style
4. Logs actual style used in `sms_history` (not "random")
5. Returns `styleUsed` in API response

## Frontend Implementation 🔜 TODO

### Phase 8+: Admin UI for Message Styles

#### Admin Message Styles Page
**File: `frontend/src/pages/admin/MessageStyles.tsx`**

Features needed:
- [ ] List all message styles (active and inactive)
- [ ] Show style details (name, displayName, description, prompt)
- [ ] Create new message style form
- [ ] Edit existing style (inline or modal)
- [ ] Toggle active/inactive status
- [ ] Reorder styles (sortOrder)
- [ ] Delete style with confirmation
- [ ] Preview style with sample data
- [ ] Test style by sending test SMS

#### Admin Settings Integration
**File: `frontend/src/pages/admin/Settings.tsx`**

Add tab or section:
- [ ] Link to Message Styles management
- [ ] Quick stats (total styles, active styles)
- [ ] Recent style usage from SMS history

### Phase 8+: User Settings UI

#### User Settings Page
**File: `frontend/src/pages/UserSettings.tsx`**

Updates needed:
- [ ] Replace hardcoded messageStyle dropdown
- [ ] Fetch active styles from `/api/message-styles`
- [ ] Display style descriptions in dropdown/cards
- [ ] Show preview of selected style
- [ ] Highlight if "random" is selected
- [ ] Show "Last used style" if user has SMS history

#### Message Style Selector Component
**File: `frontend/src/components/MessageStyleSelector.tsx`**

Features:
- [ ] Load styles from API
- [ ] Display as dropdown or card grid
- [ ] Show displayName and description
- [ ] Visual indicator for "random" option
- [ ] Preview example message for each style
- [ ] Save selection to user settings

## API Usage Examples

### Get Active Styles (User)
```typescript
GET /api/message-styles
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "name": "professional",
    "displayName": "Professional",
    "description": "Clear, concise, business-appropriate communication",
    "prompt": "You are a professional executive assistant...",
    "isActive": 1,
    "sortOrder": 1,
    "createdAt": "2025-11-27T10:00:00.000Z",
    "updatedAt": "2025-11-27T10:00:00.000Z"
  },
  // ... more styles
]
```

### Create New Style (Admin)
```typescript
POST /api/message-styles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "motivational",
  "displayName": "Motivational Coach",
  "prompt": "You are an enthusiastic motivational coach...",
  "description": "Inspiring and energizing messages",
  "sortOrder": 8
}

Response: (created style object)
```

### Update Style (Admin)
```typescript
PUT /api/message-styles/1
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "displayName": "Professional Executive",
  "description": "Updated description",
  "isActive": true
}

Response: (updated style object)
```

### Delete Style (Admin)
```typescript
DELETE /api/message-styles/5
Authorization: Bearer <admin-token>

Response:
{
  "message": "Message style deleted successfully"
}
```

## Testing

### Backend Testing
```bash
# Test creating a new style
curl -X POST http://localhost:8080/api/message-styles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pirate",
    "displayName": "Pirate",
    "prompt": "You are a friendly pirate. Use pirate language...",
    "description": "Arrr matey! Pirate-themed messages"
  }'

# Test getting active styles
curl http://localhost:8080/api/message-styles \
  -H "Authorization: Bearer <token>"

# Test random selection
curl -X POST http://localhost:8080/api/sms/send-daily-summary \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Frontend Testing Checklist
- [ ] Admin can view all message styles
- [ ] Admin can create new style with validation
- [ ] Admin can edit style name, prompt, description
- [ ] Admin can toggle style active/inactive
- [ ] Admin can reorder styles
- [ ] Admin can delete unused styles
- [ ] User can see only active styles in dropdown
- [ ] User can select style and save preference
- [ ] Style descriptions display correctly
- [ ] Random option explained clearly to user
- [ ] SMS history shows actual style used (not "random")

## Database Migration Notes

The `message_styles` table is automatically created when `schema.sql` is executed, and default styles are seeded during the migration process. No manual migration required for existing installations - simply restart the server after pulling the latest code.

## Benefits

### For Administrators
- ✅ Add new message styles without code changes
- ✅ Edit prompts to fine-tune AI behavior
- ✅ Disable styles that aren't working well
- ✅ Reorder styles for better UX
- ✅ Test styles before activating

### For Users
- ✅ More style options available
- ✅ Clear descriptions help choose right style
- ✅ Random option provides daily variety
- ✅ Can see which style was used in history

### For Development
- ✅ No code changes needed for new styles
- ✅ Easy to A/B test different prompts
- ✅ Database-backed = auditable history
- ✅ Can be extended with user-created styles (future)

## Future Enhancements

Potential additions for later phases:

1. **User-Created Styles** - Allow users to create their own personalities
2. **Style Analytics** - Track which styles are most popular
3. **Style Rating** - Users rate messages to improve prompts
4. **Scheduled Styles** - Different style on weekends vs weekdays
5. **Context-Aware Selection** - Different style based on event types
6. **Style Templates** - Pre-made prompts users can customize
7. **Style Sharing** - Export/import styles between installations
8. **A/B Testing** - Automatically test style variations
9. **Multi-Language Support** - Styles in different languages
10. **Voice/Tone Controls** - Fine-tune formality, humor level, etc.

## Files Modified

### Backend
- ✅ `backend/src/lib/schema.sql` - Added message_styles table
- ✅ `backend/src/lib/migrate.ts` - Added seeding function
- ✅ `backend/src/lib/db-helpers.ts` - Added messageStyleHelpers
- ✅ `backend/src/types/shared.ts` - Added MessageStyle types
- ✅ `backend/src/services/claudeService.ts` - Updated to use database
- ✅ `backend/src/routes/sms.ts` - Added random selection logic
- ✅ `backend/src/routes/message-styles.ts` - New route file (CRUD)
- ✅ `backend/src/index.ts` - Registered message-styles router

### Frontend (TODO)
- [ ] `frontend/src/pages/admin/MessageStyles.tsx` - Admin management UI
- [ ] `frontend/src/pages/UserSettings.tsx` - User style selector
- [ ] `frontend/src/components/MessageStyleSelector.tsx` - Reusable component
- [ ] `frontend/src/api/messageStyles.ts` - API client functions

### Planning
- ✅ `planning/REBUILD_STATUS.md` - Updated with Phase 6.5
- ✅ `planning/PHASE_6.5_MESSAGE_STYLES.md` - This document

---

**Status:** Backend Complete ✅ | Frontend Pending 🔜
**Last Updated:** 2025-11-27
