# Cali Calendar AI - Rebuild Plan: Phases 12-15

> **📚 Complete Rebuild Documentation**
> - **Part 1:** REBUILD_PLAN_PHASES_1-4.md - Project setup, database, auth, events
> - **Part 2:** REBUILD_PLAN_PHASES_5-7.md - SMS, AI messaging, family sharing
> - **Part 3:** REBUILD_PLAN_PHASES_8-11.md - Admin dashboard, settings, scheduler, navigation
> - **Part 4:** REBUILD_PLAN_PHASES_12-15.md (this file) - Calendar integrations, polish

## Overview
This document covers the final phases (12-15), focusing on external calendar integrations and advanced features.

---

# Phase 12: TimeTree Calendar Integration (Puppeteer)

## Goal
Integrate TimeTree calendar using Puppeteer for web scraping to import events.

## Step 12.1: Install Puppeteer

```bash
cd apps/server
npm install puppeteer
npm install @types/puppeteer -D
```

## Step 12.2: Create TimeTree Service

**File: `apps/server/src/services/timetreeService.ts`**
```typescript
import puppeteer from 'puppeteer'
import prisma from '../lib/prisma'
import { eventHelpers } from '../lib/db-helpers'

export interface TimeTreeCredentials {
  email: string
  password: string
}

export const syncTimeTreeCalendar = async (
  userId: string,
  credentials: TimeTreeCredentials
) => {
  let browser
  try {
    console.log('🌳 Starting TimeTree sync...')

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Navigate to TimeTree login
    await page.goto('https://timetreeapp.com/signin', {
      waitUntil: 'networkidle2',
    })

    // Login
    await page.type('input[type="email"]', credentials.email)
    await page.type('input[type="password"]', credentials.password)
    await page.click('button[type="submit"]')

    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    // Check if login was successful
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('.error-message')
    })

    if (!isLoggedIn) {
      throw new Error('TimeTree login failed')
    }

    // Navigate to calendar view
    await page.goto('https://timetreeapp.com/calendars', {
      waitUntil: 'networkidle2',
    })

    // Extract events from the calendar
    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('.event-item')
      const extractedEvents: any[] = []

      eventElements.forEach((element) => {
        const title = element.querySelector('.event-title')?.textContent || ''
        const timeElement = element.querySelector('.event-time')
        const locationElement = element.querySelector('.event-location')

        const timeText = timeElement?.textContent || ''
        const location = locationElement?.textContent || ''

        // Parse time (this will vary based on TimeTree's HTML structure)
        const match = timeText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)

        if (match) {
          extractedEvents.push({
            title,
            startTime: match[1],
            endTime: match[2],
            location,
          })
        }
      })

      return extractedEvents
    })

    // Delete existing TimeTree events for this user
    await eventHelpers.deleteBySource(userId, 'timetree')

    // Import new events
    const imported = []
    for (const event of events) {
      try {
        // Convert times to proper Date objects (you may need to adjust this)
        const today = new Date()
        const [startHour, startMinute] = event.startTime.split(':').map(Number)
        const [endHour, endMinute] = event.endTime.split(':').map(Number)

        const startTime = new Date(today)
        startTime.setHours(startHour, startMinute, 0, 0)

        const endTime = new Date(today)
        endTime.setHours(endHour, endMinute, 0, 0)

        const created = await eventHelpers.create({
          title: event.title,
          startTime,
          endTime,
          location: event.location,
          isAllDay: false,
          source: 'timetree',
          userId,
        })

        imported.push(created)
      } catch (error) {
        console.error('Failed to import event:', event.title, error)
      }
    }

    console.log(`✅ TimeTree sync complete: ${imported.length} events imported`)

    return {
      success: true,
      eventsImported: imported.length,
    }
  } catch (error) {
    console.error('TimeTree sync error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export const testTimeTreeConnection = async (credentials: TimeTreeCredentials) => {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.goto('https://timetreeapp.com/signin', {
      waitUntil: 'networkidle2',
    })

    await page.type('input[type="email"]', credentials.email)
    await page.type('input[type="password"]', credentials.password)
    await page.click('button[type="submit"]')

    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('.error-message')
    })

    return isLoggedIn
  } catch (error) {
    return false
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
```

## Step 12.3: Create Calendar Integration Routes

**File: `apps/server/src/routes/integrations.ts`**
```typescript
import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validateRequest } from '../lib/validation'
import { syncTimeTreeCalendar, testTimeTreeConnection } from '../services/timetreeService'
import prisma from '../lib/prisma'

const router = Router()
router.use(authenticate)

// Get user's calendar integrations
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.id

    const integrations = await prisma.calendarIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        isActive: true,
        lastSyncAt: true,
        syncError: true,
        createdAt: true,
      },
    })

    res.json(integrations)
  } catch (error) {
    console.error('Get integrations error:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

// Connect TimeTree
router.post('/timetree/connect', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], validateRequest, async (req, res) => {
  try {
    const userId = req.user!.id
    const { email, password } = req.body

    // Test connection first
    const isValid = await testTimeTreeConnection({ email, password })

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid TimeTree credentials' })
    }

    // Save integration
    await prisma.calendarIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'timetree',
        },
      },
      update: {
        timetreeEmail: email,
        timetreePassword: password, // Should be encrypted in production
        isActive: true,
        syncError: null,
      },
      create: {
        userId,
        provider: 'timetree',
        timetreeEmail: email,
        timetreePassword: password, // Should be encrypted in production
        isActive: true,
      },
    })

    res.json({ success: true, message: 'TimeTree connected' })
  } catch (error) {
    console.error('Connect TimeTree error:', error)
    res.status(500).json({ error: 'Failed to connect TimeTree' })
  }
})

// Sync TimeTree calendar
router.post('/timetree/sync', async (req, res) => {
  try {
    const userId = req.user!.id

    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'timetree',
        },
      },
    })

    if (!integration || !integration.timetreeEmail || !integration.timetreePassword) {
      return res.status(400).json({ error: 'TimeTree not connected' })
    }

    const result = await syncTimeTreeCalendar(userId, {
      email: integration.timetreeEmail,
      password: integration.timetreePassword,
    })

    // Update integration status
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncError: result.success ? null : result.error,
      },
    })

    res.json(result)
  } catch (error) {
    console.error('Sync TimeTree error:', error)
    res.status(500).json({ error: 'Failed to sync TimeTree' })
  }
})

// Disconnect integration
router.delete('/:provider', async (req, res) => {
  try {
    const userId = req.user!.id
    const { provider } = req.params

    await prisma.calendarIntegration.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })

    // Also delete events from that source
    await prisma.calendarEvent.deleteMany({
      where: {
        userId,
        source: provider,
      },
    })

    res.json({ message: `${provider} disconnected` })
  } catch (error) {
    console.error('Disconnect integration error:', error)
    res.status(500).json({ error: 'Failed to disconnect integration' })
  }
})

export default router
```

## Step 12.4: Update Server with Integration Routes

Add to `apps/server/src/index.ts`:
```typescript
import integrationsRouter from './routes/integrations'
app.use('/api/integrations', integrationsRouter)
```

## Step 12.5: Create Integrations Page (Client)

**File: `apps/client/src/pages/Integrations.tsx`**
```typescript
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { format } from 'date-fns'

export const Integrations: React.FC = () => {
  const queryClient = useQueryClient()
  const [showTimeTreeForm, setShowTimeTreeForm] = useState(false)
  const [timetreeCredentials, setTimetreeCredentials] = useState({
    email: '',
    password: '',
  })

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await axios.get('/api/integrations', { withCredentials: true })
      return response.data
    },
  })

  const connectTimeTree = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axios.post('/api/integrations/timetree/connect', credentials, {
        withCredentials: true,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setShowTimeTreeForm(false)
      setTimetreeCredentials({ email: '', password: '' })
    },
  })

  const syncTimeTree = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/integrations/timetree/sync', {}, {
        withCredentials: true,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const disconnect = useMutation({
    mutationFn: async (provider: string) => {
      await axios.delete(`/api/integrations/${provider}`, { withCredentials: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const handleConnect TimeTree = (e: React.FormEvent) => {
    e.preventDefault()
    connectTimeTree.mutate(timetreeCredentials)
  }

  const timetreeIntegration = integrations?.find((i: any) => i.provider === 'timetree')

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Calendar Integrations</h1>

      {/* TimeTree Integration */}
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">🌳 TimeTree</h2>
            <p className="text-gray-600 mb-4">
              Import events from your TimeTree calendar using web scraping
            </p>

            {timetreeIntegration ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      timetreeIntegration.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {timetreeIntegration.isActive ? 'Connected' : 'Inactive'}
                  </span>
                </div>

                {timetreeIntegration.lastSyncAt && (
                  <p className="text-sm text-gray-500">
                    Last synced: {format(new Date(timetreeIntegration.lastSyncAt), 'PPpp')}
                  </p>
                )}

                {timetreeIntegration.syncError && (
                  <p className="text-sm text-red-600">Error: {timetreeIntegration.syncError}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => syncTimeTree.mutate()}
                    disabled={syncTimeTree.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {syncTimeTree.isPending ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => disconnect.mutate('timetree')}
                    disabled={disconnect.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : showTimeTreeForm ? (
              <form onSubmit={handleConnectTimeTree} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={timetreeCredentials.email}
                    onChange={(e) =>
                      setTimetreeCredentials({
                        ...timetreeCredentials,
                        email: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={timetreeCredentials.password}
                    onChange={(e) =>
                      setTimetreeCredentials({
                        ...timetreeCredentials,
                        password: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={connectTimeTree.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {connectTimeTree.isPending ? 'Connecting...' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTimeTreeForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowTimeTreeForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Connect TimeTree
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> TimeTree integration uses web scraping which may be fragile
          if TimeTree updates their website. Google Calendar and Microsoft integrations are
          more reliable.
        </p>
      </div>
    </div>
  )
}
```

## Phase 12 Checklist

- [ ] Installed Puppeteer
- [ ] Created TimeTree service with web scraping
- [ ] Created integration routes
- [ ] Integrated routes into server
- [ ] Created Integrations page
- [ ] Tested TimeTree connection
- [ ] Tested TimeTree sync
- [ ] Added encryption for stored credentials (production)

## Next Steps

Proceed to **Phase 13: Google Calendar API Integration** for official API-based calendar sync.

---

# Phase 13: Google Calendar API Integration

## Goal
Integrate Google Calendar using the official Google Calendar API with OAuth 2.0.

## Step 13.1: Install Google APIs

```bash
cd apps/server
npm install googleapis
```

## Step 13.2: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/integrations/google/callback`
5. Save Client ID and Client Secret

## Step 13.3: Create Google Calendar Service

**File: `apps/server/src/services/googleCalendarService.ts`**
```typescript
import { google } from 'googleapis'
import prisma from '../lib/prisma'
import { eventHelpers } from '../lib/db-helpers'
import { adminHelpers } from '../lib/db-helpers'

const oauth2Client = new google.auth.OAuth2()

const getOAuthClient = async () => {
  const clientId = await adminHelpers.getSetting('google_client_id')
  const clientSecret = await adminHelpers.getSetting('google_client_secret')
  const redirectUri = await adminHelpers.getSetting('google_redirect_uri')

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth not configured')
  }

  oauth2Client.setCredentials({})
  oauth2Client._clientId = clientId
  oauth2Client._clientSecret = clientSecret
  oauth2Client._redirectUri = redirectUri

  return oauth2Client
}

export const getGoogleAuthUrl = async () => {
  const client = await getOAuthClient()

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
  })

  return authUrl
}

export const handleGoogleCallback = async (code: string, userId: string) => {
  const client = await getOAuthClient()

  const { tokens } = await client.getToken(code)

  // Save tokens to database
  await prisma.calendarIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: 'google',
      },
    },
    update: {
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || '',
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
      syncError: null,
    },
    create: {
      userId,
      provider: 'google',
      accessToken: tokens.access_token || '',
      refreshToken: tokens.refresh_token || '',
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
    },
  })

  return { success: true }
}

export const syncGoogleCalendar = async (userId: string) => {
  try {
    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    })

    if (!integration || !integration.accessToken) {
      throw new Error('Google Calendar not connected')
    }

    const client = await getOAuthClient()
    client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken || undefined,
    })

    const calendar = google.calendar({ version: 'v3', auth: client })

    // Get events from now to 7 days ahead
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekAhead.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []

    // Delete existing Google events
    await eventHelpers.deleteBySource(userId, 'google')

    // Import new events
    const imported = []
    for (const event of events) {
      try {
        const startTime = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : event.start?.date
          ? new Date(event.start.date)
          : new Date()

        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
          ? new Date(event.end.date)
          : new Date()

        const created = await eventHelpers.create({
          title: event.summary || 'Untitled Event',
          description: event.description,
          startTime,
          endTime,
          location: event.location,
          isAllDay: !event.start?.dateTime,
          source: 'google',
          userId,
        })

        imported.push(created)
      } catch (error) {
        console.error('Failed to import event:', event.summary, error)
      }
    }

    // Update last sync time
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncError: null,
      },
    })

    console.log(`✅ Google Calendar sync complete: ${imported.length} events imported`)

    return {
      success: true,
      eventsImported: imported.length,
    }
  } catch (error) {
    console.error('Google Calendar sync error:', error)

    // Log error
    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: { userId, provider: 'google' },
      },
    })

    if (integration) {
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          syncError: error instanceof Error ? error.message : 'Sync failed',
        },
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

## Step 13.4: Add Google Routes to Integrations

Add to `apps/server/src/routes/integrations.ts`:

```typescript
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  syncGoogleCalendar,
} from '../services/googleCalendarService'

// Initiate Google OAuth flow
router.get('/google/connect', async (req, res) => {
  try {
    const authUrl = await getGoogleAuthUrl()
    res.json({ authUrl })
  } catch (error) {
    console.error('Get Google auth URL error:', error)
    res.status(500).json({ error: 'Failed to initiate Google OAuth' })
  }
})

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' })
    }

    const userId = state as string // State contains userId

    await handleGoogleCallback(code as string, userId)

    // Redirect to integrations page
    res.redirect(`${process.env.CLIENT_URL}/integrations?success=google`)
  } catch (error) {
    console.error('Google callback error:', error)
    res.redirect(`${process.env.CLIENT_URL}/integrations?error=google`)
  }
})

// Sync Google Calendar
router.post('/google/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id
    const result = await syncGoogleCalendar(userId)
    res.json(result)
  } catch (error) {
    console.error('Sync Google error:', error)
    res.status(500).json({ error: 'Failed to sync Google Calendar' })
  }
})
```

## Step 13.5: Update Integrations Page for Google

Add to `apps/client/src/pages/Integrations.tsx`:

```typescript
const connectGoogle = useMutation({
  mutationFn: async () => {
    const response = await axios.get('/api/integrations/google/connect', {
      withCredentials: true,
    })
    return response.data
  },
  onSuccess: (data) => {
    // Redirect to Google OAuth
    window.location.href = data.authUrl
  },
})

const syncGoogle = useMutation({
  mutationFn: async () => {
    const response = await axios.post('/api/integrations/google/sync', {}, {
      withCredentials: true,
    })
    return response.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['integrations'] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
})

// Add Google integration card similar to TimeTree
```

## Phase 13 Checklist

- [ ] Installed googleapis
- [ ] Set up Google Cloud project
- [ ] Created Google Calendar service with OAuth
- [ ] Added Google routes
- [ ] Updated Integrations page
- [ ] Tested Google OAuth flow
- [ ] Tested Google Calendar sync
- [ ] Verified token refresh handling

## Next Steps

Proceed to **Phase 14: Microsoft Graph Integration (Optional)** for Microsoft Calendar support.

---

# Phase 14: Microsoft Graph Integration (Optional)

## Goal
Integrate Microsoft Outlook/Office 365 calendar using Microsoft Graph API (similar to existing implementation but improved).

## Note
Since you already have Microsoft OAuth in your existing codebase, this phase is about adapting it to the new structure.

## Step 14.1: Install Microsoft Graph SDK

```bash
cd apps/server
npm install @microsoft/microsoft-graph-client @azure/msal-node
npm install @types/microsoft-graph
```

## Step 14.2: Create Microsoft Graph Service

**File: `apps/server/src/services/microsoftGraphService.ts`**
```typescript
import { Client } from '@microsoft/microsoft-graph-client'
import { ConfidentialClientApplication } from '@azure/msal-node'
import prisma from '../lib/prisma'
import { eventHelpers } from '../lib/db-helpers'
import { adminHelpers } from '../lib/db-helpers'

let msalClient: ConfidentialClientApplication | null = null

const getMsalClient = async () => {
  if (msalClient) return msalClient

  const clientId = await adminHelpers.getSetting('microsoft_client_id')
  const clientSecret = await adminHelpers.getSetting('microsoft_client_secret')
  const tenantId = await adminHelpers.getSetting('microsoft_tenant_id') || 'common'

  if (!clientId || !clientSecret) {
    throw new Error('Microsoft OAuth not configured')
  }

  msalClient = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  })

  return msalClient
}

export const getMicrosoftAuthUrl = async (userId: string) => {
  const client = await getMsalClient()
  const redirectUri = await adminHelpers.getSetting('microsoft_redirect_uri')

  const authUrl = await client.getAuthCodeUrl({
    scopes: ['User.Read', 'Calendars.Read', 'offline_access'],
    redirectUri: redirectUri || 'http://localhost:3001/api/integrations/microsoft/callback',
    state: userId,
  })

  return authUrl
}

export const handleMicrosoftCallback = async (code: string, userId: string) => {
  const client = await getMsalClient()
  const redirectUri = await adminHelpers.getSetting('microsoft_redirect_uri')

  const tokenResponse = await client.acquireTokenByCode({
    code,
    scopes: ['User.Read', 'Calendars.Read', 'offline_access'],
    redirectUri: redirectUri || 'http://localhost:3001/api/integrations/microsoft/callback',
  })

  // Save tokens
  await prisma.calendarIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: 'microsoft',
      },
    },
    update: {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken || '',
      tokenExpiry: tokenResponse.expiresOn || null,
      isActive: true,
      syncError: null,
    },
    create: {
      userId,
      provider: 'microsoft',
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken || '',
      tokenExpiry: tokenResponse.expiresOn || null,
      isActive: true,
    },
  })

  return { success: true }
}

export const syncMicrosoftCalendar = async (userId: string) => {
  try {
    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'microsoft',
        },
      },
    })

    if (!integration || !integration.accessToken) {
      throw new Error('Microsoft Calendar not connected')
    }

    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, integration.accessToken)
      },
    })

    // Get events from now to 7 days ahead
    const now = new Date()
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const response = await graphClient
      .api('/me/calendarview')
      .query({
        startDateTime: now.toISOString(),
        endDateTime: weekAhead.toISOString(),
      })
      .select('subject,start,end,location,bodyPreview,isAllDay')
      .orderby('start/dateTime')
      .get()

    const events = response.value || []

    // Delete existing Microsoft events
    await eventHelpers.deleteBySource(userId, 'microsoft')

    // Import new events
    const imported = []
    for (const event of events) {
      try {
        const created = await eventHelpers.create({
          title: event.subject || 'Untitled Event',
          description: event.bodyPreview,
          startTime: new Date(event.start.dateTime),
          endTime: new Date(event.end.dateTime),
          location: event.location?.displayName,
          isAllDay: event.isAllDay || false,
          source: 'microsoft',
          userId,
        })

        imported.push(created)
      } catch (error) {
        console.error('Failed to import event:', event.subject, error)
      }
    }

    // Update last sync time
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncError: null,
      },
    })

    console.log(`✅ Microsoft Calendar sync complete: ${imported.length} events imported`)

    return {
      success: true,
      eventsImported: imported.length,
    }
  } catch (error) {
    console.error('Microsoft Calendar sync error:', error)

    const integration = await prisma.calendarIntegration.findUnique({
      where: {
        userId_provider: { userId, provider: 'microsoft' },
      },
    })

    if (integration) {
      await prisma.calendarIntegration.update({
        where: { id: integration.id },
        data: {
          syncError: error instanceof Error ? error.message : 'Sync failed',
        },
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

## Step 14.3: Add Microsoft Routes

Add to `apps/server/src/routes/integrations.ts` (similar to Google):

```typescript
import {
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  syncMicrosoftCalendar,
} from '../services/microsoftGraphService'

// Similar structure to Google routes
```

## Phase 14 Checklist

- [ ] Installed Microsoft Graph SDK
- [ ] Created Microsoft Graph service
- [ ] Added Microsoft routes
- [ ] Updated Integrations page
- [ ] Tested Microsoft OAuth flow
- [ ] Tested Microsoft Calendar sync
- [ ] Verified token refresh handling

## Next Steps

Proceed to **Phase 15: Style Randomizer & Final Polish** for the last features.

---

# Phase 15: Style Randomizer & Final Polish

## Goal
Add daily rotation of message personalities and final polish features.

## Step 15.1: Add "Random" Message Style Support

Update `apps/server/src/services/claudeService.ts`:

```typescript
const AVAILABLE_STYLES = ['professional', 'witty', 'sarcastic', 'mission', 'irwin', 'tanda']

export const generateCalendarMessage = async (
  events: CalendarEvent[],
  userName: string,
  personality: string = 'professional'
): Promise<string> => {
  // If random, select a style for today based on date
  let selectedPersonality = personality

  if (personality === 'random') {
    const today = new Date().toISOString().split('T')[0]
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % AVAILABLE_STYLES.length
    selectedPersonality = AVAILABLE_STYLES[index]
    console.log(`🎲 Random style for today: ${selectedPersonality}`)
  }

  // Continue with existing logic using selectedPersonality
  // ...
}
```

## Step 15.2: Create System Health Check Endpoint

**File: `apps/server/src/routes/health.ts`**
```typescript
import { Router } from 'express'
import prisma from '../lib/prisma'
import { testClaudeConnection } from '../services/claudeService'
import { initializeTwilioClient } from '../services/twilioService'

const router = Router()

router.get('/detailed', async (req, res) => {
  const health: any = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    services: {},
  }

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = { status: 'ok' }
  } catch (error) {
    health.services.database = { status: 'error', error: 'Connection failed' }
    health.status = 'degraded'
  }

  // Claude API
  try {
    const claudeOk = await testClaudeConnection()
    health.services.claude = { status: claudeOk ? 'ok' : 'error' }
    if (!claudeOk) health.status = 'degraded'
  } catch (error) {
    health.services.claude = { status: 'error' }
    health.status = 'degraded'
  }

  // Twilio
  try {
    const twilioConfig = await initializeTwilioClient()
    health.services.twilio = { status: twilioConfig ? 'ok' : 'not configured' }
  } catch (error) {
    health.services.twilio = { status: 'error' }
    health.status = 'degraded'
  }

  res.json(health)
})

export default router
```

## Step 15.3: Add Automatic Sync Scheduling

Update `apps/server/src/services/schedulerService.ts` to add calendar sync:

```typescript
import { syncGoogleCalendar } from './googleCalendarService'
import { syncMicrosoftCalendar } from './microsoftGraphService'
import { syncTimeTreeCalendar } from './timetreeService'

// Add to scheduler - run every 6 hours
export const startCalendarSyncScheduler = () => {
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Running calendar sync for all users...')

    const integrations = await prisma.calendarIntegration.findMany({
      where: { isActive: true },
    })

    for (const integration of integrations) {
      try {
        switch (integration.provider) {
          case 'google':
            await syncGoogleCalendar(integration.userId)
            break
          case 'microsoft':
            await syncMicrosoftCalendar(integration.userId)
            break
          case 'timetree':
            if (integration.timetreeEmail && integration.timetreePassword) {
              await syncTimeTreeCalendar(integration.userId, {
                email: integration.timetreeEmail,
                password: integration.timetreePassword,
              })
            }
            break
        }
      } catch (error) {
        console.error(`Failed to sync ${integration.provider} for user ${integration.userId}:`, error)
      }
    }
  })

  console.log('✅ Calendar sync scheduler started (runs every 6 hours)')
}
```

## Step 15.4: Add Rate Limiting

```bash
cd apps/server
npm install express-rate-limit
```

**File: `apps/server/src/middleware/rateLimit.ts`**
```typescript
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
})

export const smsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 SMS per hour
  message: 'Too many SMS requests, please try again later.',
})
```

Add to `apps/server/src/index.ts`:
```typescript
import { apiLimiter } from './middleware/rateLimit'

app.use('/api', apiLimiter)
```

## Step 15.5: Add Request Logging

```bash
cd apps/server
npm install winston winston-daily-rotate-file
```

**File: `apps/server/src/lib/logger.ts`**
```typescript
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  )
}

export default logger
```

## Step 15.6: Add Error Handling Middleware

**File: `apps/server/src/middleware/errorHandler.ts`**
```typescript
import { Request, Response, NextFunction } from 'express'
import logger from '../lib/logger'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}
```

## Step 15.7: Create README and Setup Guide

**File: `SETUP_GUIDE.md`**
```markdown
# Cali Calendar AI - Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp apps/server/.env.example apps/server/.env
   # Edit .env with your configuration
   ```

3. **Initialize Database**
   ```bash
   npx prisma migrate dev
   npm run db:seed --workspace=apps/server
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001
   - Default admin: admin@localhost / admin123

## Configuration

### Required Settings
- JWT_SECRET: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Database: SQLite (default) or PostgreSQL

### Optional API Keys
Configure via Admin Settings UI after first login:
- Anthropic API Key (for AI messages)
- Twilio Account SID & Auth Token (for SMS)
- Google OAuth credentials (for Google Calendar)
- Microsoft OAuth credentials (for Outlook)

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.
```

## Phase 15 Checklist

- [ ] Added "random" message style with daily rotation
- [ ] Created system health check endpoint
- [ ] Added automatic calendar sync scheduling
- [ ] Implemented rate limiting
- [ ] Added request logging with Winston
- [ ] Created error handling middleware
- [ ] Wrote setup guide and documentation
- [ ] Tested all features end-to-end
- [ ] Verified production readiness

## Phases 12-15 Complete!

Congratulations! You now have a complete calendar application with:
- TimeTree integration (Puppeteer)
- Google Calendar integration (official API)
- Microsoft Graph integration (official API)
- Daily rotating message personalities
- Rate limiting and logging
- Comprehensive error handling

## Final Deployment Checklist

- [ ] Update all API keys in production
- [ ] Set strong JWT_SECRET
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure production database backups
- [ ] Set up monitoring and alerts
- [ ] Test all integrations in production
- [ ] Document deployment process

---

## Complete Project Structure

```
cali-calendar-ai/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   ├── password.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── db-helpers.ts
│   │   │   │   └── logger.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   └── errorHandler.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── calendar.ts
│   │   │   │   ├── sms.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── family.ts
│   │   │   │   ├── admin.ts
│   │   │   │   ├── integrations.ts
│   │   │   │   └── health.ts
│   │   │   ├── services/
│   │   │   │   ├── twilioService.ts
│   │   │   │   ├── claudeService.ts
│   │   │   │   ├── schedulerService.ts
│   │   │   │   ├── joinCodeService.ts
│   │   │   │   ├── googleCalendarService.ts
│   │   │   │   ├── microsoftGraphService.ts
│   │   │   │   └── timetreeService.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── client/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout.tsx
│       │   │   ├── MobileNav.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx
│       │   ├── hooks/
│       │   │   └── useCalendar.ts
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Events.tsx
│       │   │   ├── Settings.tsx
│       │   │   ├── SmsHistory.tsx
│       │   │   ├── Family.tsx
│       │   │   ├── FamilyJoin.tsx
│       │   │   ├── Integrations.tsx
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── AdminUsers.tsx
│       │   │   └── AdminSettings.tsx
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
├── packages/
│   └── shared/
│       └── src/
│           ├── types.ts
│           └── constants.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── REBUILD_PLAN.md
├── REBUILD_PLAN_PHASES_5-7.md
├── REBUILD_PLAN_PHASES_8-11.md
├── REBUILD_PLAN_PHASES_12-15.md
├── SETUP_GUIDE.md
└── package.json
```

## You're Ready to Build!

Follow the phases sequentially, test each phase before moving to the next, and you'll have a fully functional self-hosted calendar SMS application.

Good luck! 🚀
