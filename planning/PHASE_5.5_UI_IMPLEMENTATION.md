# Phase 5.5 - Frontend UI Implementation Plan

## Overview

Build functional frontend UI for Cali Calendar AI with authentication, calendar management, and user settings. The design will feature **warm orange/yellow colors** with a **fun, welcoming yet professional** aesthetic.

**Scope:**
- Admin signup with required phone number
- Login/logout functionality
- Calendar view as main page (today/this week events)
- Settings page for phone number updates
- Complete rebrand with orange/yellow color scheme

---

## 1. Design System

### Color Palette (Complete Rebrand)

**Primary Colors:**
- Primary Orange: `#FF6B35` (buttons, links, accents)
- Secondary Yellow: `#FFB61D` (highlights, hover states)
- Orange-Yellow Gradient: `linear-gradient(135deg, #FF6B35 0%, #FFB61D 100%)`

**Neutral Colors:**
- Dark Background: `#1A1A1D` (main background)
- Card Background: `#2D2D30` (elevated surfaces)
- Light Text: `#F7F7F7` (primary text)
- Muted Text: `#B8B8B8` (secondary text)
- Border: `rgba(255, 107, 53, 0.2)` (subtle borders with orange tint)

**Status Colors:**
- Success: `#4CAF50`
- Error: `#FF5252`
- Warning: `#FFA726`

**Design Principles:**
- Fun and approachable with rounded corners (8px-12px)
- Warm gradient accents on interactive elements
- Professional typography and spacing
- High contrast for accessibility
- Subtle shadows for depth

---

## 2. Dependencies to Install

```bash
cd frontend
npm install react-router-dom date-fns
npm install @types/react-router-dom --save-dev
```

**Rationale:**
- `react-router-dom`: Client-side routing for multi-page navigation
- `date-fns`: Lightweight date formatting and manipulation
- Native `fetch`: Already available, no axios needed

---

## 3. File Structure

```
frontend/src/
├── components/
│   ├── Layout.tsx           # Main layout wrapper with navbar
│   ├── Navbar.tsx           # Top navigation bar
│   ├── ProtectedRoute.tsx   # Auth-guarded route wrapper
│   ├── EventCard.tsx        # Event display card
│   └── EventForm.tsx        # Event create/edit modal form
├── pages/
│   ├── Login.tsx            # Login page
│   ├── Register.tsx         # Admin signup (phone required)
│   ├── Calendar.tsx         # Main calendar view
│   └── Settings.tsx         # User settings page
├── context/
│   └── AuthContext.tsx      # Global auth state
├── hooks/
│   └── useAuth.tsx          # Auth context hook
├── services/
│   └── api.ts               # API service layer
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   └── api.ts               # Already exists (getApiBaseUrl)
├── App.tsx                  # Main app with routing
├── main.tsx                 # Entry point
├── App.css                  # Component styles (update colors)
└── index.css                # Global styles (update colors)
```

---

## 4. Backend Prerequisite

**MUST CREATE FIRST:** User settings update endpoint

**File:** `backend/src/routes/users.ts`

See the detailed implementation in Step 1 of the implementation steps below.

**Update:** `backend/src/index.ts`
```typescript
import usersRouter from './routes/users.js'
// ...
app.use('/api/users', usersRouter)
```

---

## 5. Implementation Steps Summary

### Step 1: Backend Users Route ✅
Create user settings update endpoint

### Step 2: Install Dependencies
```bash
npm install react-router-dom date-fns
npm install @types/react-router-dom --save-dev
```

### Step 3-11: Frontend Implementation
- TypeScript types
- API service layer
- Auth Context & hooks
- Protected Route component
- Layout components (Navbar, Layout)
- Authentication pages (Login, Register with phone number)
- Calendar page (EventCard, EventForm, Calendar)
- Settings page
- App routing

### Step 12: CSS Styling
- Update index.css with orange/yellow color scheme
- Update App.css with component styles
- Mobile responsive design

---

## 6. Key Features

### Authentication
- Admin signup with **required phone number** (E.164 format)
- Email/password login
- JWT-based auth with HTTP-only cookies
- Protected routes
- Persistent auth state on refresh

### Calendar
- View modes: Today, This Week, All Events
- Create manual events
- Edit/delete manual events
- Cannot edit synced events (Google, Microsoft, TimeTree)
- Form validation (required fields, time validation)

### Settings
- Update phone number (required field)
- Update timezone (dropdown)
- Update SMS time (time picker)
- Update message style (radio buttons: professional, witty, sarcastic, mission, irwin, tanda)

---

## 7. Testing Checklist

### Authentication
- [ ] Register new admin user with phone number
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Logout clears session
- [ ] Protected routes redirect to login when not authenticated
- [ ] Auth state persists on page refresh

### Calendar
- [ ] View today's events
- [ ] View this week's events
- [ ] View all events
- [ ] Create new event with all fields
- [ ] Edit manual event
- [ ] Delete manual event
- [ ] Cannot edit synced events
- [ ] Form validation (required fields, end time > start time)

### Settings
- [ ] View current user settings
- [ ] Update phone number
- [ ] Update timezone
- [ ] Update SMS time
- [ ] Update message style
- [ ] Phone number validation (E.164 format)
- [ ] Settings save successfully

### UI/UX
- [ ] Orange/yellow theme applied consistently
- [ ] Responsive on mobile (768px breakpoint)
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Navigation works smoothly
- [ ] Forms have proper validation feedback

---

## 8. Critical Files

The 5 most critical files for implementation:

1. **backend/src/routes/users.ts** - User settings backend route (MUST CREATE FIRST)
2. **frontend/src/context/AuthContext.tsx** - Authentication state management
3. **frontend/src/services/api.ts** - API service layer
4. **frontend/src/pages/Calendar.tsx** - Main calendar interface
5. **frontend/src/App.tsx** - Application routing

---

## 9. Design Reference

### Color Usage
- **Buttons (Primary)**: Orange-yellow gradient with shadow
- **Links**: Orange with yellow hover
- **Navbar Brand**: Gradient text
- **Active Filters**: Gradient background
- **Borders**: Orange-tinted rgba
- **Cards**: Dark card background with orange hover border

### Typography
- **Headings**: Font weight 600, gradient for titles
- **Body**: Light text (#F7F7F7) on dark background
- **Muted**: Secondary text (#B8B8B8)

### Interactions
- **Hover**: Slight lift effect for buttons
- **Focus**: Orange border with glow
- **Transitions**: 0.2s for smooth interactions

---

## Summary

This plan implements Phase 5.5 with:

✅ **Complete orange/yellow rebrand** - Fun, welcoming, professional
✅ **Admin signup** - Phone number required on registration
✅ **Calendar view** - Main page with today/week filters
✅ **Settings** - Phone number and preferences management
✅ **Full authentication** - Login, logout, protected routes
✅ **Plain CSS** - No frameworks, warm gradient accents
✅ **Type-safe** - Full TypeScript coverage
✅ **Mobile responsive** - Works on all screen sizes

The implementation is sequential and builds incrementally, starting with backend prerequisites, then core infrastructure (auth, routing), and finally page-specific features.

---

**Note:** For complete code examples of each component, see the full plan in the `.claude/plans` directory or refer to the agent's detailed planning output.
